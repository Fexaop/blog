---
title: "How Containerisation Works"
description: "Docker’s runtime is just Go calling clone, pivot_root, cgroups, and netlink until a process feels like a tiny host."
date: "2026-08-05"
tags: ["linux", "containers", "syscalls", "namespaces", "go", "docker"]
featured: true
author: "Gunit"
---

Containers are not tiny VMs. Sorry. They’re normal processes the kernel lies to — about the filesystem, PIDs, network, users, and how much RAM they can torch. That lie is almost all **syscalls**. The whale sticker is optional.

Docker, containerd, and **runc** are Go. They don’t invent isolation. They call `clone`/`unshare`, `mount`, `pivot_root`, write cgroup files, poke netlink. Below is that spine, rebuilt the same rough way: bare process → something that *behaves* like a small host.

Lab code. Root. Linux only. Shape of runc, not “ship this Monday.” If it OOMs your laptop, congrats — you learned what cgroups are for.

**What you’re faking**

| Concern | Kernel bit |
|---------|------------|
| Private PIDs | PID namespace |
| Private `/` | mount ns + `pivot_root` |
| Private net | network ns + veth |
| Hostname | UTS ns |
| Limits | cgroups |
| “root” that isn’t host root | user ns + uid_map |

Docker orchestrates. **runc** does the last mile. We care about the last mile.

**Starting a child from Go**

C tutorials pass a function to `clone()`. Go will ruin your day if you try that — the runtime owns stacks. So Docker-shaped code **re-execs itself** with a different argv, and passes namespace flags on `SysProcAttr.Cloneflags`:

```go
package main

import (
	"fmt"
	"os"
	"os/exec"
	"syscall"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "child" {
		child()
		return
	}
	run()
}

func run() {
	cmd := exec.Command("/proc/self/exe", append([]string{"child"}, os.Args[1:]...)...)
	cmd.Stdin, cmd.Stdout, cmd.Stderr = os.Stdin, os.Stdout, os.Stderr
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS | syscall.CLONE_NEWUTS |
			syscall.CLONE_NEWPID | syscall.CLONE_NEWIPC |
			syscall.CLONE_NEWNET | syscall.CLONE_NEWUSER,
	}
	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "container exit: %v\n", err)
		os.Exit(1)
	}
}
```

Without those flags you just forked a shell. Same PID table, same `/`, same net. Cute, not a container.

**Rootfs: lie about the filesystem**

In the child, stop mounts leaking to the host, bind a rootfs, `pivot_root` (runc’s preference — `chroot` alone is a joke for real isolation), then mount proc/sys/dev:

```go
import (
	"os"
	"path/filepath"
	"golang.org/x/sys/unix"
)

func setupMountPrivate() error {
	return unix.Mount("", "/", "", unix.MS_REC|unix.MS_PRIVATE, "")
}

func pivotRoot(newRoot string) error {
	putOld := filepath.Join(newRoot, ".old_root")
	if err := unix.Mount(newRoot, newRoot, "", unix.MS_BIND|unix.MS_REC, ""); err != nil {
		return err
	}
	if err := os.MkdirAll(putOld, 0700); err != nil {
		return err
	}
	if err := unix.PivotRoot(newRoot, putOld); err != nil {
		return err
	}
	if err := unix.Chdir("/"); err != nil {
		return err
	}
	if err := unix.Unmount("/.old_root", unix.MNT_DETACH); err != nil {
		return err
	}
	return os.RemoveAll("/.old_root")
}

func mountStdFS() error {
	if err := unix.Mount("proc", "/proc", "proc", 0, ""); err != nil {
		return err
	}
	if err := unix.Mount("sysfs", "/sys", "sysfs", 0, ""); err != nil {
		return err
	}
	if err := unix.Mount("tmpfs", "/dev", "tmpfs",
		unix.MS_NOSUID|unix.MS_STRICTATIME, "mode=755"); err != nil {
		return err
	}
	_ = os.MkdirAll("/dev/pts", 0755)
	return unix.Mount("devpts", "/dev/pts", "devpts", 0, "newinstance,ptmxmode=0666")
}
```

No `/proc` and `ps` sulks. No `/dev` and half your binaries die on `open`. Isolation is a layer cake, not a light switch.

**PID 1 and friends**

With `CLONE_NEWPID`, inside you are PID 1. Host `ps` still shows a normal host PID. If PID 1 exits, the kernel may murder the rest of the namespace. Zombies are a feature. Charming.

