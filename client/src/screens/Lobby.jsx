import { useState } from "react";
import { useStore } from "../game/store.js";
import { getVehicle } from "../game/vehicles.js";
import { setReady, startRace, leaveRoomNet } from "../net/socket";

export default function Lobby() {
  const { room, playerId, leaveRoom } = useStore();
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const me = room.players.find((p) => p.id === playerId);
  const isHost = room.hostId === playerId;
  const allReady = room.players.length > 0 && room.players.every((p) => p.ready);

  function copyCode() {
    navigator.clipboard?.writeText(room.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleLeave() {
    leaveRoomNet();
    leaveRoom();
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Left: room code + controls */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-ink/70 p-6">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.4em] text-cyan cyan-glow">
              Share to invite
            </p>
            <h2 className="mb-4 font-display text-3xl font-black uppercase italic text-white">
              Race lobby
            </h2>
            <button
              onClick={copyCode}
              className="group w-full rounded-xl border border-magenta/40 bg-magenta/5 px-4 py-6 text-center transition hover:bg-magenta/10"
            >
              <span className="block font-display text-5xl font-black tracking-[0.4em] text-magenta title-glow">
                {room.code}
              </span>
              <span className="mt-2 block font-body text-xs uppercase tracking-widest text-white/50">
                {copied ? "Copied!" : "Tap to copy"}
              </span>
            </button>
            <p className="mt-4 font-body text-sm text-white/50">
              {room.players.length}/8 racers · {room.totalLaps} laps
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => me && setReady(!me.ready)}
              className={`w-full rounded-xl px-4 py-4 font-display text-lg font-bold uppercase tracking-wide transition active:translate-y-px ${
                me?.ready
                  ? "bg-lime/20 text-lime shadow-[0_0_20px_rgba(182,255,60,0.25)]"
                  : "border border-white/20 text-white hover:bg-white/5"
              }`}
            >
              {me?.ready ? "✓ Ready" : "Ready up"}
            </button>

            {isHost && (
              <button
                onClick={startRace}
                disabled={!allReady}
                className="w-full rounded-xl bg-cyan px-4 py-4 font-display text-lg font-bold uppercase tracking-wide text-night shadow-cyanglow transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                {allReady ? "Start race ▶" : "Waiting for racers…"}
              </button>
            )}
            {!isHost && (
              <p className="text-center font-body text-sm text-white/40">
                Waiting for host to start…
              </p>
            )}

            <button
              onClick={handleLeave}
              className="w-full py-2 font-body text-sm uppercase tracking-widest text-white/40 hover:text-magenta"
            >
              Leave room
            </button>
          </div>
        </div>

        {/* Right: roster */}
        <div className="rounded-2xl border border-white/10 bg-ink/70 p-6">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.4em] text-white/40">
            Starting grid
          </p>
          <ul className="space-y-2">
            {room.players.map((p, i) => {
              const v = getVehicle(p.vehicle);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-night/60 px-4 py-3"
                >
                  <span className="w-6 font-display text-lg font-bold text-white/30">
                    {i + 1}
                  </span>
                  <span
                    className="h-8 w-8 rounded-lg"
                    style={{ background: v.color, boxShadow: `0 0 12px ${v.color}88` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold text-white">
                      {p.name}
                      {p.id === playerId && (
                        <span className="ml-2 font-body text-xs text-cyan">you</span>
                      )}
                      {p.id === room.hostId && (
                        <span className="ml-2 font-body text-xs text-amber">host</span>
                      )}
                    </p>
                    <p className="font-body text-xs uppercase tracking-wider text-white/40">
                      {v.name}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-body text-xs uppercase tracking-wider ${
                      p.ready ? "bg-lime/20 text-lime" : "bg-white/5 text-white/40"
                    }`}
                  >
                    {p.ready ? "Ready" : "Idle"}
                  </span>
                </li>
              );
            })}
            {Array.from({ length: Math.max(0, 2 - room.players.length) }).map((_, i) => (
              <li
                key={`empty-${i}`}
                className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-3 font-body text-sm text-white/25"
              >
                Waiting for a racer…
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
