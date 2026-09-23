# Portfolio Studio

A personal portfolio site with a password-protected owner studio for editing
content and uploading a CV/project images — no code changes needed to
update the site.

Two independent apps, both deployable to Vercel for free:

- **`client/`** — React + Vite single-page app (the public portfolio, the
  owner-login screen, and the studio editor). Deploys as a static site.
- **`server/`** — Express API, deployed as a Vercel serverless function
  (`server/api/index.ts`). Handles portfolio content, CV upload/download,
  project image upload, and owner authentication.

Portfolio content, the CV file, and project images are stored in
[Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — no database,
and no persistent disk required (which serverless platforms don't provide
anyway).

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

For local development to actually persist saved content/uploads, `server/.env`
also needs `BLOB_READ_WRITE_TOKEN` — see "Setting up Vercel Blob" below.
Without it, the server still runs and the public site still works (it falls
back to the built-in starter content), but saving/uploading from `/studio`
will fail until the token is set.

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

This builds the server (`server/dist` — used only for local `npm start`,
not for the Vercel deployment, which builds `server/api` itself) and the
client (`client/dist`, a static site).

## Deploying — two separate Vercel projects

Import this repo into Vercel **twice**, once per app. Each import asks for
a Root Directory — pick carefully, since Vercel's auto-detection can guess
wrong on a monorepo like this (it may default to `./` or auto-select the
wrong subfolder):

### 1. Client project

- Root Directory: `client`
- Framework Preset: **Vite** (confirm this explicitly — don't rely on
  auto-detect)
- Environment variable: `VITE_API_URL` = the server project's URL once you
  have it (e.g. `https://portfolio-server-xxxx.vercel.app`). Leave blank
  until the server is deployed, then add it and redeploy.

### 2. Server project

- Root Directory: `server`
- Framework Preset: **Other** (this repo's own `server/vercel.json` +
  `server/api/index.ts` handle the routing explicitly — don't let Vercel's
  "Express" auto-preset take over)
- Environment variables:
  - `OWNER_PASSWORD` — your real studio login password
  - `CLIENT_ORIGIN` — the client project's URL (comma-separated if you
    have more than one, e.g. a preview + production domain)
  - `NODE_ENV` = `production` (Vercel sets this automatically — no action
    needed)

**Setting up Vercel Blob** (do this on the server project): open the
project → **Storage** tab → **Create Database** → **Blob** → connect it to
this project. Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into the
server project's environment — no manual copying needed for the deployed
app. For local development, copy that same token's value from the Storage
tab into `server/.env`.

Once both projects are deployed, go back to the **client** project's
environment variables, set `VITE_API_URL` to the server's URL, and
redeploy the client so it actually points at the live API.

The owner-session cookie is set with `SameSite=None; Secure` in production
so it works across the two separate `*.vercel.app` domains — both are
served over HTTPS by default on Vercel, so this works out of the box.

## Project structure

```
client/
  src/
    pages/         Home, OwnerLogin, Studio (route-level components)
    components/    PortfolioView (public site), PortfolioEditor (studio UI)
    lib/           api.ts (fetch wrapper), types.ts
    styles/        portfolio.css, theme.css, polish.css, globals.css
server/
  api/
    index.ts        Vercel serverless function entry point (exports the Express app)
  src/
    index.ts        Local dev entry point (calls app.listen — not used in deployment)
    app.ts           Express app + middleware + route mounting
    routes/          portfolio.ts, cv.ts, project-image.ts, auth.ts
    lib/             portfolio.ts (Blob storage + validation), owner.ts (auth)
  vercel.json        Rewrites all requests to the single serverless function
```
