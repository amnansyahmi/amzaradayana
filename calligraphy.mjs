import { lettering } from './calligraphy-art.mjs';
const NS = 'http://www.w3.org/2000/svg';
const svgNode = (tag, attrs = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

export function mountCalligraphy(names) {
  for (const word of names.querySelectorAll(':scope > span:not(.name-ampersand)')) {
    const name = word.textContent.trim(), art = lettering[name];
    if (!art || word.querySelector('svg')) continue;
    word.classList.add('name-word');
    const text = document.createElement('span');
    text.className = 'name-fallback'; text.textContent = name;
    const svg = svgNode('svg', { viewBox: `-20 -850 ${art.width} 1150`, class: 'name-calligraphy',
      'aria-hidden': 'true', focusable: 'false' });
    svg.style.width = `${art.width / 1000}em`;
    const defs = svgNode('defs'); svg.append(defs);
    art.letters.forEach((letter, index) => {
      const id = `ink-${name.toLowerCase()}-${index}`;
      const mask = svgNode('mask', { id, maskUnits: 'userSpaceOnUse', x: -250, y: -400, width: 1450, height: 1300 });
      // Mask and outline use identical font coordinates, so crossings never reveal
      // the neighbouring letter early. The final fill is the original font outline.
      const guide = svgNode('path', { d: letter.guide, class: 'ink-stroke', fill: 'none', stroke: 'white',
        'stroke-width': letter.capital ? 130 : 110, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'data-capital': String(letter.capital) });
      mask.append(guide); defs.append(mask);
      const group = svgNode('g', { transform: `translate(${letter.x},0) scale(1,-1)` });
      const outline = svgNode('path', { d: letter.outline, fill: 'currentColor', class: 'ink-outline',
        style: `--ink-mask: url(#${id})` });
      group.append(outline); svg.append(group);
    });
    word.replaceChildren(text, svg);
  }
}

export function revealCalligraphy(names, { mirror, reducedMotion = false } = {}) {
  const headings = [names, mirror].filter(Boolean);
  const animations = [];
  let disposed = false;
  const finish = () => {
    if (disposed) return;
    disposed = true;
    document.removeEventListener('visibilitychange', visibility);
    for (const heading of headings) {
      heading.classList.remove('names-inking');
      heading.closest('.couple-composition')?.classList.remove('names-awaiting');
      heading.querySelectorAll('.ink-stroke').forEach(stroke => {
        stroke.style.removeProperty('stroke-dasharray'); stroke.style.removeProperty('stroke-dashoffset');
      });
    }
    animations.forEach(animation => animation.cancel());
  };
  const visibility = () => animations.forEach(animation => document.hidden ? animation.pause() : animation.play());
  if (reducedMotion || typeof names.animate !== 'function') { finish(); return { cancel: finish }; }
  try {
    headings.forEach(heading => {
      heading.classList.add('names-inking');
      heading.querySelectorAll('.name-calligraphy').forEach((word, wordIndex) => {
        let delay = wordIndex * 1050;
        word.querySelectorAll('.ink-stroke').forEach(stroke => {
          const length = stroke.getTotalLength();
          stroke.style.strokeDasharray = `${length} ${length}`;
          stroke.style.strokeDashoffset = String(length);
          const duration = stroke.dataset.capital === 'true' ? 650 : 225;
          const animation = stroke.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
            { duration, delay, fill: 'forwards', easing: 'cubic-bezier(.35,0,.3,1)' });
          animations.push(animation); delay += duration - 25;
        });
      });
      const ampersand = heading.querySelector('.name-ampersand');
      if (ampersand) animations.push(ampersand.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 450, delay: 750, fill: 'both', easing: 'ease-out' }));
      heading.closest('.couple-composition')?.classList.remove('names-awaiting');
    });
    document.addEventListener('visibilitychange', visibility);
    visibility();
    Promise.all(animations.map(animation => animation.finished)).then(finish, finish);
  } catch { finish(); }
  return { cancel: finish };
}
