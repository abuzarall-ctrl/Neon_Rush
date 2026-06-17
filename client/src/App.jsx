import { useStore } from "./game/store.js";
import MainMenu from "./screens/MainMenu.jsx";
import VehicleSelect from "./screens/VehicleSelect.jsx";
import Lobby from "./screens/Lobby.jsx";
import Race from "./screens/Race.jsx";
import Results from "./screens/Results.jsx";
import CrashScreen from "./screens/CrashScreen.jsx";

export default function App() {
  const screen = useStore((s) => s.screen);
  const connected = useStore((s) => s.connected);

  return (
    <div className="relative h-full w-full">
      {screen === "menu" && <MainMenu />}
      {screen === "vehicle" && <VehicleSelect />}
      {screen === "lobby" && <Lobby />}
      {screen === "race" && <Race />}
      {screen === "race-crash" && <CrashScreen />}
      {screen === "results" && <Results />}

      {!connected && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber/40 bg-black/70 px-4 py-1.5 font-body text-sm text-amber backdrop-blur">
          <span className="mr-2 inline-block h-2 w-2 animate-pulseFast rounded-full bg-amber align-middle" />
          Connecting to server…
        </div>
      )}
    </div>
  );
}
