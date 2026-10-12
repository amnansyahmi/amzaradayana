import { events, getEvent, mapUrl, wazeUrl, calendarFile, googleCalendarUrl, countdown } from './events.mjs';
import { animateCardOpening } from './card-opening.mjs';
import { createAmbientMotion, createPaperTransition } from './paper-motion.mjs';
import { mountEventSwipe, mountCoverViewport } from './mobile-motion.mjs';

const byId = id => document.getElementById(id);
const cover = byId('cover');
const shell = byId('invitation-shell');
const openButton = byId('open-card');
const panel = byId('event-panel');
const dialog = byId('calendar-dialog');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let selected = getEvent(new URLSearchParams(location.search).get('majlis'));
let isOpening = false;
let countdownTimer;
let opening;
let webglCard;
let webglPreparing;
let smoothScroll;
let effectsModule, effectsLoading, ringsScene, namesEffect;
let revealStarted = false, animateNamesOnReveal = false, fullEffectsRequested = false;
let ambientMotion;
const paperTransition = createPaperTransition(panel);
const coverViewport = mountCoverViewport(cover);

function warmInvitationEffects() {
  if (effectsLoading) return effectsLoading;
  effectsLoading = import('./invitation-effects.mjs').then(module => { effectsModule = module; return module; }).catch(() => null);
  return effectsLoading;
}

function revealDetails() {
  document.body.classList.remove('cover-active');
  if (revealStarted) return;
  revealStarted = true;
  ambientMotion?.refresh();
  const composition = byId('couple-composition');
  composition.classList.remove('names-awaiting');
  if (animateNamesOnReveal) {
    if (effectsModule) namesEffect = effectsModule.revealNames(byId('couple-names'));
    else composition.classList.add('names-reveal');
  }
}

function mountInvitationRings() {
  warmInvitationEffects().then(module => {
    if (!module || !cover.hidden || ringsScene) return;
    try { ringsScene = module.mountRings(byId('rings-stage'), { reducedMotion: motionPreference.matches && !fullEffectsRequested }); }
    catch { /* The inline ring illustration remains available without WebGL. */ }
  });
}

function warmCardScene() {
  if (webglCard || webglPreparing || cover.hidden) return;
  webglPreparing = import('./card-webgl.mjs').then(module => module.prepareWebGLCard(cover, byId('fold-card'), () => !isOpening && !cover.hidden))
    .then(scene => {
      webglPreparing = null;
      if (!scene) return;
      if (cover.hidden || isOpening) scene.dispose();
      else webglCard = scene;
    }).catch(() => { webglPreparing = null; }); // WebGL unavailable: retain the CSS 3D card.
}

function updateDesktopScroll() {
  if (motionPreference.matches || !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      !cover.hidden || document.hidden || dialog.open) {
    smoothScroll?.destroy(); smoothScroll = null;
    return;
  }
  if (smoothScroll) return;
  import('lenis').then(({ default: Lenis }) => {
    if (smoothScroll || !cover.hidden || document.hidden || dialog.open || motionPreference.matches ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    smoothScroll = new Lenis({ autoRaf: true, smoothWheel: true, syncTouch: false,
      duration: .85, anchors: true, prevent: node => node.closest?.('dialog') });
  }).catch(() => {}); // Native scrolling is the fallback.
}

function notify(message) {
  byId('toast-message').textContent = message;
  byId('toast').hidden = false;
}
byId('dismiss-toast').addEventListener('click', () => { byId('toast').hidden = true; });

function updateCountdown() {
  const remaining = countdown(selected);
  byId('countdown-days').textContent = String(remaining.days).padStart(2, '0');
  byId('countdown-hours').textContent = String(remaining.hours).padStart(2, '0');
  byId('countdown-minutes').textContent = String(remaining.minutes).padStart(2, '0');
  byId('countdown-heading').textContent = remaining.started
    ? 'Tarikh majlis telah tiba'
    : `Menghitung hari ke majlis ${selected.shortName.toLowerCase()}`;
  byId('countdown-accessible').textContent = remaining.started
    ? 'Tarikh majlis telah tiba.'
    : `${remaining.days} hari, ${remaining.hours} jam dan ${remaining.minutes} minit ke ${selected.name}.`;
}

function setCountdownRunning() {
  clearInterval(countdownTimer);
  if (!document.hidden && cover.hidden) {
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 30_000);
  }
}
document.addEventListener('visibilitychange', () => { setCountdownRunning(); updateDesktopScroll(); });

