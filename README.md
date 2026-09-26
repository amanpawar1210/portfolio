# Portfolio Studio

A personal portfolio with a password-protected owner studio. Every section,
the CV and project screenshots are editable from the browser, so updating the
site needs no code changes.

**Public site:** a hero with a typed role line and a live local-time clock,
count-up stats, projects you can filter by tech, a case-study page per project
(`/work/:id`), an expandable experience timeline, education, certifications,
achievements, testimonials and a contact form that saves to an inbox. It also
has a Ctrl+K / `/` command palette, a light/dark theme, scroll animations, and
layouts for phone and desktop.

**Owner studio (`/studio`):** an analytics dashboard (views, visitors, CV
downloads, top projects, referrers, recent activity); a message inbox with
read, star, reply and delete; editors for every section with a live
side-by-side preview; drag-to-reorder lists; drag-and-drop image and CV
uploads; Ctrl+S to save; a warning before leaving with unsaved changes; a
profile-strength checklist; and version history with one-click restore
(the last 20 saves).

**Security:** the owner session is a signed, HTTP-only cookie. Login locks for
15 minutes after 5 wrong attempts. The contact form is rate-limited and has a
honeypot field against spam bots. Uploads are checked by their real file
signature, not the file extension.

Two apps, both deployable to Vercel:

- **`client/`**: React + Vite single-page app, deployed as a static site.
- **`server/`**: Express API, deployed as a Vercel serverless function
  (`server/api/index.ts`).

All data (content, save history, CV, images, messages, analytics) is stored in
MongoDB, in the `portfolio` database. The name is fixed in code, so a shared
cluster's other databases are never touched.

## Prerequisites

- Node.js `>=18`
- npm (this repo uses npm workspaces)

## Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`: set `OWNER_PASSWORD` (the studio login),
`SESSION_SECRET` (any long random string) and `MONGODB_URI`.

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
  - `MONGODB_URI`: your MongoDB connection string
  - `SESSION_SECRET`: a long random string
  - `NODE_ENV` = `production` (Vercel sets this automatically, so there's
    nothing to do)

**MongoDB Atlas:** under Network Access, allow `0.0.0.0/0`, because Vercel
has no fixed IP addresses. Then add `MONGODB_URI` and `SESSION_SECRET` to the
server project's environment variables.

Once both projects are deployed, go back to the **client** project's
environment variables, set `VITE_API_URL` to the server's URL, and
redeploy the client so it actually points at the live API.

The owner-session cookie is set with `SameSite=None; Secure` in production
so it works across the two separate `*.vercel.app` domains — both are
served over HTTPS by default on Vercel, so this works out of the box.

## Project structure

```
client/src/
  pages/              Home, ProjectPage (/work/:id), OwnerLogin, Studio, NotFound
  components/
    PortfolioView     public home page sections
    PortfolioEditor   studio shell (sidebar, save bar, live preview)
    site/             header, command palette, contact form, project art
    studio/           dashboard, inbox, history, section editors, form fields
  lib/                api, types, hooks, context (data/theme/toasts), track
  styles/             base.css (tokens + light/dark), site.css, studio.css
server/
  api/index.ts        Vercel serverless entry (exports the Express app)
  src/
    index.ts          local dev entry (app.listen)
    app.ts            middleware + route mounting + error handler
    routes/           portfolio (+ revisions), files (cv, images), messages, analytics, auth
    lib/              db (MongoDB), portfolio (model + validation), owner (auth), rate-limit
```
