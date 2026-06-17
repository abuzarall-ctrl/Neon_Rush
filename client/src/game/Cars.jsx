import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import CarMesh from "./CarMesh.jsx";
import Powerups from "./Powerups.jsx";
import { getVehicle } from "./vehicles.js";
import { vehiclePhysics, clamp } from "./physics";
import {
  TRACK,
  nearestSample,
  offRoadAmount,
  lapProgress,
  gridSlot,
} from "./track";
import { input, attachKeyboard, resetInput } from "./input";
import { hud } from "./hud";
import { useStore } from "./store";
import { peerStates, sendTransform, sendFinish, sendPowerupCollected } from "../net/socket";
import { POWERUP_TYPES } from "./powerups.js";

// Metres past the painted road edge before the car is treated as having hit the
// barrier wall (which sits ~0.7m out). A small grace lets you clip the kerb
// without an instant crash.
const CRASH_MARGIN = 0.85;

function LocalCar({ vehicleId, design, startIndex, raceStartTime }) {
  const ref = useRef();
  const phys = useMemo(() => vehiclePhysics(vehicleId), [vehicleId]);
  const vis = getVehicle(vehicleId);
  const { camera } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const zoom = useRef(15); // Default zoom distance

  const s = useRef(null);
  if (!s.current) {
    const g = gridSlot(startIndex);
    s.current = {
      x: g.x,
      z: g.z,
      heading: g.heading,
      speed: 0,
      lap: 0,
      prevIdx: nearestSample(g.x, g.z).index,
      passedHalf: false,
      finished: false,
      lastSend: 0,
      boost: null, // { type, expiresAt }
    };
  }

  useEffect(() => {
    attachKeyboard();

    // Add wheel event listener for zooming
    const handleWheel = (event) => {
      zoom.current += event.deltaY * 0.01;
      zoom.current = clamp(zoom.current, 8, 30); // Min/max zoom
    };

    window.addEventListener("wheel", handleWheel);
    // Cleanup listener on component unmount
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Re-seed on grid whenever a fresh race begins (raceStartTime changes).
  useEffect(() => {
    const g = gridSlot(startIndex);
    Object.assign(s.current, {
      x: g.x,
      z: g.z,
      heading: g.heading,
      speed: 0,
      lap: 0,
      prevIdx: nearestSample(g.x, g.z).index,
      passedHalf: false,
      finished: false,
      boost: null,
    });
    resetInput();
  }, [startIndex, raceStartTime]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = s.current;
    const store = useStore.getState();
    const racing = store.raceStartTime != null && store.room?.status === "racing";

    if (racing && !st.finished) {
      // Apply power-up effects
      let currentPhys = phys;
      if (st.boost && performance.now() < st.boost.expiresAt) {
        const boostType = POWERUP_TYPES[st.boost.type];
        currentPhys = {
          ...phys,
          accel: phys.accel * boostType.accelMultiplier,
          maxSpeed: phys.maxSpeed * (1 + boostType.speedAdd),
        };
      } else if (st.boost) {
        st.boost = null;
      }

      // throttle / brake / coast
      if (input.up) st.speed += currentPhys.accel * dt;
      else if (input.down) st.speed -= phys.brakeForce * dt;
      else {
        const d = Math.sign(st.speed) * phys.coastDrag * dt;
        st.speed = Math.abs(d) > Math.abs(st.speed) ? 0 : st.speed - d;
      }
      st.speed = clamp(st.speed, -phys.reverseMax, phys.maxSpeed);

      // steering (needs motion; inverts in reverse)
      const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      const sf = Math.min(1, Math.abs(st.speed) / 6);
      st.heading += steer * currentPhys.turn * dt * sf * Math.sign(st.speed || 1);

      // off-road penalty: a little drift onto the kerb just scrubs speed...
      const off = offRoadAmount(st.x, st.z);
      if (off > 0) {
        const cap = phys.maxSpeed * phys.offRoadCap;
        if (st.speed > cap) st.speed = Math.max(cap, st.speed * 0.9);
        st.speed *= 0.985;
      }

      // ...but crossing the neon barrier wall ends the run -> Try Again screen.
      if (off > CRASH_MARGIN && !store.crashDetected) {
        store.setCrashDetected(true);
        store.setScreen("race-crash");
        st.speed = 0;
        return;
      }

      // integrate
      st.x += Math.sin(st.heading) * st.speed * dt;
      st.z += Math.cos(st.heading) * st.speed * dt;

      // Check for power-up collection
      store.room.powerups.forEach((p) => {
        if (!p.collected) {
          const dx = p.x - st.x;
          const dz = p.z - st.z;
          if (dx * dx + dz * dz < 4) {
            // 2m radius
            sendPowerupCollected(p.id);
            const boostType = POWERUP_TYPES.BOOST;
            st.boost = { type: boostType.id, expiresAt: performance.now() + boostType.duration };
          }
        }
      });

      // lap detection via start-line crossing with a halfway gate
      const idx = nearestSample(st.x, st.z).index;
      const seg = TRACK.segments;
      if (idx > seg * 0.4 && idx < seg * 0.6) st.passedHalf = true;
      if (st.passedHalf && st.prevIdx > seg * 0.85 && idx < seg * 0.15) {
        st.lap++;
        st.passedHalf = false;
        if (st.lap >= store.room.totalLaps) {
          st.finished = true;
          const time = (performance.now() - store.raceStartTime) / 1000;
          useStore.setState({ myFinishTime: time });
          sendFinish(time);
        }
      }
      st.prevIdx = idx;

      // throttle network updates to ~20Hz
      const now = performance.now();
      if (now - st.lastSend > 50) {
        st.lastSend = now;
        sendTransform({
          x: st.x,
          z: st.z,
          heading: st.heading,
          speed: st.speed,
          lap: st.lap,
          progress: lapProgress(idx),
        });
      }

      hud.speed = Math.abs(st.speed);
      hud.lap = Math.min(st.lap + 1, store.room.totalLaps);
      hud.totalLaps = store.room.totalLaps;
      hud.finished = st.finished;
    }

    if (ref.current) {
      ref.current.position.set(st.x, 0, st.z);
      ref.current.rotation.y = st.heading;
    }

    // chase camera
    const fx = Math.sin(st.heading);
    const fz = Math.cos(st.heading);
    tmp.set(st.x - fx * zoom.current, 4 + zoom.current * 0.3, st.z - fz * zoom.current);
    camera.position.lerp(tmp, racing ? 0.12 : 0.06);
    camera.lookAt(st.x, 1.4, st.z);
  });

  return <CarMesh ref={ref} color={vis.color} accent={vis.accent} design={design} />;
}

function RemoteCar({ player, index }) {
  const ref = useRef();
  const vis = getVehicle(player.vehicle);
  const cur = useRef(null);
  if (!cur.current) {
    const g = gridSlot(index);
    cur.current = { x: g.x, z: g.z, heading: g.heading };
  }

  useFrame(() => {
    const c = cur.current;
    const t = peerStates.get(player.id);
    if (t) {
      // smooth toward the latest received transform
      c.x += (t.x - c.x) * 0.25;
      c.z += (t.z - c.z) * 0.25;
      let dh = t.heading - c.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      c.heading += dh * 0.25;
    }
    if (ref.current) {
      ref.current.position.set(c.x, 0, c.z);
      ref.current.rotation.y = c.heading;
    }
  });

  return <CarMesh ref={ref} color={vis.color} accent={vis.accent} design={player.design} />;
}

export default function Cars() {
  const room = useStore((s) => s.room);
  const playerId = useStore((s) => s.playerId);
  const raceStartTime = useStore((s) => s.raceStartTime);
  if (!room) return null;

  const players = room.players;
  const myIndex = players.findIndex((p) => p.id === playerId);
  const me = players[myIndex];

  return (
    <>
      <Powerups />
      {me && (
        <LocalCar
          vehicleId={me.vehicle}
          design={me.design}
          startIndex={Math.max(0, myIndex)}
          raceStartTime={raceStartTime}
        />
      )}
      {players.map((p, i) =>
        p.id === playerId ? null : <RemoteCar key={p.id} player={p} index={i} />
      )}
    </>
  );
}
