import * as THREE from 'three';
import { gsap } from 'gsap';

const W = 2.8;

export function hingeGeometry(side) {
  return { pivot: side === 'left' ? -W / 2 : W / 2,
    centre: side === 'left' ? W / 4 : -W / 4,
    angle: THREE.MathUtils.degToRad(side === 'left' ? -154 : 154) };
}

function canvas(width, height) {
  const image = document.createElement('canvas');
  image.width = width; image.height = height;
  return [image, image.getContext('2d')];
}

function texture(image) {
  const map = new THREE.CanvasTexture(image);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 2;
  return map;
}

function coverTexture(branch, aspect) {
  const height = Math.round(768 * aspect), y = value => value * height / 1064;
  const [image, ctx] = canvas(768, height);
  ctx.fillStyle = '#132d46'; ctx.fillRect(0, 0, 768, height);
  ctx.strokeStyle = '#c3a36b'; ctx.lineWidth = 1.5;
  ctx.strokeRect(25, 25, 718, height - 50); ctx.globalAlpha = .4;
  ctx.strokeRect(35, 35, 698, height - 70); ctx.globalAlpha = .75;
  ctx.drawImage(branch, -108, height - 579, 414, 647);
  ctx.save(); ctx.translate(768, 0); ctx.scale(-1, 1);
  ctx.drawImage(branch, -108, height - 579, 414, 647); ctx.restore(); ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f4e7c9';
  ctx.font = '42px "Cormorant Garamond"'; ctx.fillText('Walimatulurus', 384, y(135));
  ctx.font = '145px "Great Vibes"'; ctx.fillText('Amzar', 384, y(315)); ctx.fillText('Dayana', 384, y(690));
  ctx.font = '25px Manrope'; ctx.fillStyle = '#e5d7b9';
  ctx.fillText('Dengan sukacitanya menjemput', 384, y(881)); ctx.fillText('anda seisi keluarga', 384, y(923));
  return image;
}

function paperTexture(branch, aspect, inside = false) {
  const height = Math.round(768 * aspect), y = value => value * height / 1064;
  const [image, ctx] = canvas(768, height);
  const wash = ctx.createLinearGradient(0, 0, 768, height);
  wash.addColorStop(0, inside ? '#f7f1e3' : '#f0e8d7');
  wash.addColorStop(.5, inside ? '#fcfaf4' : '#f6f1e6');
  wash.addColorStop(1, inside ? '#f6eedf' : '#eee3cd');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, 768, height);
  // Fine paper fibres are baked into the texture once, never per animation frame.
  ctx.fillStyle = '#9c8353';
  for (let row = 4; row < height; row += 7) {
    for (let col = 4; col < 768; col += 11) {
      ctx.globalAlpha = ((row * 13 + col * 7) % 5 + 1) * .009;
      ctx.fillRect(col, row, 1, 2);
    }
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#d8cbb0'; ctx.lineWidth = 1.8; ctx.strokeRect(25, 25, 718, height - 50);
  ctx.strokeStyle = '#c4a56e'; ctx.globalAlpha = .55; ctx.lineWidth = 1;
  ctx.strokeRect(38, 38, 692, height - 76); ctx.globalAlpha = 1;
  if (inside) {
    // Botanical corners frame the names, with clear space through the centre.
    ctx.globalAlpha = .9;
    ctx.drawImage(branch, -88, height - 740, 355, 680);
    ctx.save(); ctx.translate(768, height); ctx.rotate(Math.PI); ctx.globalAlpha = .8;
    ctx.drawImage(branch, -88, height - 740, 355, 680); ctx.restore(); ctx.globalAlpha = 1;
    // An engraved pair of rings replaces the empty area above the introduction.
    ctx.save(); ctx.translate(384, y(110)); ctx.strokeStyle = '#9b7a3e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-18, 0, 27, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(18, 0, 27, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-27, -27); ctx.lineTo(-34, -38); ctx.lineTo(-27, -46);
    ctx.lineTo(-9, -46); ctx.lineTo(-2, -38); ctx.lineTo(-9, -27); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-34, -38); ctx.lineTo(-2, -38); ctx.stroke(); ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#20364a';
    ctx.font = '38px "Cormorant Garamond"'; ctx.fillText('Dengan penuh kesyukuran', 384, y(215));
    ctx.font = '135px "Great Vibes"'; ctx.fillText('Amzar', 384, y(410)); ctx.fillText('Dayana', 384, y(655));
    ctx.font = '60px "Cormorant Garamond"'; ctx.fillStyle = '#806232'; ctx.fillText('&', 384, y(528));
    ctx.fillStyle = '#20364a'; ctx.font = '38px "Cormorant Garamond"';
    ctx.fillText('menjemput anda meraikan', 384, y(810)); ctx.fillText('hari istimewa kami.', 384, y(866));
    ctx.strokeStyle = '#b69558'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(250, y(956)); ctx.lineTo(358, y(956));
    ctx.moveTo(410, y(956)); ctx.lineTo(518, y(956)); ctx.stroke();
    ctx.save(); ctx.translate(384, y(956)); ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-7, -7, 14, 14); ctx.restore();
  } else {
    ctx.globalAlpha = .8; ctx.drawImage(branch, -15, height - 694, 430, 675);
  }
  return texture(image);
}

