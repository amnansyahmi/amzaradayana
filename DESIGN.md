# Amzar & Dayana

An invitation that opens like a physical gatefold card. Three.js renders real hinges, front/back paper faces, thin cardboard edges and shadows. GSAP coordinates the seal, staggered panel rotation, camera composition and delayed reveal. The scene renders only during the opening and releases GPU resources afterward. CSS 3D is retained for unsupported WebGL devices.

The closed card fills the visible browser viewport. The whole card is one accessible button: every tap explicitly requests the complete folding animation, including under reduced motion, as requested by the user. Decorative and other UI motion still follow the system preference. Three.js geometry and texture height follow the viewport aspect ratio so the fullscreen cover stays aligned during the handoff. Desktop Lenis scrolling is limited to fine pointers, with native touch scrolling on mobile. Motion and React Three Fiber are unnecessary in this vanilla site: GSAP already coordinates the transitions, and R3F would require a React migration.

## Visual decisions

- Deep navy `#132d46` carries the identity from the supplied invitation. Antique gold `#c3a36b` is reserved for the seal, botanical linework and fine ornaments; darker gold `#806232` is used where readable text is needed.
- Ivory paper `#fcfaf4` sits on a neutral canvas `#eae6dd`. Rose `#80525d`, blue `#315978` and green `#406557` distinguish the three events, echoing the original card.
- Great Vibes for the couple's names; Cormorant Garamond for invitation prose and dates; Manrope for controls and practical information. Fonts are self-hosted under the SIL Open Font License.
- One paper composition, centred and mobile first. Fine borders describe the physical card. There are no repeated dashboard cards, emoji controls or fabricated details.
- Hand-drawn SVG botanical and venue illustrations are decorative, rather than photographs of the actual venues.

## Design references

UI/UX Pro Max was loaded from the existing local skill and queried for this invitation. Its typography search matched wedding invitations; its two generated page structures returned generic commercial layouts and were rejected. Its focus, touch-target, contrast and reduced-motion guidance informed the implementation. Frontend Design was read from `anthropics/skills/skills/frontend-design/SKILL.md`. A separate antislop skill was not available.

## Content boundaries

The name composition includes a low-opacity procedural ring pair. Its gold reflection is baked into a small matcap, avoiding external models, HDR images and transmission shaders. The opening renderer is disposed before the ring renderer is created. The ring scene draws in response to scrolling/its initial arrival and stops when offscreen or the document is hidden. The name artwork uses glyph outlines from the same Great Vibes font, revealed by pen guides in SVG masks. Each glyph has a private mask, so crossing strokes do not expose adjacent letters early. The heading retains its real text for accessibility and no-JavaScript use.

The moving paper is a live, inert copy of the greeting rendered through Three.js CSS3DRenderer beneath the folding WebGL panels. The camera, paper position and aspect ratio converge on the actual greeting rectangle, followed by a short blend. The CSS-only fallback also uses the live paper. All IDs and SVG references are namespaced inside the temporary copy, and it is removed when the opening finishes or is cancelled. Handwriting is synchronised across both copies during the handoff.

Native IntersectionObserver starts the restrained section reveals and pauses individual floral parts offscreen. Passive scroll updates draw the milestone rule and move small ring reflections; there is no permanent decorative JavaScript render loop. The mobile calendar sheet locks the page position, supports dragging only from its handle, and restores scroll/focus on dismissal. Decorative motion follows Reduce Motion even when a guest explicitly opts into the full card opening.

Only the couple's first names and the three event schedules were supplied. No full names, parents, phone numbers, precise engagement address, engagement end time or RSVP destination are invented. Map links search the given venue names; the engagement location is explicitly an area. RSVP can be added when a real contact or response destination is available.
