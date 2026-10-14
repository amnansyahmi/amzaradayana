# Amzar & Dayana — Kad Jemputan

A mobile-first Malay wedding invitation with a fullscreen navy gatefold cover. Tap anywhere on the card to play the complete opening animation.

## Included

- A 1.26-second gate reveal using native browser transforms. The real greeting remains stationary underneath; no WebGL opening or camera handoff is loaded.
- All three event schedules from the supplied invitation, selected via accessible tabs.
- Google Maps and Waze searches, `.ics` downloads and Google Calendar links in Malaysia time.
- Countdown for the selected event, native sharing with a copy-link fallback, and replaying the card opening.
- Self-hosted fonts, keyboard navigation, progressive fallback without JavaScript, and printable details for all events. Tapping the card explicitly plays the full fold even with Reduce Motion enabled; ambient/UI effects still respect that preference.
- Desktop Lenis scrolling; mobile uses native vertical touch scrolling with pinch/double-tap zoom disabled.
- A subtle pair of procedural 3D rings behind the names, one with a faceted diamond. Rings turn with scrolling and pause offscreen or in a background tab; an SVG fallback is included.
- A fixed guest action bar opens an event picker, calendar and location sheets, or the native share menu. Event changes synchronise every sheet and the page. Sheets restore focus to the control that opened them.
- RSVP, guest wishes, family contacts and music are not enabled: attendance needs a persistence/moderation flow, and contacts/music need owner-provided details.
- Amzar and Dayana write on with SVG pen masks over the existing Great Vibes outlines. Connected script stays crisp at all screen sizes; readable text remains available without JavaScript. Handwriting, florals and ring highlights respect reduced motion.
- Individual floral leaves, stems and blooms breathe at different speeds and pause offscreen. A light-device mode keeps only the smaller set of bloom/stem effects.
- Sections reveal once as they enter view, the selected-event underline slides between tabs, and the event timeline draws with native scrolling.
- On mobile, the calendar opens as a bottom sheet with a downward drag to dismiss. Closing restores the original scroll position and keyboard focus; desktop keeps a centred dialog.

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

## Artwork maintenance

The shipped artwork needs no generation step during deployment. Optional authoring scripts regenerate the checked-in assets:

- `python scripts/prepare-calligraphy.py` uses `fontTools` and the bundled OFL font to regenerate `calligraphy-art.mjs`. Pen guides are authored in that script.
- `python scripts/prepare-florals.py` rebuilds the two inline botanical SVGs from `assets/floral-corner.svg`.

Opening, replay, responsive layout, event tabs, calendar dismissal, offscreen motion and reduced motion are checked in browser verification. Automated mobile viewports do not replace testing on a physical iPhone.
