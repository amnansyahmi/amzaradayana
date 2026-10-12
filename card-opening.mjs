// A planar paper card is rendered by the browser's 3D compositor. No WebGL or
// third-party library is needed. The cover stays mounted until the reveal ends.
export function animateCardOpening({ cover, card, seal, left, right, insideShadow, lights,
  reducedMotion = false, smallScreen = false, onReveal, onFinish }) {
  const animations = [];
  const timers = [];
  let cancelled = false;
  let completed = false;
  let resolveFinished;
  const finished = new Promise(resolve => { resolveFinished = resolve; });
  const schedule = (callback, delay) => {
    const timer = setTimeout(() => { if (!cancelled) callback(); }, delay);
    timers.push(timer);
  };
  const complete = () => {
    if (cancelled || completed) return;
    completed = true;
    timers.forEach(clearTimeout);
    onFinish();
    resolveFinished();
  };
  const animate = (element, frames, options) => {
    const animation = element.animate(frames, { fill: 'forwards', ...options });
    // Cancelling during replay rejects Animation.finished; always handle it.
    animation.finished.catch(() => {});
    animations.push(animation);
    return animation;
  };

  cover.classList.add('is-opening');
  cover.classList.toggle('motion-reduced', reducedMotion);
  const revealAt = reducedMotion ? 80 : 2700;
  const fadeDuration = reducedMotion ? 360 : 650;

  try {
    if (reducedMotion) {
      // A gentle crossfade preserves a visible response without rotating paper.
      animate(seal, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 });
    } else {
      animate(seal, [
        { transform: 'translate(-50%, -50%) translateZ(12px) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, -50%) translateZ(40px) scale(1.12) rotate(-9deg)', opacity: 1, offset: .45 },
        { transform: 'translate(-50%, -80%) translateZ(65px) scale(1.03) rotate(-14deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-in-out' });

      const hinge = { duration: 1950, easing: 'cubic-bezier(.42,0,.16,1)' };
      animate(left, [
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(-18deg)', offset: .18 },
        { transform: 'rotateY(-92deg)', offset: .56 },
        { transform: 'rotateY(-154deg)' }
      ], { ...hinge, delay: 260 });
      animate(right, [
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(18deg)', offset: .18 },
        { transform: 'rotateY(92deg)', offset: .56 },
        { transform: 'rotateY(154deg)' }
      ], { ...hinge, delay: 400 });

      animate(card, [
        { transform: 'translateZ(0) rotateX(0deg) scale(1)' },
        { transform: `translateZ(0) rotateX(7deg) scale(${smallScreen ? .76 : .9})`, offset: .4 },
        { transform: `translateZ(0) rotateX(0deg) scale(${smallScreen ? .68 : .8})`, offset: .76 },
        { transform: 'translateZ(0) rotateX(0deg) scale(1.06)' }
      ], { duration: 3100, easing: 'cubic-bezier(.22,1,.36,1)' });
      animate(insideShadow, [
        { opacity: .82 }, { opacity: .58, offset: .33 },
        { opacity: .18, offset: .72 }, { opacity: 0 }
      ], { duration: 2150, delay: 240, easing: 'ease-out' });
      for (const light of lights) animate(light, [
        { opacity: 0 }, { opacity: .7, offset: .42 }, { opacity: 0 }
      ], { duration: 1950, delay: 260, easing: 'ease-in-out' });
    }
    const reveal = animate(cover, [{ opacity: 1 }, { opacity: 0 }], {
      delay: revealAt, duration: fadeDuration, easing: 'ease-in-out'
    });
    schedule(onReveal, revealAt);
    // Await the actual reveal animation rather than hiding the card on an early timer.
    reveal.finished.then(complete, () => {});
    // Recovery for a compositor interrupted by a backgrounded tab/browser.
    schedule(complete, revealAt + fadeDuration + 1200);
  } catch {
    animations.forEach(animation => animation.cancel());
    cover.classList.add('opening-css');
    schedule(() => { cover.classList.add('is-leaving'); onReveal(); }, revealAt);
    schedule(complete, revealAt + fadeDuration);
  }

  return {
    finished,
    cancel() {
      cancelled = true;
      timers.forEach(clearTimeout);
      animations.forEach(animation => animation.cancel());
      cover.classList.remove('is-opening', 'is-leaving', 'opening-css', 'motion-reduced');
      resolveFinished();
    }
  };
}
