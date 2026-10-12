# Amzar & Dayana — Kad Jemputan

A mobile-first Malay wedding invitation with an animated navy gatefold cover. Tap the centre gold seal to open the card.

## Included

- Two-door 3D opening animation, textured paper, botanical SVGs and custom venue linework.
- All three event schedules from the supplied invitation, selected via accessible tabs.
- Google Maps and Waze searches, `.ics` downloads and Google Calendar links in Malaysia time.
- Countdown for the selected event, native sharing with a copy-link fallback, and replaying the card opening.
- Self-hosted fonts, reduced-motion support, keyboard navigation, progressive fallback without JavaScript, and printable details for all events.

## Event source of truth

Edit `events.mjs` to update the schedule and venue queries. The engagement's exact street address and end time were not supplied. No RSVP phone number or response service was supplied, so the site does not pretend to collect attendance.

| Event | Date | Time (Malaysia) | Venue |
| --- | --- | --- | --- |
| Pertunangan | Ahad, 8 November 2026 | 2.00 petang | Bukit Marak, Kelantan |
| Pernikahan — sebelah perempuan | Sabtu, 13 Mac 2027 | 5.00 petang–11.00 malam | The Tree Glass House, Kota Bharu |
| Persandingan — sebelah lelaki | Sabtu, 10 April 2027 | 11.00 pagi–4.00 petang | The Garden Hall Bizmilla, One City, Subang Jaya |

## Build and deploy

Node 20 or newer; no dependency installation is needed.

```sh
npm run check
npm test
npm run build
```

Serve `dist/` with any static host. Import this repository into Vercel: the included `vercel.json` sets the build command and output directory. The invitation needs no environment secrets or database.

Optional query string: `?majlis=pertunangan`, `?majlis=pernikahan`, or `?majlis=persandingan` preselects an event while preserving the closed-card entrance. `#majlis` opens directly to the details.

The fonts are distributed under the SIL Open Font License; see `assets/fonts/`. Venue drawings are illustrative, not photographs or accurate architectural plans.
