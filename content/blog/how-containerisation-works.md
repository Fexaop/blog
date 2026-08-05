---
title: "How Containerisation Works"
description: "Build a container-like environment the way Docker does it in Go: re-exec, clone flags, namespaces, pivot_root, cgroups, and networking — step by step."
date: "2026-08-05"
tags: ["linux", "containers", "syscalls", "namespaces", "go", "docker"]
featured: true
author: "Gunit"
---

Containers are not tiny VMs. They are **ordinary processes** that the kernel lies to — about their filesystem, process IDs, network stack, users, and resource limits. That “lie” is implemented almost entirely with **syscalls**.

Docker’s engine, containerd, and **runc** (the OCI runtime that actually starts the container) are written in **Go**. They do not invent isolation; they call the same Linux primitives: `clone`/`unshare`, `mount`, `pivot_root`, cgroup file writes, netlink. This post rebuilds that spine in Go the way those tools roughly do — from a bare process to a networked box.

> **Note:** Examples are conceptual lab code (root, Linux only). They mirror runc’s *shape*, not production hardening.

---

## 0. What we are emulating

A minimal container needs:

| Concern | Kernel feature | Syscalls (main ones) |
| ------- | -------------- | -------------------- |
| Private process tree | PID namespace | `clone` / `unshare` |
| Private mounts / rootfs | Mount namespace + pivot | `unshare`, `mount`, `pivot_root` |
| Private network | Network namespace | `unshare`, netlink sockets |
| Private hostname | UTS namespace | `unshare`, `sethostname` |
| Private IPC | IPC namespace | `unshare` |
| User mapping | User namespace | `unshare`, write `uid_map` / `gid_map` |
| Resource limits | cgroups | `open` / `write` under cgroupfs |
| Capability drop | Capabilities | `capset`, `prctl` |

Docker (daemon + containerd) **orchestrates**. **runc** (Go) does the last mile: create namespaces, set up rootfs, apply cgroups, then `exec` the entrypoint. We follow that last-mile path.

---

## 1. How Docker-shaped Go runtimes start a child

C tutorials call `clone()` with a function pointer. **Go cannot safely use raw `clone` with a Go callback** — the runtime owns stacks and threads. Docker/runc-style code does this instead:

1. **Re-exec the same binary** with a different argv (`child`, `init`, …)
2. Pass **namespace flags** via `SysProcAttr.Cloneflags` so the kernel creates namespaces on `fork`/`clone` before the child runs
3. In the child stage, finish mounts / hostname / caps, then **`syscall.Exec`** the real workload

That is the same idea as runc’s multi-stage bootstrap (host → nsexec/init → container process).

### 1.1 Parent: spawn with clone flags

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
	// Re-exec ourselves — Docker/runc style, not clone(fn).
	cmd := exec.Command("/proc/self/exe", append([]string{"child"}, os.Args[1:]...)...)
	cmd.Stdin, cmd.Stdout, cmd.Stderr = os.Stdin, os.Stdout, os.Stderr

	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: unixCloneFlags(),
		// Unshareflags can be used for extra unshare after clone in some setups.
	}

	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "container exit: %v\n", err)
		os.Exit(1)
	}
}

func unixCloneFlags() uintptr {
	return syscall.CLONE_NEWNS |
		syscall.CLONE_NEWUTS |
		syscall.CLONE_NEWPID |
		syscall.CLONE_NEWIPC |
		syscall.CLONE_NEWNET |
		syscall.CLONE_NEWUSER // order/capabilities need care in real rootless
}
```

Under the hood Go’s `os/exec` still ends in **`clone`/`fork` + `execve`**. `Cloneflags` is how you get Docker’s “new namespaces for this process” without writing C.

### 1.2 Before isolation: plain process

Without clone flags, a “container” is only:

```go
cmd := exec.Command("/bin/sh")
cmd.Stdin, cmd.Stdout, cmd.Stderr = os.Stdin, os.Stdout, os.Stderr
cmd.Run() // fork/clone + execve — same PID table, same /, same net
```

**Goal:** keep `Exec` of the workload, but change **namespaces and root** first — exactly what runc does before the container entrypoint.

---

## 2. Private userspace view: mount namespace + rootfs

### 2.1 Make mounts private

In the **child** (already in a new mount ns via `CLONE_NEWNS`):

```go
import "golang.org/x/sys/unix"

