---
title: "Reading PCAPs Like a Human"
description: "A practical checklist for triaging packet captures without drowning in Wireshark columns."
date: "2026-05-18"
tags: ["security", "networking", "forensics"]
featured: false
author: "Gunit"
---

Packet captures punish curiosity. Open a busy PCAP in Wireshark and your brain will want to filter everything at once. Don't.

## Start with the conversation, not the frame

1. **Who talks to whom?** — endpoints and ports first.
2. **When does volume spike?** — time graph before deep dive.
3. **What failed?** — retransmits, resets, DNS NXDOMAIN, TLS alerts.

## Filters that earn their keep

```text
tcp.flags.reset == 1
dns.flags.rcode != 0
tls.alert_message
http.request or http.response
```

Save custom columns for source, dest, protocol, length, and info. Hide the rest until you need them.

## Extract, then re-focus

Export interesting streams. Rebuild the smaller problem. A 2GB capture is not a dataset you "read" — it's a haystack you reduce until a human can reason about it.

## Write it down

Your future self will not remember which filter found the C2 beacon. Capture the filter, the frame number, and the conclusion in the writeup while it's still hot.
