# Focus

Public `/focus` provides a 25-minute timer with pause/resume/reset. Signed-in users keep private daily task lists with priorities, time estimates, completion, editing, deletion and carry-forward. India dates default to today. Shared database settings store each personal plan under `focus:<user-id>`; this reuses SQLite/SQL Server/D1 persistence without a schema migration. Every mutation validates the session, revision and input. Limits: 100 tasks/day, 500/account and 160 characters/task. No guest task storage, notifications, external task integration or automatic timer persistence.
