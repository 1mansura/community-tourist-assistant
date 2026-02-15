# Community Tourist Assistant

A crowd-sourced tourism platform for Devon: discover attractions, heritage sites, beaches, and dining. Submit places, write reviews, upload photos, and explore on an interactive map, with moderation and gamification (points, badges, leaderboard).

## System overview

Two parts run on your machine:

- **Frontend** — Next.js (React) app: the site you open in the browser.
- **Backend** — Django REST API: serves data (places, reviews, users). The frontend calls it automatically.

| Part      | URL                     | When you use it |
|-----------|-------------------------|------------------|
| Frontend  | http://localhost:3000   | Open this in the browser. |
| Backend   | http://localhost:8000   | API + Swagger docs at `/api/docs/`. |

You only need to visit **http://localhost:3000**; the UI talks to the API on 8000 by itself.

## What is the Community Tourist Assistant?

The **Community Tourist Assistant (CTA)** is a web application that lets people discover and share tourism-related places in Devon (attractions, heritage, beaches, food). **Visitors** browse and search places, view them on a map, and read reviews. **Registered users** can submit new places (with photos), write reviews, rate locations, and earn points and badges. **Administrators and moderators** review submitted content in a queue (approve or reject), handle user reports, and view an audit log. The platform is community-driven: users contribute content, and moderation and reporting keep it accurate and appropriate. **PlantUML sources** (C4, components, ERD, deployment, sequences) are in **`architecture/`** at the repo root — see [architecture/README.md](architecture/README.md).

## Key features

- **Interactive map** — Places on a map with sidebar search; click for details, "View full page", or "Write a review".
- **Browse & discover** — List of places with filters (category, search, sort by rating or date).
- **Submit places** — Add new places with location, description, and images (pending moderation).
- **Reviews & ratings** — Rate places, write reviews, mark reviews as helpful.
- **Auth & roles** — Register and log in (JWT); roles: user, contributor, moderator, admin.
- **Gamification** — Points and badges for contributions; leaderboard.
- **Moderation** — Queue for staff to approve/reject submissions; user reports and audit log.
- **Responsive UI** — Works on mobile; animations and clear navigation.

## Backend API

The backend is a **Django REST API** (Django 4.2 + Django REST Framework) that provides all data and business logic for the frontend. It runs on port **8000** and is the single server-side component that the frontend talks to.

