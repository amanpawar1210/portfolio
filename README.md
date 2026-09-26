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

Two apps in one repo, deployed together as one Vercel project:

- **`client/`**: React + Vite single-page app, deployed as a static site.
- **`server/`**: Express API, deployed as a Vercel serverless function
  (`api/index.ts`) in the same project and on the same domain as the site.

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

This builds the server (`server/dist`, used only for local `npm start`) and the
client (`client/dist`, the static site).

## Deploying to Vercel (one project)

The site and the API are deployed together as **one Vercel project** on one
domain. The React app is served as static files, and every `/api/*` request
goes to a serverless function (`api/index.ts`) that runs the Express app. Using
one domain keeps the owner-login cookie first-party, so the studio works in
every browser (including Safari), and there is no CORS to configure.

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo. Leave
   **Root Directory** as `./`. The root `vercel.json` supplies the install and
   build commands, output folder, and routing.
3. Add these environment variables, then deploy:

   | Name | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string |
   | `OWNER_PASSWORD` | a strong studio password |
   | `SESSION_SECRET` | a long random string (`openssl rand -hex 32`) |
   | `NODE_ENV` | `production` |

4. In MongoDB Atlas, open **Network Access** and allow `0.0.0.0/0`. Vercel
   has no fixed IP addresses; the database password still protects your data.

Upload limits: Vercel accepts request bodies up to 4.5 MB, so the CV limit is
4 MB and images are limited to 4 MB each.

### Adding a custom domain (e.g. from GoDaddy)

The site stays hosted on Vercel; GoDaddy only provides the domain name.

1. In Vercel, open your project, go to **Settings → Domains**, and add
   `yourdomain.com` and `www.yourdomain.com`.
2. Vercel shows the DNS records to create. In GoDaddy, open **My Products →
   DNS** for the domain and add them. This is usually an `A` record for `@`
   pointing to Vercel's IP address, and a `CNAME` for `www` pointing to
   `cname.vercel-dns.com`.
3. Wait for DNS to update (minutes to a few hours). Vercel issues the HTTPS
   certificate automatically.

No code changes are needed, because the site and API move to the new domain
together.

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
api/index.ts          Vercel serverless entry (exports the Express app)
vercel.json           one-project build + routing for Vercel
server/
  src/
    index.ts          local dev entry (app.listen)
    app.ts            middleware + route mounting + error handler
    routes/           portfolio (+ revisions), files (cv, images), messages, analytics, auth
    lib/              db (MongoDB), portfolio (model + validation), owner (auth), rate-limit
```
