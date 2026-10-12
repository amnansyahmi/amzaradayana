# Amzar & Dayana — Kad Jemputan

A mobile-first Malay wedding invitation with a fullscreen navy gatefold cover. Tap anywhere on the card to play the complete opening animation.

## Included

- Three.js paper geometry, visible front/back faces and thickness, real-time shadows, and a GSAP opening sequence. CSS 3D remains available if WebGL cannot initialise.
- All three event schedules from the supplied invitation, selected via accessible tabs.
- Google Maps and Waze searches, `.ics` downloads and Google Calendar links in Malaysia time.
- Countdown for the selected event, native sharing with a copy-link fallback, and replaying the card opening.
- Self-hosted fonts, keyboard navigation, progressive fallback without JavaScript, and printable details for all events. Tapping the card explicitly plays the full fold even with Reduce Motion enabled; ambient/UI effects still respect that preference.
- Desktop Lenis scrolling; mobile uses native vertical touch scrolling with pinch/double-tap zoom disabled.
- A subtle pair of procedural 3D rings behind the names, one with a faceted diamond. Rings turn with scrolling and pause offscreen or in a background tab; an SVG fallback is included.
- Names appear in the sequence Amzar, ampersand, Dayana. The opening camera approaches the printed names before blending into the page. A deliberate full-animation card tap also opts into the name/ring effects; direct detail links follow reduced-motion preferences.

## Event source of truth

Edit `events.mjs` to update the schedule and venue queries. The engagement's exact street address and end time were not supplied. No RSVP phone number or response service was supplied, so the site does not pretend to collect attendance.

| Event | Date | Time (Malaysia) | Venue |
| --- | --- | --- | --- |
| Pertunangan | Ahad, 8 November 2026 | 2.00 petang | Bukit Marak, Kelantan |
| Pernikahan — sebelah perempuan | Sabtu, 13 Mac 2027 | 5.00 petang–11.00 malam | The Tree Glass House, Kota Bharu |
| Persandingan — sebelah lelaki | Sabtu, 10 April 2027 | 11.00 pagi–4.00 petang | The Garden Hall Bizmilla, One City, Subang Jaya |

## Build and deploy

Node 20 or newer. Exact library versions are recorded in `package-lock.json`.

```sh
npm ci
npm run check
npm test
npm run build
```

Serve `dist/` with any static host. Import this repository into Vercel: the included `vercel.json` sets the build command and output directory. The invitation needs no environment secrets or database.

Optional query string: `?majlis=pertunangan`, `?majlis=pernikahan`, or `?majlis=persandingan` preselects an event while preserving the closed-card entrance. `#majlis` opens directly to the details.

The fonts are distributed under the SIL Open Font License; see `assets/fonts/`. Venue drawings are illustrative, not photographs or accurate architectural plans.
