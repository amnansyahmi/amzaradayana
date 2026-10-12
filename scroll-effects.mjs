import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// Safari toolbar height changes should not reset scroll-scrubbed decoration.
ScrollTrigger.config({ ignoreMobileResize: true });

export function mountScrollEffects(shell, { reducedMotion = false, onVenueEnter } = {}) {
  let context, disposed = false, suspended = [];
  const rebuild = () => {
    context?.revert(); context = null;
    if (disposed || reducedMotion || document.body.classList.contains('effects-lite')) return;
    context = gsap.context(() => {
      const greeting = shell.querySelector('.greeting');
      for (const [index, selector] of ['.floral-layer-back','.floral-layer-front','.floral-layer-details'].entries()) {
        gsap.fromTo(greeting.querySelectorAll(selector), { y: -(3 + index * 4) }, {
          y: 3 + index * 4, ease: 'none',
          scrollTrigger: { trigger: greeting, start: 'top bottom', end: 'bottom top', scrub: .35 }
        });
      }
      for (const section of shell.querySelectorAll('.section-heading,.all-dates h2,.date-list li,.blessing')) {
        // Never conceal content already on screen, including direct #majlis links.
        if (section.getBoundingClientRect().top < window.innerHeight * .88) continue;
        gsap.fromTo(section, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .55,
          ease: 'power2.out', clearProps: 'opacity,transform',
          scrollTrigger: { trigger: section, start: 'top 88%', once: true }
        });
      }
      ScrollTrigger.create({ trigger: shell.querySelector('#event-panel'), start: 'top 88%', once: true,
        onEnter: onVenueEnter });
    }, shell);
    ScrollTrigger.refresh();
  };
  const focus = event => {
    const section = event.target.closest?.('.section-heading,.date-list li,.blessing');
    if (section) {
      gsap.killTweensOf(section); gsap.set(section, { clearProps: 'opacity,transform' });
    }
  };
  const visibility = () => {
    if (document.hidden) {
      suspended = context?.getTweens().filter(tween => tween.isActive()) ?? [];
      suspended.forEach(tween => tween.pause());
    } else {
      // Scrubbed layers seek to the current scroll position on return.
      suspended.forEach(tween => tween.resume()); suspended = [];
      ScrollTrigger.update();
    }
  };
  shell.addEventListener('focusin', focus);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('invitation-quality-change', rebuild);
  rebuild();
  return { refresh: () => ScrollTrigger.refresh(), setReducedMotion(value) { reducedMotion = value; rebuild(); },
    dispose() {
      disposed = true; context?.revert();
      shell.removeEventListener('focusin', focus); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('invitation-quality-change', rebuild);
    }
  };
}
