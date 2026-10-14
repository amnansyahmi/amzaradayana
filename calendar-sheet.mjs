export function mountCalendarSheet(dialog, preference) {
  const handle = dialog.querySelector('.sheet-handle');
  const mobile = () => window.matchMedia('(max-width: 600px)').matches;
  let animation, closing = false, drag, returnFocus, scrollY = 0;
  const cancelAnimation = () => { animation?.cancel(); animation = null; };
  const animate = (frames, options) => {
    cancelAnimation();
    animation = dialog.animate(frames, options);
    animation.finished.catch(() => {});
    return animation;
  };
  const close = () => {
    if (!dialog.open || closing) return;
    closing = true;
    const finish = () => { dialog.close(); };
    if (preference.matches || typeof dialog.animate !== 'function') { finish(); return; }
    const from = dialog.style.transform || 'translateY(0)';
    const outgoing = animate([{ transform: from, opacity: 1 },
      { transform: mobile() ? 'translateY(100%)' : 'translateY(12px)', opacity: mobile() ? 1 : 0 }],
      { duration: mobile() ? 240 : 160, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    outgoing.finished.then(finish, () => { if (closing) finish(); });
  };
  const open = (trigger = document.activeElement) => {
    if (dialog.open) return;
    closing = false; returnFocus = trigger; scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('sheet-open');
    dialog.showModal();
    if (!preference.matches && typeof dialog.animate === 'function') animate([
      { transform: mobile() ? 'translateY(100%)' : 'translateY(12px)', opacity: mobile() ? 1 : 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: mobile() ? 380 : 220, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => {
    closing = false; drag = null; cancelAnimation(); dialog.style.removeProperty('transform');
    document.body.classList.remove('sheet-open'); document.body.style.removeProperty('top');
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    returnFocus?.focus({ preventScroll: true });
  });
  handle.addEventListener('pointerdown', event => {
    if (!mobile() || !event.isPrimary || closing) return;
    cancelAnimation();
    drag = { id: event.pointerId, y: event.clientY, time: performance.now(), distance: 0 };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    drag.distance = Math.max(0, event.clientY - drag.y);
    dialog.style.transform = `translateY(${drag.distance}px)`;
  });
  const release = event => {
    if (!drag || drag.id !== event.pointerId) return;
    const { distance, time } = drag; drag = null;
    const velocity = distance / Math.max(1, performance.now() - time);
    if (event.type === 'pointerup' && (distance > 90 || (distance > 30 && velocity > .5))) { close(); return; }
    const from = dialog.style.transform || 'translateY(0)'; dialog.style.removeProperty('transform');
    if (!preference.matches) animate([{ transform: from }, { transform: 'translateY(0)' }],
      { duration: 250, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  handle.addEventListener('pointerup', release); handle.addEventListener('pointercancel', release);
  preference.addEventListener('change', () => { if (preference.matches) { if (closing) dialog.close(); else cancelAnimation(); } });
  return { open, close };
}