function selectEvent(id, animate = true) {
  const previousId = selected.id;
  selected = getEvent(id);
  for (const tab of document.querySelectorAll('[role="tab"]')) {
    const active = tab.dataset.event === selected.id;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', `tab-${selected.id}`);
  panel.dataset.theme = selected.theme;
  byId('venue-art').setAttribute('href', `assets/venues.svg#${selected.icon}`);
  byId('event-host').textContent = selected.host;
  byId('event-title').textContent = selected.name;
  byId('date-day').textContent = selected.dateParts[0];
  // Keep the year span intact when replacing the month text.
  byId('date-month').firstChild.textContent = selected.dateParts[1];
  byId('date-year').textContent = selected.dateParts[2];
  byId('date-weekday').textContent = selected.day;
  document.querySelector('.event-date').setAttribute('aria-label', `${selected.day}, ${selected.dateLabel}`);
  byId('event-time').textContent = selected.timeLabel;
  byId('event-venue').textContent = selected.venue;
  byId('event-region').textContent = selected.region;
  byId('location-note').textContent = selected.locationNote;
  byId('location-note').hidden = !selected.locationNote;
  byId('map-link').href = mapUrl(selected);
  byId('map-link').setAttribute('aria-label', `Lihat lokasi ${selected.venue} dalam Google Maps`);
  byId('waze-link').href = wazeUrl(selected);
  byId('google-calendar').href = googleCalendarUrl(selected);
  byId('calendar-description').textContent = `${selected.name} · ${selected.dateLabel}`;
  byId('calendar-note').textContent = 'Masa tamat majlis pertunangan belum dinyatakan. Anda boleh melengkapkannya dalam kalendar anda.';
  byId('calendar-note').hidden = Boolean(selected.end);
  updateCountdown();
  if (animate && previousId !== selected.id) {
    const direction = events.findIndex(event => event.id === selected.id) > events.findIndex(event => event.id === previousId) ? 1 : -1;
    paperTransition.play({ direction, reducedMotion: motionPreference.matches });
  }
  const url = new URL(location.href);
  url.searchParams.set('majlis', selected.id);
  try { history.replaceState(null, '', url); } catch { /* The card also works in restrictive embeds. */ }
}

document.querySelectorAll('[data-event]').forEach(tab => {
  tab.addEventListener('click', () => selectEvent(tab.dataset.event));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = events.findIndex(item => item.id === selected.id);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? events.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + events.length) % events.length;
    selectEvent(events[next].id);
    byId(`tab-${selected.id}`).focus({ preventScroll: true });
  });
});

document.querySelectorAll('[data-jump]').forEach(button => {
  button.addEventListener('click', () => {
    selectEvent(button.dataset.jump);
    byId('majlis').scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
    byId(`tab-${selected.id}`).focus({ preventScroll: true });
  });
});

function finishOpening() {
  cover.hidden = true;
  opening?.cancel(); opening = null;
  webglCard?.dispose(); webglCard = null;
  cover.style.opacity = '';
  revealDetails();
  shell.inert = false;
  openButton.setAttribute('aria-expanded', 'true');
  byId('couple-names').focus({ preventScroll: true });
  isOpening = false;
  ambientMotion?.refresh();
  setCountdownRunning();
  updateDesktopScroll();
  // The opening renderer is disposed before the ring renderer is created.
  mountInvitationRings();
}

mountEventSwipe(panel, direction => {
  const index = events.findIndex(event => event.id === selected.id);
  const next = Math.max(0, Math.min(events.length - 1, index + direction));
  if (next !== index) selectEvent(events[next].id);
});

function openCard(immediate = false, forceMotion = false) {
  if (isOpening || cover.hidden) return;
  isOpening = true;
  ambientMotion?.refresh();
  revealStarted = false;
  fullEffectsRequested = forceMotion && !immediate;
  animateNamesOnReveal = (!motionPreference.matches || fullEffectsRequested) && !immediate;
  byId('couple-composition').classList.toggle('names-explicit-motion', fullEffectsRequested);
  byId('couple-composition').classList.toggle('names-awaiting', animateNamesOnReveal);
  openButton.disabled = true;
  if (immediate) return finishOpening(); // Only an explicit #majlis deep link skips the cover.
  const callbacks = { onReveal: revealDetails, onFinish: finishOpening,
    focusTarget: byId('couple-names').querySelector('span') };
  if (webglCard && (!motionPreference.matches || forceMotion)) {
    try { opening = webglCard.play(callbacks); return; }
    catch { webglCard.dispose(); webglCard = null; }
  }
  opening = animateCardOpening({ cover, card: byId('fold-card'), seal: byId('card-seal'),
    left: document.querySelector('.door-left'), right: document.querySelector('.door-right'),
    insideShadow: document.querySelector('.inside-fold-shadow'), lights: document.querySelectorAll('.door-light'),
    reducedMotion: motionPreference.matches && !forceMotion, smallScreen: window.matchMedia('(max-width: 600px)').matches,
    ...callbacks });
}

