import { useStore } from "../game/store.js";
import { resetRaceNet } from "../net/socket";

export default function CrashScreen() {
  const { room, playerId, resetRace, setScreen, leaveRoom } = useStore();

  const handleTryAgain = () => {
    resetRace();
    resetRaceNet();
    setScreen("race");
  };

  const handleBackToMenu = () => {
    leaveRoom();
    setScreen("menu");
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div className="neon-bg" />
      <div className="neon-grid" />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Crash animation effect */}
        <div className="mb-8 animate-pulse">
          <div className="text-7xl mb-4">💥</div>
          <h2 className="font-display text-5xl font-black uppercase italic text-red-500 title-glow animate-bounce">
            CRASH!
          </h2>
        </div>

        <p className="font-body text-lg text-white/70 mb-8">
          You hit the barrier! Your lap has been reset.
        </p>

        {/* Try Again Button */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleTryAgain}
            className="rounded-xl bg-gradient-to-r from-cyan to-magenta px-8 py-4 font-display text-xl font-bold uppercase tracking-wide text-night shadow-neon transition hover:brightness-110 active:translate-y-px"
          >
            Try Again →
          </button>

          {/* Back to Menu Button */}
          <button
            onClick={handleBackToMenu}
            className="rounded-xl border-2 border-white/30 bg-white/5 px-8 py-3 font-display text-lg font-bold uppercase tracking-wide text-white/70 backdrop-blur transition hover:border-white/50 hover:bg-white/10 hover:text-white"
          >
            « Back to Menu
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 rounded-lg border border-cyan/30 bg-cyan/5 p-4 backdrop-blur">
          <p className="font-body text-sm text-cyan/80">
            💡 Avoid the colored barriers on the track edges to stay in the race!
          </p>
        </div>
      </div>
    </div>
  );
}
