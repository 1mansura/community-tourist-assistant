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

## License

ECM3432 Software Engineering coursework 

## Contributing

Use conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `infra:`). Run tests and lint before submitting.
