import { createOpeningPaper } from './opening-paper.mjs';

// A planar paper card is rendered by the browser's 3D compositor. No WebGL or
// third-party library is needed. The cover stays mounted until the reveal ends.
export function animateCardOpening({ cover, card, seal, left, right, insideShadow, lights,
  reducedMotion = false, smallScreen = false, paperTarget, onReveal, onFinish }) {
  const animations = [];
  const timers = [];
  let cancelled = false;
  let completed = false;
  let livePaper;
  let didReveal = false;
  const revealDetails = () => {
    if (didReveal || cancelled) return;
    didReveal = true; onReveal(livePaper?.names);
  };
  let cardAnimation, cardFrames;
  const viewportChange = () => {
    if (cancelled || completed || !livePaper || !cardAnimation) return;
    // Mobile browser chrome resizes the viewport during a tap. Retarget the
    // moving paper at its current time instead of cutting the opening short.
    cardAnimation.effect.setKeyframes([{ transform: 'none' }]);
    const bounds = card.getBoundingClientRect(), target = livePaper.measure();
    livePaper.element.style.transform = `scale(${bounds.width / target.width},${bounds.height / target.height})`;
    const x = target.left + target.width / 2 - bounds.left - bounds.width / 2;
    const y = target.top + target.height / 2 - bounds.top - bounds.height / 2;
    const transform = `translate(${x}px,${y}px) rotateX(0deg) scale(${target.width / bounds.width},${target.height / bounds.height})`;
    cardFrames[3].transform = transform; cardFrames[4].transform = transform;
    cardAnimation.effect.setKeyframes(cardFrames);
  };
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
    revealDetails();
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
  const revealAt = reducedMotion ? 80 : 3300;
  const fadeDuration = reducedMotion ? 360 : 400;

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

      animate(cover, [{ backgroundColor: '#132d46' }, { backgroundColor: '#eae6dd' }], { duration: 900, delay: 300, easing: 'ease-in-out' });
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

      let finalTransform = 'translateZ(0) rotateX(0deg) scale(1.06)';
      if (paperTarget) {
        const bounds = card.getBoundingClientRect();
        livePaper = createOpeningPaper(cover, paperTarget);
        const target = livePaper.measure();
        livePaper.element.classList.add('fallback-paper');
        livePaper.element.style.transform = `scale(${bounds.width / target.width},${bounds.height / target.height})`;
        card.prepend(livePaper.element); card.classList.add('has-live-paper');
        const x = target.left + target.width / 2 - bounds.left - bounds.width / 2;
        const y = target.top + target.height / 2 - bounds.top - bounds.height / 2;
        finalTransform = `translate(${x}px,${y}px) rotateX(0deg) scale(${target.width / bounds.width},${target.height / bounds.height})`;
        window.addEventListener('resize', viewportChange);
        window.visualViewport?.addEventListener('resize', viewportChange);
      }
      cardFrames = [
        { transform: 'translateZ(0) rotateX(0deg) scale(1)' },
        { transform: `translateZ(0) rotateX(6deg) scale(${smallScreen ? .8 : .9})`, offset: .3 },
        { transform: `translateZ(0) rotateX(0deg) scale(${smallScreen ? .68 : .8})`, offset: .65 },
        { transform: finalTransform, offset: .9 },
        { transform: finalTransform }
      ];
      cardAnimation = animate(card, cardFrames, { duration: 3700, easing: 'cubic-bezier(.42,0,.22,1)' });
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
    schedule(revealDetails, reducedMotion ? 80 : 2650);
    // Await the actual reveal animation rather than hiding the card on an early timer.
    reveal.finished.then(complete, () => {});
    // Recovery for a compositor interrupted by a backgrounded tab/browser.
    schedule(complete, revealAt + fadeDuration + 1200);
  } catch {
    animations.forEach(animation => animation.cancel());
    cover.classList.add('opening-css');
    schedule(() => { cover.classList.add('is-leaving'); revealDetails(); }, revealAt);
    schedule(complete, revealAt + fadeDuration);
  }

  return {
    finished,
    cancel() {
      cancelled = true;
      if (paperTarget) { window.removeEventListener('resize', viewportChange); window.visualViewport?.removeEventListener('resize', viewportChange); card.classList.remove('has-live-paper'); livePaper?.dispose(); }
      timers.forEach(clearTimeout);
      animations.forEach(animation => animation.cancel());
      cover.classList.remove('is-opening', 'is-leaving', 'opening-css', 'motion-reduced');
      resolveFinished();
    }
  };
}
