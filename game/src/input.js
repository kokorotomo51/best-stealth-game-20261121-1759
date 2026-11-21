// input.js — keyboard and mouse state. One job: report what the player
// is doing right now (move direction, sneak, sprint, fresh key presses,
// mouse position and clicks) so main.js never touches DOM events.
export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    clicked: null, // {x, y} in canvas pixels, consumed by main.js
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!input.keys.has(key)) input.pressed.add(key);
    input.keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    input.keys.delete(key);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouseDown = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    const point = canvasPoint(event);
    input.mouseX = point.x;
    input.mouseY = point.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const point = canvasPoint(event);
    input.mouseX = point.x;
    input.mouseY = point.y;
    input.mouseDown = true;
    input.clicked = point;
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  input.moveVector = function moveVector() {
    let x = 0;
    let y = 0;
    if (input.keys.has('a') || input.keys.has('ArrowLeft')) x -= 1;
    if (input.keys.has('d') || input.keys.has('ArrowRight')) x += 1;
    if (input.keys.has('w') || input.keys.has('ArrowUp')) y -= 1;
    if (input.keys.has('s') || input.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  };

  input.isSneaking = function isSneaking() {
    return input.mouseDown || input.keys.has('c');
  };

  input.isSprinting = function isSprinting() {
    return input.keys.has('Shift');
  };

  input.wasPressed = function wasPressed(key) {
    return input.pressed.has(key);
  };

  input.endFrame = function endFrame() {
    input.pressed.clear();
    input.clicked = null;
  };

  input.pointIn = function pointIn(rect, point) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  };

  return input;
}
