import { mapUrl, wazeUrl } from './events.mjs';
import { mountCalendarSheet } from './calendar-sheet.mjs';

export function mountGuestNavigation({ events, getSelected, selectEvent, preference, openCalendar, share, onSheetOpen, onSheetClose }) {
  const byId = id => document.getElementById(id);
  const controllers = new Map();
  for (const id of ['events-dialog', 'location-dialog']) {
    const dialog = byId(id), controller = mountCalendarSheet(dialog, preference);
    controllers.set(id, controller);
    dialog.querySelector('[data-close-sheet]').addEventListener('click', controller.close);
    dialog.addEventListener('close', onSheetClose);
    dialog.addEventListener('click', event => {
      const r = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) controller.close();
    });
  }
  const open = (id, trigger) => { onSheetOpen(); controllers.get(id).open(trigger); };
  byId('nav-events').addEventListener('click', event => open('events-dialog', event.currentTarget));
  byId('nav-calendar').addEventListener('click', event => openCalendar(event.currentTarget));
  byId('nav-location').addEventListener('click', event => open('location-dialog', event.currentTarget));
  byId('nav-share').addEventListener('click', share);
  const options = [...document.querySelectorAll('[data-sheet-event-select]')];
  options.forEach(select => {
    for (const event of events) {
      const option = document.createElement('option'); option.value = event.id; option.textContent = event.shortName; select.append(option);
    }
    select.addEventListener('change', () => selectEvent(select.value, false));
  });
  for (const [index, event] of events.entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'event-choice'; button.dataset.choice = event.id;
    const number = document.createElement('span'); number.className = 'event-choice-number'; number.textContent = `0${index + 1}`;
    const text = document.createElement('span');
    for (const [tag, value] of [['strong', event.shortName], ['span', `${event.day}, ${event.dateLabel}`], ['small', `${event.venue} · ${event.region}`]]) {
      const item = document.createElement(tag); item.textContent = value; text.append(item);
    }
    button.append(number, text); byId('event-choices').append(button);
    button.addEventListener('click', () => {
      selectEvent(event.id);
      byId('events-dialog').addEventListener('close', () => {
        byId('majlis').scrollIntoView({ behavior: preference.matches ? 'instant' : 'smooth', block: 'start' });
        byId(`tab-${event.id}`).focus({ preventScroll: true });
      }, { once: true });
      controllers.get('events-dialog').close();
    });
  }
  const update = () => {
    const event = getSelected();
    options.forEach(select => { select.value = event.id; });
    document.querySelectorAll('[data-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === event.id)));
    byId('location-name').textContent = event.venue;
    byId('location-region').textContent = event.region;
    byId('location-time').textContent = `${event.dateLabel} · ${event.timeLabel}`;
    byId('sheet-location-note').textContent = event.locationNote;
    byId('sheet-location-note').hidden = !event.locationNote;
    byId('sheet-map').href = mapUrl(event); byId('sheet-waze').href = wazeUrl(event);
    byId('location-art').setAttribute('href', `assets/venues.svg#${event.icon}`);
    byId('nav-context').textContent = event.shortName;
  };
  document.addEventListener('invitation-event-change', update); update();
  byId('guest-nav').hidden = false;
}
