import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Track from "../game/Track.jsx";
import Cars from "../game/Cars.jsx";
import HUD from "./HUD";
import { useStore } from "../game/store.js";
import { setInput, resetInput } from "../game/input.js";

function Lights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#3a2a5a", "#0a0612", 0.6]} />
      <directionalLight position={[40, 60, 20]} intensity={0.9} castShadow />
      <pointLight position={[0, 30, 0]} intensity={0.6} color="#ff2e97" distance={300} />
      <pointLight position={[60, 20, -40]} intensity={0.5} color="#19e3ff" distance={300} />
    </>
  );
}

function Countdown() {
  const startAt = useStore((s) => s.startAt);
  const raceStartTime = useStore((s) => s.raceStartTime);
  const [label, setLabel] = useState("");

  useEffect(() => {
    let raf;
    const tick = () => {
      if (raceStartTime != null) {
        const since = performance.now() - raceStartTime;
        setLabel(since < 900 ? "GO!" : "");
      } else if (startAt) {
        const remain = Math.ceil((startAt - Date.now()) / 1000);
        setLabel(remain > 0 ? String(remain) : "GO!");
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startAt, raceStartTime]);

  if (!label) return null;
  const go = label === "GO!";
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <span
        key={label}
        className={`font-display font-black italic ${
          go ? "text-lime" : "text-white"
        } title-glow animate-pulseFast`}
        style={{ fontSize: go ? "9rem" : "12rem", textShadow: "0 0 60px rgba(255,46,151,0.6)" }}
      >
        {label}
      </span>
    </div>
  );
}

function TouchControls() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(window.matchMedia?.("(pointer: coarse)").matches);
  }, []);
  if (!show) return null;

  const Btn = ({ dir, label, cls }) => (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        setInput(dir, true);
      }}
      onPointerUp={() => setInput(dir, false)}
      onPointerLeave={() => setInput(dir, false)}
      onPointerCancel={() => setInput(dir, false)}
      className={`h-20 w-20 rounded-2xl border border-white/20 bg-black/40 font-display text-2xl text-white backdrop-blur active:bg-white/20 ${cls}`}
    >
      {label}
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-32 z-30 flex justify-between px-6">
      <div className="pointer-events-auto flex gap-3">
        <Btn dir="left" label="◄" />
        <Btn dir="right" label="►" />
      </div>
      <div className="pointer-events-auto flex gap-3">
        <Btn dir="down" label="⊟" cls="text-magenta" />
        <Btn dir="up" label="▲" cls="text-lime" />
      </div>
    </div>
  );
}

function BackButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { goBack } = useStore();

  // One step back from the race = the lobby (the scene unmounts, so the local
  // car stops sending transforms automatically).
  const handleBack = () => goBack();

  if (showConfirm) {
    return (
      <div className="pointer-events-auto absolute top-4 left-4 z-50 flex flex-col gap-2 rounded-xl border border-white/15 bg-black/60 p-3 backdrop-blur">
        <p className="text-center text-xs text-white/70">Leave the race?</p>
        <div className="flex gap-2">
          <button
            onClick={handleBack}
            className="rounded-lg border-2 border-red-500/50 bg-red-500/10 px-3 py-1 font-display text-sm font-bold text-red-400 transition hover:bg-red-500/20"
          >
            Yes
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded-lg border-2 border-cyan/50 bg-cyan/10 px-3 py-1 font-display text-sm font-bold text-cyan transition hover:bg-cyan/20"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="pointer-events-auto absolute top-4 left-4 z-40 rounded-lg border border-white/20 bg-black/40 px-4 py-2 font-display font-bold text-white/70 backdrop-blur transition hover:border-white/40 hover:bg-black/60 hover:text-white"
    >
      « Back
    </button>
  );
}

export default function Race() {
  useEffect(() => () => resetInput(), []);

  return (
    <div className="relative h-full w-full bg-night">
      <Canvas
        shadows
        camera={{ position: [0, 12, -22], fov: 62, near: 0.1, far: 600 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#070311"]} />
        <fog attach="fog" args={["#070311", 70, 280]} />
        <Lights />
        <Track />
        <Cars />
      </Canvas>

      <HUD />
      <Countdown />
      <TouchControls />
      <BackButton />

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 font-body text-xs uppercase tracking-widest text-white/30">
        WASD / arrows to drive
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-body text-xs uppercase tracking-widest text-white/40">
        Developed by Abuzar
      </div>
    </div>
  );
}
