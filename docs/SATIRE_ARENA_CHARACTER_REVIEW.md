# Arena character pages: local design review

Status: user authorised commit and production publication on 2026-10-18;
deployment verification follows. Preview uses an isolated temporary SQLite database;
its reactions are test data, separate from production.

Open [Namo Nimbus](http://localhost:3035/satire-arena/characters/namo-nimbus) to
start. Each page has previous/next links and a scrollable cast strip for reviewing
the full set one by one. The local preview server is bound to localhost only.

| Character | Profile direction | Local preview |
| --- | --- | --- |
| Namo Nimbus | Grand entrances, stage presence, golden accents | [Review](http://localhost:3035/satire-arena/characters/namo-nimbus) |
| Rally Rohan | Eternal campaigner, fresh starts, lilac accents | [Review](http://localhost:3035/satire-arena/characters/rally-rohan) |
| Muffler Mohan | Neighbourhood fixes, whiteboards, blue accents | [Review](http://localhost:3035/satire-arena/characters/muffler-mohan) |
| Briefcase Babu | Committees and paperwork, mint accents | [Review](http://localhost:3035/satire-arena/characters/briefcase-babu) |
| Drumroll Didi | Street-corner energy and quick comebacks | [Review](http://localhost:3035/satire-arena/characters/drumroll-didi) |
| Coalition Chacha | Musical chairs and flexible alliances | [Review](http://localhost:3035/satire-arena/characters/coalition-chacha) |
| Saffron Sage | Deadpan delivery and theatrical pauses | [Review](http://localhost:3035/satire-arena/characters/saffron-sage) |
| Cycle Captain | Scenic routes and comeback laps | [Review](http://localhost:3035/satire-arena/characters/cycle-captain) |
| Lexicon Lord | Elaborate vocabulary and comic footnotes | [Review](http://localhost:3035/satire-arena/characters/lexicon-lord) |
| Highway Hari | Lanes, detours and opening ceremonies | [Review](http://localhost:3035/satire-arena/characters/highway-hari) |
| Budget Beena | Decimal points, annexures and fine print | [Review](http://localhost:3035/satire-arena/characters/budget-beena) |
| Rally Raja | Extra innings and encore rallies | [Review](http://localhost:3035/satire-arena/characters/rally-raja) |
| Debate Dastan | Rebuttals and never-ending clarifications | [Review](http://localhost:3035/satire-arena/characters/debate-dastan) |

Every page includes a portrait hero, six reactions in one mobile row, a fictional
character sketch, personality traits, three original signature lines, published
punchline history when available, sharing and cast navigation. These sketches and
one-liners are fictional parody; they are not real biographies or attributed quotes.
Published editorial biographies/taglines take precedence over fallback copy.

Reactions use the same validated annual API, browser identity and sound effects as
the Arena. Save failures reconcile against the server; unavailable scores disable
voting and show a retry control. Opening a page never casts a reaction.

Existing compressed WebP artwork is reused. New CSS is scoped to character detail
pages. No new service, schema, migration, AI connection or production data change.

Review screenshots are in `.publish/character-review/`: thirteen full mobile
captures plus a Namo desktop capture. To restart a stopped local preview, run
`node .publish/character-preview.cjs`; it creates a new temporary database.
