import { create } from "zustand";

// Screen flow: menu -> vehicle -> lobby -> race -> results.
export const useStore = create((set) => ({
  screen: "menu",
  prevScreen: null,
  connected: false,
  error: null,
  crashDetected: false,

  playerName: "",
  playerId: null,
  vehicle: "comet",

  room: null, // { code, hostId, status, totalLaps, players: [...] }
  countdown: null, // 3,2,1 during the pre-race sequence
  startAt: null, // server timestamp the race clock begins
  raceStartTime: null, // local performance baseline once "go" fires
  myFinishTime: null,
  standings: [],

  setScreen: (screen) => set((state) => ({ prevScreen: state.screen, screen })),
  setPrevScreen: (prevScreen) => set({ prevScreen }),
  setError: (error) => set({ error }),
  setConnected: (connected) => set({ connected }),
  setName: (playerName) => set({ playerName }),
  setVehicle: (vehicle) => set({ vehicle }),
  setRoom: (room) => set({ room }),
  setPlayerId: (playerId) => set({ playerId }),
  setCrashDetected: (crashDetected) => set({ crashDetected }),

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

