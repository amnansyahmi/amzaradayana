// The actual invitation stays still behind two lightweight cover panels.
// No duplicate greeting, camera movement, or renderer handoff is needed.
export function animateCardOpening({ cover, seal, left, right, reducedMotion = false, onReveal, onFinish }) {
  let cancelled = false, completed = false, resolveFinished;
  const animations = [], timers = [];
  const finished = new Promise(resolve => { resolveFinished = resolve; });
  const complete = () => {
    if (cancelled || completed) return;
    completed = true; timers.forEach(clearTimeout); onFinish(); resolveFinished();
  };
  const animate = (element, frames, options) => {
    const animation = element.animate(frames, { fill: 'forwards', ...options });
    animation.finished.catch(() => {}); animations.push(animation); return animation;
  };
  cover.classList.add('is-opening', 'opening-stationary');
  cover.classList.toggle('motion-reduced', reducedMotion);
  onReveal();
  try {
    animate(seal, [{ opacity: 1 }, { opacity: 0 }], { duration: reducedMotion ? 180 : 240, easing: 'ease-out' });
    if (!reducedMotion) {
      for (const [element, direction] of [[left, -1], [right, 1]]) {
        animate(element, [{ transform: 'translateX(0)' }, { transform: `translateX(${direction * 102}%)` }],
          { duration: 1100, delay: 140, fill: 'both', easing: 'cubic-bezier(.32,0,.18,1)' });
      }
    }
    const fade = animate(cover, [{ opacity: 1 }, { opacity: 0 }],
      { duration: reducedMotion ? 280 : 140, delay: reducedMotion ? 0 : 1120, easing: 'ease-out' });
    fade.finished.then(complete, () => {});
    timers.push(setTimeout(complete, reducedMotion ? 800 : 1900));
  } catch {
    cover.classList.add('opening-css');
    timers.push(setTimeout(complete, reducedMotion ? 280 : 1260));
  }
  return { finished, cancel() {
    cancelled = true; timers.forEach(clearTimeout); animations.forEach(animation => animation.cancel());
    cover.classList.remove('is-opening', 'opening-stationary', 'opening-css', 'motion-reduced');
    resolveFinished();
  } };
}
