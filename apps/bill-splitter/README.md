# Bill Splitter

One flow for shared expenses: add each person, enter what they paid underneath
their name, and read live settlements. Expenses default to everyone; the inline
Shared by control selects the participants for that expense. The payer can be
excluded (for example, buying a gift for someone else). Adding a person updates
everyone-shared expenses, while explicitly selected subsets stay explicit.
Removing the last selected person requires choosing new participants; it never
silently changes that expense to everyone. Person removal confirms deletion of
entered expenses. Example and Start fresh are secondary actions.

The app-owned splitGroup engine allocates integer paise per expense, assigns
indivisible paise in person order, aggregates paid/share balances and settles the
net debts. It validates 2-20 distinct names, 1-100 positive expenses and nonempty,
unique valid participant lists. The previous split/splitExpenses calculation
exports remain compatible; their global percentage/weight/custom controls are
removed from this interface. No bill/trip mode, login, payment integration or
editable sharing link. Copy includes expenses, participants and settlements.
Inputs/results stay in memory in this tab; refreshing clears them.

Verification: tests/bill-group.test.js covers exclusions, stable rounding, bad
input, 500 generated groups, maximum totals and settled groups. Existing engine
compatibility checks remain in tests/bill-trip-arrangements.test.js and
tests/public-quick-wins.test.js. Focused browser checks in this app cover live
updates, copy fallback, renames, additions/removals, empty subsets, invalid edits,
refresh and responsive themes using disposable DATA_DIR values. Historical Ritual
checks in the same browser file are separate workflows.

No backend, schema or business-data changes. See docs/FUNCTIONALITY_LEDGER.md for
verified release/deployment status.
