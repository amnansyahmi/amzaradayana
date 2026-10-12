import test from 'node:test';
import assert from 'node:assert/strict';
import { animateCardOpening } from '../card-opening.mjs';
import { hingeGeometry } from '../card-webgl.mjs';
import { Vector3, Matrix4 } from 'three';

function element() {
  const names = new Set(), animations = [];
  return { animations, classList: {
    add: (...values) => values.forEach(value => names.add(value)),
    remove: (...values) => values.forEach(value => names.delete(value)),
    toggle: (value, force) => force ? names.add(value) : names.delete(value),
    contains: value => names.has(value)
  }, animate(frames, options) {
    let resolve, reject;
    const finished = new Promise((a, b) => { resolve = a; reject = b; });
    const animation = { frames, options, finished, resolve, cancel() { reject(new Error('cancelled')); } };
    animations.push(animation); return animation;
  } };
}

function fixture(reducedMotion = false) {
  let finishes = 0;
  const cover = element(), left = element(), right = element();
  const controller = animateCardOpening({ cover, left, right, card: element(), seal: element(),
    insideShadow: element(), lights: [element(), element()], reducedMotion,
    onReveal() {}, onFinish() { finishes++; } });
  return { cover, left, right, controller, finishes: () => finishes };
}

test('card remains mounted until the reveal animation actually completes', async () => {
  const state = fixture();
  assert.equal(state.finishes(), 0);
  assert.equal(state.left.animations.length, 1);
  assert.equal(state.right.animations.length, 1);
  state.left.animations[0].resolve(); state.right.animations[0].resolve();
  await Promise.resolve(); assert.equal(state.finishes(), 0);
  state.cover.animations.at(-1).resolve();
  await state.controller.finished;
  assert.equal(state.finishes(), 1);
  state.controller.cancel();
});

test('reduced motion gives a visible response without rotating panels', async () => {
  const state = fixture(true);
  assert.equal(state.left.animations.length, 0);
  assert.equal(state.right.animations.length, 0);
  assert.equal(state.finishes(), 0);
  state.cover.animations.at(-1).resolve(); await state.controller.finished;
  assert.equal(state.finishes(), 1); state.controller.cancel();
});

test('cancelling an opening cannot reveal the invitation later', async () => {
  const state = fixture();
  state.controller.cancel();
  state.cover.animations.at(-1).resolve();
  await state.controller.finished; await Promise.resolve();
  assert.equal(state.finishes(), 0);
  assert.equal(state.cover.classList.contains('is-opening'), false);
});

test('the Three.js doors share a closed seam and keep their outside hinge fixed', () => {
  for (const side of ['left', 'right']) {
    const layout = hingeGeometry(side);
    // The centre seam is the inside edge of each leaf in its hinge's local space.
    assert.equal(layout.pivot + layout.centre * 2, 0);
    const hinge = new Vector3(layout.pivot, 0, 0);
    for (const angle of [0, layout.angle / 2, layout.angle]) {
      const matrix = new Matrix4().makeTranslation(layout.pivot, 0, 0)
        .multiply(new Matrix4().makeRotationY(angle));
      assert.ok(new Vector3(0, 0, 0).applyMatrix4(matrix).distanceTo(hinge) < 1e-10);
    }
  }
});
