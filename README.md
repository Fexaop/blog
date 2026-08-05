# gunit — blog.pwnhub.in

Static Next.js lab notebook for [blog.pwnhub.in](https://blog.pwnhub.in).  
Portfolio: [pwnhub.in](https://pwnhub.in) (`/home/gunit/Documents/smooothy`).

## Visual system

- **bydefaulthuman** (Rough.js) UI
- Dark sketchbook + faint grid
- Caveat + Kalam hand fonts
- **Pac-Man cross-site transition** ↔ portfolio (no bare loading flash)

## Domains

| Site | URL | CNAME file |
|------|-----|------------|
| Blog | `blog.pwnhub.in` | `public/CNAME` |
| Portfolio | `pwnhub.in` | smooothy `public/CNAME` |

DNS: CNAME `blog` → `USER.github.io` (or your Pages target).  
GitHub **Settings → Pages → Custom domain**: `blog.pwnhub.in` + enforce HTTPS.

## Commands

```bash
pnpm install
pnpm dev
pnpm build   # → out/ (includes CNAME)
pnpm lint
```

## Deploy

| Workflow | Trigger | What |
|----------|---------|------|
| `ci.yml` | PR + push `main` | lint + build |
| `deploy.yml` | push `main` | build → GitHub Pages |

Pages source must be **GitHub Actions**.

## Cross-site nav

- Blog header/footer: **Portfolio →** runs Pac-Man (chase/eat ghost) then `location` → `pwnhub.in`
- Portfolio nav **BLOG**: Pac-Man hunted while eating pellets → `blog.pwnhub.in`
- Arrival uses `sessionStorage` so the destination skips its loader and fades in black→content

## Add a post

`content/blog/my-slug.md` + frontmatter → `pnpm build`.

## License

MIT


