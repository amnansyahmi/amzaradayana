import * as THREE from 'three';

// Small procedural geometry avoids model downloads and expensive diamond shaders.
export function createRingPair(gold, stone) {
  const pair = new THREE.Group();
  pair.name = 'wedding-rings';
  for (const [index, thickness] of [0.06, 0.038].entries()) {
    const ring = new THREE.Group();
    ring.name = index === 0 ? 'plain-ring' : 'diamond-ring';
    const band = new THREE.Mesh(new THREE.TorusGeometry(.78, thickness, 10, 64), gold);
    band.name = 'band'; ring.add(band);
    ring.position.x = index === 0 ? -.44 : .44;
    ring.rotation.set(index === 0 ? .30 : -.36, index === 0 ? -.22 : .24, index === 0 ? -.34 : .18);
    if (index === 1) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.145), stone);
      gem.name = 'diamond'; gem.position.set(0, .86, .025); gem.rotation.z = Math.PI / 4;
      ring.add(gem);
      const prongGeometry = new THREE.CylinderGeometry(.014, .014, .13, 5);
      for (const x of [-.09, .09]) for (const z of [-.06, .06]) {
        const prong = new THREE.Mesh(prongGeometry, gold);
        prong.position.set(x, .83, z); ring.add(prong);
      }
    }
    pair.add(ring);
  }
  return pair;
}
