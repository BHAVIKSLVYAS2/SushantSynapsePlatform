# Ask Nishi

Button release verified (16 November 2026 IST): source 03c40bb, Worker
d5be7bad-b67b-4996-9866-c09a5d4b0154. The new home trigger is live. All 27
language/theme/viewport layouts, reduced-motion behavior and the existing Nishi
browser workflow pass. Three live assets match the build; health is good and
AI remains disabled. No migration or paid service activation. This supersedes
the local-only status of the trigger checkpoint below.

Home trigger polish (16 November 2026, local): the existing entry now uses a
primary pill, Nishi's shared SVG avatar and a small sparkle. Shared theme tokens
control its surface, ink and glow; a 700ms entrance respects reduced motion.
The button remains beside Edit layout with no added floating control or popup.
Its accessible name stays translated Ask Nishi; AI availability and processing
are unchanged. Two browser regressions and 27 trigger layout checks pass;
build:ui and syntax/diff checks pass. Not committed or deployed.

Production release (15 November 2026): three-app local draft workflows deployed
from source 893d46a, Worker 9e9d672c-17d8-4762-b692-10fe8948359e. AI binding
is absent and the enable flag is false. Live capability and forced-AI request
checks confirm local extraction only. No migration or paid AI activation.
This supersedes the local-only release status below; live AI remains pending.

Current local extension (15 November 2026): Nishi prepares reviewed Ritual
Assist, JapSeva and Ritvayam drafts through `/api/nishi/plan`. Submitted text
goes to our service; optional Workers AI processing requires explicit submission
opt-in and server enablement. The user approved submitted text only, never
automatic saved-record transfer. Cloudflare AI remains disabled in production
configuration; no live inference, migration or deployment was performed.
One-time app handoffs expire after five minutes and never automatically save
requests or calculate charts. See [three-app workflows](NISHI_THREE_APP_WORKFLOWS.md)
for verification, limits and activation steps. Earlier no-network statements
below describe the previous implementation, not this local extension.

Conversation presentation update (15 November 2026, local): added Nishi's
decorative SVG avatar, greeting, suggested prompts, current question/reply
bubbles and a bottom composer with labelled send icon. Local answering is
unchanged; a quiet AI connection coming soon label makes the integration status
explicit. Messages still clear on close; there is no stored chat history or
network/model connection. Controls and greeting support English/Hindi/Gujarati.
Existing home trigger stays in the normal layout. Not committed or deployed.

Local implementation, 15 November 2026. Portal-owned entry point for future
agent integration; currently a deterministic app guide, not connected AI chat.

- A labelled button sits beside Edit layout on the collection home. There is
  no floating bubble, automatic popup, extra sticky bar or background polling.
- Native modal dialog provides close/Escape, focus containment and return to
  its opener. Content scrolls within the viewport and uses shared theme tokens.
- English/Hindi/Gujarati interface follows the shared language selection.
- Local app finding searches existing visible catalogue metadata and presents
  up to three links. Restricted workspaces use the existing sign-in destination;
  no access permissions are granted or changed. Responses use DOM text nodes.
- A storage-help action explains the current browser/server storage boundary.
- Questions/results are page-memory only and cleared on close; no questions are
  transmitted, stored, logged or used to execute application commands.

Ownership: apps/portal/frontend/ask-sushant.js, registered in the static allowlist
and loaded before home discovery. SynapseHomeAgent.mount(home) attaches once
per home render and replaces stale dialog/listeners during catalogue remounts.
This is a UI lifecycle entry, not a privileged action or model-provider API.

Future AI integration should replace local answering deliberately, define its
data/consent boundary, use server-side provider credentials and preserve app/API
authorisation. No provider key, dummy endpoint, model response or external
service connection is represented as available in this implementation.

Verification: four catalogue tests and three browser workflows pass, including
opt-in display, local app links, storage help, question clearing, text injection
handling, focus restoration, sign-in link, catalogue remount and preserved
search/edit/order behaviour. The agent test covers 27 language/theme/phone-tablet
combinations; the existing Comfort matrix also passes. Inspected the 390px
panel screenshot. Evidence: .publish/ask-sushant-review/.

Not committed or deployed. See the functionality ledger for later release status.
