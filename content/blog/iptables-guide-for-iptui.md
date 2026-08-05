---
title: "iptables guide (for iptui)"
description: "How Linux packet filtering works with iptables — tables, chains, matches, and targets — and how iptui shows or adds rules."
date: "2026-08-06"
tags: ["linux", "iptables", "networking", "netfilter", "firewall"]
featured: true
author: "Gunit"
---

How Linux packet filtering works with **iptables**, and how **iptui** shows or adds rules.  
This is a short map of **tables**, **chains**, **matches**, and **targets** — not a full man page.

```bash
go build -o iptui ./cmd/iptui
sudo ./iptui              # monitor + apply rules
./iptui --demo            # sample data; apply only previews
```

---

## Packet path (IPv4)

One interconnect graph. At each chain, tables run **raw → mangle → nat → filter → security** when that table has the chain.

```
                              NIC (in)
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │      PREROUTING        │
                    │   raw · mangle · nat   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   routing decision     │
                    └─────┬────────────┬─────┘
                 local    │            │    forward
                          ▼            ▼
           ┌──────────────────┐  ┌──────────────────┐
           │      INPUT       │  │     FORWARD      │
           │ mangle · filter  │  │ mangle · filter  │
           │    · security    │  │    · security    │
           └────────┬─────────┘  └────────┬─────────┘
                    │                     │
                    ▼                     │
           ┌──────────────────┐           │
           │  local process   │           │
           └────────┬─────────┘           │
                    │                     │
                    ▼                     │
           ┌──────────────────┐           │
           │      OUTPUT      │           │
           │ raw · mangle ·   │           │
           │ nat · filter ·   │           │
           │    security      │           │
           └────────┬─────────┘           │
                    │                     │
                    └──────────┬──────────┘
                               ▼
                    ┌────────────────────────┐
                    │     POSTROUTING        │
                    │     mangle · nat       │
                    └────────────┬───────────┘
                                 │
                                 ▼
                              NIC (out)
```

| Path | Through the graph |
|------|-------------------|
| **Ingress** | NIC in → `PREROUTING` → local → `INPUT` → process |
| **Egress** | process → `OUTPUT` → `POSTROUTING` → NIC out |
| **Forward** | NIC in → `PREROUTING` → forward → `FORWARD` → `POSTROUTING` → NIC out |

iptui’s monitor focuses on **filter INPUT / OUTPUT**.  
The **add-rule** page (`a`) can target any table/chain listed below.

---

## Tables

| Table | Purpose | Built-in chains |
|-------|---------|-----------------|
| **filter** | Allow / block packets (main firewall) | `INPUT`, `FORWARD`, `OUTPUT` |
| **nat** | Change addresses/ports (SNAT/DNAT/MASQUERADE) | `PREROUTING`, `INPUT`, `OUTPUT`, `POSTROUTING` |
| **mangle** | Mark / alter packet headers (TOS, MARK, TTL, …) | `PREROUTING`, `INPUT`, `FORWARD`, `OUTPUT`, `POSTROUTING` |
| **raw** | Before connection tracking; skip tracking | `PREROUTING`, `OUTPUT` |
| **security** | SELinux-related filtering (if used) | `INPUT`, `FORWARD`, `OUTPUT` |

Order of evaluation for a given hook is roughly: **raw → mangle → nat → filter → security** (exact order depends on hook).

---

## Chains (hook points)

| Chain | When it runs | Typical use |
|-------|----------------|-------------|
| **PREROUTING** | Very early, before routing | DNAT, REDIRECT, early DROP, NOTRACK |
| **INPUT** | Packet destined **to this host** | Server firewall (services, ports) |
| **FORWARD** | Packet routed **through** this host | Router / Docker bridge filters |
| **OUTPUT** | Packet created **by this host** | Outbound control, local NAT |
| **POSTROUTING** | Just before leaving the NIC | SNAT, MASQUERADE |

### Policy

Each built-in chain has a **default policy**: `ACCEPT`, `DROP`, or `REJECT`.  
If no rule matches, the policy applies.

iptui shows undealt ports as `[*POLICY]` (e.g. `[*DROP]`).

