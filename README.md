# 🏁 Neon Rush — Real-Time Multiplayer Racing

A high-energy 3D arcade racer. Spin up a room, share a 6-character code, and race
your friends in real time on a neon track.

- **Frontend:** React + Three.js (`@react-three/fiber`) + Tailwind CSS + Vite
- **Backend:** Node.js + Express + Socket.io (authoritative rooms, live position relay)
- **Networking:** create/join rooms by code, lobby with ready-up, synced countdown,
  20 Hz position sync, server-validated lap counting and finish order

## Project layout

```
racing-game/
├── server/                 # Node.js + Socket.io game server
│   ├── index.js            # socket events, room lifecycle, race flow
│   └── rooms.js            # in-memory room manager + 6-char codes
└── client/                 # React + Three.js client
    └── src/
        ├── screens/        # MainMenu, VehicleSelect, Lobby, Race, HUD, Results
        ├── game/           # Track + car physics, rendering, store, input
        └── net/socket.js   # socket.io-client + store wiring
```

## Run it (two terminals)

**1. Start the server**
```bash
cd server
npm install
npm start            # → http://localhost:3001
```

**2. Start the client**
```bash
cd client
npm install
npm run dev          # → http://localhost:5173
```

Open `http://localhost:5173` in two browser windows (or share over your LAN).
Create a race in one, copy the 6-char code, and join from the other. Ready up,
and the host hits **Start**.

> Solo testing works too — create a room, ready up, and start a one-car race to
> drive the track.

## Production build (single origin)

```bash
cd client && npm run build     # outputs client/dist
cd ../server && npm start      # Express serves client/dist + sockets on :3001
```

Then open `http://localhost:3001`.

## Controls

- **Accelerate:** W / ↑
- **Brake / reverse:** S / ↓
- **Steer:** A / D or ← / →
- On touch devices, on-screen buttons appear automatically.

## How the multiplayer works

The server owns room state (who's in, lobby/countdown/racing/finished, lap counts,
finish order). Each client simulates its own car and streams position to the
server ~20×/sec; the server relays those to the other players in the room. This
client-authoritative-position model is standard for arcade racers — it keeps
steering latency near zero while the server still validates progress and finish
order. To scale past a single process, swap the in-memory `RoomManager` for Redis.