func setupMountPrivate() error {
	// Stop mount events leaking to the host (runc does this early).
	return unix.Mount("", "/", "", unix.MS_REC|unix.MS_PRIVATE, "")
}
```

`unix.Mount` is a thin wrapper over the `mount(2)` syscall — same as C.

### 2.2 Prepare a root filesystem

You need a directory that *looks like* a rootfs (busybox tree, or layers unpacked from an image the way Docker does):

```text
rootfs/
  bin/  lib/  lib64/  etc/  proc/  sys/  dev/  tmp/
```

Docker: image layers → merged rootfs → OCI bundle. Kernel only sees a path.

### 2.3 Bind-mount + `pivot_root` (runc’s preferred path)

```go
func pivotRoot(newRoot string) error {
	putOld := filepath.Join(newRoot, ".old_root")

	// 1) new root must be a mount point
	if err := unix.Mount(newRoot, newRoot, "", unix.MS_BIND|unix.MS_REC, ""); err != nil {
		return err
	}
	if err := os.MkdirAll(putOld, 0700); err != nil {
		return err
	}

	// 2) swap roots — pivot_root(2)
	if err := unix.PivotRoot(newRoot, putOld); err != nil {
		return err
	}
	if err := unix.Chdir("/"); err != nil {
		return err
	}

	// 3) detach host filesystem
	if err := unix.Unmount("/.old_root", unix.MNT_DETACH); err != nil {
		return err
	}
	return os.RemoveAll("/.old_root")
}
```

`chroot` alone is weaker; **runc uses `pivot_root`** so the old tree can be fully unmounted.

### 2.4 Mount proc / sys / dev

```go
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
	// mknod/bind null, zero, tty; mount devpts — runtimes fill these out
	_ = os.MkdirAll("/dev/pts", 0755)
	return unix.Mount("devpts", "/dev/pts", "devpts", 0, "newinstance,ptmxmode=0666")
}
```

Without `/proc`, `ps` lies or breaks. Without `/dev`, many binaries fail at `open`.

**Checkpoint:** private rootfs view, still sharing host PIDs/network until those namespaces are set.

---

## 3. Private process tree: PID namespace

### 3.1 Created at clone time

You already passed `syscall.CLONE_NEWPID` in `SysProcAttr.Cloneflags`. In the child:

```go
fmt.Println("pid inside ns:", os.Getpid()) // → 1
```

Host `ps` still shows a normal host PID. Inside, you are **PID 1** — same contract Docker relies on.

### 3.2 Why PID 1 matters

If PID 1 exits, the kernel may kill the rest of the namespace. Docker/runc either run a tiny init or treat the app as PID 1 carefully (zombie reaping via `wait`).

### 3.3 Remount `/proc` after NEWPID

```go
// After pivot into rootfs, proc must reflect *this* PID namespace
unix.Mount("proc", "/proc", "proc", 0, "")
```

`/proc/1` is now your container init, not host systemd.

---

## 4. UTS, IPC, and user namespaces

### 4.1 Hostname (UTS) — Docker’s `Hostname` field

```go
func setHostname(name string) error {
	// CLONE_NEWUTS already applied at clone; just set the name.
	return unix.Sethostname([]byte(name))
}

// setHostname("box")
```

### 4.2 IPC

Covered by `CLONE_NEWIPC` in `Cloneflags` — no extra call if you created it at spawn. To unshare later:

```go
unix.Unshare(unix.CLONE_NEWIPC)
```

### 4.3 User namespace (rootless path)

Docker rootless maps container uid 0 → an unprivileged host uid. In Go the parent usually writes maps after the child starts (or uses `SysProcAttr.UidMappings` / `GidMappings` — Go’s helper around the same `/proc` writes):

```go
cmd.SysProcAttr = &syscall.SysProcAttr{
	Cloneflags: syscall.CLONE_NEWUSER | /* other flags */,
	UidMappings: []syscall.SysProcIDMap{
		{ContainerID: 0, HostID: os.Geteuid(), Size: 1},
	},
	GidMappings: []syscall.SysProcIDMap{
		{ContainerID: 0, HostID: os.Getegid(), Size: 1},
	},
}
```

Manual equivalent (what the kernel ultimately needs):

```go
// parent, after Start(), before child proceeds:
os.WriteFile(fmt.Sprintf("/proc/%d/uid_map", pid),
	[]byte(fmt.Sprintf("0 %d 1", hostUID)), 0644)