function halfTexture(image, side) {
  const [half, ctx] = canvas(384, image.height);
  ctx.drawImage(image, side === 'left' ? 0 : 384, 0, 384, image.height, 0, 0, 384, image.height);
  return texture(half);
}

async function loadBranch(file = 'botanical.svg') {
  const image = new Image();
  image.src = new URL(`./assets/${file}`, document.baseURI).href;
  await image.decode();
  return image;
}

export async function prepareWebGLCard(cover, card, shouldPrepare = () => true) {
  // CanvasTexture captures the intended typography only after the webfonts load.
  await Promise.all([
    document.fonts.load('76px "Great Vibes"'), document.fonts.load('20px "Cormorant Garamond"'),
    document.fonts.load('13px Manrope')
  ]);
  const [branch, floral] = await Promise.all([loadBranch(), loadBranch('floral-corner.svg')]);
  // A quick first tap may already be running the CSS fallback. Avoid shader
  // compilation during that animation, which would interrupt its frame pacing.
  if (!shouldPrepare()) return null;
  const initialBounds = card.getBoundingClientRect();
  const H = W * initialBounds.height / initialBounds.width, aspect = H / W;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'card-webgl';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  const root = new THREE.Group(); scene.add(root);
  // Keep the combined irradiance below the paper's diffuse clipping point.
  // The old intensities bleached the botanical textures to white on mobile.
  scene.add(new THREE.AmbientLight(0xffffff, 1.7));
  const light = new THREE.DirectionalLight(0xfffaf1, 1.1);
  light.position.set(-3, 5, 8); light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .1, far: 20 });
  light.shadow.bias = -.001; scene.add(light);
  const front = coverTexture(branch, aspect);
  const paper = paperTexture(floral, aspect);
  const basePaper = paperTexture(floral, aspect, true);
  const edge = new THREE.MeshStandardMaterial({ color: '#ccb992', roughness: .9 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, .016), [edge, edge, edge, edge,
    new THREE.MeshStandardMaterial({ map: basePaper, roughness: .92 }), edge]);
  base.receiveShadow = true; root.add(base);
  const leaves = {};
  for (const side of ['left', 'right']) {
    const layout = hingeGeometry(side);
    const hinge = new THREE.Group(); hinge.position.set(layout.pivot, 0, .024); root.add(hinge);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(W / 2, H, .014), [edge, edge, edge, edge,
      new THREE.MeshStandardMaterial({ map: halfTexture(front, side), roughness: .88 }),
      new THREE.MeshStandardMaterial({ map: paper, roughness: .92 })]);
    leaf.position.x = layout.centre; leaf.castShadow = true; leaf.receiveShadow = true;
    hinge.add(leaf); leaves[side] = hinge;
  }
  const [sealImage, ctx] = canvas(256, 256);
  ctx.fillStyle = '#d6b374'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#9a743d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(128, 128, 104, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#40290d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '70px "Cormorant Garamond"'; ctx.fillText('A&D', 128, 132);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(.30, .30, .035, 48), [
    new THREE.MeshStandardMaterial({ color: '#b59151', metalness: .3, roughness: .55 }),
    new THREE.MeshStandardMaterial({ map: texture(sealImage), metalness: .2, roughness: .6 }), edge
  ]);
  seal.rotation.x = Math.PI / 2; seal.position.z = .067; seal.castShadow = true; root.add(seal);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.ShadowMaterial({ opacity: .18 }));
  floor.position.z = -.045; floor.receiveShadow = true; scene.add(floor);
  let disposed = false;
  let timeline;
  let activeFinish;
  let paperScaleY = 1;
  const zoom = { scale: 1 };
  const applyScale = () => root.scale.set(zoom.scale, paperScaleY * zoom.scale, zoom.scale);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    const finish = activeFinish;
    dispose();
    finish?.();
  });
  const resize = () => {
    if (disposed) return;
    const bounds = cover.getBoundingClientRect(), paperBounds = card.getBoundingClientRect();
    if (!bounds.width || !bounds.height || !paperBounds.width) return;
    const units = W / paperBounds.width;
    paperScaleY = paperBounds.height * units / H;
    applyScale();
    camera.aspect = bounds.width / bounds.height;
    camera.position.z = bounds.height * units / (2 * Math.tan(THREE.MathUtils.degToRad(35 / 2)));
    camera.updateProjectionMatrix(); renderer.setSize(bounds.width, bounds.height);
    root.position.x = ((paperBounds.left + paperBounds.width / 2) - (bounds.left + bounds.width / 2)) * units;
    root.position.y = -((paperBounds.top + paperBounds.height / 2) - (bounds.top + bounds.height / 2)) * units;
    renderer.render(scene, camera);
  };
  // Preserve screen alignment through orientation changes; idle frames are not rendered.
  window.addEventListener('resize', resize);
  resize();
  function dispose() {
    if (disposed) return;
    disposed = true; timeline?.kill(); window.removeEventListener('resize', resize);
    const geometries = new Set(), materials = new Set(), maps = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => {
        materials.add(material); if (material.map) maps.add(material.map);
      });
    });
    geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); maps.forEach(item => item.dispose());
    renderer.dispose(); renderer.domElement.remove(); cover.classList.remove('webgl-active');
  }
  return {
    dispose,
    play({ onReveal, onFinish }) {
      if (disposed) throw new Error('Disposed card scene');
      activeFinish = onFinish;
      renderer.domElement.style.opacity = '0';
      cover.append(renderer.domElement); cover.classList.add('webgl-active', 'is-opening');
      const small = window.matchMedia('(max-width: 600px)').matches;
      timeline = gsap.timeline({ onUpdate: () => { applyScale(); renderer.render(scene, camera); }, onComplete: () => { onFinish(); dispose(); } });
      // Blend matching DOM/Canvas covers before either hinge starts rotating.
      timeline.to(renderer.domElement, { opacity: 1, duration: .22, ease: 'sine.inOut' }, 0);
      timeline.to(card, { opacity: 0, duration: .22, ease: 'sine.inOut' }, 0);
      timeline.to(seal.position, { z: .5, y: .25, duration: .48, ease: 'power2.in' }, 0);
      timeline.to(seal.scale, { x: 0, y: 0, z: 0, duration: .32, ease: 'power2.in' }, .2);
      timeline.to(leaves.left.rotation, { y: hingeGeometry('left').angle, duration: 2.15, ease: 'power2.inOut' }, .26);
      timeline.to(leaves.right.rotation, { y: hingeGeometry('right').angle, duration: 2.15, ease: 'power2.inOut' }, .40);
      timeline.to(root.rotation, { x: .10, duration: .9, ease: 'power1.inOut' }, .25);
      timeline.to(root.rotation, { x: 0, duration: .9, ease: 'power1.inOut' }, 1.4);
      timeline.to(zoom, { scale: small ? .68 : .8, duration: 2.4, ease: 'power1.inOut' }, .15);
      timeline.call(onReveal, [], 2.9);
      timeline.to(cover, { opacity: 0, duration: .65, ease: 'power1.inOut' }, 2.9);
      return { cancel() { timeline.kill(); gsap.set([cover, card], { clearProps: 'opacity' }); dispose(); } };
    }
  };
}
