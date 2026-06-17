import { create } from "zustand";

// One logical step "back" for each screen. Used by the in-game/back buttons so
// a click rewinds a single step instead of jumping all the way to the menu.
const BACK_MAP = {
  vehicle: "menu",
  design: "vehicle",
  lobby: "design",
  race: "lobby",
  "race-crash": "race",
  results: "lobby",
};

// Screen flow: menu -> vehicle -> lobby -> race -> results.
export const useStore = create((set) => ({
  screen: "menu",
  prevScreen: null,
  connected: false,
  error: null,
  crashDetected: false, // Add this line

  playerName: "",
  playerId: null,
  vehicle: "comet",
  carDesign: "gt", // chosen body style, see game/vehicles.js CAR_DESIGNS

  room: null, // { code, hostId, status, totalLaps, players: [...] }
  countdown: null, // 3,2,1 during the pre-race sequence
  startAt: null, // server timestamp the race clock begins
  raceStartTime: null, // local performance baseline once "go" fires
  myFinishTime: null,
  standings: [],

  setScreen: (screen) => set((state) => ({ prevScreen: state.screen, screen })),
  setPrevScreen: (prevScreen) => set({ prevScreen }),
  // Rewind exactly one step in the flow (falls back to the menu).
  goBack: () =>
    set((state) => ({ prevScreen: state.screen, screen: BACK_MAP[state.screen] || "menu" })),
  setError: (error) => set({ error }), // Add crashDetected to this block
  setConnected: (connected) => set({ connected }),
  setName: (playerName) => set({ playerName }),
  setVehicle: (vehicle) => set({ vehicle }),
  setCarDesign: (carDesign) => set({ carDesign }),
  setRoom: (room) => set({ room }),
  setPlayerId: (playerId) => set({ playerId }),
  setCrashDetected: (crashDetected) => set({ crashDetected }),
  // End of added block

  resetRace: () =>
    set({
      countdown: null,
      startAt: null,
      raceStartTime: null,
      myFinishTime: null,
      standings: [],
      crashDetected: false,
    }),

  leaveRoom: () =>
    set({
      screen: "menu",
      room: null,
      playerId: null,
      countdown: null,
      startAt: null,
      raceStartTime: null,
      myFinishTime: null,
      standings: [],
      error: null,
      crashDetected: false,
    }),
}));
