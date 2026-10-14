# Amzar & Dayana

A navy invitation opens with two cover panels moving aside over the stationary greeting. A 240ms seal fade overlaps a 1100ms gate movement; a final 140ms fade ends at 1260ms. Native Web Animations handle transform and opacity. No camera zoom, duplicated invitation, or opening renderer is required.

The whole cover is one accessible button. An explicit tap requests the gate movement; decorative motion still respects the system setting. CSS keyframes provide a fallback when Web Animations are unavailable. Desktop smooth scrolling is limited to fine pointers; phones retain native scrolling.

## Visual decisions

- Deep navy `#132d46` carries the identity from the supplied invitation. Antique gold `#c3a36b` is reserved for the seal, botanical linework and fine ornaments; darker gold `#806232` is used where readable text is needed.
- Ivory paper `#fcfaf4` sits on a neutral canvas `#eae6dd`. Rose `#80525d`, blue `#315978` and green `#406557` distinguish the three events, echoing the original card.
- Great Vibes for the couple's names; Cormorant Garamond for invitation prose and dates; Manrope for controls and practical information. Fonts are self-hosted under the SIL Open Font License.
- One paper composition, centred and mobile first. Fine borders describe the physical card. There are no repeated dashboard cards, emoji controls or fabricated details.
- Hand-drawn SVG botanical and venue illustrations are decorative, rather than photographs of the actual venues.

## Design references

UI/UX Pro Max was loaded from the existing local skill and queried for this invitation. Its typography search matched wedding invitations; its two generated page structures returned generic commercial layouts and were rejected. Its focus, touch-target, contrast and reduced-motion guidance informed the implementation. Frontend Design was read from `anthropics/skills/skills/frontend-design/SKILL.md`. A separate antislop skill was not available.

## Content boundaries

The name composition includes a low-opacity procedural ring pair. Its gold reflection is baked into a small matcap, avoiding external models, HDR images and transmission shaders. The ring renderer is loaded after the opening. The ring scene draws in response to scrolling/its initial arrival and stops when offscreen or the document is hidden. The name artwork uses glyph outlines from the same Great Vibes font, revealed by pen guides in SVG masks. Each glyph has a private mask, so crossing strokes do not expose adjacent letters early. The heading retains its real text for accessibility and no-JavaScript use.

A fixed four-action bar gives guests access to Majlis, Kalendar, Lokasi and Kongsi. Native dialogs share a bottom-sheet presentation on mobile and a centred layout on desktop. Calendar and location each include an event selector, backed by the same event state as the page. The event picker lists only supplied dates and venues; there are no invented programme times or contact details.

Native IntersectionObserver starts the restrained section reveals and pauses individual floral parts offscreen. Passive scroll updates draw the milestone rule and move small ring reflections; there is no permanent decorative JavaScript render loop. The mobile calendar sheet locks the page position, supports dragging only from its handle, and restores scroll/focus on dismissal. Decorative motion follows Reduce Motion even when a guest explicitly opts into the full card opening.

Only the couple's first names and the three event schedules were supplied. No full names, parents, phone numbers, precise engagement address, engagement end time or RSVP destination are invented. Map links search the given venue names; the engagement location is explicitly an area. RSVP can be added when a real contact or response destination is available.
