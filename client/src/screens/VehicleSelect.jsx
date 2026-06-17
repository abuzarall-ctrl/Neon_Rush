import { useStore } from "../game/store.js";
import { VEHICLES, CAR_DESIGNS, getVehicle } from "../game/vehicles.js";
import { chooseVehicle, leaveRoomNet } from "../net/socket"; // Assuming chooseVehicle is correctly implemented here

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

// Stylized top-down racer that morphs with the chosen body design so each card
// previews its silhouette without spinning up a second WebGL canvas.
function CarGlyph({ color, accent, shape = "gt" }) {
  const gid = `g-${color.replace("#", "")}-${shape}`;
  return (
    <svg viewBox="0 0 120 70" className="h-20 w-32 drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      {/* body width varies by design */}
      {shape === "widebody" || shape === "muscle" ? (
        <rect x="30" y="6" width="60" height="58" rx="14" fill={`url(#${gid})`} />
      ) : shape === "hyper" ? (
        <polygon points="60,4 86,28 84,64 36,64 34,28" fill={`url(#${gid})`} />
      ) : (
        <rect x="36" y="6" width="48" height="58" rx="18" fill={`url(#${gid})`} />
      )}
      {/* wheels */}
      <rect x="26" y="20" width="68" height="9" rx="4" fill={accent} opacity="0.85" />
      <rect x="26" y="44" width="68" height="9" rx="4" fill={accent} opacity="0.85" />
      {/* cockpit (open roadster shows no roof glass) */}
      {shape !== "roadster" && (
        <rect x="48" y="14" width="24" height="20" rx="6" fill="#0b0820" opacity="0.85" />
      )}
      <rect x="48" y="40" width="24" height="14" rx="5" fill="#0b0820" opacity="0.55" />
      {/* rear wing for the trackier shapes */}
      {(shape === "widebody" || shape === "hyper") && (
        <rect x="34" y="60" width="52" height="6" rx="3" fill={accent} />
      )}
    </svg>
  );
}

export default function VehicleSelect() {
  const { vehicle, setVehicle, carDesign, setCarDesign, setScreen, goBack, leaveRoom, room } =
    useStore();
  const active = getVehicle(vehicle);
  const shape = CAR_DESIGNS.find((d) => d.id === carDesign)?.shape || "gt";

  function handleBack() {
    // One step back = the main menu; abandon the room we just created/joined.
    leaveRoomNet();
    leaveRoom();
    goBack();
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-y-auto p-6 pt-12">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-white/60 transition hover:border-white/40 hover:text-white"
            >
              ← Back
            </button>
            <div>
              <p className="font-body text-xs uppercase tracking-[0.4em] text-cyan cyan-glow">
                Pick your machine
              </p>
              <h2 className="font-display text-4xl font-black uppercase italic text-white">
                Garage
              </h2>
            </div>
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
            const isActive = v.id === vehicle;
            return (
              <button
                key={v.id}
                onClick={() => setVehicle(v.id)}
                className={`group relative overflow-hidden rounded-2xl border bg-ink/70 p-4 text-left transition ${
                  isActive
                    ? "border-white/80 shadow-[0_0_30px_rgba(255,255,255,0.12)]"
                    : "border-white/10 hover:border-white/30"
                }`}
                style={isActive ? { boxShadow: `0 0 28px ${v.color}55, inset 0 0 0 1px ${v.color}` } : {}}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
                  style={{ background: v.color, opacity: isActive ? 0.35 : 0.12 }}
                />
                <div className="relative mb-3 flex h-20 items-center justify-center">
                  <div className={isActive ? "animate-floaty" : ""}>
                    <CarGlyph color={v.color} accent={v.accent} shape={shape} />
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
                {isActive && (
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
            onClick={() => setScreen("design")}
            className="rounded-xl bg-cyan px-10 py-4 font-display text-lg font-bold uppercase tracking-wide text-night shadow-cyanglow transition hover:brightness-110 active:translate-y-px"
          >
            Next: Customize →
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-body text-xs uppercase tracking-widest text-white/40">
        Developed by Abuzar
      </div>
    </div>
  );
}
