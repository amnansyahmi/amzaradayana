// Small DOM effects stay independent of the WebGL opening and ring renderer.
export function createAmbientMotion({ cover, greeting, getState, document: doc = document,
  Observer = globalThis.IntersectionObserver }) {
  let greetingVisible = !Observer;
  const refresh = () => {
    const { coverActive, reducedMotion } = getState();
    const allowed = !doc.hidden && !reducedMotion;
    cover.classList.toggle('ambient-running', allowed && coverActive);
    greeting.classList.toggle('ambient-running', allowed && !coverActive && greetingVisible);
  };
  const observer = Observer ? new Observer(entries => {
    greetingVisible = entries.some(entry => entry.isIntersecting);
    refresh();
  }, { threshold: .01 }) : null;
  observer?.observe(greeting);
  doc.addEventListener('visibilitychange', refresh);
  refresh();
  return { refresh, dispose() {
    observer?.disconnect();
    doc.removeEventListener('visibilitychange', refresh);
    cover.classList.remove('ambient-running');
    greeting.classList.remove('ambient-running');
  } };
}

export function createPaperTransition(panel) {
  let animations = [];
  const cancel = () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
  };
  return { cancel, play({ direction = 1, reducedMotion = false } = {}) {
    cancel();
    if (reducedMotion || typeof panel.animate !== 'function') return;
    const origin = direction > 0 ? '0% 50%' : '100% 50%';
    const options = { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' };
    animations.push(panel.animate([
      { opacity: .3, transform: `perspective(1100px) translateX(${direction * 8}px) rotateY(${direction * 4}deg)`, transformOrigin: origin },
      { opacity: 1, transform: 'perspective(1100px) translateX(0) rotateY(0deg)', transformOrigin: origin }
    ], options));
    const light = panel.querySelector('.paper-turn-light');
    if (light?.animate) {
      animations.push(light.animate([
        { opacity: .3, transform: 'scaleX(1)', transformOrigin: origin },
        { opacity: 0, transform: 'scaleX(0)', transformOrigin: origin }
      ], options));
    }
  } };
}
