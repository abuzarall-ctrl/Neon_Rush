import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import CarMesh from "./CarMesh.jsx";
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
import { peerStates, sendTransform, sendFinish } from "../net/socket";

function LocalCar({ vehicleId, startIndex, raceStartTime }) {
  const ref = useRef();
  const phys = useMemo(() => vehiclePhysics(vehicleId), [vehicleId]);
  const vis = getVehicle(vehicleId);
  const { camera } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);

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
    };
  }

  useEffect(() => attachKeyboard(), []);

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
    });
    resetInput();
  }, [startIndex, raceStartTime]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = s.current;
    const store = useStore.getState();
    const racing = store.raceStartTime != null && store.room?.status === "racing";

    if (racing && !st.finished) {
      // throttle / brake / coast
      if (input.up) st.speed += phys.accel * dt;
      else if (input.down) st.speed -= phys.brakeForce * dt;
      else {
        const d = Math.sign(st.speed) * phys.coastDrag * dt;
        st.speed = Math.abs(d) > Math.abs(st.speed) ? 0 : st.speed - d;
      }
      st.speed = clamp(st.speed, -phys.reverseMax, phys.maxSpeed);

      // steering (needs motion; inverts in reverse)
      const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      const sf = Math.min(1, Math.abs(st.speed) / 6);
      st.heading += steer * phys.turn * dt * sf * Math.sign(st.speed || 1);

      // off-road penalty
      if (offRoadAmount(st.x, st.z) > 0) {
        const cap = phys.maxSpeed * phys.offRoadCap;
        if (st.speed > cap) st.speed = Math.max(cap, st.speed * 0.9);
        st.speed *= 0.985;
      }

      // TODO: Add barrier collision detection - temporarily disabled
      // const crashed = checkBarrierCollision(st.x, st.z);
      // if (crashed && !store.crashDetected) {
      //   store.setCrashDetected(true);
      //   store.setScreen("race-crash");
      //   st.speed = 0;
      // }

      // integrate
      st.x += Math.sin(st.heading) * st.speed * dt;
      st.z += Math.cos(st.heading) * st.speed * dt;

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
    tmp.set(st.x - fx * 15, 8.5, st.z - fz * 15);
    camera.position.lerp(tmp, racing ? 0.12 : 0.06);
    camera.lookAt(st.x, 1.4, st.z);
  });

  return <CarMesh ref={ref} color={vis.color} accent={vis.accent} />;
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

  return <CarMesh ref={ref} color={vis.color} accent={vis.accent} name={player.name} />;
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
      {me && (
        <LocalCar
          vehicleId={me.vehicle}
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
