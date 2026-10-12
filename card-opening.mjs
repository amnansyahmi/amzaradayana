// A planar paper card is rendered by the browser's 3D compositor. No WebGL or
// third-party library is needed. The cover stays mounted until the reveal ends.
import { OPENING } from './mobile-motion.mjs';
import { planCSSHandoff } from './opening-handoff.mjs';
export function animateCardOpening({ cover, card, seal, left, right, insideShadow, lights,
  reducedMotion = false, smallScreen = false, focusTarget, onReveal, onFinish }) {
  const animations = [];
  const timers = [];
  let cancelled = false;
  let completed = false;
  let paperAnimation, paperFrames;
  let paperHandoff = { y: 0, scale: 1.06 };
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
    cleanupViewport();
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
  const revealAt = reducedMotion ? 80 : OPENING.reveal * 1000;
  const fadeDuration = reducedMotion ? 360 : OPENING.fade * 1000;
  const alignPaper = () => {
    if (!focusTarget || !card.getBoundingClientRect) return;
    // offsetWidth/Height ignore the currently animated CSS transform.
    const bounds = cover.getBoundingClientRect(), target = focusTarget.getBoundingClientRect();
    paperHandoff = planCSSHandoff({ cardWidth: card.offsetWidth, cardHeight: card.offsetHeight,
      viewportHeight: bounds.height, nameCenterY: target.top + target.height / 2 - bounds.top,
      nameFontSize: Number.parseFloat(getComputedStyle(focusTarget).fontSize) });
    if (paperFrames) {
      paperFrames.at(-1).transform = `translateY(${paperHandoff.y}px) rotateX(0deg) scale(${paperHandoff.scale})`;
      paperAnimation?.effect?.setKeyframes(paperFrames);
    }
  };
  alignPaper();
  globalThis.window?.addEventListener('resize', alignPaper);
  globalThis.window?.visualViewport?.addEventListener('resize', alignPaper);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(alignPaper) : null;
  observer?.observe(cover);
  const cleanupViewport = () => {
    globalThis.window?.removeEventListener('resize', alignPaper);
    globalThis.window?.visualViewport?.removeEventListener('resize', alignPaper);
    observer?.disconnect();
  };

  try {
    if (reducedMotion) {
      // A gentle crossfade preserves a visible response without rotating paper.
      animate(seal, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 });
    } else {
      animate(seal, [
        { transform: 'translate(-50%, -50%) translateZ(12px) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, -50%) translateZ(7px) scale(.95)', opacity: 1, offset: OPENING.press / OPENING.seal },
        { transform: 'translate(-50%, -50%) translateZ(40px) scale(1.06) rotate(-9deg)', opacity: 1, offset: .58 },
        { transform: 'translate(-50%, -80%) translateZ(65px) scale(1.03) rotate(-14deg)', opacity: 0 }
      ], { duration: OPENING.seal * 1000, easing: 'ease-in-out' });

      const hinge = { duration: OPENING.hinge * 1000, easing: 'cubic-bezier(.42,0,.16,1)' };
      animate(left, [
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(-18deg)', offset: .18 },
        { transform: 'rotateY(-92deg)', offset: .56 },
        { transform: 'rotateY(-154deg)' }
      ], { ...hinge, delay: OPENING.left * 1000 });
      animate(right, [
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(18deg)', offset: .18 },
        { transform: 'rotateY(92deg)', offset: .56 },
        { transform: 'rotateY(154deg)' }
      ], { ...hinge, delay: OPENING.right * 1000 });

      paperFrames = [
        { transform: 'translateZ(0) rotateX(0deg) scale(1)' },
        { transform: `translateZ(0) rotateX(7deg) scale(${smallScreen ? .76 : .9})`, offset: .4 },
        { transform: `translateZ(0) rotateX(0deg) scale(${smallScreen ? .68 : .8})`, offset: OPENING.approach / 3.55 },
        { transform: `translateY(${paperHandoff.y}px) rotateX(0deg) scale(${paperHandoff.scale})` }
      ];
      paperAnimation = animate(card, paperFrames, { duration: 3550, easing: 'cubic-bezier(.22,1,.36,1)' });
      animate(insideShadow, [
        { opacity: .82 }, { opacity: .58, offset: .33 },
        { opacity: .18, offset: .72 }, { opacity: 0 }
      ], { duration: OPENING.hinge * 1000, delay: OPENING.left * 1000, easing: 'ease-out' });
      for (const light of lights) animate(light, [
        { opacity: 0 }, { opacity: .7, offset: .42 }, { opacity: 0 }
      ], { duration: OPENING.hinge * 1000, delay: OPENING.left * 1000, easing: 'ease-in-out' });
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
      cleanupViewport();
      resolveFinished();
    }
  };
}
