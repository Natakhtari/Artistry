# Artistry

Ad-free portfolio platform for visual artists. Built with vanilla JS on the frontend and PHP + PostgreSQL on the backend, managed with Liquibase migrations and Docker.

Original Figma design: [Kursayin](https://www.figma.com/design/VbN7MzRSE3eTq7ZyjNbyHX/Kursayin?node-id=0-1&p=f&t=VN48GINg71Syqi12-0)

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be **running** before you start
- Python 3 — for the frontend dev server (comes pre-installed on macOS)

---

## Running the project

### Step 1 — Copy and configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set a strong `JWT_SECRET` (at least 32 random characters).  
Everything else can stay as the defaults for local development.

### Step 2 — Start the backend (Docker)

```bash
docker compose up --build
```

This starts two containers:

| Container | What it does | Host port |
|---|---|---|
| `artistry_postgres` | PostgreSQL 16 — runs `init.sql` on first start | `5442` |
| `artistry_api` | PHP 8.3 / Apache REST API | `8742` |

**First run takes ~1–2 minutes** (pulls images, builds the PHP image).  
You know it's ready when you see:

```
artistry_api  | AH00558: apache2 ...
```

On subsequent runs just use `docker compose up` (no `--build`).

### Step 3 — Start the frontend

Open a **second terminal**:

```bash
cd vanilla
python3 server.py
```

Choose option **1** (Python). The server starts on port **8093**.

### Step 4 — Open in browser

```
http://localhost:8093
```

Go to `/auth` to register an account or sign in.

---

## Stopping everything

```bash
# Stop the frontend
Ctrl+C  (in the terminal running server.py)

# Stop Docker containers
docker compose down

# Stop and delete the database volume (full reset)
docker compose down -v
```

---

## Project structure

```
Artistry/
├── docker-compose.yml          # Orchestrates all services
├── .env.example                # Copy to .env before first run
│
├── backend/
│   ├── Dockerfile              # PHP 8.3 + Apache image
│   ├── apache.conf             # Apache virtual host config
│   ├── db/
│   │   └── init.sql            # Full schema — runs automatically on first DB start
│   └── api/
│       ├── public/
│       │   ├── index.php       # Single entry point + routing
│       │   └── .htaccess
│       └── src/
│           ├── Database.php
│           ├── JWT.php
│           ├── Response.php
│           ├── Router.php
│           ├── controllers/
│           │   ├── AuthController.php
│           │   ├── FeedController.php
│           │   ├── UserController.php
│           │   ├── ArtworkController.php
│           │   └── LikeController.php
│           └── middleware/
│               └── AuthMiddleware.php
│
├── vanilla/
│   ├── index.html
│   ├── server.py               # SPA-aware dev server (port 8093)
│   ├── css/styles.css
│   └── js/
│       ├── app.js              # App entry point + routing
│       ├── router.js
│       ├── utils/
│       │   ├── api.js          # Backend API client
│       │   ├── state.js        # Global state + localStorage
│       │   ├── toast.js        # In-app notifications
│       │   ├── avatars.js
│       │   └── seo.js
│       └── components/
│           ├── AuthPage.js
│           ├── FeedPage.js
│           ├── ProfilePage.js
│           ├── MessagesPage.js
│           ├── NotificationsPage.js
│           ├── SettingsPage.js
│           ├── NewsPage.js
│           ├── UserProfilePage.js
│           ├── ArtworkLightbox.js
│           ├── ContentViewer.js
│           ├── CreatePostModal.js
│           ├── EditProfileModal.js
│           ├── Navigation.js
│           └── Component.js
│
└── DB/                         # Original SQL reference files
    ├── artistry_db.sql
    ├── functions.sql
    └── trigger.sql
```

---

## API endpoints

Base URL: `http://localhost:8742/api`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Sign in, returns access token |
| `POST` | `/auth/refresh` | — | Refresh access token (uses HTTP-only cookie) |
| `POST` | `/auth/logout` | ✓ | Invalidate refresh token |
| `GET` | `/auth/me` | ✓ | Get current user profile |
| `GET` | `/feed` | ✓ | Paginated feed from followed users |
| `GET` | `/artworks` | — | List published artworks |
| `GET` | `/artworks/{id}` | — | Single artwork |
| `POST` | `/artworks` | ✓ | Create artwork |
| `PUT` | `/artworks/{id}` | ✓ | Update own artwork |
| `DELETE` | `/artworks/{id}` | ✓ | Delete own artwork |
| `POST` | `/likes` | ✓ | Toggle like on artwork or blog post |
| `GET` | `/users/{id}` | — | User public profile |
| `GET` | `/users/{id}/stats` | — | Follower / artwork counts |
| `POST` | `/users/{id}/follow` | ✓ | Follow or unfollow a user |
| `PUT` | `/users/profile` | ✓ | Update own profile |

Protected routes (`✓`) require `Authorization: Bearer <token>` header.

---

## Ports used

| Port | Service |
|---|---|
| `8093` | Frontend (vanilla JS) |
| `8742` | PHP API |
| `5442` | PostgreSQL |

These are intentionally non-standard to avoid conflicts with other local services.

---

## Rebuilding after backend changes

If you edit any PHP file in `backend/api/` the change is live immediately (volume mount — no restart needed).

If you edit `backend/Dockerfile` or `backend/apache.conf`:

```bash
docker compose up --build
```

If you change `backend/db/init.sql`, the schema only re-applies on a **fresh** database volume:

```bash
docker compose down -v   # deletes the DB volume
docker compose up        # recreates everything from scratch
```