function replayCard() {
  paperTransition.cancel();
  ringsScene?.dispose(); ringsScene = null;
  namesEffect?.cancel(); namesEffect = null;
  byId('couple-composition').classList.remove('names-awaiting', 'names-reveal', 'names-explicit-motion');
  opening?.cancel(); opening = null;
  webglCard?.dispose(); webglCard = null;
  smoothScroll?.destroy(); smoothScroll = null;
  clearInterval(countdownTimer);
  if (dialog.open) dialog.close();
  byId('toast').hidden = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
  shell.inert = true;
  isOpening = false;
  openButton.disabled = false;
  openButton.setAttribute('aria-expanded', 'false');
  cover.classList.remove('is-opening', 'is-leaving', 'opening-css', 'motion-reduced', 'webgl-active');
  cover.style.opacity = '';
  document.body.classList.add('cover-active');
  cover.hidden = false;
  coverViewport.refresh();
  ambientMotion?.refresh();
  requestAnimationFrame(() => openButton.focus({ preventScroll: true }));
  warmCardScene();
}
// The entire screen-sized card is one semantic button. Every deliberate tap
// opts into the same full animation as the previous labelled animation action.
openButton.addEventListener('click', () => openCard(false, true));
// This labelled action lets a guest explicitly request the full folding motion
// even when their operating system normally prefers reduced motion.
byId('direct-open').addEventListener('click', () => openCard(false, true));
byId('replay-bottom').addEventListener('click', replayCard);
motionPreference.addEventListener('change', () => {
  // Ambient/UI effects follow the preference; an explicitly requested opening
  // continues to completion when the preference changes mid-animation.
  updateDesktopScroll();
  ambientMotion?.refresh();
  if (motionPreference.matches) paperTransition.cancel();
  warmCardScene();
  ringsScene?.setReducedMotion(motionPreference.matches && !fullEffectsRequested);
  if (motionPreference.matches && !fullEffectsRequested) {
    namesEffect?.cancel(); namesEffect = null;
    byId('couple-composition').classList.remove('names-awaiting', 'names-reveal');
  }
  byId('direct-open').textContent = motionPreference.matches ? 'Mainkan animasi pembukaan' : 'Buka kad jemputan';
});
window.addEventListener('resize', updateDesktopScroll);

byId('save-date').addEventListener('click', () => {
  if (typeof dialog.showModal === 'function') {
    document.body.classList.add('sheet-open');
    smoothScroll?.destroy(); smoothScroll = null;
    dialog.showModal();
  } else {
    downloadCalendar();
  }
});
byId('close-calendar').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  document.body.classList.remove('sheet-open');
  updateDesktopScroll();
  byId('save-date').focus({ preventScroll: true });
});
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});

function downloadCalendar() {
  const blob = new Blob([calendarFile(selected)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `amzar-dayana-${selected.id}.ics`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  if (dialog.open) dialog.close();
  notify('Fail kalendar disediakan. Buka fail untuk menambah tarikh majlis.');
}
byId('download-calendar').addEventListener('click', downloadCalendar);

async function copyInvitation(url) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);
    notify('Pautan jemputan disalin. Sedia untuk dikongsi.');
  } catch {
    const input = document.createElement('textarea');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    byId('share-invitation').focus({ preventScroll: true });
    notify(copied ? 'Pautan jemputan disalin. Sedia untuk dikongsi.' : 'Salin pautan dari bar alamat pelayar anda untuk berkongsi.');
  }
}

byId('share-invitation').addEventListener('click', async () => {
  const url = new URL(location.href);
  url.hash = '';
  url.searchParams.set('majlis', selected.id);
  const share = {
    title: 'Undangan Amzar & Dayana',
    text: `Assalamualaikum. Anda seisi keluarga dijemput ke ${selected.name} Amzar & Dayana pada ${selected.dateLabel}. Buka kad jemputan untuk butiran.`,
    url: url.href
  };
  if (navigator.share && (!navigator.canShare || navigator.canShare(share))) {
    try { await navigator.share(share); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  await copyInvitation(url.href);
});

// Printed invitations contain all three events, regardless of the active tab.
const printEvents = document.createElement('div');
printEvents.className = 'print-events';
printEvents.hidden = true;
for (const event of events) {
  const section = document.createElement('section');
  section.className = 'print-event';
  for (const [tag, text] of [['h3', event.name], ['p', event.host], ['p', `${event.day}, ${event.dateLabel} · ${event.timeLabel}`], ['p', `${event.venue}, ${event.region}`]]) {
    const element = document.createElement(tag);
    element.textContent = text;
    section.append(element);
  }
  printEvents.append(section);
}
byId('majlis').append(printEvents);

// Initialise the interactive cover only after all of its handlers exist.
selectEvent(selected.id, false);
byId('replay-bottom').hidden = false;
cover.hidden = false;
shell.inert = true;
document.body.classList.add('cover-active');
ambientMotion = createAmbientMotion({ cover, greeting: document.querySelector('.greeting'),
  getState: () => ({ coverActive: !cover.hidden || isOpening, reducedMotion: motionPreference.matches || isOpening }) });
byId('direct-open').textContent = motionPreference.matches ? 'Mainkan animasi pembukaan' : 'Buka kad jemputan';
if (location.hash === '#majlis') openCard(true);
else warmCardScene();
warmInvitationEffects();

// Keep the invitation app-like on mobile while retaining regular vertical swipes.
document.addEventListener('touchmove', event => {
  if (event.touches.length > 1) event.preventDefault();
}, { passive: false });
document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
document.addEventListener('gesturechange', event => event.preventDefault(), { passive: false });
