# Sushant Synapse portal

Available at `/`. Owns the platform home, searchable app collection, favourites, recent launches, profile screens and owner-managed team access.

- `frontend/`: portal HTML, JavaScript, styles, brand icon and manifest.
- `backend/routes.js`: app catalogue responses, preferences, launches and access grants.
- `tests/`: portal browser workflows, including shared sign-in with Chambers.

Run `npm run test:portal` from the repository root. Identity is implemented in `packages/auth`; preferences and access tables belong to `packages/database`. App definitions live in `packages/app-registry`.

Projects, Finance and Knowledge are planned catalogue entries, not implemented apps. Add real app folders when their development begins; follow [the architecture guide](../../docs/ARCHITECTURE.md).
