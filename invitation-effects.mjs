import * as THREE from 'three';
import { gsap } from 'gsap';
import { createRingPair } from './ring-geometry.mjs';
import { createFrameBudget, enableLiteMotion, isLiteDevice } from './mobile-motion.mjs';
export { createVenueEffects } from './venue-effects.mjs';

export function revealNames(names) {
  const composition = names.closest('.couple-composition');
  const words = names.querySelectorAll(':scope > span');
  composition.classList.remove('names-awaiting');
  const strokes = names.querySelectorAll('.ink-stroke');
  const windows = names.querySelectorAll('.ink-glint-window');
  const ampersand = names.querySelector('.name-ampersand');
  composition.classList.add('ink-active');
  gsap.set(words, { opacity: 1, clearProps: 'transform' });
  gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(windows, { attr: { x: -400 } });
  const animation = gsap.timeline();
  strokes.forEach((stroke, index) => {
    const start = index * 1.5;
    animation.to(stroke, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, start);
    animation.to(windows[index], { attr: { x: 3200 }, duration: .65, ease: 'sine.inOut' }, start + 1.25);
  });
  animation.fromTo(ampersand, { opacity: 0 }, { opacity: 1, duration: .3 }, 1.2);
  return { cancel() {
    animation.kill(); gsap.set(words, { clearProps: 'opacity,transform' });
    gsap.set(strokes, { clearProps: 'strokeDasharray,strokeDashoffset' });
    composition.classList.remove('ink-active');
    composition.classList.remove('names-awaiting');
  } };
}

function goldMatcap() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gold = ctx.createRadialGradient(38, 27, 2, 64, 64, 79);
  gold.addColorStop(0, '#fff9e5'); gold.addColorStop(.24, '#ead9ad');
  gold.addColorStop(.46, '#ae8e54'); gold.addColorStop(.68, '#e1c995'); gold.addColorStop(1, '#76633d');
  ctx.fillStyle = gold; ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#fffaed'; ctx.lineWidth = 11; ctx.globalAlpha = .7;
  ctx.beginPath(); ctx.ellipse(55, 55, 34, 43, -.5, Math.PI, Math.PI * 1.75); ctx.stroke();
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function reflectionMap() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 25);
  glow.addColorStop(0, '#fff'); glow.addColorStop(.16, '#fff9'); glow.addColorStop(1, '#fff0');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = '#fffc'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(32, 8); ctx.lineTo(32, 56); ctx.moveTo(8, 32); ctx.lineTo(56, 32); ctx.stroke();
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}

export function mountRings(host, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  let lite = isLiteDevice() || document.body.classList.contains('effects-lite');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 20); camera.position.z = 4.65;
  const map = goldMatcap();
  const gold = new THREE.MeshMatcapMaterial({ matcap: map });
  const stone = new THREE.MeshPhongMaterial({ color: '#e5edf0', specular: '#ffffff', shininess: 140, flatShading: true });
  const pair = createRingPair(gold, stone); scene.add(pair);
  const reflection = reflectionMap();
  const diamondReflection = new THREE.SpriteMaterial({ map: reflection, color: '#d6c495', transparent: true, opacity: 0, depthWrite: false });
  const bandReflection = diamondReflection.clone();
  const sparkle = new THREE.Sprite(diamondReflection); sparkle.scale.set(.38, .38, 1);
  pair.getObjectByName('diamond').add(sparkle);
  const bandGlint = new THREE.Sprite(bandReflection); bandGlint.position.set(-.18, .75, .09); bandGlint.scale.set(.26, .26, 1);
  pair.getObjectByName('plain-ring').add(bandGlint);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const light = new THREE.DirectionalLight(0xffffff, 1.8); light.position.set(-3, 4, 4); scene.add(light);
  let visible = true, disposed = false, frame = 0;
  let intro, glint, previousProgress, lastGlint = -Infinity;
  const canRender = () => !disposed && visible && !document.hidden;
  const render = () => {
    if (!canRender() || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (canRender()) { budget.sample(performance.now()); renderer.render(scene, camera); }
    });
  };
  const turn = gsap.quickTo(pair.rotation, 'y', { duration: .5, ease: 'power2.out', onUpdate: render });
  const onScroll = () => {
    if (!canRender() || reducedMotion) return;
    const bounds = host.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / window.innerHeight));
    if (!intro?.isActive()) turn(.08 + progress * .42);
    const crossed = previousProgress !== undefined && [-.12, .18].some(point =>
      (previousProgress < point && progress >= point) || (previousProgress > point && progress <= point));
    previousProgress = progress;
    if (crossed && !lite && performance.now() - lastGlint > 1800) {
      lastGlint = performance.now(); glint?.kill();
      glint = gsap.timeline({ onUpdate: render });
      glint.fromTo(diamondReflection, { opacity: 0 }, { opacity: .85, duration: .18, ease: 'sine.out' });
      glint.to(diamondReflection, { opacity: 0, duration: .42, ease: 'sine.in' });
      glint.fromTo(bandReflection, { opacity: 0 }, { opacity: .45, duration: .16 }, .08);
      glint.to(bandReflection, { opacity: 0, duration: .32 }, .24);
    }
  };
  const resize = () => {
    if (disposed) return;
    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height);
    camera.aspect = bounds.width / bounds.height; camera.updateProjectionMatrix();
    render();
  };
  const visibility = () => {
    budget.reset();
    if (!canRender()) { turn.tween.pause(); intro?.pause(); glint?.pause(); }
    else { intro?.resume(); glint?.resume(); onScroll(); render(); }
  };
  const quality = () => {
    lite = true; glint?.kill(); diamondReflection.opacity = bandReflection.opacity = 0;
    renderer.setPixelRatio(1); resize();
  };
  const budget = createFrameBudget(() => { quality(); enableLiteMotion(); }, lite);
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; visibility();
  }, { threshold: .01 }) : null;
  observer?.observe(host);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('invitation-quality-change', quality);
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); dispose(); });
  host.append(renderer.domElement); host.classList.add('ring-webgl-ready');
  resize();
  if (!reducedMotion) {
    intro = gsap.fromTo(pair.rotation, { y: -.22 }, { y: .08, duration: 1.25, ease: 'sine.out', onUpdate: render,
      onComplete: () => { intro = null; onScroll(); } });
  }
  function dispose() {
    if (disposed) return;
    disposed = true; turn.tween.kill(); intro?.kill(); glint?.kill();
    observer?.disconnect(); cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('invitation-quality-change', quality);
    const geometry = new Set(); pair.traverse(object => { if (object.geometry) geometry.add(object.geometry); });
    geometry.forEach(item => item.dispose()); gold.dispose(); stone.dispose(); map.dispose();
    diamondReflection.dispose(); bandReflection.dispose(); reflection.dispose();
    renderer.dispose(); renderer.domElement.remove(); host.classList.remove('ring-webgl-ready');
  }
  return { dispose, setReducedMotion(value) {
    reducedMotion = value;
    if (value) { turn.tween.pause(); intro?.kill(); glint?.kill(); diamondReflection.opacity = bandReflection.opacity = 0; pair.rotation.y = .08; render(); }
    else onScroll();
  } };
}
