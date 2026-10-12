import { gsap } from 'gsap';

let illustrations;
function loadIllustrations() {
  if (!illustrations) illustrations = fetch(new URL('./assets/venues.svg', document.baseURI))
    .then(response => { if (!response.ok) throw new Error('Venue artwork unavailable'); return response.text(); })
    .then(source => {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml');
      return new Map([...svg.querySelectorAll('symbol')].map(symbol => [symbol.id, symbol]));
    }).catch(() => null);
  return illustrations;
}

export function createVenueEffects(panel) {
  const svg = panel.querySelector('.venue-illustration');
  const lines = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  lines.classList.add('venue-lines'); svg.append(lines);
  const details = panel.querySelectorAll('.event-host,h3,.event-date,.event-time,.event-location');
  let version = 0, disposed = false, animation, visible = true;
  const stop = () => {
    animation?.kill(); animation = null;
    gsap.set(details, { clearProps: 'opacity,transform' });
    gsap.set(lines.querySelectorAll('path,circle'), { clearProps: 'strokeDasharray,strokeDashoffset' });
  };
  const visibility = () => {
    if (document.hidden || !visible) animation?.pause();
    else animation?.resume();
  };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; visibility();
  }, { threshold: .01 }) : null;
  observer?.observe(panel);
  document.addEventListener('visibilitychange', visibility);
  return { async show(icon, { animate = true, reducedMotion = false } = {}) {
    const request = ++version;
    stop(); svg.classList.remove('venue-svg-ready');
    const drawings = await loadIllustrations();
    if (disposed || request !== version || !drawings?.has(icon)) return;
    lines.replaceChildren(...[...drawings.get(icon).children].map(child => child.cloneNode(true)));
    svg.classList.add('venue-svg-ready');
    if (!animate || reducedMotion) return;
    const strokes = [...lines.querySelectorAll('path,circle')].filter(path => typeof path.getTotalLength === 'function');
    animation = gsap.timeline();
    for (const [index, path] of strokes.entries()) {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      animation.to(path, { strokeDashoffset: 0, duration: .85, ease: 'power2.out',
        onComplete: () => gsap.set(path, { clearProps: 'strokeDasharray,strokeDashoffset' }) }, index * .08);
    }
    animation.fromTo(details, { opacity: .25, y: 6 }, {
      opacity: 1, y: 0, duration: .4, stagger: .06, ease: 'power2.out', clearProps: 'opacity,transform'
    }, .15);
    visibility();
  }, setReducedMotion(value) { if (value) { ++version; stop(); } }, dispose() {
    disposed = true; ++version; stop(); observer?.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    svg.classList.remove('venue-svg-ready'); lines.remove();
  } };
}
