// Written every frame by the local car, sampled by the HUD on a slow rAF so the
// gauges update without re-rendering the whole React tree at 60fps.
export const hud = {
  speed: 0,
  lap: 0,
  totalLaps: 3,
  finished: false,
};

export function resetHud() {
  hud.speed = 0;
  hud.lap = 0;
  hud.finished = false;
}