---

## Verdict targets (what happens to the packet)

### Filter-style (stop processing this chain)

| Target | Effect |
|--------|--------|
| **ACCEPT** | Packet allowed; leaves this chain (may still hit later tables/hooks). |
| **DROP** | Silent discard. No reply to sender. |
| **REJECT** | Discard and send an error (ICMP or TCP RST). See **reject-with**. |
| **RETURN** | Stop this chain; continue in the calling chain (user chains) or fall through toward policy. |
| **QUEUE** / **NFQUEUE** | Hand packet to userspace (e.g. IDS). |

### REJECT — `--reject-with`

| Value | Meaning |
|-------|---------|
| `icmp-port-unreachable` | Common default for UDP/TCP |
| `icmp-net-unreachable` | Network unreachable |
| `icmp-host-unreachable` | Host unreachable |
| `icmp-proto-unreachable` | Protocol unreachable |
| `icmp-net-prohibited` | Administratively prohibited (net) |
| `icmp-host-prohibited` | Administratively prohibited (host) |
| `icmp-admin-prohibited` | Admin prohibited |
| `tcp-reset` | TCP only: send RST (clean for TCP clients) |

**DROP vs REJECT:** DROP is stealthier; REJECT is friendlier for debugging (client gets an error).

### NAT targets

| Target | Chain (usual) | Effect |
|--------|----------------|--------|
| **DNAT** | PREROUTING (also OUTPUT) | Change destination IP/port (port forward). |
| **SNAT** | POSTROUTING | Change source IP (fixed public IP). |
| **MASQUERADE** | POSTROUTING | SNAT using outbound interface address (DHCP / changing IP). |
| **REDIRECT** | PREROUTING / OUTPUT | DNAT to local host (transparent proxy). |

NAT does **not** by itself “open a port” in filter; you often need a matching **filter ACCEPT** as well.

### Mangle / mark targets

| Target | Effect |
|--------|--------|
| **MARK** | Set firewall mark (for policy routing, tc, later matches). |
| **CONNMARK** | Mark whole connection. |
| **TOS** / **DSCP** | Change quality-of-service bits. |
| **TTL** | Change time-to-live. |
| **TCPMSS** | Clamp TCP MSS (common with PPPoE). |

### Raw / conntrack targets

| Target | Effect |
|--------|--------|
| **CT** | Connection-tracking options (e.g. set zone). |
| **NOTRACK** (legacy) / `CT --notrack` | Skip connection tracking for matching traffic. |

### Logging / helpers

| Target | Effect |
|--------|--------|
| **LOG** | Log to kernel log (does **not** accept or drop; often followed by DROP). |
| **ULOG** / **NFLOG** | Userspace logging. |
| **AUDIT** | Audit subsystem. |

### Jump to user chains

`-j MYCHAIN` is not a final verdict: packets enter **MYCHAIN**; `RETURN` or end-of-chain continues.

---

## Common matches (rule conditions)

| Match | Flags | Meaning |
|-------|-------|---------|
| Interface in | `-i eth0` | Arrived on interface |
| Interface out | `-o eth0` | Leaving on interface |
| Protocol | `-p tcp\|udp\|icmp\|…` | L4 protocol |
| Source | `-s 1.2.3.0/24` | Source address/CIDR |
| Dest | `-d 10.0.0.5` | Destination address/CIDR |
| Dest port | `--dport 80` or `80:90` | Destination port / range |
| Source port | `--sport …` | Source port / range |
| Multiport | `-m multiport --dports 80,443` | Several ports |
| Conntrack state | `-m conntrack --ctstate NEW,ESTABLISHED,RELATED,INVALID` | Connection state |
| State (legacy) | `-m state --state …` | Older name for similar idea |

### Connection states (ctstate)

| State | Meaning |
|-------|---------|
| **NEW** | First packet of a connection |
| **ESTABLISHED** | Part of an existing tracked connection |
| **RELATED** | Related to an existing connection (e.g. FTP data) |
| **INVALID** | Does not match a valid conntrack entry |

Typical “stateful firewall” pattern:

