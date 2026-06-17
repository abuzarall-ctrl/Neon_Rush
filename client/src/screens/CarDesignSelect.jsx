import { useStore } from "../game/store.js";
import { VEHICLES, CAR_DESIGNS, getVehicle } from "../game/vehicles.js";
import { chooseVehicle } from "../net/socket";

// This is the same CarGlyph component from VehicleSelect.jsx
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
      {shape === "widebody" || shape === "muscle" ? (
        <rect x="30" y="6" width="60" height="58" rx="14" fill={`url(#${gid})`} />
      ) : shape === "hyper" ? (
        <polygon points="60,4 86,28 84,64 36,64 34,28" fill={`url(#${gid})`} />
      ) : (
        <rect x="36" y="6" width="48" height="58" rx="18" fill={`url(#${gid})`} />
      )}
      <rect x="26" y="20" width="68" height="9" rx="4" fill={accent} opacity="0.85" />
      <rect x="26" y="44" width="68" height="9" rx="4" fill={accent} opacity="0.85" />
      {shape !== "roadster" && (
        <rect x="48" y="14" width="24" height="20" rx="6" fill="#0b0820" opacity="0.85" />
      )}
      <rect x="48" y="40" width="24" height="14" rx="5" fill="#0b0820" opacity="0.55" />
      {(shape === "widebody" || shape === "hyper") && (
        <rect x="34" y="60" width="52" height="6" rx="3" fill={accent} />
      )}
    </svg>
  );
}

export default function CarDesignSelect() {
  const { vehicle, carDesign, setCarDesign, setScreen, goBack } = useStore();
  const activeVehicle = getVehicle(vehicle);

  function handleContinue() {
    // Send the final selection to the server before moving to the lobby.
    chooseVehicle(vehicle, carDesign);
    setScreen("lobby");
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start overflow-y-auto p-6 pt-12">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={goBack}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-display text-sm font-bold uppercase tracking-wider text-white/60 transition hover:border-white/40 hover:text-white"
          >
            ← Back
          </button>
          <div>
            <p className="font-body text-xs uppercase tracking-[0.4em] text-magenta/80 cyan-glow">
              Customize your ride
            </p>
            <h2 className="font-display text-4xl font-black uppercase italic text-white">
              Body Design
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CAR_DESIGNS.map((d) => {
            const isActive = d.id === carDesign;
            return (
              <button
                key={d.id}
                onClick={() => setCarDesign(d.id)}
                className={`group flex flex-col items-center rounded-xl border bg-ink/60 p-3 text-center transition ${
                  isActive
                    ? "border-cyan/80 shadow-cyanglow"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex h-14 items-center justify-center">
                  <CarGlyph color={activeVehicle.color} accent={activeVehicle.accent} shape={d.shape} />
                </div>
                <h4 className="mt-1 font-display text-sm font-bold uppercase text-white">
                  {d.name}
                </h4>
                <p className="mt-1 hidden h-12 font-body text-[10px] leading-snug text-white/45 sm:block">
                  {d.blurb}
                </p>
                {isActive && (
                  <span className="mt-1 font-body text-[10px] uppercase tracking-widest text-cyan">
                    ✓ Equipped
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleContinue}
            className="rounded-xl bg-magenta px-10 py-4 font-display text-lg font-bold uppercase tracking-wide text-night shadow-neon transition hover:brightness-110 active:translate-y-px"
          >
            Lock it in →
          </button>
        </div>
      </div>
    </div>
  );
}