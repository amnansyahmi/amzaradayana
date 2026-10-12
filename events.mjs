// The attached invitation is the source of truth. Times use Malaysia time (+08:00).
// No end time was provided for the engagement, so its calendar entry only has DTSTART.
export const events = Object.freeze([
  {
    id: 'pertunangan', name: 'Majlis Pertunangan', shortName: 'Pertunangan',
    host: 'Bermulanya sebuah ikatan', day: 'Ahad', dateLabel: '8 November 2026',
    dateParts: ['8', 'November', '2026'], timeLabel: '2.00 petang',
    start: '2026-11-08T14:00:00+08:00', end: null,
    venue: 'Bukit Marak', region: 'Kelantan', mapQuery: 'Bukit Marak, Kelantan, Malaysia',
    locationNote: 'Lokasi kawasan Bukit Marak. Alamat rumah khusus belum diberikan.',
    icon: 'rings', theme: 'blue'
  },
  {
    id: 'pernikahan', name: 'Majlis Pernikahan', shortName: 'Pernikahan',
    host: 'Sebelah perempuan', day: 'Sabtu', dateLabel: '13 Mac 2027',
    dateParts: ['13', 'Mac', '2027'], timeLabel: '5.00 petang – 11.00 malam',
    start: '2027-03-13T17:00:00+08:00', end: '2027-03-13T23:00:00+08:00',
    venue: 'The Tree Glass House', region: 'Kota Bharu, Kelantan',
    mapQuery: 'The Tree Glass House, Kota Bharu, Kelantan', locationNote: '',
    icon: 'glasshouse', theme: 'rose'
  },
  {
    id: 'persandingan', name: 'Majlis Persandingan', shortName: 'Persandingan',
    host: 'Sebelah lelaki', day: 'Sabtu', dateLabel: '10 April 2027',
    dateParts: ['10', 'April', '2027'], timeLabel: '11.00 pagi – 4.00 petang',
    start: '2027-04-10T11:00:00+08:00', end: '2027-04-10T16:00:00+08:00',
    venue: 'The Garden Hall Bizmilla', region: 'One City, Subang Jaya',
    mapQuery: 'The Garden Hall Bizmilla, One City, Subang Jaya', locationNote: '',
    icon: 'garden', theme: 'green'
  }
]);

export function getEvent(id) {
  return events.find(event => event.id === id) ?? events[1];
}

export function mapUrl(event) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapQuery)}`;
}

export function wazeUrl(event) {
  return `https://waze.com/ul?q=${encodeURIComponent(event.mapQuery)}&navigate=yes`;
}

export function utcStamp(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(value) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// RFC 5545: fold lines at 75 octets without splitting UTF-8 characters.
export function foldLine(line) {
  const encoder = new TextEncoder();
  let result = '', part = '', bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      result += part + '\r\n';
      part = ' ';
      bytes = 1;
    }
    part += char;
    bytes += size;
  }
  return result + part;
}

export function calendarFile(event, now = new Date()) {
  const description = `${event.name} Amzar & Dayana. ${event.host}. ${event.timeLabel}.` +
    (event.locationNote ? ` ${event.locationNote}` : '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Amzar Dayana//Undangan//MS',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${event.id}-amzar-dayana@invitation.local`, `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(event.start)}`,
    ...(event.end ? [`DTEND:${utcStamp(event.end)}`] : []),
    `SUMMARY:${escapeICS(`${event.name} Amzar & Dayana`)}`,
    `LOCATION:${escapeICS(`${event.venue}, ${event.region}`)}`,
    `DESCRIPTION:${escapeICS(description)}`, 'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR'
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(event) {
  const start = utcStamp(event.start);
  // No invented engagement finish time: Google can prompt the guest to choose a duration.
  const dates = `${start}/${event.end ? utcStamp(event.end) : start}`;
  return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE', text: `${event.name} Amzar & Dayana`, dates,
    location: `${event.venue}, ${event.region}`, details: `${event.host}. ${event.timeLabel}. ${event.locationNote}`,
    ctz: 'Asia/Kuala_Lumpur'
  }).toString();
}

export function countdown(event, now = Date.now()) {
  const difference = Math.max(0, new Date(event.start).getTime() - now);
  return {
    days: Math.floor(difference / 86400000), hours: Math.floor(difference / 3600000) % 24,
    minutes: Math.floor(difference / 60000) % 60, started: difference === 0
  };
}
