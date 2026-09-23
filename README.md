# Portfolio Studio

A personal portfolio site with a password-protected owner studio for editing
content and uploading a CV — no code changes needed to update the site.

Two independent apps:

- **`client/`** — React + Vite single-page app (the public portfolio, the
  owner-login screen, and the studio editor).
- **`server/`** — Express + Node.js API (serves/saves portfolio content,
  handles CV upload/download, and owner authentication).

The server stores portfolio content and the CV file on disk under
`server/data/` (gitignored). This is intentionally simple — no external
database or object storage required. If you deploy the server somewhere
with an ephemeral filesystem (most serverless platforms), point it at a
persistent volume, or swap `server/src/lib/portfolio.ts` and
`server/src/routes/cv.ts` for a real datastore.

## Prerequisites

- Node.js `>=18`
- npm (this repo uses npm workspaces)

## Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and set `OWNER_PASSWORD` to whatever you want the studio
login password to be.

## Development

```bash
npm run dev
```

This runs both apps together:

- Client: http://localhost:5173
- Server: http://localhost:4000 (proxied by Vite under `/api`, so the
  browser only ever talks to `localhost:5173`)

Visit `/owner-login`, sign in with `OWNER_PASSWORD`, and you'll be dropped
into `/studio`.

Run them individually with `npm run dev:client` / `npm run dev:server`.

## Building for production

```bash
npm run build
```

This builds the server (`server/dist`) and the client (`client/dist`, a
static site).

## Deploying

The two apps deploy independently:

- **Client**: any static host (Vercel, Netlify, Cloudflare Pages, S3 +
  CDN...). Build command `npm run build --workspace=client`, output
  directory `client/dist`. Set `VITE_API_URL` to your deployed API's URL
  (leave empty only if the API is reverse-proxied under the same domain).
- **Server**: any Node.js host with a persistent filesystem for
  `server/data/` (Render, Railway, Fly.io, a VPS...). Build command
  `npm run build --workspace=server`, start command `npm run start --workspace=server`.
  Set `OWNER_PASSWORD` and `CLIENT_ORIGIN` (comma-separated list of your
  deployed client origin(s)) as environment variables.

In production the owner-session cookie is set with `SameSite=None; Secure`
so it works across the client/server domain split — both must be served
over HTTPS.

## Project structure

```
client/
  src/
    pages/        Home, OwnerLogin, Studio (route-level components)
    components/    PortfolioView (public site), PortfolioEditor (studio UI)
    lib/           api.ts (fetch wrapper), types.ts
    styles/        portfolio.css, theme.css, polish.css, globals.css
server/
  src/
    routes/        portfolio.ts, cv.ts, auth.ts
    lib/            portfolio.ts (storage + validation), owner.ts (auth)
  data/            portfolio.json, cv.pdf (created at runtime, gitignored)
```
