# Moment Studio AI writing

Local implementation checkpoint, 2026-10-31. Not committed or deployed in this
checkpoint. The previous deployed helper was deterministic templates, not Phase 3
AI. The implementation below replaces that helper rather than relabeling templates.

## Editor integration

Both existing editors mount `writing-ui.mjs` inline. Generate always uses the free
request, even when the editor already contains starter wording. The other ten
actions use the existing message: improve, shorten, formal, friendly, emotional,
grammar, simplify, alternative, invitation style and certificate wording.

The panel reuses supplied recipient, sender, occasion, date, location, title,
contribution and additional details. Optional overrides add relationship; tone,
language and desired length are separate controls. Nothing requires users to fill
every field. Unknown event details are omitted. Certificate output respects its
existing 250-character limit; cards respect 600 characters. Overlong model output
is rejected rather than silently truncated.

`local-writing.mjs` calls native `LanguageModel.create()`/`prompt()` for actual
on-device inference. It checks availability, declares English input/output,
handles browser-managed model download progress, honors cancellation/timeout,
destroys sessions, and has no API key, external inference, remote fallback,
package download or prompt persistence. Browser/model downloads occur only after
an explicit Generate action on an approved language. Existing CSP is preserved.

Supplied names/locations/dates and numeric source details use protected tokens.
Missing tokens, changed tokens, new numbers/calendar facts and overlong output
are rejected. A conservative proper-name recognizer also protects likely names
in English requests/source text; explicit personalization is more reliable.
These checks are not a complete semantic hallucination detector: they cannot prove
every claim or infer every proper name. Preview prominently asks users to check
meaning and facts. Apply is explicit; edits made in the host editor while a
suggestion is open require confirmation before replacement. No output is auto-saved.

Keyboard Escape closes/cancels and restores trigger focus. Busy controls prevent
overlapping requests; failures and cancellation preserve editor wording. Local AI
unavailability never disables manual editing, templates, photos or exports.

## Language and quality gates

`reviewedWritingLanguages` is empty. **No language is enabled for AI generation.**
This follows the requirement to verify real output quality before enabling it.
English is the first candidate; Hindi, Gujarati and Hinglish remain explicitly
unverified, and are never silently routed to English or advertised as model output.

The native API's documented input/output languages include English, Japanese,
Spanish, German and French; Hindi, Gujarati and Hinglish are not documented as
supported. Native foundation models are desktop-only in the current Chrome
documentation. Mobile users retain normal local editing and starter wording.
Sources checked 2026-10-31:
[Prompt API](https://developer.chrome.com/docs/ai/prompt-api) and
[hardware/language requirements](https://developer.chrome.com/docs/ai/get-started).

The isolated evaluation here used Chrome 156 and returned `unavailable`, with
`realInference:false` and `qualityApprovedLanguages:[]`. No model was downloaded.
This is a blocked quality evaluation, not a pass. Mocked protocol/browser tests
verify integration only. Per-session English grammar and detail-preservation smoke
checks additionally fail closed when the model produces unusable output; they do
not substitute for fluent-language review.

## Real-model review procedure

Run `node apps/moment-studio/tests/real-model.cjs` on a supported machine. It serves
only the inference module on an ephemeral localhost port in an isolated Chrome
profile, uses synthetic details, and touches no application database or accounts.
Exit 2 means inference was unavailable; exit 1 means a check failed. `--download`
explicitly permits a browser-managed download on eligible hardware. `--headed`
opens a visible isolated browser for a manual review session when requested.

The harness evaluates birthday invitation, Diwali greeting, appreciation and
retirement wording, plus every rewriting action. It emits actual text, failures
and browser identity. Review naturalness, grammar, action relevance, desired length,
unchanged supplied details and absence of invented event information. Repeating
these checks across several prompts is required before recording language approval.

Also check Unicode shaping, line breaks and actual PNG/PDF exports on target
desktop/mobile platforms. The existing English/Hindi card language and renderer
font fallbacks are preserved; this change does not certify Gujarati fonts/exports
or add an unverified Gujarati AI model. Additional model/language adapters require
their own documented inference and native-language review.

Only after real-output review passes, record model/browser identity, sample
results, reviewer decision and export evidence here, then explicitly add the
approved language to `reviewedWritingLanguages`. Integration tests simulate an
English approval through an isolated module response override, never a production
configuration or a hidden runtime flag. The evaluation harness can bypass the
release gate solely to collect synthetic candidate output; editor code cannot.

Verification results and release status are recorded in the functionality ledger.
