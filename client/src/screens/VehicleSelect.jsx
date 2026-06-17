import { useStore } from "../game/store.js";
import { VEHICLES } from "../game/vehicles.js";
import { chooseVehicle } from "../net/socket";

function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 font-body text-[10px] uppercase tracking-widest text-white/50">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${value * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}

function CarGlyph({ color, accent }) {
  // Stylized top-down racer drawn in SVG so each card previews its vehicle
  // without spinning up a second WebGL canvas.
  return (
    <svg viewBox="0 0 120 70" className="h-20 w-32 drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]">
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <rect x="36" y="6" width="48" height="58" rx="18" fill={`url(#g-${color})`} />
      <rect x="30" y="20" width="60" height="10" rx="5" fill={accent} opacity="0.85" />
      <rect x="30" y="42" width="60" height="10" rx="5" fill={accent} opacity="0.85" />
      <rect x="48" y="14" width="24" height="20" rx="6" fill="#0b0820" opacity="0.85" />
      <rect x="48" y="40" width="24" height="14" rx="5" fill="#0b0820" opacity="0.55" />
    </svg>
  );
}

export default function VehicleSelect() {
  const { vehicle, setVehicle, setScreen, room } = useStore();

  function pick(id) {
    setVehicle(id);
    chooseVehicle(id);
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.4em] text-cyan cyan-glow">
              Pick your machine
            </p>
            <h2 className="font-display text-4xl font-black uppercase italic text-white">
              Garage
            </h2>
          </div>
          {room && (
            <div className="text-right font-body">
              <p className="text-xs uppercase tracking-widest text-white/40">Room code</p>
              <p className="font-display text-2xl tracking-[0.3em] text-magenta title-glow">
                {room.code}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VEHICLES.map((v) => {
            const active = v.id === vehicle;
            return (
              <button
                key={v.id}
                onClick={() => pick(v.id)}
                className={`group relative overflow-hidden rounded-2xl border bg-ink/70 p-4 text-left transition ${
                  active
                    ? "border-white/80 shadow-[0_0_30px_rgba(255,255,255,0.12)]"
                    : "border-white/10 hover:border-white/30"
                }`}
                style={active ? { boxShadow: `0 0 28px ${v.color}55, inset 0 0 0 1px ${v.color}` } : {}}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
                  style={{ background: v.color, opacity: active ? 0.35 : 0.12 }}
                />
                <div className="relative mb-3 flex h-20 items-center justify-center">
                  <div className={active ? "animate-floaty" : ""}>
                    <CarGlyph color={v.color} accent={v.accent} />
                  </div>
                </div>
                <div className="relative flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-bold uppercase text-white">{v.name}</h3>
                  <span
                    className="rounded-full px-2 py-0.5 font-body text-[10px] uppercase tracking-wider"
                    style={{ background: `${v.color}22`, color: v.color }}
                  >
                    {v.tag}
                  </span>
                </div>
                <p className="relative mb-3 mt-1 h-10 font-body text-xs leading-snug text-white/55">
                  {v.blurb}
                </p>
                <div className="relative space-y-1.5">
                  <StatBar label="Speed" value={v.stats.speed} color={v.color} />
                  <StatBar label="Accel" value={v.stats.accel} color={v.color} />
                  <StatBar label="Grip" value={v.stats.grip} color={v.color} />
                </div>
                {active && (
                  <div className="relative mt-3 text-center font-display text-xs uppercase tracking-widest text-white">
                    ✓ Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setScreen("lobby")}
            className="rounded-xl bg-magenta px-10 py-4 font-display text-lg font-bold uppercase tracking-wide text-night shadow-neon transition hover:brightness-110 active:translate-y-px"
          >
            Lock it in →
          </button>
        </div>
      </div>
    </div>
  );
}
