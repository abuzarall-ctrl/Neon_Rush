// Single shared input object read inside the render loop. Keyboard and on-screen
// touch controls both write here so the physics step doesn't care where input
// came from.
export const input = { up: false, down: false, left: false, right: false };

const KEY_MAP = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const PREVENT = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

export function attachKeyboard() {
  const down = (e) => {
    const k = KEY_MAP[e.code];
    if (k) input[k] = true;
    if (PREVENT.has(e.code)) e.preventDefault();
  };
  const up = (e) => {
    const k = KEY_MAP[e.code];
    if (k) input[k] = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
  };
}

export const setInput = (name, val) => {
  input[name] = val;
};

export const resetInput = () => {
  input.up = input.down = input.left = input.right = false;
};
