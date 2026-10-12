let paperSequence = 0;

// The moving insert uses the same HTML, SVG and fonts as the final invitation.
// A private, inert copy keeps text sharp and avoids a canvas-to-DOM typography jump.
export function createOpeningPaper(cover, source) {
  const element = document.createElement('div');
  element.className = 'opening-paper-surface';
  element.setAttribute('aria-hidden', 'true');
  element.inert = true;
  const greeting = source.cloneNode(true);
  greeting.classList.remove('ambient-running');
  const prefix = `opening-${++paperSequence}-`;
  const ids = new Map();
  for (const node of [greeting, ...greeting.querySelectorAll('[id]')]) {
    if (node.id) { ids.set(node.id, prefix + node.id); node.id = prefix + node.id; }
  }
  for (const node of [greeting, ...greeting.querySelectorAll('*')]) {
    for (const attribute of [...node.attributes]) {
      let value = attribute.value.replace(/url\(#([^)]*)\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
      if (['href', 'xlink:href'].includes(attribute.name) && value.startsWith('#') && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
      if (['aria-labelledby', 'aria-describedby'].includes(attribute.name)) value = value.split(' ').map(id => ids.get(id) || id).join(' ');
      if (value !== attribute.value) node.setAttribute(attribute.name, value);
    }
    node.removeAttribute('tabindex');
  }
  element.append(greeting);
  const measure = () => {
    const bounds = source.getBoundingClientRect();
    element.style.width = `${bounds.width}px`;
    element.style.height = `${bounds.height}px`;
    greeting.style.width = `${bounds.width}px`;
    greeting.style.height = `${bounds.height}px`;
    return bounds;
  };
  measure();
  return { element, greeting, names: greeting.querySelector('.couple-names'), measure,
    dispose() { element.remove(); } };
}
