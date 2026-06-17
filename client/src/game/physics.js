import { getVehicle } from "./vehicles.js";

// Translate the 1..10 card stats into real handling constants so the garage
// numbers actually mean something on track. Units are roughly metres/second.
export function vehiclePhysics(id) {
  const { stats } = getVehicle(id);
  return {
    maxSpeed: 28 + stats.speed * 2.6, // top speed
    accel: 16 + stats.accel * 3.4, // throttle force
    brakeForce: 30 + stats.accel * 1.5,
    reverseMax: 12,
    turn: 1.5 + stats.grip * 0.14, // rad/s of steering authority
    coastDrag: 6, // rolling resistance when off throttle
    offRoadCap: 0.42, // fraction of top speed allowed in the grass
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
