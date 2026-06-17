import { useStore } from "../game/store.js";
import { leaveRoomNet } from "../net/socket";

export default function CrashScreen() {
  const { setCrashDetected, setScreen, leaveRoom } = useStore();

  // The race is still live on the server, so just clear the crash flag and drop
  // back in — the car respawns on the starting grid when the scene remounts.
  const handleTryAgain = () => {
    setCrashDetected(false);
    setScreen("race");
  };

  const handleBackToMenu = () => {
    leaveRoomNet();
    leaveRoom();
    setCrashDetected(false);
    setScreen("menu");
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-red-500/30 bg-black/50 p-8 text-center shadow-2xl shadow-red-500/20 backdrop-blur-lg">
        {/* Animated crash icon */}
        <div className="mb-6 animate-wiggle">
          <div className="text-8xl">💥</div>
        </div>

        {/* Main title */}
        <h2 className="font-display text-6xl font-black uppercase italic text-red-500 title-glow animate-pulseFast">
          CRASH!
        </h2>

        <p className="font-body text-lg text-white/70 mt-4 mb-8">
          You slammed the neon barrier wall! Your lap has been reset.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleTryAgain}
            className="rounded-xl bg-gradient-to-r from-lime to-cyan px-8 py-4 font-display text-xl font-bold uppercase tracking-wide text-night shadow-neon transition hover:scale-105 hover:brightness-110 active:translate-y-px active:scale-100"
          >
            Try Again →
          </button>

          <button
            onClick={handleBackToMenu}
            className="rounded-xl border-2 border-white/30 bg-white/5 px-8 py-3 font-display text-lg font-bold uppercase tracking-wide text-white/70 transition hover:border-white/50 hover:bg-white/10 hover:text-white"
          >
            « Back to Menu
          </button>
        </div>

        {/* Tip Box */}
        <div className="mt-10 rounded-lg border border-cyan/30 bg-cyan/5 p-4">
          <p className="font-body text-sm text-cyan/80">
            💡 Avoid the colored barriers on the track edges to stay in the race!
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-body text-xs uppercase tracking-widest text-white/40">
        Developed by Abuzar
      </div>
    </div>
  );
}
