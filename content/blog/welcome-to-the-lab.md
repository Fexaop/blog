---
title: "Welcome to the Lab"
description: "First post — what this blog is about, the stack behind it, and why the UI is pure bydefaulthuman."
date: "2026-03-01"
tags: ["meta", "design", "nextjs"]
featured: true
author: "Gunit"
---

This site is a **static lab notebook** for security research, systems tinkering, and build notes. No server. No runtime CMS. Just markdown, a build step, and HTML you can host anywhere.

## Design intent

The visual system is **bydefaulthuman all the way**:

1. Rough.js ink borders on buttons, cards, badges, inputs
2. Caveat for display accents + RoughHighlight underlines
3. A faint graph-paper grid in the background — nothing else

No thick offset shadows. No neo-brutal chrome. The sketch *is* the UI.

## Stack

- **Next.js** App Router with `output: 'export'`
- **TypeScript** + **Tailwind CSS**
- Markdown posts via `gray-matter` + `remark`
- Selective Rough.js components from bydefaulthuman

## What you'll find here

- Writeups and reverse notes
- Architecture rants that stay technical
- Small tools and experiments
- Design decisions that ship as code

If you want to add a post, drop a `.md` file in `content/blog/` with frontmatter and rebuild. That's the whole CMS.
