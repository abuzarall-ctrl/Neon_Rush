// Vehicle roster. Stats are normalized 1..10 for the UI bars and converted into
// real physics constants in game/physics.js so the cards and the handling agree.

export const VEHICLES = [
  {
    id: "comet",
    name: "Comet",
    tag: "Balanced",
    color: "#19e3ff",
    accent: "#9af6ff",
    stats: { speed: 7, accel: 7, grip: 7 },
    blurb: "No weaknesses. The one you pick when you want to win, not show off.",
  },
  {
    id: "vapor",
    name: "Vapor",
    tag: "Top speed",
    color: "#ff2e97",
    accent: "#ff9ed1",
    stats: { speed: 10, accel: 5, grip: 5 },
    blurb: "Slow to wind up, terrifying once it does. Long straights are home.",
  },
  {
    id: "hornet",
    name: "Hornet",
    tag: "Cornering",
    color: "#b6ff3c",
    accent: "#e2ffa6",
    stats: { speed: 6, accel: 8, grip: 9 },
    blurb: "Sticks to the apex like it owes it money. Out-turns everything.",
  },
  {
    id: "bolt",
    name: "Bolt",
    tag: "Acceleration",
    color: "#ffb627",
    accent: "#ffd98a",
    stats: { speed: 7, accel: 10, grip: 6 },
    blurb: "First off the line, first out of every hairpin. Punishes mistakes.",
  },
  {
    id: "phantom",
    name: "Phantom",
    tag: "Stealth",
    color: "#9d4edd",
    accent: "#c77dff",
    stats: { speed: 8, accel: 6, grip: 8 },
    blurb: "Sleek and mysterious. Glides through corners with supernatural grace.",
  },
  {
    id: "inferno",
    name: "Inferno",
    tag: "Extreme Power",
    color: "#ff6b35",
    accent: "#ff8c42",
    stats: { speed: 9, accel: 9, grip: 7 },
    blurb: "Pure raw power. Feels like you're riding a rocket with wheels.",
  },
  {
    id: "glacier",
    name: "Glacier",
    tag: "Precision",
    color: "#00d9ff",
    accent: "#48e6d9",
    stats: { speed: 6, accel: 7, grip: 10 },
    blurb: "Ice-cold handling. Never loses grip. The perfect control car.",
  },
  {
    id: "vortex",
    name: "Vortex",
    tag: "All-rounder",
    color: "#06ffa5",
    accent: "#58ff5c",
    stats: { speed: 7, accel: 7, grip: 8 },
    blurb: "The dark horse. Adaptive handling that feels natural at any speed.",
  },
];

export const VEHICLE_MAP = Object.fromEntries(VEHICLES.map((v) => [v.id, v]));

export function getVehicle(id) {
  return VEHICLE_MAP[id] || VEHICLES[0];
}
