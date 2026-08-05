---
title: "Neo-Brutalism in Practice"
description: "Design tokens, hard shadows, and how to mix Rough.js accents without making the whole UI feel sketched."
date: "2026-04-02"
tags: ["design", "css", "ui"]
featured: true
author: "Gunit"
---

Neo-brutalism is not "ugly on purpose." It's **high-contrast geometry with honest materials** — borders you can see, shadows that don't blur, type that doesn't whisper.

## Tokens first

Lock the palette in CSS variables:

```css
:root {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --primary: #a855f7;
  --border: #a855f7;
  --shadow: #a855f7;
}
```

Then build utilities:

- `border: 3px solid var(--border)`
- `box-shadow: 4px 4px 0 0 var(--shadow)` — **no blur**
- radius ≤ 6px

## Where hand-drawn belongs

Use Rough.js / bydefaulthuman for:

- Primary buttons
- Feature cards
- Form inputs

Do **not** use notebook textures, paper backgrounds, or rough strokes on the layout shell. The chrome stays modern and technical; the accents feel human.

## Hierarchy rule

| Layer        | Treatment              |
| ------------ | ---------------------- |
| Page shell   | Neo-brutal / clean CSS |
| Interactive  | Ink theme rough strokes |
| Body text    | High-contrast typography |

If everything is sketched, nothing feels intentional.
