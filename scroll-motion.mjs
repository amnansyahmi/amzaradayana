// Native scrolling drives short, one-time reveals and the fine event timeline.
export function mountScrollMotion(shell, preference) {
  const targets = [...shell.querySelectorAll('.section-heading, .event-art, .event-host, .event-panel h3, .event-date, .event-time, .event-location, .event-actions, .countdown-wrap, .all-dates h2, .date-list li, .blessing-rings, .blessing h2, .blessing p, .blessing-signature')];
  const list = shell.querySelector('.date-list');
  const milestones = [...list.children];
  const seen = new Set(), animations = new Map();
  let started = false, frame = 0, timelineVisible = false;
  const motionAllowed = () => !preference.matches && !document.hidden;
  const reveal = (node, delay = 0) => {
    if (seen.has(node)) return;
    seen.add(node); node.classList.remove('awaiting-scroll');
    if (!motionAllowed() || typeof node.animate !== 'function') return;
    const animation = node.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    animations.set(node, animation);
    animation.finished.then(() => animations.delete(node), () => animations.delete(node));
  };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    if (!started) return;
    const entering = entries.filter(entry => entry.isIntersecting).map(entry => entry.target);
    entering.forEach((node, index) => reveal(node, Math.min(index * 65, 195)));
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' }) : null;
  if (observer && !preference.matches) targets.forEach(node => { node.classList.add('awaiting-scroll'); observer.observe(node); });
  const drawTimeline = () => {
    frame = 0;
    if (!started || document.hidden) return;
    milestones.forEach((node, index) => {
      const bounds = node.getBoundingClientRect();
      const progress = preference.matches ? 1 : Math.max(0, Math.min(1, (window.innerHeight * .77 - bounds.top - 40) / Math.max(1, bounds.height - 16)));
      node.style.setProperty('--line-progress', String(progress));
      node.classList.toggle('milestone-reached', preference.matches || bounds.top + 35 < window.innerHeight * .77);
      if (index === milestones.length - 1) node.style.removeProperty('--line-progress');
    });
  };
  const schedule = () => { if (started && timelineVisible && !frame && !document.hidden) frame = requestAnimationFrame(drawTimeline); };
  const timelineObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    timelineVisible = entries[0].isIntersecting; schedule();
  }, { rootMargin: '80px' }) : null;
  timelineObserver?.observe(list);
  if (timelineObserver) list.classList.add('timeline-motion');
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  const focus = event => { const node = targets.find(item => item.contains(event.target)); if (node) reveal(node); };
  shell.addEventListener('focusin', focus);
  const visibility = () => {
    // Complete rather than replay a text reveal when a guest switches apps.
    if (document.hidden) animations.forEach(animation => animation.finish());
    else schedule();
  };
  document.addEventListener('visibilitychange', visibility);
  const reduce = () => {
    if (preference.matches) {
      targets.forEach(node => reveal(node));
      animations.forEach(animation => animation.finish());
      drawTimeline();
    }
  };
  preference.addEventListener('change', reduce);
  return {
    start() {
      started = true;
      targets.forEach(node => {
        const bounds = node.getBoundingClientRect();
        if (!observer || preference.matches || (bounds.bottom > 0 && bounds.top < window.innerHeight - 24)) reveal(node);
      });
      drawTimeline();
    },
    pause() { started = false; animations.forEach(animation => animation.finish()); },
    dispose() {
      observer?.disconnect(); timelineObserver?.disconnect(); cancelAnimationFrame(frame);
      animations.forEach(animation => animation.cancel()); targets.forEach(node => node.classList.remove('awaiting-scroll'));
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      shell.removeEventListener('focusin', focus); document.removeEventListener('visibilitychange', visibility);
      preference.removeEventListener('change', reduce);
    }
  };
}
