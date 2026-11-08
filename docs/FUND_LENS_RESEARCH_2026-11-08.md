# Fund Lens: provider research and implementation audit

Reviewed 8 November 2026 (Asia/Kolkata). Discussion proposal; no Fund Lens product
changes are included in the Hisabio rename release.

## Recommendation

Keep Fund Lens focused on understanding holdings and historical performance.
Improve data usability before adding more metrics. The next release should make
coverage obvious, make long NAV histories practical to import, and present the
existing calculations in a smaller mobile summary. After that, add optional
amount-weighted exposure and rolling-return analysis using official/user-supplied
data. Retain the three existing destinations: holdings, performance and planning.

This is a comparison of selected established providers, not a traffic ranking or
an assessment of which provider gives the best investment advice. Public product
pages, documentation and educational material were inspected. Paid dashboards,
authenticated accounts, native phone applications, transaction execution and
provider calculation accuracy were not independently tested. Published feature
descriptions establish availability/intent, not independently verified outcomes.
Competitor pages were read for research; their financial datasets were not copied.

## What the providers do and what to learn

| Provider | Verified public approach | Useful lesson for Fund Lens |
| --- | --- | --- |
| [Groww comparison](https://groww.in/mutual-funds/compare) | Three fund slots, standardized fields for costs/risk/returns, holdings and manager details. | Start with a small shortlist and a predictable comparison. Use only facts supported by our own sources. |
| [Value Research tools](https://www.valueresearchonline.com/premium/subscribe/) and [comparison framework](https://www.valueresearchonline.com/stories/224457/how-to-compare-mutual-funds-key-metrics/) | Portfolio planning/analysis, printable fund cards and a framework considering category, longer histories, costs and consistency. | A concise, dated fund summary is more useful than an unexplained overlap percentage. |
| [ET Money portfolio health](https://www.etmoney.com/portfolio-health) and [analysis help](https://www.etmoney.com/help/mutual-funds/portfolio-analysis/how-do-you-analyse-portfolio) | Explains sector exposure, fluctuations and consistency through portfolio-oriented findings. | Turn calculations into plain-language observations. Do not equate our holdings overlap with overall portfolio health. |
| [Advisorkhoj overlap](https://www.advisorkhoj.com/mutual-funds-research/mutual-fund-portfolio-overlap) and [rolling returns](https://www.advisorkhoj.com/mutual-funds-research/rolling-return-performance-comparison) | Task-specific tools: pair overlap/common stocks with a reporting date; separate rolling-window comparisons. | Keep holdings composition and historical returns separate, with dates visible beside the answer. |
| [Morningstar comparison help](https://www.morningstar.com/help-center/funds/compare-funds) | Public help describes standardized comparisons of up to five securities, screening and analyst reports. Search-indexed help was accessible; direct retrieval returned 403. | Use progressive detail and consistent definitions. Its proprietary ratings are not a feature we can reproduce from holdings alone. |
| [Tickertape screener](https://www.tickertape.in/screener/home/mutual-fund?switch=true) and [official guide](https://www.tickertape.in/blog/how-to-use-tickertape-mutual-fund-screener/) | Fund discovery with category, plan, size, costs, returns and risk filters. The detailed guide is dated December 2022; current public screener was also checked. | A few useful filters can help discovery. Fifty filters would work against our mobile simplicity goal. |

These lessons are design inferences from the cited material, not claims that
Fund Lens matches those providers' data coverage, ratings or advisory services.

## What Fund Lens actually has

Source inspection includes `frontend/index.html`, `fund-picker.js`,
`simple-comparison.js`, `engine.js`, `performance.js`, `performance-engine.js`,
`planning.js`, `analytics-engine.js`, and the official/reference indexes.

- Default search uses saved catalogue names and official holdings references.
  Searching for a name and having comparable holdings are different capabilities.
  HDFC Balanced Advantage can be found while its holdings remain unavailable.
- Selection supports two to eight portfolios. The mobile picker now uses readable
  in-flow results. A native-dropdown replacement is not the outstanding problem.
- Results already calculate weighted pair overlap by ISIN, common/unique
  securities, industry overlap, dates and included NAV coverage. Detailed sources,
  exclusion notes, a pair matrix, exports and printing already exist.
- The default comparison normalizes included physical equities to 100%. Original
  disclosed NAV weights are available as a separate basis. Cash, debt,
  derivatives and fund-unit look-through are excluded. Physical equity in an
  arbitrage strategy does not represent its net unhedged exposure.
- The committed `official-index.json` has 592 entries from 22 fund houses, all
  dated 30 September 2026. This count excludes the separate five-reference base
  index and is not a claim that all catalogue schemes or current months are
  covered. The entries' broad category label is “Physical equity portfolio”,
  so it cannot support trustworthy regulatory-category screening by itself.
- Performance accepts user-supplied Growth-plan histories; it calculates common-
  date growth, total/annualized return and observed drawdown, with gap/staleness
  notices. Imports remain in the tab, clear on reload and replace prior imports.
- Retirement, SIP/step-up and goal planning already exist. More simple calculators
  alone would not resolve the comparison problems.
- `analytics-engine.js` contains rolling, exposure, SIP/XIRR and risk helpers;
  `portfolio-core.js` also exists. Neither is loaded by the current default HTML.
  This is reusable code to audit, not evidence that these features are shipped.

## Highest-value gaps

### 1. Historical-data preparation is too much work

The [AMFI NAV download page](https://www.amfiindia.com/net-asset-value/nav-download)
includes a history form and explicitly limits a download to 90 days. The existing
Fund Lens link is valid; the problem is the import workflow. A user collecting
several periods cannot append them in the app. A new import replaces the prior
file, so multi-year and multi-plan history requires external file preparation.

Proposed fix: accept multiple files and offer Add history / Replace history.
Merge locally by scheme code and date, deduplicate identical observations, reject
conflicting NAVs without replacing valid data, and show each plan's date range,
row count and gaps. Preserve bounded total file/row/plan limits across all files.
Show short instructions that the official source may require several periods.
Keep optional device-local history persistence a separate explicit choice.

### 2. Exact-plan identity needs a stronger check

The UI asks for exact Direct/Regular Growth plans, but the current parser checks
Growth versus distribution wording and code format; it does not require a plan
type or verify names against official metadata. A local diagnostic with
`Example Growth` and a valid-looking code is accepted. This does not establish
that imported files are authentic; the UI already labels them user-supplied.

Proposed fix: show Direct / Regular / Unverified explicitly, validate against
available official scheme metadata where possible, and never silently map a
holdings family to a plan-specific return series. Do not guess identity from a
similar fund name. Keep unsupported distribution adjustments explicit.

### 3. Coverage and meaning should be visible before the percentage

The equity-normalized result is mathematically useful, but a hybrid fund with a
small included equity slice can look like a complete portfolio comparison.
Detailed explanations currently carry too much of this burden.

Proposed fix: a compact data strip above the result: reporting dates, included
NAV per fund, and the chosen weight basis. Show a plain-language sentence such
as “This compares the disclosed equity portion; other assets are excluded.”
Make date mismatches/stale reporting conspicuous. Distinguish incomplete equity
identification from legitimate non-equity exclusions; neither is simply a bad
fund score. Avoid red/green “sell” implications or arbitrary health grades.

### 4. Better synthesis of calculations already available

Show the overlap answer, common holdings and a short list of largest shared
positions first. Keep matrix, industries, all holdings and source details behind
clear disclosure controls. Move lengthy source/process language out of the
selection path while retaining accessible data limitations beside results.

For multiple funds, keep pairwise overlap labelled pairwise. An unweighted average
is not the user's money-weighted portfolio concentration. Existing CSV and print
features should be refined rather than rebuilt as new functionality.

## New functionality that fits the no-additional-API constraint

| Priority | Feature | Data and acceptance condition |
| --- | --- | --- |
| First release | Multi-file official NAV import, plan identity, coverage-first summary | Existing saved metadata plus user files; no competitor endpoint or personal-data upload. |
| Next | Optional allocation-based “Where your money goes” | User-entered amounts or weights, calculated locally against original NAV holdings. Report excluded/unresolved weight separately; never rescale an incomplete portfolio into apparent full coverage. |
| Next | Rolling returns and calendar-year comparison | Sufficient exact-plan official/imported histories. Define observation frequency, window boundaries, missing-date rules and comparable samples. Report median/range/negative windows with sample count rather than one magic score. |
| Later | Expense impact / Direct-versus-Regular explanation | User-entered expense assumptions initially, or dated official TER disclosures after a separate ingestion review. Illustrative cost calculation must remain distinct from reported historical NAV returns, which already reflect expenses. |
| Conditional | Benchmark comparison, category ranks, market-cap split | Needs verified benchmark TRI history/category universe/dated issuer classifications. Existing equity snapshots do not supply these facts. Do not synthesize missing data. |

The [Zerodha Varsity methodology discussion](https://zerodha.com/varsity/chapter/know-your-fund/)
also highlights why risk ratios differ when assumptions and sampling differ.
Before exposing dormant analytics helpers, check them independently against
known calculations and sparse/flat/different-calendar histories. Rolling results
should not claim independence of overlapping windows, future-return confidence
or a full risk assessment.

## Proposed product direction for discussion

Keep **Check fund overlap**, **Fund performance**, and **Plan money**. Within each,
show one primary task and one useful summary. Start with the data/import and
coverage work above, followed by optional allocation exposure and rolling
returns. Avoid a broad screener, proprietary-style star ratings, generic “best
fund” rankings, daily alerts without fresh data, or unsupported risk labels.

An alternative to manual imports is a reviewed scheduled publication of official
AMC/AMFI data into static assets. That adds an ingestion/refresh/validation
operation even without a new runtime API, so it is a separate scope decision.
No automatic refresh, comprehensive coverage, benchmark rights or reuse licence
has been established by this research. Public access alone is not evidence of
unrestricted redistribution rights.

## Validation and release boundary

Hisabio rename is implemented and tested separately. Fund Lens findings above are
based on source inspection, the existing mobile interaction work, a bounded local
parser diagnostic and cited public material. No competitor financial data was
imported, no provider connection was added, and none of the proposed Fund Lens
changes is represented as implemented or deployed.
