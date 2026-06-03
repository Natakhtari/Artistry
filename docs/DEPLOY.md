# Deploying Artistry on free tiers

## Master checklist (do in this order)

1. **Push code to GitHub** — the whole `Artistry` repo (or your fork).
2. **Neon — create project** at [neon.tech](https://neon.tech) → copy connection details (host, user, password, database name).
3. **Neon — SQL** → open **SQL Editor** → paste entire **`backend/db/init.sql`** from the repo → **Run**.
4. **Neon — SQL again** → paste **`backend/db/deploy_extras.sql`** → **Run** (chat tables, notifications, **upload_blobs** for DB‑stored images).
5. **Render — sign up** at [render.com](https://render.com) → link GitHub.
6. **Render — New Web Service** → pick this repo.
7. **Render — settings:** Root directory **`backend`**, Dockerfile path **`Dockerfile.deploy`**, plan **Free**.
8. **Render — Environment** → add variables from **`backend/render.env.template`**: copy that file, replace Neon host / password / JWT / `CORS_ORIGIN`, then in Render → **Environment** use **Add from .env** (or paste `KEY=value` lines). See [§2 API](#2-api-render--docker) for the full table.
9. **Render — note the URL** after first successful deploy, e.g. `https://artistry-api-xxxx.onrender.com`.
10. **Cloudflare — Pages** → [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → Connect Git → same repo.
11. **Cloudflare — build:** Framework **None**. **Build command:** `exit 0` (static site; avoids npm). **Build output directory:** `vanilla`.
12. **Cloudflare — Environment variable:** add **`SKIP_DEPENDENCY_INSTALL`** = **`1`** so Pages skips `npm clean-install` (optional but faster). If you skip it, the repo root includes a minimal **`package.json`** + **`package-lock.json`** so npm can succeed anyway.
13. **Cloudflare — deploy** → copy site URL, e.g. `https://artistry-web.pages.dev`.
14. **Render — fix CORS:** set `CORS_ORIGIN` to that Pages URL **exactly** (https, no trailing `/`) → **Save** (triggers redeploy).
15. **Your laptop — edit `vanilla/index.html`:** uncomment the `ARTISTRY_API_BASE` line and set it to `https://YOUR-API.onrender.com/api` (same host as step 9, must end with `/api`).
16. **Git:** commit and push so Cloudflare rebuilds Pages.
17. **Browser — test:** open the Pages URL → register or log in → feed loads without CORS errors.
18. **If login fails:** open DevTools → Network; fix `CORS_ORIGIN` or `ARTISTRY_API_BASE` until `/api/auth/login` returns 200.

**Order matters:** you need a placeholder `CORS_ORIGIN` before the API works from the browser. If Pages is not created yet, temporarily set `CORS_ORIGIN` to `http://localhost:8093`, deploy the API, then after you have the Pages URL update `CORS_ORIGIN` and redeploy the API.

---

Artistry is three pieces:

| Piece | What it is | Good free options |
|-------|------------|-------------------|
| **Database** | PostgreSQL 16 | [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both are Postgres; not MySQL) |
| **API** | PHP 8.3 + Apache | [Render](https://render.com) Web Service (Docker) or [Fly.io](https://fly.io) |
| **Frontend** | Static files in `vanilla/` | [Cloudflare Pages](https://pages.cloudflare.com) or [GitHub Pages](https://pages.github.com) |

You get **free HTTPS subdomains** from each provider (e.g. `*.pages.dev`, `*.onrender.com`). A fully custom domain is rarely free forever; see [Free domain](#free-custom-domain) below.

---

## 1. Database (Neon or Supabase)

### Neon (simple Postgres)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`).
3. In the Neon SQL editor, run **`backend/db/init.sql`** from this repo (paste full file, execute).
4. Then run **`backend/db/deploy_extras.sql`** for direct messages, message likes, **`notifications`**, and **`upload_blobs`** (stores uploaded **images** in Postgres so they survive API redeploys; video/audio still use disk until you add object storage).

### Supabase

1. New project → **SQL** → paste and run `init.sql`, then `deploy_extras.sql` (includes **`upload_blobs`** for image persistence).
2. Use **Settings → Database → Connection string** (URI mode, port 5432).  
   Supabase also gives Auth/Storage; this app only needs the Postgres URL for PHP.

**Note:** Seed data and large binary uploads are your choice. **New photo uploads** are stored in the **`upload_blobs`** table (see `backend/db/migrations/004_upload_blobs.sql`); URLs look like `https://YOUR-API/api/files/123`. If those links are wrong behind a reverse proxy, set **`PUBLIC_BASE_URL`** on the API (origin only, no path). Video/audio files are still written to the container disk and can disappear on free-tier redeploys unless you add R2/S3 or a persistent volume.

---

## 2. API (Render + Docker)

Render’s free web service can sleep after ~15 minutes idle (cold start ~30–60s). Uploads stored on disk are **ephemeral** on free tier (lost on redeploy). For persistent images, add Cloudflare R2 or AWS S3 later.

1. Push this repo to GitHub.
2. [Render](https://render.com) → **New +** → **Web Service** → connect the repo.
3. Settings:
   - **Root directory:** `backend`
   - **Dockerfile path:** `Dockerfile.deploy`
   - **Instance type:** Free
4. **Environment variables:**

   | Name | Example |
   |------|---------|
   | `DB_HOST` | `ep-cool-thing-123456.us-east-2.aws.neon.tech` (no `postgres://`) |
   | `DB_PORT` | `5432` |
   | `DB_NAME` | `neondb` or your DB name |
   | `DB_USER` | from Neon/Supabase |
   | `DB_PASS` | from Neon/Supabase |
   | `DB_SSLMODE` | `require` for Neon / Supabase (encrypted connection to Postgres) |
   | `JWT_SECRET` | `openssl rand -hex 32` |
   | `CORS_ORIGIN` | Your **frontend** URL with **no** trailing slash, e.g. `https://artistry-xxx.pages.dev` |
   | `NEWS_API_KEY` | *(Optional)* [NewsAPI.org](https://newsapi.org) key — merged into **`GET /api/news`** with RSS; omit to use RSS-only (Hyperallergic, Colossal). The API host must allow **outbound HTTPS** for RSS and NewsAPI. |
   | `PUBLIC_BASE_URL` | *(Optional)* Public origin for upload URLs, e.g. `https://artistry-api-xxxx.onrender.com` — no path, no trailing slash. Use if **`/api/files/…`** image links are built with the wrong host behind a proxy. |

5. Check `Database.php` (or env usage) — if the app expects `DB_HOST` as hostname only, strip any `?sslmode=require` from host; enable SSL in PDO if required (Neon usually needs SSL).

After deploy, note the service URL, e.g. `https://artistry-api.onrender.com`.

**Health check:** open `https://YOUR-API.onrender.com/api/feed` (may 401 without token — that still proves PHP is up).

---

## 3. Frontend (Cloudflare Pages)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → Connect Git.
2. **Project name:** e.g. `artistry-web`
3. **Build settings:**
   - **Framework preset:** None
   - **Build command:** `exit 0` — static files only; Cloudflare recommends this for plain HTML/JS (see [Static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)).
   - **Build output directory:** `vanilla`
4. **Environment variables (Pages → Settings → Environment variables):**
   - **`SKIP_DEPENDENCY_INSTALL`** = **`1`** — skips `npm clean-install` (optional). Without it, root **`package.json`** / **`package-lock.json`** let npm finish in seconds (no real dependencies).
   - The API URL is set in `index.html` (`ARTISTRY_API_BASE`), not here, unless you prefer a build-time variable.
5. After first deploy, copy the site URL, e.g. `https://artistry-web.pages.dev`.

**SPA deep links (refresh on `/profile`, `/feed`, …):** **`vanilla/index.html`** uses `<base href="/" />` and root-relative **`/js/app.js`**, **`/css/styles.css`** so assets load when the URL path is not `/`.

- **Cloudflare Pages** (build output = `vanilla/`): add **`vanilla/_redirects`** with one rule line: `/*    /index.html   200` — see **`vanilla/_redirects.pages-example`**. (Pages does not use `wrangler.toml` for static-only projects.)
- **Wrangler Workers + `[assets]`** (e.g. CI runs `npx wrangler deploy`): **do not** commit **`vanilla/_redirects`** — it conflicts with **`not_found_handling = "single-page-application"`** and fails with “infinite loop”. SPA fallback is only from **`wrangler.toml`**.

### Cloudflare Workers (`*.workers.dev`) + Wrangler

Use the repo-root **`wrangler.toml`**:

- **`[assets]`** → `directory = "./vanilla"`
- **`not_found_handling = "single-page-application"`** so `/profile` and similar return **`/index.html`** with **200** (see [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)).

From the repo root (with [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) logged in):

```bash
npx wrangler deploy
```

Adjust **`name`** in `wrangler.toml` if it clashes with an existing Worker. Redeploy after pulling these changes.

### Point the app at your API

In `vanilla/index.html`, **uncomment** and set the script **before** `app.js`:

```html
<script>window.ARTISTRY_API_BASE = 'https://artistry-api.onrender.com/api';</script>
<script type="module" src="/js/app.js"></script>
```

Commit and push; Pages will rebuild.

Set **`CORS_ORIGIN`** on the API to exactly that Pages URL (`https://artistry-web.pages.dev` — no slash at end).

Locally, `api.js` still defaults to `http://localhost:8742/api` when `ARTISTRY_API_BASE` is unset.

---

## 4. SSL and CORS

- Pages and Render both use HTTPS.
- The PHP `index.php` sets `Access-Control-Allow-Origin` from `CORS_ORIGIN`. It must match the browser origin exactly (scheme + host + port if any).

---

## 5. Optional: custom domain on Cloudflare

If you buy a domain (often ~$10/year) or use a free subdomain program:

1. Cloudflare Pages → your project → **Custom domains** → add `www.yoursite.com`.
2. Update `CORS_ORIGIN` on Render to `https://www.yoursite.com`.
3. Update `window.ARTISTRY_API_BASE` to your stable API hostname (you can put the API on `api.yoursite.com` with a Render custom domain or Fly).

---

## Free “custom” domain

Truly free custom domains change over time; options people use:

- **Subdomain from your host:** `yoursite.pages.dev`, `yoursite.onrender.com` — zero cost, HTTPS included.
- **Developer programs:** [is-a.dev](https://github.com/is-a-dev/register) (GitHub PR for a subdomain), [eu.org](http://nic.eu.org/) (slow approval).
- **GitHub Student Pack:** sometimes includes a free domain coupon.

There is no universal “free .com forever” from a major registrar; expect a subdomain or a small yearly fee for a real TLD.

---

## 6. Fly.io (alternative to Render)

Similar idea: deploy `backend/Dockerfile.deploy` with `fly launch`, set secrets for `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`. Fly’s free allowance is credit-based; check current pricing.

---

## 7. GitHub Pages (alternative frontend)

Repo → **Settings → Pages** → Source: branch + folder `/vanilla`.  
You must set `ARTISTRY_API_BASE` in `index.html` to your **public** API URL.  
GitHub Pages is `https://username.github.io/repo/` — add that exact origin to `CORS_ORIGIN`.

---

## Checklist

- [ ] Postgres created; `init.sql` + `deploy_extras.sql` applied (includes chat, notifications, **`upload_blobs`**)  
- [ ] API deployed; `/api/...` responds  
- [ ] `JWT_SECRET` strong and unique  
- [ ] `CORS_ORIGIN` = frontend URL (no trailing slash)  
- [ ] `window.ARTISTRY_API_BASE` = `https://your-api-host/api`  
- [ ] Register/login works end-to-end in the browser  

---

## Troubleshooting

| Cloudflare: `npm error ENOENT package.json` | Set **`SKIP_DEPENDENCY_INSTALL`** = **`1`** and build command **`exit 0`**; output dir **`vanilla`**. |
| Cloudflare: `npm ci` / missing or invalid `package-lock.json` | Pull latest repo: root **`package.json`** + **`package-lock.json`** are a minimal no-deps project so `npm clean-install` succeeds. Or set **`SKIP_DEPENDENCY_INSTALL`**=`1` and redeploy. |
| Browser: CORS error | `CORS_ORIGIN` mismatch (www vs non-www, http vs https) |
| **Refresh on `/profile` (etc.) → 404** on Cloudflare **Workers** | Deploy with **`wrangler.toml`** + **`not_found_handling = "single-page-application"`**. Remove **`vanilla/_redirects`** if present (it breaks Workers deploy). Use **`<base href="/">`** and **`/js/app.js`** in **`index.html`**. |
| **Wrangler: `Invalid _redirects` / infinite loop** | Delete **`vanilla/_redirects`**. Workers SPA mode already serves **`index.html`** for unknown paths; `_redirects` is for **Pages** only (see **`vanilla/_redirects.pages-example`**). |
| Register/login **500** | Usually Postgres from Render → Neon: set **`DB_SSLMODE=require`**, use **hostname-only** `DB_HOST`, redeploy. Enable **`DEBUG_ERRORS=1`** temporarily to read **`detail`**. |
| **`GET /api/health` returns 503** (older builds) | That was “DB down” — Render treats **503 as unhealthy** and blocks deploy. Latest code returns **200** with **`database":false`** when Postgres fails so the service can start; fix **`DB_HOST`**, **`DB_USER`**, **`DB_PASS`**, **`DB_NAME`**, **`DB_SSLMODE=require`** on Render, then reload `/api/health` until **`database":true`**. |
| Debug any **500** | Set **`DEBUG_ERRORS=1`** on Render (env), redeploy, retry — JSON will include **`detail`** (then set back to **`0`**). Or open **`GET https://YOUR-API.onrender.com/api/health`** on the **Render** host (not the Workers frontend URL). **`{"error":"Route not found"}`** usually means wrong path (use **`/api/health`**, not `/health` alone if your app strips prefix) or old deploy — pull latest and redeploy. |
| API: DB connection failed | Wrong `DB_HOST` / SSL; Neon needs SSL on port 5432 |
| 401 on everything | JWT or clock skew; clear `localStorage` and log in again |
| Uploads disappear | Free Render disk is ephemeral — use object storage for production |

If `Database.php` does not read env vars the way your host provides them, align variable names with that file or add a small `.env` loader for production.
