import { useState } from "react";
import { useStore } from "../game/store.js";
import { createRoom, joinRoom } from "../net/socket";

export default function MainMenu() {
  const { playerName, setName, vehicle, carDesign, setPlayerId, setScreen, setError, error } = useStore();
  const [mode, setMode] = useState(null); // null | "join"
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const name = playerName.trim();

  async function handleCreate() {
    if (!name) return setError("Enter a racer name first.");
    setBusy(true);
    setError(null);
    const res = await createRoom(name, vehicle, carDesign);
    setBusy(false);
    if (res?.ok) {
      setPlayerId(res.playerId);
      setScreen("vehicle");
    } else {
      setError(res?.error || "Could not create a race.");
    }
  }

  async function handleJoin() {
    if (!name) return setError("Enter a racer name first.");
    if (code.trim().length !== 6) return setError("Race codes are 6 characters.");
    setBusy(true);
    setError(null);
    const res = await joinRoom(code, name, vehicle, carDesign);
    setBusy(false);
    if (res?.ok) {
      setPlayerId(res.playerId);
      setScreen("vehicle");
    } else {
      setError(res?.error || "Could not join that race.");
    }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-10 text-center">
          <p className="font-body text-sm uppercase tracking-[0.5em] text-cyan cyan-glow">
            Multiplayer
          </p>
          <h1 className="font-display text-6xl font-black uppercase italic leading-none text-magenta title-glow sm:text-7xl">
            Neon
            <br />
            Rush
          </h1>
          <p className="mt-3 font-body text-white/60">
            Spin up a room, share the code, and race in real time.
          </p>
        </header>

        <label className="mb-1 block font-body text-xs uppercase tracking-widest text-white/50">
          Racer name
        </label>
        <input
          value={playerName}
          onChange={(e) => setName(e.target.value.slice(0, 14))}
          placeholder="e.g. Vega"
          className="mb-5 w-full rounded-xl border border-white/10 bg-ink/80 px-4 py-3 font-display text-lg text-white outline-none transition focus:border-cyan focus:shadow-cyanglow"
        />

        {mode !== "join" ? (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={busy}
              className="w-full rounded-xl bg-magenta px-4 py-4 font-display text-lg font-bold uppercase tracking-wide text-night shadow-neon transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
            >
              Create race
            </button>
            <button
              onClick={() => {
                setError(null);
                setMode("join");
              }}
              className="w-full rounded-xl border border-cyan/50 bg-cyan/5 px-4 py-4 font-display text-lg font-bold uppercase tracking-wide text-cyan transition hover:bg-cyan/10"
            >
              Join with code
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
              }
              placeholder="6-CHAR CODE"
              className="w-full rounded-xl border border-white/10 bg-ink/80 px-4 py-4 text-center font-display text-2xl uppercase tracking-[0.6em] text-cyan outline-none transition focus:border-cyan focus:shadow-cyanglow"
            />
            <button
              onClick={handleJoin}
              disabled={busy}
              className="w-full rounded-xl bg-cyan px-4 py-4 font-display text-lg font-bold uppercase tracking-wide text-night shadow-cyanglow transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
            >
              Join race
            </button>
            <button
              onClick={() => {
                setError(null);
                setMode(null);
              }}
              className="w-full py-2 font-body text-sm uppercase tracking-widest text-white/40 hover:text-white/70"
            >
              ← Back
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-magenta/40 bg-magenta/10 px-3 py-2 text-center font-body text-sm text-magenta">
            {error}
          </p>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-body text-xs uppercase tracking-widest text-white/40">
        Developed by Abuzar
      </div>
    </div>
  );
}
