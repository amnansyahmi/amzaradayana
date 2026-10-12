export const OPENING = Object.freeze({ seal: .48, left: .26, right: .4,
  hinge: 2.05, approach: 2.3, write: 2.65, reveal: 3.3, fade: .4, end: 3.7 });

export function isLiteDevice(nav = globalThis.navigator) {
  return Boolean(nav?.connection?.saveData || (nav?.deviceMemory && nav.deviceMemory <= 4) ||
    (nav?.hardwareConcurrency && nav.hardwareConcurrency <= 4));
}

export function enableLiteMotion() {
  if (document.body.classList.contains('effects-lite')) return;
  document.body.classList.add('effects-lite');
  window.dispatchEvent(new Event('invitation-quality-change'));
}

// Sample only actual animation frames; tab suspension is not a slow phone.
export function createFrameBudget(onDowngrade, lite = false) {
  let previous = 0, samples = [], downgraded = lite;
  return { sample(now) {
    if (downgraded) return;
    const delta = now - previous; previous = now;
    if (delta < 5 || delta > 100) return;
    samples.push(delta);
    if (samples.length < 24) return;
    if (samples.filter(value => value > 26).length > 12) {
      downgraded = true; onDowngrade();
    }
    samples = [];
  }, reset() { previous = 0; samples = []; } };
}

// Swipes are committed on release. Vertical gestures, multi-touch and controls
// are never captured, so the event sheet retains native mobile scrolling.
export function mountEventSwipe(panel, onSwipe, now = () => performance.now()) {
  let start;
  const down = event => {
    if (!event.isPrimary || event.pointerType === 'mouse' ||
      event.target.closest?.('a,button,input,select,textarea')) { start = null; return; }
    start = { id: event.pointerId, x: event.clientX, y: event.clientY, time: now() };
  };
  const up = event => {
    const first = start; start = null;
    if (!first || first.id !== event.pointerId || now() - first.time > 900) return;
    const x = event.clientX - first.x, y = event.clientY - first.y;
    if (Math.abs(x) >= 48 && Math.abs(x) > Math.abs(y) * 1.6) onSwipe(x < 0 ? 1 : -1);
  };
  const cancel = () => { start = null; };
  panel.addEventListener('pointerdown', down, { passive: true });
  panel.addEventListener('pointerup', up, { passive: true });
  panel.addEventListener('pointercancel', cancel, { passive: true });
  return { dispose() {
    panel.removeEventListener('pointerdown', down); panel.removeEventListener('pointerup', up);
    panel.removeEventListener('pointercancel', cancel);
  } };
}

export function mountCoverViewport(cover, win = window) {
  let frame = 0;
  const refresh = () => {
    frame = 0;
    const height = win.visualViewport?.height || win.innerHeight;
    if (height > 0) cover.style.setProperty('--cover-height', `${Math.round(height)}px`);
  };
  const schedule = () => { if (!frame) frame = win.requestAnimationFrame(refresh); };
  win.addEventListener('resize', schedule);
  win.visualViewport?.addEventListener('resize', schedule);
  refresh();
  return { refresh, dispose() {
    win.cancelAnimationFrame(frame); win.removeEventListener('resize', schedule);
    win.visualViewport?.removeEventListener('resize', schedule);
  } };
}