- **Authentication:** JWT (SimpleJWT). Users register and log in via `/api/users/register/` and `/api/users/login/`; the frontend sends the access token in the `Authorization` header for protected endpoints. Refresh tokens extend sessions; logout blacklists the token.
- **Data:** PostgreSQL stores users, places (assets), categories, reviews, moderation actions, reports, and gamification (points, badges). MinIO (S3-compatible) stores uploaded images; the API returns URLs that the frontend uses to display photos.
- **Endpoints:** Assets (list, detail, create, featured, nearby, categories), reviews (list, create, mark helpful), users (profile, leaderboard), moderation (queue, approve/reject, reports, audit), and analytics (platform stats). All list endpoints are paginated; filtering and search are supported where relevant.
- **Roles:** Permission classes enforce who can do what: e.g. only moderators/admins see the moderation queue and decide actions; only authenticated users can submit places or write reviews. See the [API endpoints](#api-endpoints) table below and **http://localhost:8000/api/docs/** (Swagger) for the full list.

The API is stateless (no server-side sessions), so it can be scaled horizontally behind a load balancer. OpenAPI schema is at `/api/schema/`; interactive docs at `/api/docs/`.

## Frontend

The frontend is a **Next.js 15** application (React 18, TypeScript) that runs on port **3000**. It is the only UI users interact with; it calls the backend API for all data.

- **Pages and routing:** Next.js App Router defines the routes: home (`/`), browse (`/assets`), place detail (`/assets/[slug]`), map (`/map`), submit (`/assets/submit`), login/register, profile (`/profile`), leaderboard (`/leaderboard`), and admin moderation (`/admin/moderation`). Each page composes shared layout (header, nav) and page-specific components.
- **State and API:** React Context holds auth state (user, tokens); services in `src/services/` call the backend via a shared API client (`src/lib/api.ts`) that attaches the JWT and handles base URL. React Query can be used for server-state caching where needed.
- **UI and maps:** Tailwind CSS and Framer Motion handle layout and animations. The map view uses Leaflet with OpenStreetMap tiles; place markers and a sidebar list let users explore and open place details. Forms (submit place, review, login) use controlled components and the same API client.
- **Roles in the UI:** Links to the moderation queue and admin-only actions are shown only to users with the right role; the backend still enforces permissions so the UI only reflects what the API allows.

Building and running: `npm run dev` in `frontend/`; set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` so the app targets your local backend. See [Project structure](#project-structure) below for folder layout.

## Project structure

```
ECM3432/
├── frontend/                  # Next.js frontend application (see frontend/README.md)
│   ├── src/
│   │   ├── app/              # Next.js App Router (pages, layout)
│   │   ├── components/       # React components (UI, assets, map, reviews, layout)
│   │   ├── contexts/         # React context (e.g. auth)
│   │   ├── services/         # API service layer
│   │   ├── types/           # TypeScript interfaces
│   │   └── lib/             # Utilities (API client, etc.)
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── README.md            # Frontend run/test pointers
│   └── Dockerfile           # Frontend container configuration
├── backend/                   # Django REST API (see backend/README.md)
│   ├── apps/
│   │   ├── assets/          # Places, categories, images
│   │   ├── users/           # Auth, profiles, leaderboard, badges
│   │   ├── reviews/         # Ratings and reviews
│   │   ├── moderation/      # Queue, reports, audit
│   │   └── analytics/       # Platform statistics
│   ├── config/              # Django settings
│   ├── fixtures/            # Seed data (categories + example places)
│   ├── tests/               # pytest test suite
│   ├── README.md            # Backend run/test pointers
│   └── Dockerfile           # Backend container configuration
├── scripts/                 # start-demo.sh, reset-demo-data.sh, setup-demo-docker.sh, docker-fresh-restart.sh, …
├── docker-compose.yml       # Full stack (frontend, backend, db, minio)
├── .env.example             # Environment variable template
└── README.md                # This file — run/build instructions
```

## Technologies

### Frontend

| Area | Technologies |
|------|--------------|
| **Core** | Next.js 15 (React 18), TypeScript |
| **UI & styling** | Tailwind CSS, Framer Motion, Lucide React (icons) |
| **Maps** | Leaflet, OpenStreetMap |
| **Networking** | Axios (API client) |
| **State** | React Context, Zustand |
| **Tooling** | ESLint, Jest |

### Backend

| Area | Technologies |
|------|--------------|
| **Core** | Python 3.11, Django 4.2, Django REST Framework |
| **Database** | PostgreSQL 15 |
| **Storage** | MinIO (S3-compatible) for images |
| **Auth** | JWT (SimpleJWT), token blacklist, role-based access (user, contributor, moderator, admin) |
| **API docs** | drf-spectacular (OpenAPI / Swagger) |
| **Tooling** | pytest, pytest-django, pytest-cov, ruff |

### Infrastructure

- Docker & Docker Compose
- GitHub Actions (CI: tests, lint, frontend build)

## Setup

**In short:** Have PostgreSQL running, then start the backend (port 8000) and frontend (port 3000). Or run everything with Docker. Load fixtures if you want example places.

### Prerequisites

- Node.js (≥20) and npm
- Python (≥3.11)
- PostgreSQL (local or via Docker)
- MinIO optional for local dev (uploads can go to `backend/media/`)

### Backend setup

1. Go to the backend folder:
   ```bash
   cd backend
   ```

2. Use the project virtual environment (recommended; separate from conda):
   ```bash
   # One-time: create venv and install deps (already done if you ran scripts/run-backend-tests.sh)
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
   To run Django or pytest, either activate the venv or use its binaries:
   ```bash
   source .venv/bin/activate   # then: pytest, python manage.py runserver, etc.
   # Or without activating:
   .venv/bin/pytest
   .venv/bin/python manage.py runserver
   ```
   VS Code will use `backend/.venv` automatically if you select that interpreter (or use the workspace default).

3. Configure environment variables (create `.env` in project root from `.env.example`, or set):
   ```bash
   # Database (local or Docker)
   export DJANGO_SETTINGS_MODULE=config.settings.dev
   export DB_HOST=localhost
   export POSTGRES_USER=your_user
   export POSTGRES_PASSWORD=your_password
   export POSTGRES_DB=tourist_assistant

   # Optional: MinIO for image uploads (local dev can use backend/media/)
   # MINIO_ROOT_USER=minioadmin
   # MINIO_ROOT_PASSWORD=minioadmin
   # MINIO_ENDPOINT=localhost:9000
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. (Optional) Load example places and demo users (for video demos):
   ```bash
   python manage.py loaddata fixtures/categories.json fixtures/assets.json
   python manage.py seed_demo --with-images   # creates admin@example.com / DemoAdmin123!, etc.; adds placeholder images
   ```

6. (Optional) Create a superuser (Django admin at /admin/):
   ```bash
   python manage.py createsuperuser
   ```

7. Start the backend:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   You should see the API at **http://localhost:8000** and docs at **http://localhost:8000/api/docs/**.

### Frontend setup

1. Go to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment (create `.env.local` or set):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```
   Frontend is at **http://localhost:3000** (always port 3000).

### One-command local run

From the **project root** (after backend venv and DB are set up once):

```bash
./scripts/start-local.sh
```

Stops anything on 3000/8000, starts backend then frontend. Open **http://localhost:3000**. Ctrl+C stops both.

### Load example places

If Explore or the Map are empty, load seed data:

From project root:

```bash
./scripts/load-fixtures.sh
```

Or from `backend` with venv activated:

```bash
python manage.py loaddata fixtures/categories.json fixtures/assets.json
```

This loads 7 categories and 12 Devon places focused around Exeter/Exmouth.

### Troubleshooting

| Problem | Fix |
|--------|-----|
| Port 3000 (or 8000) in use | Run `./scripts/start-local.sh` to free both and restart. |
| "Cannot find module './XX.js'" | Stale Next cache. In `frontend`: `npm run dev:clean`. On Windows: delete `frontend/.next`, then `npm run dev`. |
| Empty list or API errors on /assets | Start the backend; load fixtures with `./scripts/load-fixtures.sh` if you want example data. |

## Docker setup and deployment

**Local run with Docker (PostgreSQL)** — The app uses PostgreSQL; Docker supplies the database and the rest of the stack.

| Script | When to use |
|--------|-------------|
| **`./scripts/reset-demo-data.sh`** | **Easiest between practice runs:** same containers/volumes; resets DB + MinIO objects + `seed_demo` to the default baseline (fast). |
| **`./scripts/start-demo.sh`** | First time or after Docker issues: tears down project volumes, fresh `up --build`, then same seed as above. |
| **`./scripts/docker-fresh-restart.sh`** | Stale images / need `--no-cache` rebuild + `npm install` in the frontend container. |

**One command for a full clean stack + default demo data:**

```bash
./scripts/start-demo.sh
# same as: ./scripts/setup-demo-docker.sh
```

**Quick reset only (keep Docker running):**

```bash
./scripts/reset-demo-data.sh
```

Then open **http://localhost:3000** and log in (e.g. admin@example.com / DemoAdmin123!).
This script also ensures MinIO object storage is ready for media (bucket + policy), then seeds placeholder images.

**Stale containers or old frontend after many code changes?** Run `./scripts/docker-fresh-restart.sh` — it removes project volumes, rebuilds backend/frontend with `--no-cache`, and re-seeds the demo (slower than `setup-demo-docker.sh`, but guarantees a clean stack).

If you see **`No such container`** or **`volume ... already exists but was not created by Docker Compose`**, Docker Engine was likely restarted mid-teardown: run `./scripts/docker-fresh-restart.sh` again (it force-removes project containers/volumes), or manually: `docker compose down --remove-orphans` then `docker volume rm -f ecm3432demo_db_data ecm3432demo_minio_data` (older clones may still have `ecm3432_*` volumes), then `./scripts/start-demo.sh`.

**Manual Docker steps:**

1. Clone the repo, then copy env: `cp .env.example .env`
2. Start the stack: `docker compose up --build` (or `docker compose up -d` for background). The backend runs **migrations automatically** on startup (PostgreSQL).
3. (Optional) Load example places and demo users:
   ```bash
   docker compose exec backend python manage.py loaddata fixtures/categories.json fixtures/assets.json
   docker compose exec backend python manage.py seed_demo --with-images
   ```
   For deterministic demo resets (including MinIO object storage setup), prefer `./scripts/setup-demo-docker.sh`.
4. Use the app at the URLs below.

| Service       | Port  | URL |
|---------------|-------|-----|
| Frontend      | 3000  | http://localhost:3000 |
| Backend API   | 8000  | http://localhost:8000/api |
| API docs (Swagger) | 8000  | http://localhost:8000/api/docs/ |
| MinIO console | 9001  | http://localhost:9001 |
| PostgreSQL    | 5432  | (internal) |

MinIO login (default local demo): `minioadmin` / `minioadmin`.

Useful commands: `docker compose logs -f` (logs), `docker compose down` (stop), `docker compose down -v` (wipe volumes).

A separate `docker-compose.prod.yml` is provided for production-like deployments.

## Privacy and data protection

The platform collects only the minimum data needed to operate: **email address** and **username** at registration. No real names, phone numbers, or addresses are required. Emails are never exposed publicly (the leaderboard and review listings show usernames only). Passwords are hashed using Django's default PBKDF2 (SHA-256) algorithm. The application does not use third-party analytics or tracking scripts, and no user data is shared with external services. All uploaded images are stored in the project's own MinIO (S3-compatible) bucket, not on external CDNs. For local/demo use, data stays on the host machine; for production, standard server-side security practices (HTTPS, firewall, backup) apply.

## License

ECM3432 Software Engineering coursework 

## Contributing

Use conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `infra:`). Run tests and lint before submitting.
