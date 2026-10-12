import test from 'node:test';
import assert from 'node:assert/strict';
import { isLiteDevice, createFrameBudget, mountEventSwipe, mountCoverViewport } from '../mobile-motion.mjs';

test('only deliberate horizontal touch swipes change events', () => {
  const listeners = new Map(), turns = [];
  const panel = { addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name) };
  let now = 0;
  const controller = mountEventSwipe(panel, direction => turns.push(direction), () => now);
  const event = (x, y, extra = {}) => ({ isPrimary: true, pointerType: 'touch', pointerId: 1,
    clientX: x, clientY: y, target: { closest: () => null }, ...extra });
  const gesture = (endX, endY, extra = {}) => {
    listeners.get('pointerdown')(event(100,100,extra)); now += 200;
    listeners.get('pointerup')(event(endX,endY,extra));
  };
  gesture(30,108); gesture(165,100); assert.deepEqual(turns,[1,-1]);
  gesture(95,210); gesture(120,100); gesture(20,180);
  gesture(20,100,{pointerType:'mouse'});
  gesture(20,100,{target:{closest:()=>({tagName:'BUTTON'})}});
  listeners.get('pointerdown')(event(100,100));
  listeners.get('pointerdown')(event(110,100,{pointerId:2,isPrimary:false}));
  listeners.get('pointerup')(event(20,100));
  listeners.get('pointerdown')(event(100,100)); listeners.get('pointercancel')();
  listeners.get('pointerup')(event(20,100));
  assert.deepEqual(turns,[1,-1]); controller.dispose(); assert.equal(listeners.size,0);
});

test('quality drops once for sustained slow frames, but not normal frames or tab suspension', () => {
  let drops = 0;
  const budget = createFrameBudget(() => drops++);
  let now = 1000;
  for (let i=0;i<30;i++) budget.sample(now+=16.7);
  assert.equal(drops,0);
  budget.reset(); now += 60000;
  for (let i=0;i<30;i++) budget.sample(now+=16.7);
  assert.equal(drops,0);
  budget.reset();
  for (let i=0;i<70;i++) budget.sample(now+=33.4);
  assert.equal(drops,1);
  assert.equal(isLiteDevice({connection:{saveData:true}}),true);
  assert.equal(isLiteDevice({hardwareConcurrency:4}),true);
  assert.equal(isLiteDevice({hardwareConcurrency:8,deviceMemory:8}),false);
  assert.equal(isLiteDevice({}),false);
});

test('Safari visual viewport changes are coalesced and all listeners can be removed', () => {
  const listeners = new Map(), viewportListeners = new Map(), properties = new Map();
  let callback, count = 0;
  const win = { innerHeight: 850, visualViewport: {height:700,
    addEventListener: (name,handler) => viewportListeners.set(name,handler),
    removeEventListener: name => viewportListeners.delete(name)},
    addEventListener: (name,handler) => listeners.set(name,handler),
    removeEventListener: name => listeners.delete(name),
    requestAnimationFrame: handler => { callback=handler; count++; return count; }, cancelAnimationFrame(){}
  };
  const controller = mountCoverViewport({style:{setProperty:(name,value)=>properties.set(name,value)}},win);
  assert.equal(properties.get('--cover-height'),'700px');
  win.visualViewport.height=790;
  viewportListeners.get('resize')(); listeners.get('resize')(); assert.equal(count,1);
  callback(); assert.equal(properties.get('--cover-height'),'790px');
  controller.dispose(); assert.equal(listeners.size,0); assert.equal(viewportListeners.size,0);
});
