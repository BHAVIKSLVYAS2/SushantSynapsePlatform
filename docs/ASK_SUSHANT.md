# Ask Nishi

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
