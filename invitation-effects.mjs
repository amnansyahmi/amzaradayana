import * as THREE from 'three';
import { gsap } from 'gsap';
import { createRingPair } from './ring-geometry.mjs';

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

export function mountRings(host, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 20); camera.position.z = 4.65;
  const map = goldMatcap();
  const gold = new THREE.MeshMatcapMaterial({ matcap: map });
  const stone = new THREE.MeshPhongMaterial({ color: '#e5edf0', specular: '#ffffff', shininess: 140, flatShading: true });
  const pair = createRingPair(gold, stone); scene.add(pair);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const light = new THREE.DirectionalLight(0xffffff, 1.8); light.position.set(-3, 4, 4); scene.add(light);
  // A small painted reflection follows scroll position; it has no idle loop.
  const glintCanvas = document.createElement('canvas'); glintCanvas.width = glintCanvas.height = 64;
  const glintContext = glintCanvas.getContext('2d');
  const glow = glintContext.createRadialGradient(32, 32, 0, 32, 32, 31);
  glow.addColorStop(0, '#fffdf0'); glow.addColorStop(.13, '#fff7d9dd');
  glow.addColorStop(.4, '#fff2c24d'); glow.addColorStop(1, '#fff2c200');
  glintContext.fillStyle = glow; glintContext.fillRect(0, 0, 64, 64);
  const glintMap = new THREE.CanvasTexture(glintCanvas);
  const glintMaterials = [new THREE.SpriteMaterial({ map: glintMap, transparent: true, opacity: 0, depthWrite: false }),
    new THREE.SpriteMaterial({ map: glintMap, transparent: true, opacity: 0, depthWrite: false })];
  glintMaterials.forEach((material, index) => {
    const reflection = new THREE.Sprite(material); reflection.scale.setScalar(index ? .18 : .12);
    reflection.position.set(index ? 0 : -.5, index ? .93 : .6, .13);
    pair.children[index].add(reflection);
  });
  const sheen = { progress: 0 };
  const applySheen = () => {
    glintMaterials[0].opacity = reducedMotion ? 0 : .55 * Math.exp(-Math.pow((sheen.progress + .18) * 6, 2));
    glintMaterials[1].opacity = reducedMotion ? 0 : .8 * Math.exp(-Math.pow((sheen.progress - .12) * 7, 2));
    light.position.x = -3 + sheen.progress * 3;
    render();
  };
  let visible = true, disposed = false, frame = 0;
  let intro;
  const canRender = () => !disposed && visible && !document.hidden;
  const render = () => {
    if (!canRender() || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (canRender()) renderer.render(scene, camera);
    });
  };
  const turn = gsap.quickTo(pair.rotation, 'y', { duration: .5, ease: 'power2.out', onUpdate: render });
  const shine = gsap.quickTo(sheen, 'progress', { duration: .55, ease: 'power2.out', onUpdate: applySheen });
  const onScroll = () => {
    if (!canRender() || reducedMotion) return;
    const bounds = host.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / window.innerHeight));
    turn(.08 + progress * .42); shine(progress);
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
    if (!canRender()) { turn.tween.pause(); shine.tween.pause(); intro?.pause(); }
    else { intro?.resume(); onScroll(); render(); }
  };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; visibility();
  }, { threshold: .01 }) : null;
  observer?.observe(host);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); dispose(); });
  host.append(renderer.domElement); host.classList.add('ring-webgl-ready');
  resize();
  if (!reducedMotion) {
    intro = gsap.fromTo(pair.rotation, { y: -.22 }, { y: .08, duration: 1.25, ease: 'sine.out', onUpdate: render });
  }
  function dispose() {
    if (disposed) return;
    disposed = true; turn.tween.kill(); shine.tween.kill(); intro?.kill();
    observer?.disconnect(); cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', visibility);
    const geometry = new Set(); pair.traverse(object => { if (object.geometry) geometry.add(object.geometry); });
    geometry.forEach(item => item.dispose()); gold.dispose(); stone.dispose(); map.dispose();
    glintMaterials.forEach(material => material.dispose()); glintMap.dispose();
    renderer.dispose(); renderer.domElement.remove(); host.classList.remove('ring-webgl-ready');
  }
  return { dispose, setReducedMotion(value) {
    reducedMotion = value;
    if (value) { turn.tween.pause(); shine.tween.pause(); intro?.kill(); pair.rotation.y = .08; applySheen(); }
    else onScroll();
  } };
}
