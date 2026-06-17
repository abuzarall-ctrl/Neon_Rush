import { forwardRef } from "react";

// Enhanced supercar design - Pointed along +Z so heading 0 faces "forward".
// Used for both local and remote cars; all motion is applied to the outer group.
const CarMesh = forwardRef(function CarMesh({ color = "#19e3ff", accent = "#ffffff", name }, ref) {
  return (
    <group ref={ref}>
      {/* Underglow with enhanced glow */}
      <pointLight color={color} intensity={8} distance={12} position={[0, 0.5, 0]} />
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.8, 6.0]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>

      {/* Front bumper - aggressive design */}
      <mesh position={[0, 0.35, 2.4]} castShadow>
        <boxGeometry args={[2.1, 0.35, 0.6]} />
        <meshStandardMaterial color={accent} metalness={0.6} roughness={0.25} />
      </mesh>

      {/* Front splitter */}
      <mesh position={[0, 0.15, 2.5]}>
        <boxGeometry args={[2.0, 0.08, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Main chassis - sleek and elongated */}
      <mesh position={[0, 0.62, 0.2]} castShadow>
        <boxGeometry args={[2.0, 0.75, 4.8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Hood with smooth curve simulation */}
      <mesh position={[0, 0.75, 1.2]} castShadow>
        <boxGeometry args={[2.0, 0.15, 1.4]} />
        <meshStandardMaterial color={accent} metalness={0.45} roughness={0.3} />
      </mesh>

      {/* Windshield - dark and sleek */}
      <mesh position={[0, 1.15, 0.5]}>
        <boxGeometry args={[1.5, 0.65, 1.2]} />
        <meshStandardMaterial color="#0a0612" metalness={0.1} roughness={0.15} transparent opacity={0.9} />
      </mesh>

      {/* Roof section */}
      <mesh position={[0, 1.05, -0.3]} castShadow>
        <boxGeometry args={[1.4, 0.35, 1.6]} />
        <meshStandardMaterial color={accent} metalness={0.35} roughness={0.3} />
      </mesh>

      {/* Side vents - design detail */}
      <mesh position={[-1.1, 0.7, 0.5]}>
        <boxGeometry args={[0.15, 0.35, 0.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.1, 0.7, 0.5]}>
        <boxGeometry args={[0.15, 0.35, 0.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Rear cabin */}
      <mesh position={[0, 0.95, -1.2]} castShadow>
        <boxGeometry args={[1.2, 0.5, 1.4]} />
        <meshStandardMaterial color="#0b0820" metalness={0.2} roughness={0.2} />
      </mesh>

      {/* Rear wing - aggressive spoiler */}
      <mesh position={[0, 1.25, -2.2]} castShadow>
        <boxGeometry args={[2.2, 0.15, 0.6]} />
        <meshStandardMaterial color={accent} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Wing supports */}
      {[[-0.9, -1.9], [0.9, -1.9]].map(([x, z], i) => (
        <mesh key={`wing-${i}`} position={[x, 1.05, z]}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* Tail light bar - prominent LED */}
      <mesh position={[0, 0.7, -2.4]}>
        <boxGeometry args={[1.8, 0.22, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
      </mesh>

      {/* Tail bumper */}
      <mesh position={[0, 0.35, -2.6]} castShadow>
        <boxGeometry args={[2.0, 0.35, 0.4]} />
        <meshStandardMaterial color={accent} metalness={0.6} roughness={0.25} />
      </mesh>

      {/* High-performance wheels - larger and wider */}
      {[
        [-1.15, 1.8],
        [1.15, 1.8],
        [-1.15, -1.8],
        [1.15, -1.8],
      ].map(([wx, wz], i) => (
        <group key={`wheel-${i}`} position={[wx, 0.38, wz]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.48, 0.48, 0.48, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          {/* Rim/brake disc effect */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.05]}>
            <cylinderGeometry args={[0.35, 0.35, 0.08, 12]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Front headlights */}
      {[[-0.6, 0.5, 2.5], [0.6, 0.5, 2.5]].map(([x, y, z], i) => (
        <mesh key={`light-${i}`} position={[x, y, z]}>
          <boxGeometry args={[0.25, 0.25, 0.1]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
});

export default CarMesh;
