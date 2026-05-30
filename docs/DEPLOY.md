# Deploying Artistry on free tiers

## Master checklist (do in this order)

1. **Push code to GitHub** — the whole `Artistry` repo (or your fork).
2. **Neon — create project** at [neon.tech](https://neon.tech) → copy connection details (host, user, password, database name).
3. **Neon — SQL** → open **SQL Editor** → paste entire **`backend/db/init.sql`** from the repo → **Run**.
4. **Neon — SQL again** → paste **`backend/db/deploy_extras.sql`** → **Run** (chat tables).
5. **Render — sign up** at [render.com](https://render.com) → link GitHub.
6. **Render — New Web Service** → pick this repo.
7. **Render — settings:** Root directory **`backend`**, Dockerfile path **`Dockerfile.deploy`**, plan **Free**.
8. **Render — Environment** → add every variable in the table in [§2 API](#2-api-render--docker) (especially `DB_SSLMODE=require`, `JWT_SECRET`, `CORS_ORIGIN`).
9. **Render — note the URL** after first successful deploy, e.g. `https://artistry-api-xxxx.onrender.com`.
10. **Cloudflare — Pages** → [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → Connect Git → same repo.
11. **Cloudflare — build:** Framework **None**, build command **empty**, output directory **`vanilla`**.
12. **Cloudflare — deploy** → copy site URL, e.g. `https://artistry-web.pages.dev`.
13. **Render — fix CORS:** set `CORS_ORIGIN` to that Pages URL **exactly** (https, no trailing `/`) → **Save** (triggers redeploy).
14. **Your laptop — edit `vanilla/index.html`:** uncomment the `ARTISTRY_API_BASE` line and set it to `https://YOUR-API.onrender.com/api` (same host as step 9, must end with `/api`).
15. **Git:** commit and push so Cloudflare rebuilds Pages.
16. **Browser — test:** open the Pages URL → register or log in → feed loads without CORS errors.
17. **If login fails:** open DevTools → Network; fix `CORS_ORIGIN` or `ARTISTRY_API_BASE` until `/api/auth/login` returns 200.

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
4. Then run **`backend/db/deploy_extras.sql`** for direct messages and message likes.

### Supabase

1. New project → **SQL** → paste and run `init.sql`, then `deploy_extras.sql`.
2. Use **Settings → Database → Connection string** (URI mode, port 5432).  
   Supabase also gives Auth/Storage; this app only needs the Postgres URL for PHP.

**Note:** Seed data and large binary uploads are your choice; production usually uses smaller seeds or S3/R2 for files.

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

5. Check `Database.php` (or env usage) — if the app expects `DB_HOST` as hostname only, strip any `?sslmode=require` from host; enable SSL in PDO if required (Neon usually needs SSL).

After deploy, note the service URL, e.g. `https://artistry-api.onrender.com`.

**Health check:** open `https://YOUR-API.onrender.com/api/feed` (may 401 without token — that still proves PHP is up).

---

## 3. Frontend (Cloudflare Pages)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → Connect Git.
2. **Project name:** e.g. `artistry-web`
3. **Build settings:**
   - **Framework preset:** None
   - **Build command:** *(leave empty)* — static site
   - **Build output directory:** `vanilla`
4. **Environment variables:** not required for build if you inject the API URL in HTML (next step).
5. After first deploy, copy the site URL, e.g. `https://artistry-web.pages.dev`.

### Point the app at your API

In `vanilla/index.html`, **uncomment** and set the script **before** `app.js`:

```html
<script>window.ARTISTRY_API_BASE = 'https://artistry-api.onrender.com/api';</script>
<script type="module" src="js/app.js"></script>
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

- [ ] Postgres created; `init.sql` + `deploy_extras.sql` applied  
- [ ] API deployed; `/api/...` responds  
- [ ] `JWT_SECRET` strong and unique  
- [ ] `CORS_ORIGIN` = frontend URL (no trailing slash)  
- [ ] `window.ARTISTRY_API_BASE` = `https://your-api-host/api`  
- [ ] Register/login works end-to-end in the browser  

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Browser: CORS error | `CORS_ORIGIN` mismatch (www vs non-www, http vs https) |
| API: DB connection failed | Wrong `DB_HOST` / SSL; Neon needs SSL on port 5432 |
| 401 on everything | JWT or clock skew; clear `localStorage` and log in again |
| Uploads disappear | Free Render disk is ephemeral — use object storage for production |

If `Database.php` does not read env vars the way your host provides them, align variable names with that file or add a small `.env` loader for production.
