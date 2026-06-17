import { useStore } from "../game/store.js";
import { getVehicle } from "../game/vehicles.js";
import { requestRematch, leaveRoomNet } from "../net/socket";

function fmt(t) {
  if (t == null) return "—";
  const mm = Math.floor(t / 60);
  const ss = (t % 60).toFixed(2).padStart(5, "0");
  return `${mm}:${ss}`;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Results() {
  const { room, standings, playerId, leaveRoom } = useStore();
  if (!room) return null;

  const isHost = room.hostId === playerId;
  // Prefer server standings; fall back to room order if a racer never finished.
  const order =
    standings.length > 0
      ? standings
      : [...room.players]
          .filter((p) => p.finished)
          .sort((a, b) => a.place - b.place)
          .map((p) => ({ id: p.id, name: p.name, vehicle: p.vehicle, time: p.finishTime, place: p.place }));

  const winner = order[0];

  function handleLeave() {
    leaveRoomNet();
    leaveRoom();
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="font-body text-sm uppercase tracking-[0.5em] text-cyan cyan-glow">
            Race complete
          </p>
          {winner && (
            <h2 className="font-display text-5xl font-black uppercase italic text-magenta title-glow">
              {winner.name} wins
            </h2>
          )}
        </div>

        <ol className="space-y-2">
          {order.map((p, i) => {
            const v = getVehicle(p.vehicle);
            const me = p.id === playerId;
            return (
              <li
                key={p.id}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  i === 0
                    ? "border-amber/50 bg-amber/10"
                    : me
                    ? "border-cyan/40 bg-cyan/5"
                    : "border-white/10 bg-ink/60"
                }`}
              >
                <span className="w-8 text-center font-display text-2xl">
                  {MEDAL[i] || i + 1}
                </span>
                <span
                  className="h-8 w-8 rounded-lg"
                  style={{ background: v.color, boxShadow: `0 0 12px ${v.color}` }}
                />
                <div className="flex-1">
                  <p className="font-display text-xl font-bold text-white">
                    {p.name}
                    {me && <span className="ml-2 font-body text-xs text-cyan">you</span>}
                  </p>
                  <p className="font-body text-xs uppercase tracking-wider text-white/40">
                    {v.name}
                  </p>
                </div>
                <span className="font-display text-lg tracking-wider text-white/80">
                  {fmt(p.time)}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex flex-col gap-3">
          {isHost ? (
            <button
              onClick={requestRematch}
              className="w-full rounded-xl bg-magenta px-4 py-4 font-display text-lg font-bold uppercase tracking-wide text-night shadow-neon transition hover:brightness-110 active:translate-y-px"
            >
              Rematch ↻
            </button>
          ) : (
            <p className="text-center font-body text-sm text-white/40">
              Waiting for host to start a rematch…
            </p>
          )}
          <button
            onClick={handleLeave}
            className="w-full py-2 font-body text-sm uppercase tracking-widest text-white/40 hover:text-magenta"
          >
            Back to menu
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-body text-xs uppercase tracking-widest text-white/40">
        Developed by Abuzar
      </div>
    </div>
  );
}
