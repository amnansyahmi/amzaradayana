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

test('the camera moves closer and aligns the printed name with the mobile heading', () => {
  for (const [width, height] of [[320,568],[390,700],[430,850]]) {
    const inputs = { cameraZ: 9, openedScale: .68, cardWidth: width,
      paperHeight: 2.8 * height / width, viewportHeight: height, nameCenterY: height * .43, nameFontSize: 76 };
    const plan = planHandoff(inputs);
    assert.ok(plan.cameraZ > 0 && plan.cameraZ < inputs.cameraZ);
    assert.ok(Number.isFinite(plan.paperY));
    const printedTextY = inputs.paperHeight * (.5 - 410 / 1064) * inputs.openedScale;
    const finalUnits = 2.8 / width * (plan.cameraZ / inputs.cameraZ);
    const actualScreenY = height / 2 - (plan.paperY + printedTextY) / finalUnits;
    assert.ok(Math.abs(actualScreenY - inputs.nameCenterY) < 1e-8);
  }
});
