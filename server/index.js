// 1. Load Environment variables and Supabase setup at the VERY top
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const { RoomManager } = require("./rooms");

const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Initialize Supabase Database Connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const rooms = new RoomManager();

app.get("/health", (_req, res) => res.json({ ok: true, rooms: rooms.rooms.size }));

// Serve the built client in production (client/dist).
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(200).send("Racing server running. Build the client to serve the UI.");
  });
});

// Helper: broadcast the authoritative room state to everyone in it.
function pushRoom(room) {
  if (!room) return;
  io.to(room.code).emit("room:update", rooms.publicState(room));
}

// Check for and respawn powerups periodically
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.rooms.values()) {
    let changed = false;
    for (const p of room.powerups) {
      if (p.collected && p.respawnAt && now >= p.respawnAt) {
        p.collected = false;
        p.respawnAt = null;
        changed = true;
      }
    }
    if (changed) pushRoom(room);
  }
}, 1000);

function checkAllFinished(room) {
  const active = [...room.players.values()];
  if (active.length > 0 && active.every((p) => p.finished)) {
    room.status = "finished";
    pushRoom(room);
    io.to(room.code).emit("race:over", { standings: room.finishOrder });
  }
}

io.on("connection", (socket) => {
  // Track which room this socket belongs to for clean teardown.
  socket.data.code = null;

  socket.on("room:create", ({ name, vehicle, design }, cb) => {
    const room = rooms.createRoom({ id: socket.id, name, vehicle, design });
    socket.join(room.code);
    socket.data.code = room.code;
    cb?.({ ok: true, code: room.code, playerId: socket.id });
    pushRoom(room);
  });

  socket.on("room:join", ({ code, name, vehicle, design }, cb) => {
    const room = rooms.getRoom(code);
    if (!room) return cb?.({ ok: false, error: "No race found with that code." });
    if (room.status !== "lobby")
      return cb?.({ ok: false, error: "That race has already started." });
    if (room.players.size >= 8)
      return cb?.({ ok: false, error: "That race is full (8 racers max)." });

    rooms.addPlayer(room, { id: socket.id, name, vehicle, design });
    socket.join(room.code);
    socket.data.code = room.code;
    cb?.({ ok: true, code: room.code, playerId: socket.id });
    pushRoom(room);
  });

  socket.on("player:vehicle", ({ vehicle, design }) => {
    const room = rooms.getRoom(socket.data.code);
    const p = room?.players.get(socket.id);
    if (p) {
      if (vehicle) p.vehicle = vehicle;
      if (design) p.design = design;
      pushRoom(room);
    }
  });

  socket.on("player:ready", ({ ready }) => {
    const room = rooms.getRoom(socket.data.code);
    const p = room?.players.get(socket.id);
    if (p) {
      p.ready = !!ready;
      pushRoom(room);
    }
  });

  socket.on("race:start", () => {
    const room = rooms.getRoom(socket.data.code);
    if (!room || room.hostId !== socket.id || room.status !== "lobby") return;

    room.status = "countdown";
    for (const p of room.players.values()) {
      p.lap = 0;
      p.progress = 0;
      p.finished = false;
      p.finishTime = null;
      p.place = null;
    }
    room.finishOrder = [];
    pushRoom(room);

    io.to(room.code).emit("race:countdown", { seconds: 3, startAt: Date.now() + 3000 });
    setTimeout(() => {
      if (rooms.getRoom(room.code)?.status === "countdown") {
        room.status = "racing";
        pushRoom(room);
        io.to(room.code).emit("race:go", { startTime: Date.now() });
      }
    }, 3000);
  });

  socket.on("player:transform", (t) => {
    const room = rooms.getRoom(socket.data.code);
    if (!room || room.status !== "racing") return;
    const p = room.players.get(socket.id);
    if (!p || p.finished) return;
    if (typeof t.progress === "number") p.progress = t.progress;
    if (typeof t.lap === "number") p.lap = t.lap;
    socket.to(room.code).emit("peer:transform", { id: socket.id, ...t });
  });

  // --- CONNECTED TO SUPABASE HERE ---
  socket.on("player:finish", async ({ time, topSpeed }) => {
    const room = rooms.getRoom(socket.data.code);
    if (!room || room.status !== "racing") return;
    const p = room.players.get(socket.id);
    if (!p || p.finished) return;

    p.finished = true;
    p.finishTime = time;
    p.place = room.finishOrder.length + 1;
    
    room.finishOrder.push({
      id: p.id,
      name: p.name,
      vehicle: p.vehicle,
      time,
      place: p.place,
    });
    
    pushRoom(room);
    io.to(room.code).emit("peer:finished", { id: p.id, place: p.place, time });

    // Send the stats asynchronously to your live Supabase database
    const { error } = await supabase
      .from('leaderboard')
      .insert([
        { 
          username: p.name, 
          top_speed: topSpeed || 0, // Fallback to 0 if frontend doesn't track top speed yet
          race_time: time 
        }
      ]);

    if (error) {
      console.error('❌ Supabase Save Error:', error.message);
    } else {
      console.log(`✅ Successfully saved stats for ${p.name} to the cloud database!`);
    }

    checkAllFinished(room);
  });

  socket.on("player:collect_powerup", ({ id }) => {
    const room = rooms.getRoom(socket.data.code);
    if (!room || room.status !== "racing") return;
    const powerup = room.powerups.find((p) => p.id === id);
    const player = room.players.get(socket.id);

    if (powerup && !powerup.collected && player) {
      powerup.collected = true;
      powerup.respawnAt = Date.now() + 10000;
      io.to(room.code).emit("powerup:collected", { powerupId: id, playerId: socket.id });
      pushRoom(room);
    }
  });

  socket.on("room:rematch", () => {
    const room = rooms.getRoom(socket.data.code);
    if (!room || room.hostId !== socket.id) return;
    room.status = "lobby";
    room.finishOrder = [];
    for (const p of room.players.values()) {
      p.ready = false;
      p.lap = 0;
      p.progress = 0;
      p.finished = false;
      p.finishTime = null;
      p.place = null;
    }
    room.powerups = rooms.initPowerups();
    pushRoom(room);
  });

  socket.on("room:leave", () => leave());
  socket.on("disconnect", () => leave());

  function leave() {
    const code = socket.data.code;
    if (!code) return;
    const room = rooms.removePlayer(code, socket.id);
    socket.leave(code);
    socket.data.code = null;
    io.to(code).emit("peer:left", { id: socket.id });
    if (room) {
      pushRoom(room);
      if (room.status === "racing") checkAllFinished(room);
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n🏁  Neon Rush server running on http://localhost:${PORT}\n`);
});