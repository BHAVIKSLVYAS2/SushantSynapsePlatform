# Moment Studio: one familiar creation experience

Review date: 12 October 2026, India time.

Initial review status: product recommendations only. The user accepts certificates and awards and has rejected the broader simplification as incomplete. The implementation update below supersedes this initial checkpoint.

## Implementation update after user authorisation

Release update: implementation `b32ec04` is deployed at https://apps.sushantsynapse.com/moment-studio on Worker `46972700-08f9-4747-a916-2108211dd960`. Eight live source comparisons, twenty desktop/phone/theme states, eight branded renders and real card PNG/certificate PNG/PDF downloads pass with no page errors or production writes. The exact Git snapshot contains 500 matching files and excludes runtime data and the unrelated review. This supersedes the local-only checkpoint below. See the functionality ledger for deployment and read-only verification evidence.

The user authorised the simplification and then a limited collection of premium certificate designs, clarifying that web search should provide the template references. All card sections now use the accepted warm certificate workspace treatment with visible card language/content/photo, editable starter wording, optional design settings and form-first mobile order. Invitations expose event name and event details; remembrance gatherings are explicitly optional. Tone/connection generators and edit jumps are removed. Personal wording survives occasion/language/design changes, and applying a suggested message asks before replacing an edit.

Certificates now offer four original compositions: Laurel (ceremonial ivory/gold), Nocturne (midnight gala with large name, split citation and award medallion), Summit (asymmetric professional achievement) and Jubilee (bold creative celebration). They differ in text geometry, typography and native artwork. Issuer logos/signatures, Indian donation wording, branded A4 PDF/PNG/print, group exports and saved organisations retain their existing handling. The certificate phone form also comes first.