// deny setgroups first when required, then gid_map
```

Capability drop after setup (runc applies a bounding set / ambient clear) uses `prctl` / libcap-style helpers; same syscalls, Go wrappers.

---

## 5. cgroups: limit blast radius

Namespaces change *what you see*. **cgroups** change *what you can consume*. Docker writes these through containerd/runc; the mechanism is file I/O on cgroupfs.

```go
func applyCgroup(name string, pid int, memoryMax string) error {
	base := filepath.Join("/sys/fs/cgroup", name)
	if err := os.MkdirAll(base, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(base, "memory.max"), []byte(memoryMax), 0644); err != nil {
		return err
	}
	// cpu.max, pids.max, ...
	return os.WriteFile(
		filepath.Join(base, "cgroup.procs"),
		[]byte(strconv.Itoa(pid)),
		0644,
	)
}
```

Without this, your “container” can still fork-bomb or OOM the host. Syscalls underneath: `open`, `write`, `mkdir`.

---

## 6. Put it together: a mini runc-shaped runtime

### 6.1 Child stage (after clone with all NEW* flags)

```go
func child() {
	must(setupMountPrivate())
	must(pivotRoot("/path/to/rootfs")) // or argv-provided path
	must(mountStdFS())
	must(setHostname("box"))
	// drop caps / seccomp here in a real runtime

	// Replace this process with the workload — no Go runtime left.
	// Same end state as Docker: entrypoint is PID 1 (or under init).
	must(syscall.Exec("/bin/sh", []string{"sh"}, os.Environ()))
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
```

### 6.2 Parent stage (orchestration)

```go
func run() {
	// 1) create cgroup dir + limits (optional before/after Start)
	// 2) re-exec with Cloneflags (namespaces)
	cmd := exec.Command("/proc/self/exe", "child", rootfsPath)
	cmd.Stdin, cmd.Stdout, cmd.Stderr = os.Stdin, os.Stdout, os.Stderr
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS | syscall.CLONE_NEWPID |
			syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC |
			syscall.CLONE_NEWNET /* | CLONE_NEWUSER ... */,
	}

	if err := cmd.Start(); err != nil {
		log.Fatal(err)
	}
	// 3) applyCgroup("mybox", cmd.Process.Pid, "256M")
	// 4) wire network using cmd.Process.Pid (next section)
	cmd.Wait()
	// 5) teardown veth + cgroup
}
```

**That is the essence of runc:** configure namespaces + mounts + cgroups, then **`Exec`**. Docker/containerd sit above this (images, API, networking plugins).

---

## 7. Networking: give the box a cable

With `CLONE_NEWNET`, the child starts with **only loopback**. Docker’s default bridge network is: create **veth pair**, put one end in the container netns, attach the other to `docker0`, NAT egress, publish ports.

### 7.1 Loopback up (inside netns)

Still netlink under the hood; from a shell inside the ns:

```bash
ip link set lo up
```

In Go you can shell out to `ip` (many lab demos do) or use netlink libraries (`github.com/vishvananda/netlink` — same family of code container networking uses):

```go
import "github.com/vishvananda/netlink"

lo, _ := netlink.LinkByName("lo")
netlink.LinkSetUp(lo)
```

### 7.2 Host ↔ container: veth pair (Docker bridge model, simplified)

On the **host** (parent), after the container process exists:

```go
// Conceptual: same operations Docker’s libnetwork / CNI plugins perform.
// Using the `ip` CLI for clarity — netlink is the real API.

func wireVeth(containerPID int) {
	runIP("link", "add", "veth0", "type", "veth", "peer", "name", "veth1")
	runIP("link", "set", "veth1", "netns", strconv.Itoa(containerPID))
	runIP("addr", "add", "10.0.0.1/24", "dev", "veth0")
	runIP("link", "set", "veth0", "up")

	// enter container netns and configure peer — see setns below
}

