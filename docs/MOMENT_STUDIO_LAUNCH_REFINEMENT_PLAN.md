# Moment Studio launch refinement review

Updated: 8 November 2026 (Asia/Kolkata).
Status: user authorised implementation, commit and deployment on 8 November 2026.
Implemented and deployed as source `3b813eb`; release evidence is in FUNCTIONALITY_LEDGER.md.

## Launch priorities

Polished output with a short form, clear previews and direct downloads. Keep
public creation available without mandatory sign-in. Photos and personal wording
remain local. Preserve platform branding and existing export/privacy contracts.
Use original artwork and appropriately licensed fonts; do not import competitor
templates into the product. No new API is needed for the proposed design work.

Shared account/MFA work is a separate programme in SHARED_ACCOUNT_MFA_PLAN.md.
It starts with workspaces after the agreed Studio work; free-app integration is
deferred. Studio account storage is not part of this visual refinement.

## Review evidence and limits

Compared the local Birthday/memorial redesign with public Greetings Island
preview images, and reviewed Canva/Adobe public gallery listings. Four formal
certificate compositions were rendered locally with realistic volunteer
appreciation details: Laurel, Nocturne, Summit and Jubilee. Compared them with a
public Canva appreciation preview and the official galleries below. Gallery
access restrictions limited interactive competitor testing; competitor exports,
paid entitlements and print quality were not independently tested.

References:
- https://www.canva.com/certificates/templates/appreciation/
- https://www.adobe.com/express/templates/certificate
- https://www.adobe.com/express/create/certificate
- https://www.greetingsisland.com/preview/cards/abstract-and-bold-photo/76-42343
- https://www.greetingsisland.com/preview/cards/trendy-bold-text-21/560-24819
- https://www.greetingsisland.com/preview/cards/iris-petals/401-46462

Local review images: `.publish/certificate-review-current.png` and
`.publish/moment-redesign-contact-sheet.png`. These contain fictional names.

## Findings

Certificates are currently stronger than greetings. Laurel and Nocturne already
have a recognisable formal structure and prominent recipient names. Summit has
a distinct modern layout, but its wide decorative sidebar consumes useful space.
Jubilee suits celebrations better than formal appreciation. The existing personal
Fun Card should stay separate from institutional certificate choices.

Certificate exports already have an A4 landscape contract: 300 DPI PDF/print and
300/600 DPI PNG options. Their PDF is raster-based, not a vector-text document.
Do not apply the greeting-card 1080px export limitation to certificates. Existing
local logo/signature handling, reusable organisation branding, batch exports and
Indian donation amount wording are practical features to preserve.

Main certificate gaps are intentional typography, consistent margins and footer
alignment, reducing repetitive decorative seals, and readable fitting for long
names/contribution text. The renderer currently permits very small fitted text;
review a readable minimum and clear export feedback before claiming all content
fits well. Branding, disclaimers and issuer responsibility remain required.
Certificate IDs and decorative seals do not establish independent verification.

Birthday still needs a genuinely photo-led layout and a distinct typography-led
layout. Memorial announcements and sympathy messages are different user intents:
the former can feature a person, portrait and gathering; the latter should work
as a message to a bereaved family without requiring a deceased person's identity.

## Agreed combined implementation

1. Refine three existing formal directions: classic ivory/gold, modern light,
   and dark ceremonial. Keep celebratory/personal awards available separately.
   Improve hierarchy, long-text fitting, logo/signature spacing and issuer details.
2. Create two distinct Birthday directions: large-photo and typography-led.
3. Separate simple sympathy-message and portrait-led memorial announcement
   compositions, preserving optional gathering details.
4. Keep the form-based workflow, easy mobile preview and direct export. Avoid a
   free-position editor, more menus or a large template catalogue at launch.
5. Verify real English/Hindi inputs where supported, long names, photos, logos,
   signatures, optional details, batch exports, print geometry, mobile layouts,
   themes and export failures. Review output images before release.

No new certificate verification service, cloud storage, AI service or message
delivery is proposed. Do not promise bilingual certificate presets until their
wording and typography are actually implemented and verified; the existing card
language controls do not establish certificate language support.
