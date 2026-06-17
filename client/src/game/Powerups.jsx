import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useStore } from "./store";

function Powerup({ x, z }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={[x, 1, z]} ref={ref}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ffb627"
          emissive="#ffb627"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#ffb627" intensity={20} distance={5} />
    </group>
  );
}

export default function Powerups() {
  const powerups = useStore((s) => s.room?.powerups) || [];

  return (
    <>
      {powerups.map(
        (p) => !p.collected && <Powerup key={p.id} x={p.x} z={p.z} />
      )}
    </>
  );
}