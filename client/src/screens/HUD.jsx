import { useEffect, useRef, useState } from "react";
import { useStore } from "../game/store.js";
import { hud } from "../game/hud.js";
import { getVehicle } from "../game/vehicles.js";

function rankPlayers(players) {
  return [...players].sort((a, b) => {
    if (a.finished && b.finished) return a.place - b.place;
    if (a.finished) return -1;
    if (b.finished) return 1;
    const ap = a.lap + a.progress;
    const bp = b.lap + b.progress;
    return bp - ap;
  });
}

export default function HUD() {
  const room = useStore((s) => s.room);
  const playerId = useStore((s) => s.playerId);
  const raceStartTime = useStore((s) => s.raceStartTime);
  const myFinishTime = useStore((s) => s.myFinishTime);
  const [, force] = useState(0);
  const elapsed = useRef(0);

  useEffect(() => {
    let raf;
    const loop = () => {
      if (raceStartTime != null) elapsed.current = (performance.now() - raceStartTime) / 1000;
      force((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [raceStartTime]);

  if (!room) return null;
  const ranked = rankPlayers(room.players);
  const myRank = ranked.findIndex((p) => p.id === playerId) + 1;
  const speedKph = Math.round(hud.speed * 7.2); // arcade flavour, not literal
  const maxSpeed = 260; // arcade max speed
  const speedPercent = Math.min((speedKph / maxSpeed) * 100, 100);

  const t = myFinishTime != null ? myFinishTime : elapsed.current;
  const mm = Math.floor(t / 60);
  const ss = (t % 60).toFixed(2).padStart(5, "0");

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none p-4 font-body">
      {/* top-left: lap + clock */}
      <div className="absolute left-4 top-4">
        <div className="rounded-2xl border border-cyan/30 bg-gradient-to-br from-black/60 to-black/40 px-4 py-3 backdrop-blur-md shadow-lg shadow-cyan/10">
          <p className="text-xs uppercase tracking-widest text-cyan/60">Lap Progress</p>
          <p className="mt-1 font-display text-4xl font-black text-white">
            {hud.lap}
            <span className="ml-1 text-lg text-white/40">/ {hud.totalLaps}</span>
          </p>
        </div>
        <div className="mt-3 rounded-xl border border-cyan/20 bg-black/50 px-4 py-2 backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-cyan/50">Race Time</p>
          <p className="font-display text-2xl font-black tracking-wider text-cyan cyan-glow">
            {mm}:{ss}
          </p>
        </div>
      </div>

      {/* top-right: live leaderboard */}
      <div className="absolute right-4 top-4 w-64">
        <div className="rounded-2xl border border-magenta/30 bg-gradient-to-br from-black/60 to-black/40 px-4 py-3 backdrop-blur-md shadow-lg shadow-magenta/10">
          <p className="text-xs uppercase tracking-widest text-magenta/60 title-glow">Live Leaderboard</p>
          <ul className="mt-2 space-y-1.5">
            {ranked.map((p, i) => {
              const v = getVehicle(p.vehicle);
              const meRow = p.id === playerId;
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                    meRow
                      ? "border border-cyan/30 bg-cyan/10 shadow-md shadow-cyan/20"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span className="w-5 font-display text-sm font-bold text-white/50">
                    {i + 1}
                  </span>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: v.color, boxShadow: `0 0 12px ${v.color}` }}
                  />
                  <span className="flex-1 truncate text-sm font-medium text-white/90">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {p.finished && <span className="text-xs text-lime font-bold">✓ DONE</span>}
                    {meRow && !p.finished && (
                      <span className="text-xs text-cyan font-bold animate-pulse">YOU</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Center-bottom: Large speedometer and position */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        {/* Position indicator */}
        <div className="mb-4 inline-block">
          <div className="rounded-2xl border-2 border-magenta/50 bg-magenta/10 px-8 py-3 backdrop-blur">
            <p className="font-display text-7xl font-black text-magenta title-glow">P{myRank}</p>
            <p className="text-xs uppercase tracking-widest text-magenta/60 mt-1">Position</p>
          </div>
        </div>
      </div>

      {/* Right side: Speed display with gauge */}
      <div className="absolute bottom-8 right-8">
        <div className="rounded-2xl border border-cyan/30 bg-gradient-to-br from-black/60 to-black/40 px-6 py-4 backdrop-blur-md shadow-lg shadow-cyan/10">
          <p className="text-xs uppercase tracking-widest text-cyan/60 mb-2">Speed</p>
          {/* Speed gauge bar */}
          <div className="w-48 h-8 rounded-lg border border-cyan/40 bg-black/50 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-cyan to-magenta/80 transition-all duration-75"
              style={{
                width: `${speedPercent}%`,
                boxShadow: `0 0 12px ${speedPercent > 80 ? "#ff2e97" : "#19e3ff"}`,
              }}
            />
          </div>
          <p className="font-display text-4xl font-black text-cyan">
            {speedKph}
            <span className="ml-2 text-lg text-white/40">KPH</span>
          </p>
          <p className="text-xs text-white/30 mt-1">{Math.round(speedPercent)}% max</p>
        </div>
      </div>

      {/* Finished state */}
      {hud.finished && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-pulse">
          <div className="rounded-full border-2 border-lime/60 bg-lime/15 px-6 py-2 backdrop-blur">
            <p className="font-display font-bold text-lime text-lg">✓ FINISHED</p>
            <p className="text-xs text-lime/70">Waiting for others...</p>
          </div>
        </div>
      )}
    </div>
  );
}
