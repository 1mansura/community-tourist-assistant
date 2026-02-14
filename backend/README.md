# Backend — Community Tourist Assistant (CTA)

**Django 4.2.x** + **Django REST Framework**, **JWT** (SimpleJWT), **PostgreSQL**, optional **MinIO** (S3-compatible) for media. Stateless API for the Next.js frontend.

---

## Django apps and responsibilities

| App | Models / concerns | API highlights |
|-----|-------------------|----------------|
| **`apps.assets`** | `Category`, `Asset`, `AssetImage` | List (approved only for public), detail, create (pending), featured, nearby, categories; image upload per slug; `my_submissions` |
| **`apps.users`** | Custom `User`, badges/points | Register, login (**custom** serializer for suspended/banned messages), profile, leaderboard |
| **`apps.reviews`** | `Review` | CRUD/list by asset, helpful votes |
| **`apps.moderation`** | `ModerationAction`, `Report`, `AuditLog` | Queue (pending assets + images), decide (approve/reject/request_changes), history, reports + resolve, user status (suspend/ban/reactivate), audit (admin) |
| **`apps.analytics`** | Counters / aggregates | Public stats; **admin** analytics endpoint for dashboard |

**Django Admin** (`/admin/`) registers models for superusers (e.g. raw category fixes). **Day-to-day moderation** is intended through the **Next.js** `/admin/moderation`, `/admin/reports`, `/admin/analytics` pages, which call these APIs.

---

## Feature coverage (backend)

- **Auth:** Registration, JWT pair + refresh blacklist on logout; RBAC (`user`, `contributor`, `moderator`, `admin`).
- **Assets:** Slug-based detail; submitter can see non-approved own assets; moderators see all in queue.
- **Media:** `django-storages` + S3 backend when `USE_S3_MEDIA=true` (Docker dev → MinIO); else local `MEDIA_ROOT` + `/media/` in DEBUG.
- **Gamification:** `add_points()`, badge rules in `apps/users/badges.py`; points on approve, reviews, image upload (see project docs).
- **Moderation:** Decisions logged; approve recalculates submitter `contribution_count` from approved assets; audit entries for reports and user actions.
- **Reporting:** Create report (authenticated); staff list/resolve.
- **API docs:** **drf-spectacular** — `/api/docs/`, `/api/schema/`.

Settings modules: `config/settings/base.py`, `dev.py`, `test.py`, `prod.py`. Tests use `config.settings.test` (long `SECRET_KEY` for JWT).

---

## Run locally (without Docker)

From **`backend/`** (or set paths accordingly):

```bash
# Project root: copy .env from .env.example and set DB_* / POSTGRES_*
export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

- **API base:** http://localhost:8000/api/  
- **Swagger:** http://localhost:8000/api/docs/  
- **Health:** http://localhost:8000/health/  

Use **PostgreSQL**; for MinIO locally, set `USE_S3_MEDIA` and MinIO-related env vars (see `config/settings/dev.py`).

---

## Run with Docker

From the **repository root**:

```bash
./scripts/start-demo.sh
# or ./scripts/reset-demo-data.sh
```

This folder's **`Dockerfile`** and **`docker-entrypoint.sh`** are used by **`docker-compose.yml`**. A separate **`docker-compose.prod.yml`** exists for a more production-like stack.

---

## Tests

```bash
export DJANGO_SETTINGS_MODULE=config.settings.test
pytest
pytest --cov=apps --cov-report=term-missing --cov-fail-under=60
```

Tests live in **`tests/`** (`conftest.py`, `test_*.py`): auth, assets, reviews, moderation, system health, etc.

---

## Fixtures and demo seed

- **`fixtures/categories.json`**, **`fixtures/assets.json`** — baseline places/categories.
- **`python manage.py seed_demo`** / **`seed_demo --with-images`** — demo users, pending/rejected queue items, reviews, reports, moderation history, chart-friendly dates (see command help in `apps/users/management/commands/seed_demo.py`).

---

## Related documentation

| Doc | Topic |
|-----|--------|
| [../README.md](../README.md) | Full stack, API endpoint table |
| [../architecture/README.md](../architecture/README.md) | PlantUML diagrams index |
