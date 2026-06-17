import { forwardRef } from "react";
import { getCarDesign } from "./vehicles.js";

// A single performance wheel: fat low-profile tyre + machined rim + brake glow.
function Wheel({ x, z, radius = 0.5, width = 0.5, accent = "#ffffff" }) {
  return (
    <group position={[x, radius - 0.12, z]}>
      {/* tyre */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius, radius, width, 24]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* rim face */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[Math.sign(x) * width * 0.55, 0, 0]}>
        <cylinderGeometry args={[radius * 0.66, radius * 0.66, 0.06, 8]} />
        <meshStandardMaterial color="#d7dbe6" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* brake-disc glow */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[Math.sign(x) * width * 0.3, 0, 0]}>
        <cylinderGeometry args={[radius * 0.5, radius * 0.5, 0.04, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// Geometry presets per body style. Everything is expressed relative to a car
// pointing along +Z so heading 0 faces "forward".
const SHAPES = {
  gt: { bodyW: 2.0, bodyL: 4.9, cabin: "coupe", flare: 0, wing: "medium", ride: 0.34, fins: false },
  roadster: { bodyW: 1.95, bodyL: 4.7, cabin: "open", flare: 0.06, wing: "duck", ride: 0.3, fins: false },
  widebody: { bodyW: 2.35, bodyL: 5.0, cabin: "coupe", flare: 0.22, wing: "swan", ride: 0.32, fins: false },
  muscle: { bodyW: 2.2, bodyL: 5.1, cabin: "fastback", flare: 0.12, wing: "lip", ride: 0.4, fins: false },
  hyper: { bodyW: 2.05, bodyL: 5.0, cabin: "canopy", flare: 0.16, wing: "swan", ride: 0.26, fins: true },
};

// Enhanced supercar. `design` selects the body silhouette; color/accent come
// from the chosen vehicle. Used for both the local and remote cars; all motion
// is applied to the outer group.
const CarMesh = forwardRef(function CarMesh(
  { color = "#19e3ff", accent = "#ffffff", design = "gt" },
  ref
) {
  const shape = SHAPES[getCarDesign(design).shape] || SHAPES.gt;
  const { bodyW, bodyL, cabin, flare, wing, ride, fins } = shape;
  const hw = bodyW / 2;

  return (
    <group ref={ref}>
      {/* underglow pool + light */}
      <pointLight color={color} intensity={9} distance={13} position={[0, 0.5, 0]} />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bodyW + 1.6, bodyL + 1.2]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} />
      </mesh>

      {/* ---------- lower chassis / floor pan ---------- */}
      <mesh position={[0, ride, -0.1]} castShadow>
        <boxGeometry args={[bodyW, 0.45, bodyL]} />
        <meshStandardMaterial color="#0b0b12" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ---------- main bodywork (tapered with a narrow upper deck) ---------- */}
      <mesh position={[0, ride + 0.4, 0.1]} castShadow>
        <boxGeometry args={[bodyW - 0.05, 0.5, bodyL - 0.5]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.22} />
      </mesh>
      <mesh position={[0, ride + 0.7, 0.3]} castShadow>
        <boxGeometry args={[bodyW - 0.55, 0.34, bodyL - 1.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.25} />
      </mesh>

      {/* sculpted hood with accent intake */}
      <mesh position={[0, ride + 0.62, 1.55]} castShadow>
        <boxGeometry args={[bodyW - 0.35, 0.18, 1.5]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, ride + 0.66, 1.4]}>
        <boxGeometry args={[0.5, 0.12, 1.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>

      {/* pointed nose / front splitter */}
      <mesh position={[0, ride + 0.18, bodyL / 2 - 0.15]} castShadow>
        <boxGeometry args={[bodyW + 0.05, 0.18, 0.7]} />
        <meshStandardMaterial color="#15151c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, ride + 0.42, bodyL / 2 + 0.05]} castShadow>
        <boxGeometry args={[bodyW - 0.25, 0.3, 0.5]} />
        <meshStandardMaterial color={accent} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* ---------- cabin / greenhouse (varies by design) ---------- */}
      {cabin === "open" ? (
        <>
          {/* short wraparound windscreen, open top */}
          <mesh position={[0, ride + 0.95, 0.55]}>
            <boxGeometry args={[bodyW - 0.7, 0.42, 0.12]} />
            <meshStandardMaterial color="#0a0612" metalness={0.1} roughness={0.1} transparent opacity={0.7} />
          </mesh>
          {/* twin roll hoops */}
          {[-0.45, 0.45].map((x) => (
            <mesh key={`hoop-${x}`} position={[x, ride + 0.95, -0.5]}>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshStandardMaterial color={accent} metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* glass canopy / windshield */}
          <mesh position={[0, ride + 1.02, 0.55]}>
            <boxGeometry args={[bodyW - 0.6, 0.6, cabin === "fastback" ? 1.7 : 1.4]} />
            <meshStandardMaterial
              color={cabin === "canopy" ? "#0c1426" : "#0a0612"}
              metalness={0.2}
              roughness={0.08}
              transparent
              opacity={0.82}
            />
          </mesh>
          {/* roof skin */}
          <mesh position={[0, ride + 1.28, cabin === "fastback" ? -0.15 : 0.1]} castShadow>
            <boxGeometry args={[bodyW - 0.7, 0.16, cabin === "fastback" ? 1.9 : 1.2]} />
            <meshStandardMaterial color={accent} metalness={0.5} roughness={0.25} />
          </mesh>
        </>
      )}

      {/* side intake pods */}
      {[-1, 1].map((s) => (
        <mesh key={`vent-${s}`} position={[s * (hw - 0.02), ride + 0.55, -0.6]}>
          <boxGeometry args={[0.12, 0.3, 1.0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* fender flares for the wide / muscle / hyper bodies */}
      {flare > 0 &&
        [
          [-1, 1.75],
          [1, 1.75],
          [-1, -1.75],
          [1, -1.75],
        ].map(([s, z], i) => (
          <mesh key={`flare-${i}`} position={[s * (hw + flare / 2 - 0.02), ride + 0.42, z]} castShadow>
            <boxGeometry args={[flare + 0.1, 0.4, 1.3]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

      {/* ---------- rear deck + engine cover ---------- */}
      <mesh position={[0, ride + 0.6, -bodyL / 2 + 0.7]} castShadow>
        <boxGeometry args={[bodyW - 0.3, 0.3, 1.2]} />
        <meshStandardMaterial color="#101018" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* engine louvres glow */}
      {[-0.4, 0, 0.4].map((x) => (
        <mesh key={`louvre-${x}`} position={[x, ride + 0.76, -bodyL / 2 + 0.7]}>
          <boxGeometry args={[0.22, 0.04, 0.9]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
        </mesh>
      ))}

      {/* ---------- rear wing (style dependent) ---------- */}
      {wing === "swan" && (
        <>
          {[[-0.7, -0.2], [0.7, -0.2]].map(([x, lean], i) => (
            <mesh key={`swan-${i}`} position={[x, ride + 1.1, -bodyL / 2 + 0.2]} rotation={[lean, 0, 0]}>
              <boxGeometry args={[0.09, 0.85, 0.14]} />
              <meshStandardMaterial color="#15151c" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, ride + 1.5, -bodyL / 2 + 0.05]} castShadow>
            <boxGeometry args={[bodyW + 0.5, 0.1, 0.7]} />
            <meshStandardMaterial color={accent} emissive={color} emissiveIntensity={0.7} metalness={0.5} />
          </mesh>
        </>
      )}
      {wing === "medium" && (
        <>
          {[[-0.85], [0.85]].map(([x], i) => (
            <mesh key={`sup-${i}`} position={[x, ride + 0.95, -bodyL / 2 + 0.3]}>
              <boxGeometry args={[0.1, 0.55, 0.12]} />
              <meshStandardMaterial color="#15151c" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, ride + 1.2, -bodyL / 2 + 0.2]} castShadow>
            <boxGeometry args={[bodyW + 0.3, 0.1, 0.6]} />
            <meshStandardMaterial color={accent} emissive={color} emissiveIntensity={0.6} metalness={0.5} />
          </mesh>
        </>
      )}
      {wing === "duck" && (
        <mesh position={[0, ride + 0.82, -bodyL / 2 + 0.35]} castShadow>
          <boxGeometry args={[bodyW - 0.2, 0.12, 0.5]} />
          <meshStandardMaterial color={accent} emissive={color} emissiveIntensity={0.5} metalness={0.5} />
        </mesh>
      )}
      {wing === "lip" && (
        <mesh position={[0, ride + 0.78, -bodyL / 2 + 0.25]} castShadow>
          <boxGeometry args={[bodyW, 0.08, 0.35]} />
          <meshStandardMaterial color={accent} metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {/* hypercar twin tail fins */}
      {fins &&
        [-0.55, 0.55].map((x) => (
          <mesh key={`fin-${x}`} position={[x, ride + 0.95, -bodyL / 2 + 0.9]}>
            <boxGeometry args={[0.08, 0.5, 0.9]} />
            <meshStandardMaterial color={accent} emissive={color} emissiveIntensity={0.5} metalness={0.6} />
          </mesh>
        ))}

      {/* ---------- lighting signatures ---------- */}
      {/* headlights */}
      {[-0.62, 0.62].map((x) => (
        <mesh key={`hl-${x}`} position={[x, ride + 0.42, bodyL / 2 - 0.05]}>
          <boxGeometry args={[0.34, 0.12, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#dff4ff" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {/* full-width rear light bar */}
      <mesh position={[0, ride + 0.55, -bodyL / 2 + 0.02]}>
        <boxGeometry args={[bodyW - 0.2, 0.16, 0.08]} />
        <meshStandardMaterial color="#ff2a3a" emissive="#ff2a3a" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[0, ride + 0.32, -bodyL / 2 - 0.02]} castShadow>
        <boxGeometry args={[bodyW - 0.3, 0.18, 0.35]} />
        <meshStandardMaterial color="#101018" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* rear diffuser fins */}
      {[-0.5, -0.17, 0.17, 0.5].map((x) => (
        <mesh key={`diff-${x}`} position={[x, ride + 0.12, -bodyL / 2 - 0.05]}>
          <boxGeometry args={[0.08, 0.22, 0.5]} />
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* ---------- wheels ---------- */}
      {(() => {
        const wheelX = hw + flare - 0.05;
        const r = 0.52;
        return (
          <>
            <Wheel x={-wheelX} z={1.6} radius={r} width={0.5} accent={accent} />
            <Wheel x={wheelX} z={1.6} radius={r} width={0.5} accent={accent} />
            <Wheel x={-wheelX} z={-1.7} radius={r + 0.04} width={0.6} accent={accent} />
            <Wheel x={wheelX} z={-1.7} radius={r + 0.04} width={0.6} accent={accent} />
          </>
        );
      })()}
    </group>
  );
});

export default CarMesh;
