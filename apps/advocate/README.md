# Chambers advocate app

Available at `/advocate`, with shared platform sign-in and an `advocate` app-access grant. Owners have access automatically.

- `frontend/`: casebook, clients, hearing diary, tasks, documents, notes, fees, reports and legal icons.
- `backend/routes.js`: authenticated business endpoints and transactional workflows.
- `backend/schema.js`: field metadata and validation.
- `backend/store.js`: Chambers data, derived balances, legacy migration and backups.
- `database/schema.sql`: business tables and reporting views.
- `tests/`: mobile and desktop browser workflows.

Run `npm run test:advocate` from the repository root. Cross-app API integration tests remain in root `tests/`. See [architecture](../../docs/ARCHITECTURE.md) for shared services and SQL ownership.
