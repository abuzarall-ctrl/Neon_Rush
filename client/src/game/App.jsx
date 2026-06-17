import { useStore } from "./game/store.js";
import MainMenu from "./screens/MainMenu.jsx";
import VehicleSelect from "./screens/VehicleSelect.jsx";
import CarDesignSelect from "./screens/CarDesignSelect.jsx";
import Lobby from "./screens/Lobby.jsx";
import Race from "./screens/Race.jsx";
import CrashScreen from "./screens/CrashScreen.jsx";
import Results from "./screens/Results.jsx";

const SCREENS = {
  menu: MainMenu,
  vehicle: VehicleSelect,
  design: CarDesignSelect,
  lobby: Lobby,
  race: Race,
  "race-crash": CrashScreen,
  results: Results,
};

export default function App() {
  const screen = useStore((s) => s.screen);
  const connected = useStore((s) => s.connected);

  const Screen = SCREENS[screen] || MainMenu;

  return (
    <>
      <Screen />
      {!connected && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-50 rounded-lg bg-red-500/80 px-3 py-1 font-body text-xs text-white">
          Disconnected
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-body text-xs uppercase tracking-widest text-white/40">
        Developed by Abuzar
      </div>
    </>
  );
}