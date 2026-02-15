# Frontend — Community Tourist Assistant (CTA)

Next.js **15** (App Router), **React 18**, **TypeScript**. All dynamic data comes from the **Django REST API**; this app is the only public UI.

---

## Features (by area)

### Public & authenticated user

| Area | Route(s) | What it does |
|------|-----------|----------------|
| **Home** | `/` | Featured / discovery content, entry to map and explore |
| **Explore** | `/assets` | Paginated place list; search, category filter, sort (rating / newest / most reviewed) |
| **Place detail** | `/assets/[slug]` | Description, category, location, map, images, ratings, reviews; **Report** (guests prompted to sign in) |
| **Suggest edits** | `/assets/[slug]/edit` | Owner-only edit + optional photo for pending/rejected submissions |
| **Map** | `/map` | Leaflet map, markers, discovery |
| **Submit place** | `/assets/submit` | New place + optional photo, Nominatim address search + map pin, pending moderation |
| **Auth** | `/login`, `/register` | JWT via API; login notifications (points/badges; staff see queue/report counts) |
| **Profile** | `/profile` | Stats, points explainer, contribution progress, **Modify** pending/rejected submissions, reviews list, badges (non-staff) |
| **Leaderboard** | `/leaderboard` | Top users by points (live fetch, no stale cache) |
| **About** | `/about` | Static project info |

### Staff (moderator / admin)

| Area | Route(s) | What it does |
|------|-----------|----------------|
| **Dashboard** | `/admin/analytics` | KPIs, charts (submissions trend, status, moderation mix, categories, top contributors) |
| **Moderation** | `/admin/moderation` | Pending queue with **submitted images**, approve / reject / request changes, moderation history cards, user suspend/ban/reactivate |
| **Reports** | `/admin/reports` | User content reports: filter by status, resolve / dismiss |
| **Nav** | Header | Home, Profile, Dashboard, Moderation, Reports (staff); reduced noise vs contributor menu |

### Utilities

| Route | Purpose |
|-------|---------|
| `/status` | Optional health-style checks (API, frontend origin); not linked in main nav |

### UX / technical

- **Auth:** `AuthContext` + JWT in `localStorage`; API client attaches `Authorization`.
- **Notifications:** `NotificationContext`; high-contrast centered overlays; route-aware display and auto-clear on navigation.
- **Media:** `mediaUrl()` normalizes API paths vs absolute MinIO URLs; Next.js rewrites/proxy as configured in `next.config.js`.
- **Maps:** Leaflet (dynamic import where needed to avoid SSR issues).
- **Roles:** Header and pages branch on `user.role`; server components use `getApiUrl()` (`INTERNAL_API_URL` vs `NEXT_PUBLIC_API_URL`).

---

## Run locally (without Docker)

```bash
npm install
# Create .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev
```

Open **http://localhost:3000**. The backend must be running on port **8000** (see `../backend/README.md`).

---

## Run with Docker (full stack)

From the **repository root** (not `frontend/`):

```bash
./scripts/reset-demo-data.sh   # quick: default demo data, same containers
./scripts/start-demo.sh        # clean volumes + up + seed
```

See root **[../README.md](../README.md)** for full Docker instructions.

This folder's **`Dockerfile`** is used by root **`docker-compose.yml`** (dev server).

---

## Project layout

| Path | Contents |
|------|----------|
| `src/app/` | App Router: pages, layouts, `error.tsx`, route groups |
| `src/components/` | UI primitives, assets, map, reviews, layout (e.g. `Header`) |
| `src/contexts/` | `AuthContext`, `NotificationContext` |
| `src/services/` | API modules (`assets`, `reviews`, `moderation`, …) |
| `src/lib/` | `api.ts` (Axios + camelCase transform), `apiUrl.ts`, `mediaUrl.ts`, etc. |
| `src/types/` | Shared TypeScript types |
| `public/` | Static assets |

---

## Tests and quality

```bash
npm test -- --runInBand --watchAll=false
npm run lint
npx tsc --noEmit
npm run build
```

---

## Related documentation

| Doc | Topic |
|-----|--------|
| [../README.md](../README.md) | End-to-end setup, API summary |
| [../architecture/README.md](../architecture/README.md) | PlantUML diagrams index |