Reference research used the [Adobe formal certificate gallery](https://www.adobe.com/express/templates/certificate/formal), [Canva recognition gallery](https://www.canva.com/certificates/templates/recognition/) and [Toastmasters appreciation certificate](https://www.toastmasters.org/events/centennial/medias/files/centennial/525c-certificate-of-appreciation-ff.pdf). These informed composition and achievement hierarchy; no template artwork, external font or remote asset was copied into the app. Gemini was not invoked: no connector/CLI/key was available, and the user subsequently directed use of web search.

Local evidence: 205/205 isolated Node/API regressions; 21/21 affected Studio/certificate/celebration Chrome workflows; 6/6 focused certificate checks after visual refinement; 40 responsive/theme page states with no errors, overflow or reversed phone order. Certificate collection and donation examples were visually reviewed. Evidence lives in ignored `.publish/studio-premium-20261012/`, `.publish/studio-premium-api-final.log`, `test-results/studio-premium-browser/` and `test-results/studio-premium-refinement/`. Implementation is locally verified; production deployment and user design acceptance are not claimed.

Fresh 390px sessions for birthday, invitation, condolence and remembrance also show the recipient input entirely in the first viewport and the design chooser initially collapsed; messages begin at y667 in those samples. Independent final visual audit inspected twelve collection/workspace/phone/donation artifacts and found no must-fix text, artwork or footer overlap. Fresh phone evidence is `fresh-mobile.json` and `*-390-fresh-light.png` in the same ignored review directory.

## Product decision

Use the accepted certificate/award screen as the reference for every Moment Studio section. Keep the existing three sections. Each opens a familiar add-details workspace with suitable defaults, an editable message, a live preview and download actions. Users should recognise the same product when switching sections; only the relevant fields and finished artwork change.

The previous cleanup established working exports and removed the tool dashboard. It did not establish product usability acceptance. A two-column form/preview layout alone is insufficient: screen treatment, field organisation, language selection and wording assistance still differ. Do not describe this product problem as resolved until the revised creation journeys have been reviewed with the user.

## Findings from the current implementation

| Finding | User consequence | Evidence |
|---|---|---|
| Certificates use a compact warm-toned inspector/artboard workspace; cards use a separate mint-toned form and bordered preview panel, different spacing and export arrangement | The sections still feel like two products | `frontend/certificates.css`, `frontend/cards.css`; fresh desktop screenshots |
| Cards begin with occasion and a large design gallery; name/message are farther down | Users browse design controls before reaching the task they came to complete | `frontend/index.html`; fresh greeting desktop screenshot |
| At 390px, the card preview begins at y=266 and the form at y=864; the preview is labelled step 3 | The first phone screen offers download/share/copy before users can add their details | `frontend/cards.css`; fresh greeting/condolence mobile screenshots |
| Headline and photo share a Personalise disclosure with palette and size | Important content is hidden among optional appearance settings; invitation event name has no obvious dedicated field | `frontend/index.html`, `frontend/card-app.js` |
| English/Hindi is inside Suggested messages; condolences add tone, connection and another use-message action | Users must learn a wording tool to perform an ordinary form task | `frontend/index.html`, `frontend/card-app.js` |
| The preview exposes download, sharing and text copying before the phone form | Secondary tasks occupy the starting screen | `frontend/index.html`; mobile screenshots |
| Current source contains no visible AI Utilities or Edit certificate label on cards; the app README still describes the removed dashboard and obsolete routes | Documentation and previous completion claims are unreliable guides to the actual experience | `apps/moment-studio/README.md`, active HTML/JS |

Certificates also currently place the preview above the form on mobile. That is an existing behaviour of the accepted reference, not a reason to redesign the accepted certificate flow during the first card fix. The proposed card form-first phone order is a specific usability recommendation for the affected sections.

## Proposed user experience

This is one screen, not a sequence of wizard pages:

**Choose the occasion → add details → check the live preview → download.**

A matching design and editable starter message are already selected. Choosing a different design is optional. The screen uses the certificate reference's workspace treatment, navigation, control styling and preview/export placement, while the existing card renderer continues producing square or vertical artwork.

Keep the fields relevant to the selected task:

| Task | Ordinary visible fields |
|---|---|
| Greeting | Occasion, card language, recipient, editable message, from; optional photo |
| Invitation | Event name, card language, date, time, venue, host/from; optional invitation message |
| Condolence | Person's name, card language, editable sympathy message, from; optional photo |
| Remembrance | Person's name, card language, tribute, from; optional photo. Gathering details appear only when a gathering is chosen |

Card language belongs in a predictable visible position near the message, separate from the shared platform interface-language setting. Selecting a language or design must protect wording already edited by the user.

Use respectful/default wording immediately. If wording alternatives are retained, offer a small optional helper beside the message. Remove the tone/connection/generator workflow from the ordinary condolence task. No AI section, tool dashboard, command search, new landing page or additional creation navigation is needed.

Keep colour, output size and additional appearance settings in More options. Keep core task content visible. Download PNG remains primary; sharing is secondary; text copying belongs with the message or inside a small secondary menu. On affected phone screens, place the form before the final preview/download area.

## Fix one flow at a time

1. **Cards & greetings / birthday:** apply the certificate reference's screen treatment and simple add-details pattern. Keep the existing occasions available; use a birthday card as the first complete example for review. Move language into the form, supply editable defaults, remove the wording mini-tool and make the phone form accessible immediately.
2. **Invitation:** use the approved screen pattern, replacing generic name/headline controls with event name, date, time, venue and host. Review one invitation before proceeding.
3. **Condolence:** apply the same pattern with respectful wording and a visible optional photo. Review the finished screen without requiring tone/connection choices.
4. **Remembrance:** apply the same pattern; show gathering inputs only when relevant. Review one tribute and one gathering invitation.

Each increment must be reviewable before the next. Preserve certificate/award artwork, existing export validation, platform branding, photo limits, saved organisations, privacy, shared themes and all existing data.

## Acceptance for the first fix

- A fresh user immediately recognises the accepted certificate workspace pattern on Cards & greetings.
- At phone width, they can begin adding details on the initial screen rather than first navigating away from a finished example.
- A birthday card needs only the recipient, message and sender; a matching template and starter text are supplied. Advanced controls are optional.
- English/Hindi is easy to find; changing a design does not overwrite typed content.
- No card screen presents certificate-specific wording or an AI/tool navigation surface.
- The completed PNG matches the preview, includes branding, and retains existing fit/photo validation.
- Review the actual desktop and phone screens with the user. Export/theme/overflow regressions passing are technical evidence, not a substitute for product acceptance.

## Verification and limits

Reviewed repository instructions, architecture, functionality ledger, root/app READMEs, active HTML/CSS/JS, routing and current browser coverage. Two independent read-only reviews considered product management and first-time user journeys.

Fresh headless Chrome inspection used a newly created temporary DATA_DIR with SQLite explicitly selected. Inspected certificates, greetings and condolences at 1440px light and 390px light/dark: nine rendered states, no page errors or horizontal overflow. Desktop certificate/greeting and mobile greeting/condolence screenshots were visually inspected. No account setup, business mutation or real workspace data was used. Temporary fixture data was removed after inspection.

Evidence: ignored `.publish/moment-studio-product-review-20261012/review.json` and screenshots in that directory. This was a rendered product review, not a fresh API/export regression run or a novice usability study. No application code changed, so the existing workflow suite was not rerun.

Fresh production navigation to both `/moment-studio` and `/moment-studio/cards` was blocked by the environment with `ERR_NETWORK_ACCESS_DENIED`. The active-source absence of AI labels does not establish what the user's current live/browser session displays. No fresh live product acceptance is claimed.
