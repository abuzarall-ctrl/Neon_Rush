import { io } from "socket.io-client";
import { useStore } from "../game/store.js";

// In dev the UI runs on Vite (:5173) and talks to the standalone server (:3001).
// In production both are served from the same origin.
const SERVER_URL = import.meta.env.DEV ? "http://localhost:3001" : window.location.origin;

export const socket = io(SERVER_URL, { autoConnect: true, transports: ["websocket", "polling"] });

// Live transforms for remote cars. Kept OUT of React state on purpose: these
// update ~20x/sec and are read directly inside the render loop (useFrame) to
// avoid thrashing the component tree.
export const peerStates = new Map(); // id -> { x, z, heading, speed, t }

function wire() {
  const s = useStore.getState();

  socket.on("connect", () => useStore.setState({ connected: true }));
  socket.on("disconnect", () => useStore.setState({ connected: false }));

  socket.on("room:update", (room) => {
    useStore.setState({ room });
    const { screen } = useStore.getState();
    // Server moved the room into a race while we sit in the lobby (host started).
    if (room.status === "countdown" && screen === "lobby") {
      useStore.setState({ screen: "race" });
    }
    if (room.status === "lobby" && screen === "results") {
      // Host triggered a rematch.
      useStore.getState().resetRace();
      useStore.setState({ screen: "lobby" });
    }
  });

  socket.on("race:countdown", ({ seconds, startAt }) => {
    useStore.setState({ countdown: seconds, startAt, screen: "race" });
  });

  socket.on("race:go", ({ startTime }) => {
    useStore.setState({ countdown: 0, raceStartTime: performance.now(), serverStart: startTime });
  });

  socket.on("peer:transform", ({ id, ...t }) => {
    peerStates.set(id, { ...t, recvAt: performance.now() });
  });

  socket.on("peer:left", ({ id }) => {
    peerStates.delete(id);
  });

  socket.on("peer:finished", () => {
    // Standings come through room:update; nothing extra needed here.
  });

  socket.on("race:over", ({ standings }) => {
    useStore.setState({ standings });
    // Give the local racer a beat to cross before flipping to results.
    setTimeout(() => useStore.setState({ screen: "results" }), 600);
  });

  void s;
}
wire();

// ---- Emitters ----
export function createRoom(name, vehicle) {
  return new Promise((resolve) => {
    socket.emit("room:create", { name, vehicle }, (res) => resolve(res));
  });
}

export function joinRoom(code, name, vehicle) {
  return new Promise((resolve) => {
    socket.emit("room:join", { code: code.toUpperCase(), name, vehicle }, (res) => resolve(res));
  });
}

export const chooseVehicle = (vehicle) => socket.emit("player:vehicle", { vehicle });
export const setReady = (ready) => socket.emit("player:ready", { ready });
export const startRace = () => socket.emit("race:start");
export const requestRematch = () => socket.emit("room:rematch");
export const leaveRoomNet = () => {
  socket.emit("room:leave");
  peerStates.clear();
};
export const resetRaceNet = () => {
  peerStates.clear();
};

export function sendTransform(t) {
  socket.emit("player:transform", t);
}

export function sendFinish(time) {
  socket.emit("player:finish", { time });
}
