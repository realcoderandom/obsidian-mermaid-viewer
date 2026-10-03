const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Camera, MAX_SCALE } = require('../../.test-build/camera.cjs');
const make = () => {
  const camera = new Camera({ width: 1200, height: 1800 });
  camera.resize({ width: 913.125, height: 617.625 });
  return camera;
};
test('fit contains a tall diagram with the expected padding', () => {
  const camera = make();
  assert(camera.x >= 32 && camera.y >= 32);
  assert(camera.bounds.height * camera.scale <= 617.625 - 64);
  assert.equal(camera.viewMode, 'fit');
});
test('initial view opens tall diagrams from the top at readable width', () => {
  const camera = make();
  camera.initialView();
  assert.equal(camera.viewMode, 'width');
  assert.equal(camera.y, 32);
});
test('zoom anchor remains fixed over 200 fractional steps and reversals', () => {
  const camera = make(),
    anchor = { x: 311.375, y: 211.0625 };
  const world = {
    x: (anchor.x - camera.x) / camera.scale,
    y: (anchor.y - camera.y) / camera.scale,
  };
  for (let i = 0; i < 200; i++) {
    camera.zoomTo(0.05 + (i % 100) * 0.078, anchor);
    assert(Math.abs(camera.x + world.x * camera.scale - anchor.x) < 1e-8);
    assert(Math.abs(camera.y + world.y * camera.scale - anchor.y) < 1e-8);
  }
});
test('pan remains in CSS pixels at every zoom level', () => {
  const camera = make();
  camera.zoomCenter(3);
  const { x, y } = camera;
  camera.pan(81.25, -43.75);
  assert.equal(camera.x - x, 81.25);
  assert.equal(camera.y - y, -43.75);
  assert.equal(camera.viewMode, 'manual');
});
test('scale limits and invalid input never corrupt the viewBox', () => {
  const camera = make();
  camera.zoomTo(100, { x: 0, y: 0 });
  assert.equal(camera.scale, MAX_SCALE);
  camera.zoomTo(-100, { x: 0, y: 0 });
  assert.equal(camera.scale, camera.minimumScale);
  const previous = camera.viewBox;
  camera.zoomTo(NaN, { x: 10, y: 10 });
  camera.pan(Infinity, 0);
  camera.resize({ width: 0, height: NaN });
  assert.equal(camera.viewBox, previous);
});
test('fit adapts on resize but manual framing is retained', () => {
  const camera = make(),
    scale = camera.scale;
  camera.resize({ width: 1200, height: 900 });
  assert(camera.scale > scale);
  camera.pan(13, 17);
  const before = { x: camera.x, y: camera.y, scale: camera.scale };
  camera.resize({ width: 600, height: 400 });
  assert.deepEqual({ x: camera.x, y: camera.y, scale: camera.scale }, before);
});
test('very large diagrams can be fully fitted below the ordinary zoom floor', () => {
  const camera = new Camera({ width: 100000, height: 200000 });
  camera.resize({ width: 400, height: 600 });
  assert(camera.scale < 0.05);
  camera.zoomTo(0.000001, { x: 200, y: 300 });
  assert.equal(camera.scale, camera.minimumScale);
});
test('invalid diagram bounds are rejected at the boundary', () => {
  assert.throws(() => new Camera({ width: -1, height: 5 }));
  assert.throws(() => new Camera({ width: Infinity, height: 5 }));
});
