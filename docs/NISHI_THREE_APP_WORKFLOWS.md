# Nishi: three-app draft workflows

Local implementation, 15 November 2026. Not committed or deployed.

The user approved processing explicitly submitted text, including names or birth
details they type. Saved records must never be sent automatically. Nishi does
not read app records or retain chat history. Closing the dialog clears its text.

## Working flows

- Ritual Assist: identify an existing guide, show its canonical materials and
  offer a proposed date. Applying that date requires an explicit button click.
- JapSeva: prepare client name, a known library mantra and target. Open the
  request form for review; neither clients nor requests are created automatically.
- Ritvayam: prepare explicitly supplied birth fields. The user must verify the
  birthplace, time accuracy and remaining fields before calculating or saving.

Unknown fields remain missing. The model cannot supply scripture, checklist
contents, predictions, computed charts or arbitrary navigation URLs. Canonical
content comes from the existing app catalogues. English, Hindi and Gujarati
interface copy is available; ritual content falls back to English where the
existing guide lacks that language. Local extraction is deliberately limited;
ambiguous requests need review in the destination app.

## Processing and ownership

`packages/nishi/planner.mjs` validates extraction and resolves canonical content.
The portal backend exposes `/api/nishi/plan` in Node and Workers. Node uses local
extraction. Workers can optionally call Workers AI only when enabled and the
submission explicitly opts in. No prompts or results are stored or logged by
this implementation. D1 stores aggregate daily call counts only.

The browser transfers a short, whitelisted draft through sessionStorage. It is
consumed once, expires after five minutes, and contains no saved-record IDs or
conversation. Each destination app owns review and its existing save controls.

## Cloudflare activation boundary

For the cost-guarded release, production omits the AI and Nishi rate-limit
bindings and keeps `NISHI_AI_ENABLED` false. No live inference has been verified. Migration
`0011-nishi-usage.sql` is prepared and has not been applied. No production data
or deployment was changed during this implementation.

Before activation, apply only the pending migration through the normal release
process, explicitly add the AI and Nishi rate-limit bindings, enable the flag, and test synthetic submissions
against the real model and all three handoffs. Do not repeat organisation
bootstrap or legacy mapping. Check current model availability and account usage.

The pilot allows six AI requests per minute per IP and at most 50 attempted
model calls per UTC day across the service. Calls use a 350-output-token limit
and a 15-second timeout. These limits are a conservative pilot policy, not a
measured guarantee of free usage. Provider, quota or parsing failures fall back
to local extraction; IP throttling returns 429. Missing quota storage prevents
model calls. Model extraction uses `@cf/meta/llama-3.1-8b-instruct-fp8-fast`.

References: [Workers AI bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
and [Cloudflare data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/).

## Verification

- Six Nishi tests pass: extraction/validation, origin/body limits, explicit AI
  opt-in, mocked provider/quota/failure handling, expiring handoff and routing.
- Six JapSeva tests, four reading-catalogue tests and five birth UI tests pass.
  The old fixed library-size assertion now permits catalogue growth while
  retaining its checks for preserved readings.
- Two browser workflows pass: three-app review handoffs and the existing Nishi
  regression covering 27 language/theme/viewport combinations. No automatic
  client/request creation, ritual date application or chart calculation occurs.
- Frontend build exports 729 assets; production Wrangler dry run and diff check
  pass. These checks do not establish live model quality or production readiness.

Evidence: `.publish/nishi-three-apps-final/` and
`.publish/nishi-three-apps-dryrun/` (local ignored artifacts).
