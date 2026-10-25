# Reading first, calculations below

Gochar-7 follow-up: the primary card now uses the everyday house-theme adapter
described in RASHIFAL_EVERYDAY_UX.md. The three classification/timing paragraphs
below remain in expandable calculation evidence, not the primary card.

25 October 2026. Presentation/rule version `rashifal-gochar-6` adds an app-owned
plain-language outlook above the numerical summary, transit timeline and evidence.
Today, tomorrow and weekly views have their own heading; English, Hindi and
Gujarati follow the single shared header language preference.

`frontend/rashifal-outlook.mjs` composes three short paragraphs:

1. The calculated Moon pattern selects the overall theme. Any uncertain or
   unresolved observation takes precedence; otherwise consistent support, mixed
   support, obstructed indications and outside-list placements stay distinct.
   An outside-list placement is not converted into a prediction of harm.
2. Other physical grahas supply the supportive or obstructed context, using the
   actual per-graha results. Nodes are excluded from this emphasis because their
   final Vedha interpretation remains unresolved. Support at some observations
   is described as a supportive thread, not a favourable whole-day guarantee.
3. A fully available timeline may supply an unambiguous Moon-related change time
   in IST. Before/after rule changes, ingress and boundary entry are distinguished.
   Partial timelines and period-edge-only events cannot produce a confident time
   or an invented “no changes” statement.

Practical wording is **original editorial interpretation**, not a new astronomy
calculation or a quotation/translation of classical life-event predictions.
It does not introduce career/money/health scores, guarantees, lucky numbers,
random sentence rotation or sign-name substitution. Similar calculated patterns
can legitimately produce similar guidance; text is not randomly diversified to
make all twelve signs look different. The private in-memory result retains the
Moon counts, emphasized bodies, timing event and model identity as its trace.

The existing classification source remains Phaladeepika 26.1–8, as documented in
RASHIFAL_CALCULATION.md. Its [retained transcription](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html)
was checked on 25 October 2026; the practical suggestions do not claim to be
classical outcome rules. Independent source, traditional and native-language
acceptance remain pending. The primary card states that outcomes are not
guaranteed; “Why this reading?” explains the editorial boundary.

The Worker, numerical transit engine, bounded caches, shared header, privacy
headers and birth-data handling are unchanged. The generated 108-case report
now retains the outlook and its trace alongside the calculation evidence.
Tests check all twelve signs/languages, uncertain and partial/boundary cases,
before-calculation display order, mobile layouts and Worker parity.
