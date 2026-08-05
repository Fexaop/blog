---
title: "Static Sites Still Win"
description: "Why fully static HTML remains the right default for blogs, docs, and personal tooling in 2026."
date: "2026-03-12"
tags: ["web", "architecture", "static"]
featured: true
author: "Gunit"
---

Serverless is great. Edge is great. For a personal blog, **static still wins**.

## The boring advantages

- **Deploy anywhere** — GitHub Pages, Cloudflare Pages, Netlify, S3, a $5 VPS with nginx.
- **No cold starts** — every page is a file.
- **Security surface** shrinks hard — no database, no auth runtime, no SSR edge cases.
- **Cheap** — often free, always predictable.

## When static is wrong

You need live personalization, user-generated content at request time, or secrets that can't ship to the client. Blogs are almost never in that set.

## The Next.js export path

With App Router:

```js
// next.config.ts
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
```

Generate paths at build time with `generateStaticParams`, read markdown from disk, ship `out/`. Done.

## Keep content simple

Frontmatter + markdown is enough:

```yaml
---
title: "My Post"
date: "2026-03-12"
tags: ["web"]
---
```

If you outgrow that, you can still stay static — just generate more files.
