import test from 'node:test';
import assert from 'node:assert/strict';
import { events, getEvent, utcStamp, calendarFile, countdown, mapUrl, wazeUrl, googleCalendarUrl, foldLine } from '../events.mjs';

test('event dates, days and Malaysia times match the supplied invitation', () => {
  assert.equal(events.length, 3);
  assert.deepEqual(events.map(event => utcStamp(event.start)), [
    '20261108T060000Z', '20270313T090000Z', '20270410T030000Z'
  ]);
  assert.equal(utcStamp(events[1].end), '20270313T150000Z');
  assert.equal(utcStamp(events[2].end), '20270410T080000Z');
  assert.deepEqual(events.map(event => new Intl.DateTimeFormat('ms-MY', {
    weekday: 'long', timeZone: 'Asia/Kuala_Lumpur'
  }).format(new Date(event.start))), ['Ahad', 'Sabtu', 'Sabtu']);
  assert.equal(events[0].end, null);
});

test('calendar downloads preserve exact schedule and escape venue commas', () => {
  const now = new Date('2026-10-12T03:30:00Z');
  for (const event of events) {
    const ics = calendarFile(event, now);
    const unfolded = ics.replace(/\r\n /g, '');
    assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
    assert.match(unfolded, /DTSTAMP:20261012T033000Z/);
    assert.ok(unfolded.includes(`DTSTART:${utcStamp(event.start)}`));
    assert.ok(unfolded.includes(`SUMMARY:${event.name} Amzar & Dayana`));
    assert.ok(unfolded.includes(`LOCATION:${event.venue}\\, `));
    assert.equal(unfolded.includes('DTEND:'), Boolean(event.end));
    for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  }
});

test('calendar folding preserves multibyte text and all characters', () => {
  const original = 'DESCRIPTION:' + 'Doa, kasih sayang dan rahmat-Mu. é— '.repeat(10);
  const folded = foldLine(original);
  assert.equal(folded.replace(/\r\n /g, ''), original);
  for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});

test('location and calendar URLs refer to the selected event', () => {
  for (const event of events) {
    assert.equal(new URL(mapUrl(event)).searchParams.get('query'), event.mapQuery);
    assert.equal(new URL(wazeUrl(event)).searchParams.get('q'), event.mapQuery);
    const url = new URL(googleCalendarUrl(event));
    assert.equal(url.searchParams.get('ctz'), 'Asia/Kuala_Lumpur');
    assert.ok(url.searchParams.get('dates').startsWith(utcStamp(event.start)));
    assert.equal(url.searchParams.get('text'), `${event.name} Amzar & Dayana`);
  }
  assert.ok(events[0].locationNote.includes('belum diberikan'));
});

test('countdown stays correct at event boundaries and after the date', () => {
  const event = events[1];
  const start = Date.parse(event.start);
  assert.deepEqual(countdown(event, start - (2 * 86400000 + 3 * 3600000 + 5 * 60000)), {
    days: 2, hours: 3, minutes: 5, started: false
  });
  assert.deepEqual(countdown(event, start), { days: 0, hours: 0, minutes: 0, started: true });
  assert.deepEqual(countdown(event, start + 86400000), { days: 0, hours: 0, minutes: 0, started: true });
  assert.equal(getEvent('unknown').id, 'pernikahan');
});
