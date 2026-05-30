# Artistry

Ad-free portfolio platform for visual artists. Vanilla JS frontend, PHP 8.3 + PostgreSQL backend, all running in Docker.

**Deploy to free tiers (Neon/Supabase + Render + Cloudflare Pages):** see [docs/DEPLOY.md](docs/DEPLOY.md).

Original Figma design: [Kursayin](https://www.figma.com/design/VbN7MzRSE3eTq7ZyjNbyHX/Kursayin?node-id=0-1&p=f&t=VN48GINg71Syqi12-0)

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be **running** before you start
- Python 3 — for the frontend dev server (pre-installed on macOS)

---

## Running the project

### Step 1 — Environment variables

```bash
cp .env.example .env
```

Open `.env` and set a strong `JWT_SECRET` (at least 32 random characters).  
Everything else can stay as the defaults for local development.

### Step 2 — Start the backend

```bash
docker compose up --build
```

This starts two containers:

| Container | What it does | Host port |
|---|---|---|
| `artistry_postgres` | PostgreSQL 16 — runs `init.sql` on first start | `5442` |
| `artistry_api` | PHP 8.3 / Apache REST API | `8742` |

First run takes ~1–2 minutes (pulls images, builds the PHP image).  
On subsequent runs just use `docker compose up` (no `--build`).

### Step 3 — Start the frontend

Open a **second terminal**:

```bash
cd vanilla
python3 server.py
```

The server starts on **port 8093**.

### Step 4 — Open in browser

```
http://localhost:8093
```

---

## Test accounts

Five users are pre-seeded. All use the same password:

| Username | Email | Password |
|---|---|---|
| `alice` | alice@artistry.dev | `password123` |
| `ben` | ben@artistry.dev | `password123` |
| `claire` | claire@artistry.dev | `password123` |
| `dani` | dani@artistry.dev | `password123` |
| `evan` | evan@artistry.dev | `password123` |

All 5 users follow each other, so logging into any account will show the other users' work in the **Following** feed tab.

> **Note:** These accounts only exist if the database was seeded. If you reset the DB with `docker compose down -v` you will need to re-run the seed (see below).

---

## Stopping everything

```bash
# Stop the frontend
Ctrl+C   (in the terminal running server.py)

# Stop Docker containers
docker compose down

# Stop and delete the database volume (full reset)
docker compose down -v
```

---

## Re-seeding after a DB reset

If you wipe the database with `docker compose down -v` and start fresh, re-register the test users and re-seed their content:

```bash
# 1 — Start containers
docker compose up

# 2 — Register the 5 users
for user in \
  'alice|alice@artistry.dev|Alice|Morgan' \
  'ben|ben@artistry.dev|Ben|Torres' \
  'claire|claire@artistry.dev|Claire|Kim' \
  'dani|dani@artistry.dev|Dani|Osei' \
  'evan|evan@artistry.dev|Evan|Park'; do
  IFS='|' read -r uname email fname lname <<< "$user"
  curl -s -X POST http://localhost:8742/api/auth/register \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$uname\",\"email\":\"$email\",\"password\":\"password123\",\"first_name\":\"$fname\",\"last_name\":\"$lname\"}" > /dev/null
  echo "Registered $uname"
done

# 3 — Seed artworks, follows, likes
docker exec -i artistry_postgres psql -U artistry -d artistry \
  < backend/db/migrations/001_news_and_tags.sql
docker exec -i artistry_postgres psql -U artistry -d artistry \
  < backend/db/migrations/002_seed_content.sql

# 4 — Download seed images into the server (stores them locally, no external links)
python3 backend/db/migrations/seed_images.py
```

---

## Project structure

```
Artistry/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── apache.conf
│   ├── db/
│   │   ├── init.sql                  # Full schema — runs on first DB start
│   │   └── migrations/
│   │       ├── 001_news_and_tags.sql # Adds category to news_articles + seed articles
│   │       └── 002_seed_content.sql  # Seed 5 users' artworks, follows, likes
│   └── api/
│       ├── public/
│       │   ├── index.php             # Entry point + routing
│       │   └── .htaccess
│       └── src/
│           ├── Database.php
│           ├── JWT.php
│           ├── Response.php
│           ├── Router.php
│           ├── middleware/AuthMiddleware.php
│           └── controllers/
│               ├── AuthController.php
│               ├── FeedController.php
│               ├── UserController.php
│               ├── ArtworkController.php
│               ├── LikeController.php
│               ├── CommentController.php
│               ├── BlogPostController.php
│               ├── TagController.php
│               ├── NewsController.php
│               └── UploadController.php
│
└── vanilla/
    ├── index.html
    ├── server.py                     # SPA-aware dev server (port 8093)
    ├── css/styles.css
    └── js/
        ├── app.js
        ├── router.js
        ├── utils/
        │   ├── api.js                # All API calls
        │   ├── state.js              # Auth state + localStorage
        │   ├── toast.js              # In-app notifications
        │   └── avatars.js
        └── components/
            ├── AuthPage.js
            ├── FeedPage.js           # Real API feed (All / Following tabs)
            ├── ProfilePage.js
            ├── UserProfilePage.js
            ├── ArtworkLightbox.js    # Opens artwork + real comments
            ├── CreatePostModal.js    # Photo / video / podcast / article
            ├── NewsPage.js           # Real news from DB
            ├── Navigation.js
            ├── EditProfileModal.js
            ├── ContentViewer.js
            ├── MessagesPage.js
            ├── NotificationsPage.js
            ├── SettingsPage.js
            └── Component.js
```

---

## API endpoints

Base URL: `http://localhost:8742/api`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Sign in (`login` field accepts email or username) |
| `POST` | `/auth/refresh` | — | Refresh access token |
| `POST` | `/auth/logout` | ✓ | Invalidate refresh token |
| `GET` | `/auth/me` | ✓ | Current user |
| `GET` | `/feed` | ✓ | Artworks from followed users |
| `GET` | `/artworks` | — | All published artworks |
| `GET` | `/artworks/{id}` | — | Single artwork |
| `POST` | `/artworks` | ✓ | Create artwork |
| `PUT` | `/artworks/{id}` | ✓ | Update own artwork |
| `DELETE` | `/artworks/{id}` | ✓ | Delete own artwork |
| `GET` | `/artworks/{id}/comments` | — | Comments on an artwork |
| `POST` | `/artworks/{id}/comments` | ✓ | Post a comment |
| `DELETE` | `/comments/{id}` | ✓ | Delete own comment |
| `GET` | `/blog-posts` | — | Published articles |
| `POST` | `/blog-posts` | ✓ | Create article |
| `GET` | `/tags` | — | All tags |
| `POST` | `/tags` | ✓ | Create / return tag |
| `GET` | `/news` | — | News articles |
| `GET` | `/news/categories` | — | News categories |
| `GET` | `/users` | — | List creators |
| `GET` | `/users/{id}` | — | User public profile |
| `GET` | `/users/{id}/stats` | — | Follower / artwork counts |
| `POST` | `/users/{id}/follow` | ✓ | Follow or unfollow |
| `PUT` | `/users/profile` | ✓ | Update own profile |
| `POST` | `/likes` | ✓ | Toggle like |
| `POST` | `/upload` | ✓ | Upload a file |

Protected routes (`✓`) require `Authorization: Bearer <token>` header.

---

## Ports

| Port | Service |
|---|---|
| `8093` | Frontend |
| `8742` | PHP API |
| `5442` | PostgreSQL |

---

## Connecting to the database (e.g. IntelliJ / DataGrip)

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5442` |
| Database | `artistry` |
| User | `artistry` |
| Password | (see `POSTGRES_PASSWORD` in your `.env`) |