Hostname is `unix.Sethostname` after `CLONE_NEWUTS`. User namespaces map container 0 → some unprivileged host uid (rootless Docker’s whole bit):

```go
cmd.SysProcAttr = &syscall.SysProcAttr{
	Cloneflags: syscall.CLONE_NEWUSER | /* … */,
	UidMappings: []syscall.SysProcIDMap{
		{ContainerID: 0, HostID: os.Geteuid(), Size: 1},
	},
	GidMappings: []syscall.SysProcIDMap{
		{ContainerID: 0, HostID: os.Getegid(), Size: 1},
	},
}
```

**cgroups: stop the fork bomb**

Namespaces change *what you see*. Cgroups change *what you can burn*. Without them your “isolated” process still OOMs the host and your afternoon:

```go
func applyCgroup(name string, pid int, memoryMax string) error {
	base := filepath.Join("/sys/fs/cgroup", name)
	if err := os.MkdirAll(base, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(base, "memory.max"), []byte(memoryMax), 0644); err != nil {
		return err
	}
	return os.WriteFile(
		filepath.Join(base, "cgroup.procs"),
		[]byte(strconv.Itoa(pid)),
		0644,
	)
}
```

Underneath: `open`, `write`, `mkdir`. Mean files. No magic.

**Glue it**

Child stage: private mounts → pivot → proc/sys/dev → hostname → drop caps → **`syscall.Exec`** the real workload (Go runtime leaves the building). Parent: start with Cloneflags, slap on cgroup, wire net, wait, tear down.

```go
func child() {
	must(setupMountPrivate())
	must(pivotRoot("/path/to/rootfs"))
	must(mountStdFS())
	must(unix.Sethostname([]byte("box")))
	must(syscall.Exec("/bin/sh", []string{"sh"}, os.Environ()))
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
```

That’s runc’s essence: set up a world, then Exec. Docker argues about images above that.

**Networking (give the box a cable)**

`CLONE_NEWNET` starts with **only loopback**. Lonely. Docker’s default story: veth pair, one end in the container netns, other on `docker0`, NAT out, DNAT for published ports.

```bash
# host
ip link add veth0 type veth peer name veth1
ip link set veth1 netns $CONTAINER_PID
ip addr add 10.0.0.1/24 dev veth0
ip link set veth0 up

# inside container netns
ip addr add 10.0.0.2/24 dev veth1
ip link set veth1 up
ip route add default via 10.0.0.1
ip link set lo up
```

In Go you `setns` into `/proc/$pid/ns/net` or shell out to `ip` like every lab demo that shipped on a deadline. Publish a port is still just NAT with branding:

```bash
iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 10.0.0.2:80
iptables -t nat -A POSTROUTING -j MASQUERADE
```

DNS doesn’t invent itself. Write or bind-mount `resolv.conf` into the rootfs or watch everything resolve to sadness.

**Checklist if you’re building a toy runtime**

1. cgroup + limits  
2. re-exec with Cloneflags  
3. user maps if rootless  
4. private mounts, pivot, proc/sys/dev  
5. hostname  
6. veth + routes + NAT  
7. drop caps / seccomp if you like sleeping  
8. `Exec` entrypoint  
9. on exit: wait, yank veth, delete cgroup  

| You did | Docker stack roughly |
|---------|----------------------|
| rootfs dir | image layers |
| PivotRoot + mounts | runc + OCI mounts |
| Cloneflags | OCI linux.namespaces |
| cgroup writes | linux.resources |
| veth + NAT | libnetwork / CNI |
| syscall.Exec | Entrypoint |

Not a separate kernel (that’s a VM). Not secure by “magic” — shared kernel, shared attack surface. Not complete without a rootfs and a network story. Just a short mean sequence of syscalls until one process *acts* like a box.

Try it yourself: re-exec + NEWNS + pivot + Exec. Add NEWPID, confirm `Getpid() == 1`. Add NEWNET and ping across a veth. Slap `memory.max=64M` and force an OOM for science. When those four work, you’ve rebuilt the spine. No whale required.

---

**TL;DR** — container = process + namespaces + private rootfs + cgroups + usually a netns/veth story. Go re-execs with Cloneflags (don’t raw-clone a Go fn). runc sets the world up then Execs. Namespaces = what you see, cgroups = what you burn. Shared kernel. Not a VM. Lab code above; prod wants caps, seccomp, and humility.
