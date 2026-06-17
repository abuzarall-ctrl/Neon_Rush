// In-memory room manager. Good for a single Node process / hackathon-scale play.
// For horizontal scaling you'd move this into Redis, but the interface below
// is intentionally small so that swap is contained.

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L to avoid confusion
const CODE_LENGTH = 6;
const TOTAL_LAPS = 3;
const ROOM_TTL_MS = 1000 * 60 * 60; // reap abandoned rooms after an hour

function makeCode() {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    setInterval(() => this.reap(), 60_000).unref?.();
  }

  createRoom(host) {
    let code = makeCode();
    while (this.rooms.has(code)) code = makeCode();

    const room = {
      code,
      hostId: host.id,
      status: "lobby", // lobby | countdown | racing | finished
      totalLaps: TOTAL_LAPS,
      players: new Map(),
      createdAt: Date.now(),
      finishOrder: [],
    };
    this.rooms.set(code, room);
    this.addPlayer(room, host);
    return room;
  }

  getRoom(code) {
    return this.rooms.get((code || "").toUpperCase());
  }

  addPlayer(room, { id, name, vehicle }) {
    room.players.set(id, {
      id,
      name: name || "Racer",
      vehicle: vehicle || "comet",
      ready: false,
      lap: 0,
      progress: 0, // 0..1 around the current lap, used for live standings
      finished: false,
      finishTime: null,
      place: null,
    });
  }

  removePlayer(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;
    room.players.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(code);
      return null;
    }
    // Reassign host if the host left.
    if (room.hostId === playerId) {
      room.hostId = room.players.keys().next().value;
    }
    return room;
  }

  // ---- Serialization for the client ----
  publicState(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      totalLaps: room.totalLaps,
      players: [...room.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        vehicle: p.vehicle,
        ready: p.ready,
        lap: p.lap,
        progress: p.progress,
        finished: p.finished,
        finishTime: p.finishTime,
        place: p.place,
      })),
    };
  }

  reap() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt > ROOM_TTL_MS && room.status !== "racing") {
        this.rooms.delete(code);
      }
    }
  }
}

module.exports = { RoomManager, TOTAL_LAPS };
