import * as THREE from 'three';
import { gsap } from 'gsap';

const W = 2.8, H = W * 54 / 39;

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

function coverTexture(branch) {
  const [image, ctx] = canvas(768, 1064);
  ctx.fillStyle = '#132d46'; ctx.fillRect(0, 0, 768, 1064);
  ctx.strokeStyle = '#c3a36b'; ctx.lineWidth = 1.5;
  ctx.strokeRect(25, 25, 718, 1014); ctx.globalAlpha = .4;
  ctx.strokeRect(35, 35, 698, 994); ctx.globalAlpha = .75;
  ctx.drawImage(branch, -108, 485, 414, 647);
  ctx.save(); ctx.translate(768, 0); ctx.scale(-1, 1);
  ctx.drawImage(branch, -108, 485, 414, 647); ctx.restore(); ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f4e7c9';
  ctx.font = '42px "Cormorant Garamond"'; ctx.fillText('Walimatulurus', 384, 135);
  ctx.font = '162px "Great Vibes"'; ctx.fillText('Amzar', 384, 315); ctx.fillText('Dayana', 384, 690);
  ctx.font = '25px Manrope'; ctx.fillStyle = '#e5d7b9';
  ctx.fillText('Dengan sukacitanya menjemput', 384, 945); ctx.fillText('anda seisi keluarga', 384, 987);
  return image;
}

function paperTexture(branch, inside = false) {
  const [image, ctx] = canvas(768, 1064);
  ctx.fillStyle = inside ? '#fcfaf4' : '#f3eee1'; ctx.fillRect(0, 0, 768, 1064);
  ctx.strokeStyle = '#d8cbb0'; ctx.lineWidth = 1.8; ctx.strokeRect(25, 25, 718, 1014);
  if (inside) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#20364a';
    ctx.font = '38px "Cormorant Garamond"'; ctx.fillText('Dengan penuh kesyukuran', 384, 215);
    ctx.font = '135px "Great Vibes"'; ctx.fillText('Amzar', 384, 410); ctx.fillText('Dayana', 384, 655);
    ctx.font = '60px "Cormorant Garamond"'; ctx.fillStyle = '#806232'; ctx.fillText('&', 384, 528);
    ctx.fillStyle = '#20364a'; ctx.font = '38px "Cormorant Garamond"';
    ctx.fillText('menjemput anda meraikan', 384, 810); ctx.fillText('hari istimewa kami.', 384, 866);
  } else {
    ctx.globalAlpha = .4; ctx.drawImage(branch, -15, 370, 430, 675);
  }
  return texture(image);
}

function halfTexture(image, side) {
  const [half, ctx] = canvas(384, 1064);
  ctx.drawImage(image, side === 'left' ? 0 : 384, 0, 384, 1064, 0, 0, 384, 1064);
  return texture(half);
}

async function loadBranch() {
  const image = new Image();
  image.src = new URL('./assets/botanical.svg', document.baseURI).href;
  await image.decode();
  return image;
}

export async function prepareWebGLCard(cover, card) {
  // CanvasTexture captures the intended typography only after the webfonts load.
  await Promise.all([
    document.fonts.load('76px "Great Vibes"'), document.fonts.load('20px "Cormorant Garamond"'),
    document.fonts.load('13px Manrope')
  ]);
  const branch = await loadBranch();
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
  scene.add(new THREE.AmbientLight(0xffffff, 2.4));
  const light = new THREE.DirectionalLight(0xfff5de, 2.6);
  light.position.set(-3, 5, 8); light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .1, far: 20 });
  light.shadow.bias = -.001; scene.add(light);
  const front = coverTexture(branch);
  const paper = paperTexture(branch);
  const basePaper = paperTexture(branch, true);
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
      cover.append(renderer.domElement); cover.classList.add('webgl-active', 'is-opening');
      const small = window.matchMedia('(max-width: 600px)').matches;
      timeline = gsap.timeline({ onUpdate: () => renderer.render(scene, camera), onComplete: () => { onFinish(); dispose(); } });
      timeline.to(seal.position, { z: .5, y: .25, duration: .48, ease: 'power2.in' }, 0);
      timeline.to(seal.scale, { x: 0, y: 0, z: 0, duration: .32, ease: 'power2.in' }, .2);
      timeline.to(leaves.left.rotation, { y: hingeGeometry('left').angle, duration: 2.15, ease: 'power2.inOut' }, .26);
      timeline.to(leaves.right.rotation, { y: hingeGeometry('right').angle, duration: 2.15, ease: 'power2.inOut' }, .40);
      timeline.to(root.rotation, { x: .10, duration: .9, ease: 'power1.inOut' }, .25);
      timeline.to(root.rotation, { x: 0, duration: .9, ease: 'power1.inOut' }, 1.4);
      timeline.to(root.scale, { x: small ? .68 : .8, y: small ? .68 : .8, z: small ? .68 : .8, duration: 2.4, ease: 'power1.inOut' }, .15);
      timeline.call(onReveal, [], 2.9);
      timeline.to(cover, { opacity: 0, duration: .65, ease: 'power1.inOut' }, 2.9);
      return { cancel() { timeline.kill(); gsap.set(cover, { clearProps: 'opacity' }); dispose(); } };
    }
  };
}
