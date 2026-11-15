# Chambers advocate app

Available at `/advocate`, with shared platform sign-in and an `advocate` app-access grant. Owners have access automatically.

- `frontend/`: casebook, clients, hearing diary, tasks, documents, notes, fees, reports and legal icons.
- `backend/routes.js`: authenticated business endpoints and transactional workflows.
- `backend/schema.js`: field metadata and validation.
- `backend/store.js`: Chambers data, derived balances, legacy migration and backups.
- `database/schema.sql`: business tables and reporting views.
- `tests/`: mobile and desktop browser workflows.

Daily-work follow-ups (local, 15 November 2026): case-toolbar quick tasks keep
the matter linked and return to its Tasks panel; Overview supports My work;
larger client/case dropdowns have search; saved outcomes offer reviewed,
editable client-update copy. Copy sends no message. Search and filters operate
only on the existing authorised workspace state; APIs retain write enforcement.
See the functionality ledger for verification and release status.

Run `npm run test:advocate` from the repository root. Cross-app API integration tests remain in root `tests/`. See [architecture](../../docs/ARCHITECTURE.md) for shared services and SQL ownership.
