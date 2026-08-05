# gunit — bydefaulthuman static blog

Fully static Next.js blog. Visual system:

- **bydefaulthuman** (Rough.js) for buttons, cards, badges, inputs, sticky notes, separators
- Dark sketchbook base + faint graph-paper grid
- Caveat + Kalam hand fonts
- **No neo-brutalism**
- `output: 'export'` → plain HTML in `out/`

## Commands

```bash
pnpm install
pnpm dev
pnpm build   # → out/
pnpm lint
```

## Deploy (GitHub Pages + Actions)

CI/CD is set up with the latest GitHub Pages Actions:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/ci.yml` | PR + push to `main` | `pnpm lint` + `pnpm build` |
| `.github/workflows/deploy.yml` | push to `main` + manual | Build static `out/` → deploy to Pages |

### One-time GitHub setup

1. Push this repo to GitHub (default branch `main`).
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions** (not “Deploy from a branch”).
4. Push to `main` (or run **Actions → Deploy to GitHub Pages → Run workflow**).

### URLs

- **Project site** (`https://USER.github.io/REPO/`): `basePath` is set automatically from `actions/configure-pages`.
- **User/org site** (`https://USER.github.io/`): base path is empty; works when the repo is named `USER.github.io`.

Local builds keep `basePath` unset so `pnpm dev` / `pnpm build` stay at `/`.

## Add a post

Create `content/blog/my-slug.md` with frontmatter, then `pnpm build`.

## License

MIT