func runIP(args ...string) {
	cmd := exec.Command("ip", args...)
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}
```

Inside the container netns:

```bash
ip addr add 10.0.0.2/24 dev veth1
ip link set veth1 up
ip route add default via 10.0.0.1
```

| Piece | Role |
| ----- | ---- |
| `veth` pair | Virtual ethernet cable |
| Host end | Often attached to bridge (`docker0`) |
| Peer moved into container netns | Container’s eth0-like NIC |
| Addresses + routes | L3 |
| Host forwarding + MASQUERADE | Outbound internet (Docker default) |

### 7.3 Moving into a netns in Go (`setns`)

```go
func inNetNS(pid int, fn func() error) error {
	f, err := os.Open(fmt.Sprintf("/proc/%d/ns/net", pid))
	if err != nil {
		return err
	}
	defer f.Close()

	// Join container network namespace — setns(2)
	if err := unix.Setns(int(f.Fd()), unix.CLONE_NEWNET); err != nil {
		return err
	}
	return fn()
}
```

`ip netns exec` is this pattern with more bookkeeping. Docker’s network setup runs in the right namespace the same way.

### 7.4 Bridge model (closer to Docker)

1. Create bridge `docker0` (or `br0`)
2. Attach host ends of many veth pairs to the bridge
3. Static IP or IPAM on the bridge subnet
4. `iptables`/`nftables` **MASQUERADE** for egress
5. **DNAT** published ports for ingress (`-p 8080:80`)

Go still ends up in netlink + netfilter — libnetwork / CNI plugins encapsulate it.

### 7.5 DNS and `/etc/resolv.conf`

Netns does not invent DNS. Docker writes or bind-mounts `resolv.conf` into the rootfs:

```go
os.WriteFile(
	filepath.Join(rootfs, "etc/resolv.conf"),
	[]byte("nameserver 10.0.0.1\n"),
	0644,
)
// or unix.Mount(hostResolv, pathInRootfs, "", unix.MS_BIND, "")
```

### 7.6 Port publishing (sketch)

```bash
iptables -t nat -A PREROUTING -p tcp --dport 8080 \
  -j DNAT --to-destination 10.0.0.2:80
iptables -t nat -A POSTROUTING -j MASQUERADE
```

Host receives traffic → NAT into container IP → across veth → process listening in the container netns. That is Docker `-p` in spirit.

---

## 8. End-to-end lifecycle (checklist)

Mental model of a tiny Go runtime (Docker/runc-shaped):

1. **Create cgroup**, set limits  
2. **`exec.Command("/proc/self/exe", "child", …)`** with `SysProcAttr.Cloneflags`  
   (`NEWNS|NEWPID|NEWUTS|NEWIPC|NEWNET|NEWUSER` as needed)  
3. **User maps** via `UidMappings` / `/proc/pid/uid_map`  
4. Child: mounts **private**, bind **rootfs**, **`unix.PivotRoot`**  
5. Mount **proc / sys / dev**  
6. **`unix.Sethostname`**  
7. Parent: **veth**, move peer into netns, routes, NAT  
8. Drop **capabilities**, optional **seccomp**  
9. **`syscall.Exec`** entrypoint  
10. On exit: `Wait`, tear down veth, remove cgroup  

---

## 9. How this maps to real Docker

| You did in Go | Docker stack roughly |
| ------------- | -------------------- |
| Rootfs directory | Image layers → unpacked/merged rootfs |
| `unix.PivotRoot` + mounts | runc applies OCI `mounts` + root |
| `SysProcAttr.Cloneflags` | OCI `linux.namespaces` → runc clone/unshare |
| cgroup file writes | `linux.resources` via runc + cgroup drivers |
| veth + bridge + NAT | libnetwork / CNI + `docker0` |
| `syscall.Exec` | container `Entrypoint` / `Cmd` |
| Re-exec `/proc/self/exe` | runc’s multi-stage init bootstrap |

Docker Engine (Go) talks API → containerd (Go) → **runc** (Go) → **syscalls**. Isolation physics never leave the kernel table in section 0.

---

## 10. What containers are *not*

- **Not** a separate kernel (that is a VM)  
- **Not** secure by “magic” — shared kernel means shared attack surface  
- **Not** complete without a rootfs and a network story for real workloads  

They *are* a disciplined sequence of syscalls — driven from Go the same way Docker’s runtime does — that reshape one process’s world until it *behaves* like a small host.

---

## Further lab exercises

1. Go binary: re-exec + `CLONE_NEWNS` + `PivotRoot` + `syscall.Exec`  
2. Add `CLONE_NEWPID`; confirm `os.Getpid() == 1` in the child  
3. Add `CLONE_NEWNET`, create a veth, ping host ↔ container  
4. Put the child in a cgroup with `memory.max=64M` and force an OOM  

When those four work, you have rebuilt the spine of containerisation — **from userspace isolation to networking** — in **Go**, with the same kernel calls Docker’s stack uses under the hood.
