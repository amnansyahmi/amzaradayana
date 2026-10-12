import test from 'node:test';
import assert from 'node:assert/strict';
import { MeshBasicMaterial } from 'three';
import { createRingPair } from '../ring-geometry.mjs';
import { planHandoff } from '../opening-handoff.mjs';

test('the paired rings include one plain band and one small faceted diamond', () => {
  const gold = new MeshBasicMaterial(), stone = new MeshBasicMaterial();
  const pair = createRingPair(gold, stone);
  assert.equal(pair.children.length, 2);
  assert.equal(pair.getObjectByName('plain-ring').getObjectByName('diamond'), undefined);
  const diamond = pair.getObjectByName('diamond-ring').getObjectByName('diamond');
  assert.ok(diamond);
  assert.equal(diamond.geometry.getAttribute('position').count, 24);
  let triangles = 0;
  const geometries = new Set();
  pair.traverse(object => {
    if (!object.geometry) return;
    geometries.add(object.geometry);
    triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
  });
  assert.ok(triangles < 3000, `Mobile geometry budget exceeded: ${triangles}`);
  geometries.forEach(geometry => geometry.dispose()); gold.dispose(); stone.dispose();
});

test('the final paper plane matches every edge of the live greeting across viewport sizes', () => {
  for (const [width, height, targetWidth, targetHeight] of [[320,568,290,780],[390,844,360,790],[430,932,400,790],[1440,900,710,850],[844,390,710,900]]) {
    const inputs = { cameraZ: 9, openedScale: width <= 600 ? .68 : .8,
      cardWidth: width, cardHeight: height, viewportWidth: width, viewportHeight: height,
      targetLeft: (width - targetWidth) / 2, targetTop: 1, targetWidth, targetHeight };
    const plan = planHandoff(inputs);
    assert.ok(plan.cameraZ > 0 && Number.isFinite(plan.cameraZ));
    const units = 2.8 / width * (plan.cameraZ / inputs.cameraZ);
    const actualWidth = 2.8 * inputs.openedScale / units;
    const actualHeight = 2.8 * height / width * inputs.openedScale * plan.aspectScale / units;
    const left = width / 2 + plan.paperX / units - actualWidth / 2;
    const top = height / 2 - plan.paperY / units - actualHeight / 2;
    for (const [actual, expected] of [[actualWidth,targetWidth],[actualHeight,targetHeight],[left,inputs.targetLeft],[top,inputs.targetTop]]) {
      assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} should match ${expected}`);
    }
  }
});