```bash
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
# then explicit NEW accepts for services
iptables -P INPUT DROP
```

iptui labels **stateful** ports as those that only work via ESTABLISHED,RELATED on that side (return path).

---

## Rule position

| Action | Command | Meaning |
|--------|---------|---------|
| **Append** | `-A CHAIN …` | Add at end of chain |
| **Insert** | `-I CHAIN [N] …` | Insert at position **N** (1 = top) |
| **Delete** | `-D …` | Remove rule (not in iptui form) |
| **Policy** | `-P CHAIN TARGET` | Default for undealt traffic |

**First match wins** for ACCEPT/DROP/REJECT in a chain. Order is critical.

---

## How iptui maps to this

| iptui | iptables idea |
|-------|----------------|
| Monitor IN row | **filter INPUT** TCP/UDP ports dealt with by rules |
| Monitor OUT row | **filter OUTPUT** |
| `[*DROP]` / policy line | Chain **policy** for undealt traffic |
| open / block / stateful | ACCEPT / DROP\|REJECT / ESTABLISHED,RELATED only |
| Bit flow | Counter deltas on those port rules |
| Add rule table | `-t filter\|nat\|mangle\|raw\|security` |
| Add rule chain | PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING |
| position append/insert | `-A` vs `-I N` |
| in/out iface | `-i` / `-o` |
| protocol + dport/sport | `-p` + `--dport` / multiport |
| ctstate | `-m conntrack --ctstate` |
| target ACCEPT/DROP/REJECT/… | `-j` |
| reject-with | `--reject-with` (if REJECT) |

Monitor is list-only (`-S`, `-L`).  
Add rule applies with `-A` / `-I` after confirm (needs root; demo only prints the command).

---

## Example: drop all incoming TCP 8000 on `ens0`

**Intent:** filter **INPUT**, interface **ens0**, TCP **dport 8000** → **DROP**.

### With iptui

1. `sudo ./iptui`
2. Press **`a`**
3. Set:

| Field | Value |
|-------|--------|
| table | `filter` |
| chain | `INPUT` |
| position | `append` (or insert at `1` to put it first) |
| in-iface | `ens0` |
| out-iface | `any` |
| protocol | `tcp` |
| dport | `8000` |
| ctstate | `none` (or `NEW` to only block new connections) |
| target | `DROP` |

4. Preview should look like:

```text
iptables -t filter -A INPUT -i ens0 -p tcp -m tcp --dport 8000 -j DROP
```

5. Press **`a`**, then **`enter`**.

### Same on the shell

```bash
sudo iptables -t filter -A INPUT -i ens0 -p tcp -m tcp --dport 8000 -j DROP
```

### Variants

```bash
# Reject with TCP RST instead of silent drop
sudo iptables -A INPUT -i ens0 -p tcp --dport 8000 -j REJECT --reject-with tcp-reset

# Only new connections (allow established if somehow related)
sudo iptables -A INPUT -i ens0 -p tcp --dport 8000 -m conntrack --ctstate NEW -j DROP

# DNAT 8000 on the public iface to an internal host (nat table)
sudo iptables -t nat -A PREROUTING -i ens0 -p tcp --dport 8000 -j DNAT --to-destination 10.0.0.5:8000
# still need FORWARD/INPUT ACCEPT as appropriate in filter
```

---

## Keys (iptui)

| Key | Where | Action |
|-----|--------|--------|
| `↑↓` `jk` | monitor | Select port |
| `enter` | monitor | Port details (process via `ss`) |
| `a` | monitor | Add-rule page |
| `↑↓` `←→` | add rule | Field / dropdown |
| `enter` | add rule | Edit text or cycle |
| `a` then `enter` | add rule | Confirm apply |
| `esc` | either | Back / cancel |
| `n` `b` | monitor | Switch interface |
| `q` | either | Quit (or leave detail) |

---

## Further reading

- `man iptables`
- `man iptables-extensions` (matches and targets)
- Netfilter packet flow diagrams (table/chain order)

This doc is a map of **methods** (tables, chains, DROP/REJECT/NAT/raw/…); iptui is a TUI over listing and building those commands.
