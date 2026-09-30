# Tournament Lite

Open `/tournament-lite`. Organizers use the platform account; Owner and app-authorized Advocate roles can organize their own tournaments. Players need no accounts. The app supports 2–64 entries and all six sports: Cricket, Badminton, Table Tennis, Pickleball, Chess and Carrom.

1. Create a tournament, choose a sport/format and review local rules.
2. Add one entry per line. Optional syntax: `Name | player one, player two | seed`. Doubles require exactly two players. Team rosters are comma-separated names. The random team builder can split individual names into equal teams or pairs.
3. Generate fixtures. Unseeded entries are shuffled, seeds are separated in knockout brackets, and BYEs advance automatically. Participants lock after generation.
4. Assign court/table/ground and IST times, mark current matches live, and enter results. Racket/board scores can be saved during a game or between games; use **Continue scoring** after reopening. A best-of-three match completes after two game wins. Deciding scores automatically update standings and bracket progression; partial scores do not count as results. Cricket and Chess still require a complete result.
5. Choose **Share tournament** to publish a read-only link. Anyone with the link can see participant names, fixtures, scores and winners; organizer contact and team rosters remain private. Public pages refresh every 30 seconds while visible. **Stop sharing** disables the link. WhatsApp opens a draft for manual sending.
6. Download a PNG winner card when all matches finish.

## Rules and corrections

- Knockout, single round robin, league plus knockout, and group stage plus knockout are supported. Groups require at least two entries each and equal qualifiers per group. The knockout stage is generated only after all league/group games finish.
- Racket sports support best of 1/3/5/7, configurable target points, win-by 1/2 and an optional cap. Badminton starts at 21 points, Table Tennis and Pickleball at 11 in the creation form. Carrom uses a best-of-board series with arbitrary local board totals; the higher total wins a board.
- Chess uses first-listed player as White, defaults to 1 / 0.5 / 0 league points, and requires decisive knockout replays. This is round robin or elimination, not a Swiss pairing engine.
- Cricket accepts innings totals, wickets and overs in cricket notation (`4.3` means 27 balls). League ties receive draw points; knockout ties require the organizer to enter the winner of a separately played tiebreak. NRR aggregates runs and balls across innings; all-out innings use the full scheduled overs. There is no ball-by-ball, abandoned-match or rain/DLS adjustment support.
- Standings sort by points, then NRR for Cricket or score difference for other sports, then original entry order. This deterministic final tiebreak is visible in Rules and also decides tied league champions and qualifiers.
- Correcting a knockout winner clears affected later results. A league correction after qualification explicitly requires confirmation and regenerates the knockout stage, including schedules. Unaffected league results remain intact.
- Scoring rules are fixed on creation; participants are editable until fixture generation. Before generating league/group knockout fixtures, use **Rules → Edit qualification** to adjust the qualifier and group counts if entry numbers change or generation is blocked. Setup shows only relevant sport/format fields. Tournament and match state, including partial racket/board scores, is persisted in SQLite. There is no browser-only business storage or offline editing.

## Ownership and recovery

Use **Edit details** to correct the tournament name, venue, dates and organizer details, including after play starts. Existing match schedules and venues remain unchanged; edit each match through **Schedule / status**. Public viewers cannot edit, and organizer contact remains private.

`backend/engine.js` owns formats and progression; `backend/sports.js` owns scoring and validation; `backend/routes.js` owns authorization, revisions and SQLite transactions. Additive SQL is in `database/001-initial.sql` and included in full platform SQL exports. Tournament snapshots have stable IDs, account ownership, public tokens and optimistic revisions. Concurrent stale writes are rejected; use Refresh before retrying. Shared Chambers data and legacy migration files are not modified by the app.

Use the platform's full SQL backup for recovery. Chambers-only JSON backups do not include tournaments. Cloud synchronization, external sports feeds, automated messages and payment collection are not integrated. Public links require the same server to be reachable; a local test URL is not an internet deployment.

Run `node --test tests/tournament.test.js` and `npx.cmd playwright test apps/tournament-lite/tests` from the repository root. Tests use isolated temporary databases.
