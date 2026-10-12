import test from 'node:test';
import assert from 'node:assert/strict';
import { createAmbientMotion, createPaperTransition } from '../paper-motion.mjs';

function element() {
  const classes = new Set();
  const animations = [];
  return { classes, animations, classList: {
    toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
    remove(name) { classes.delete(name); }
  }, animate(frames, options) {
    const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; } };
    animations.push(animation);
    return animation;
  } };
}

test('ambient effects stop offscreen, in the background, and for reduced motion', () => {
  const cover = element(), greeting = element(), listeners = new Map();
  const doc = { hidden: false,
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name)
  };
  let observation, disconnected = false;
  class Observer {
    constructor(callback) { observation = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  }
  const state = { coverActive: true, reducedMotion: false };
  const controller = createAmbientMotion({ cover, greeting, document: doc, Observer, getState: () => state });
  assert.ok(cover.classes.has('ambient-running'));
  observation([{ isIntersecting: true }]);
  assert.equal(greeting.classes.has('ambient-running'), false);
  state.coverActive = false; controller.refresh();
  assert.ok(greeting.classes.has('ambient-running'));
  assert.equal(cover.classes.has('ambient-running'), false);
  observation([{ isIntersecting: false }]);
  assert.equal(greeting.classes.has('ambient-running'), false);
  observation([{ isIntersecting: true }]);
  doc.hidden = true; listeners.get('visibilitychange')();
  assert.equal(greeting.classes.has('ambient-running'), false);
  doc.hidden = false; state.reducedMotion = true; controller.refresh();
  assert.equal(greeting.classes.has('ambient-running'), false);
  state.reducedMotion = false; controller.refresh();
  assert.ok(greeting.classes.has('ambient-running'));
  controller.dispose();
  assert.ok(disconnected);
  assert.equal(listeners.size, 0);
  assert.equal(greeting.classes.has('ambient-running'), false);
});

test('rapid majlis changes replace the previous paper turn; reduced motion cancels it', () => {
  const panel = element(), light = element();
  panel.querySelector = () => light;
  const transition = createPaperTransition(panel);
  transition.play({ direction: 1 });
  assert.match(panel.animations[0].frames[0].transform, /rotateY\(4deg\)/);
  transition.play({ direction: -1 });
  assert.ok(panel.animations[0].cancelled);
  assert.ok(light.animations[0].cancelled);
  assert.match(panel.animations[1].frames[0].transform, /rotateY\(-4deg\)/);
  transition.play({ reducedMotion: true });
  assert.equal(panel.animations.length, 2);
  assert.ok(panel.animations[1].cancelled);
  assert.ok(light.animations[1].cancelled);
});
