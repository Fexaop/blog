---
title: "iptables, without the headache"
description: "Where packets go, what DROP actually does, and why your DNAT rule still feels broken."
date: "2026-08-06"
tags: ["linux", "iptables", "networking", "netfilter", "firewall"]
featured: true
author: "Gunit"
---

iptables is a list. The kernel walks it for every packet. First rule that **ACCEPT**s, **DROP**s, or **REJECT**s wins. Nothing matches? Chain **policy** decides. That’s it. Tables and chains are just *where* you stuck the list, not a second religion.

People overcomplicate this because the names sound serious. They’re not. They’re airport security with worse UX.

<div class="diagram-frame">
  <img src="/images/iptables-packet-flow.svg" alt="IPv4 packet path through netfilter hooks" width="720" height="980" />
  <p class="diagram-caption">The poster everyone screenshots and never re-reads.</p>
</div>

**To this box:** NIC → `PREROUTING` → `INPUT` → your process.  
**From this box:** process → `OUTPUT` → `POSTROUTING` → NIC.  
**Through this box (router vibes):** NIC → `PREROUTING` → `FORWARD` → `POSTROUTING` → other NIC.

At each hook the tables roughly go **raw → mangle → nat → filter → security** when they exist. Most days you live in **filter**. Sometimes **nat**. Mangle is for when you’ve made poor life choices involving marks.

| Table | Job |
|-------|-----|
| **filter** | allow / block (the firewall people mean) |
| **nat** | rewrite addresses (port forward, masquerade) |
| **mangle** | mark / tweak headers |
| **raw** | before conntrack; skip tracking |
| **security** | SELinux-flavored leftovers |

| Chain | When you care |
|-------|----------------|
| **PREROUTING** | DNAT, early drop, “send 443 somewhere else” |
| **INPUT** | traffic **for this host** (is 22 open?) |
| **FORWARD** | traffic **through** you (docker, router) |
| **OUTPUT** | stuff **this host** generates |
| **POSTROUTING** | SNAT / MASQUERADE right before the wire |

Default policy is the chain’s “if I shrug.” `DROP` policy = default deny. Also = “please don’t lock yourself out of SSH at 2am.” Ask me how I know. Or don’t. I still have the scars.

**Targets, the short version**

- **ACCEPT** — yes, leave this chain  
- **DROP** — vanish. silent. ghost mode  
- **REJECT** — no, and say so (ICMP or TCP RST)  
- **RETURN** — pop out of a user chain  
- **DNAT / SNAT / MASQUERADE / REDIRECT** — rewrite addresses (nat table)  
- **LOG** — write a log line. does *not* accept or drop. people forget and wonder why the packet still arrives  

DROP vs REJECT: DROP is quieter. REJECT is nicer when you’re debugging and don’t want to stare at a hanging `curl` like it’s modern art.

**NAT does not open the port in filter.** You DNAT 8000 to 10.0.0.5 and then stare at the packet dying in `FORWARD` because you never ACCEPT’d it. Forty minutes. Every time. Classic bit.

**Matches** are the `if`: `-i`, `-o`, `-p tcp`, `-s`, `-d`, `--dport`, `-m conntrack --ctstate …`. The stateful pattern that actually works:

```bash
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
# then open NEW for the services you mean
iptables -P INPUT DROP
```

Allow return traffic first. Drop garbage. Open only what you intended. Order matters — first hard verdict wins. Append (`-A`) sticks at the end. Insert (`-I 1`) jumps the queue.

**Block inbound TCP 8000 on ens0:**

```bash
sudo iptables -t filter -A INPUT -i ens0 -p tcp --dport 8000 -j DROP
```

Polite version (RST instead of silence):

```bash
sudo iptables -A INPUT -i ens0 -p tcp --dport 8000 -j REJECT --reject-with tcp-reset
```

Port-forward (still need filter ACCEPT where the packet lands):

```bash
sudo iptables -t nat -A PREROUTING -i ens0 -p tcp --dport 8000 -j DNAT --to-destination 10.0.0.5:8000
```

See what’s actually there (memory lies):

```bash
sudo iptables -t filter -S
sudo iptables -t filter -L -n -v --line-numbers
```

Rules die on reboot unless you save them. How you save them depends on the distro and whether someone’s already migrated you to nftables while you weren’t looking. Pick your poison.

**Where do I put this?**

| Want | Put it here |
|------|-------------|
| Block a port on this host | filter INPUT |
| Block outbound | filter OUTPUT |
| Router / docker bridge | filter FORWARD |
| Publish internal service | nat PREROUTING (DNAT) + filter ACCEPT |
| Share internet | nat POSTROUTING (MASQUERADE) + forward |

---

**TL;DR** — lists + first match wins. filter INPUT/OUTPUT for a normal box. FORWARD + nat when you’re a middleman. DROP is quiet, REJECT is loud, NAT is not a door. Accept ESTABLISHED,RELATED, drop INVALID, open NEW on purpose. Don’t firewall yourself out of SSH.
