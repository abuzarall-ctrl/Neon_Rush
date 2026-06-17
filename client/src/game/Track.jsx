import { useMemo } from "react";
import * as THREE from "three";
import { TRACK } from "./track.js";

function buildRoadGeometry() {
  const { left, right, segments } = TRACK;
  const positions = [];
  const uvs = [];
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    const l0 = left[i],
      r0 = right[i],
      l1 = left[j],
      r1 = right[j];
    const y = 0.02;
    // two triangles per quad
    positions.push(l0.x, y, l0.z, r0.x, y, r0.z, l1.x, y, l1.z);
    positions.push(r0.x, y, r0.z, r1.x, y, r1.z, l1.x, y, l1.z);
    const v0 = i / segments;
    const v1 = j / segments;
    uvs.push(0, v0, 1, v0, 0, v1);
    uvs.push(1, v0, 1, v1, 0, v1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}

function buildCenterlineGeometry() {
  // Dashed centerline down the middle of the track
  const { left, right, segments } = TRACK;
  const positions = [];
  const w = 0.15; // width of dashes
  
  for (let i = 0; i < segments; i++) {
    if (i % 5 !== 0) continue; // Skip to create dashed effect
    
    const j = (i + 1) % segments;
    const l0 = left[i],
      r0 = right[i],
      l1 = left[j],
      r1 = right[j];
    
    // Center points
    const c0 = { x: (l0.x + r0.x) / 2, z: (l0.z + r0.z) / 2 };
    const c1 = { x: (l1.x + r1.x) / 2, z: (l1.z + r1.z) / 2 };
    
    // Perpendicular direction
    const dx = c1.x - c0.x;
    const dz = c1.z - c0.z;
    const len = Math.hypot(dx, dz);
    const px = -dz / len * w;
    const pz = dx / len * w;
    
    const y = 0.03;
    positions.push(
      c0.x - px, y, c0.z - pz,
      c0.x + px, y, c0.z + pz,
      c1.x - px, y, c1.z - pz
    );
    positions.push(
      c0.x + px, y, c0.z + pz,
      c1.x + px, y, c1.z + pz,
      c1.x - px, y, c1.z - pz
    );
  }
  
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

function buildEdgeGeometry(side) {
  // Thin glowing ribbon just outside the road edge.
  const { left, right, tangents, segments } = TRACK;
  const src = side === "left" ? left : right;
  const dir = side === "left" ? 1 : -1;
  const positions = [];
  const w = 0.9;
  const pts = src.map((p, i) => {
    const t = tangents[i];
    const nx = -t.z * dir;
    const nz = t.x * dir;
    return { inner: p, outer: { x: p.x + nx * w, z: p.z + nz * w } };
  });
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    const a = pts[i],
      b = pts[j];
    const y = 0.05;
    positions.push(a.inner.x, y, a.inner.z, a.outer.x, y, a.outer.z, b.inner.x, y, b.inner.z);
    positions.push(a.outer.x, y, a.outer.z, b.outer.x, y, b.outer.z, b.inner.x, y, b.inner.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

function buildBarriers() {
  // Create collision barriers on the outside of the track
  const { left, right, tangents, segments } = TRACK;
  const barriers = [];
  
  // Left side barriers
  for (let i = 0; i < segments; i += 5) {
    const t = tangents[i];
    const e = left[i];
    const nx = -t.z;
    const nz = t.x;
    barriers.push({
      pos: { x: e.x + nx * 1.5, z: e.z + nz * 1.5 },
      color: "#ff2e97",
      side: "left",
      index: i
    });
  }
  
  // Right side barriers
  for (let i = 0; i < segments; i += 5) {
    const t = tangents[i];
    const e = right[i];
    const nx = -t.z;
    const nz = t.x;
    barriers.push({
      pos: { x: e.x - nx * 1.5, z: e.z - nz * 1.5 },
      color: "#19e3ff",
      side: "right",
      index: i
    });
  }
  
  return barriers;
}

export default function Track() {
  const road = useMemo(buildRoadGeometry, []);
  const centerline = useMemo(buildCenterlineGeometry, []);
  const edgeL = useMemo(() => buildEdgeGeometry("left"), []);
  const edgeR = useMemo(() => buildEdgeGeometry("right"), []);
  const barriers = useMemo(buildBarriers, []);

  // Start/finish bar spanning the road at segment 0.
  const start = useMemo(() => {
    const l = TRACK.left[0];
    const r = TRACK.right[0];
    const mid = { x: (l.x + r.x) / 2, z: (l.z + r.z) / 2 };
    const angle = Math.atan2(TRACK.startTangent.x, TRACK.startTangent.z);
    const width = Math.hypot(l.x - r.x, l.z - r.z);
    return { mid, angle, width };
  }, []);

  // Enhanced pylons scattered along the outside for a sense of speed.
  const pylons = useMemo(() => {
    const out = [];
    const palette = ["#ff2e97", "#19e3ff", "#ffb627", "#b6ff3c"];
    for (let i = 0; i < TRACK.segments; i += 8) {
      const t = TRACK.tangents[i];
      const e = TRACK.left[i];
      const nx = -t.z;
      const nz = t.x;
      out.push({
        x: e.x + nx * 6.5,
        z: e.z + nz * 6.5,
        c: palette[(i / 8) % palette.length],
        h: 4 + ((i * 7) % 6),
        width: 0.6,
        depth: 0.6,
      });
      const e2 = TRACK.right[i];
      out.push({
        x: e2.x - nx * 6.5,
        z: e2.z - nz * 6.5,
        c: palette[((i / 8) + 2) % palette.length],
        h: 4 + ((i * 5) % 6),
        width: 0.6,
        depth: 0.6,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {/* Enhanced dark ground with gradient */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#0a0612" roughness={1} />
      </mesh>
      
      {/* More detailed grid with dual-layer effect */}
      <gridHelper args={[600, 120, "#1a2a4f", "#080f1a"]} position={[0, 0.001, 0]} />
      <gridHelper args={[600, 60, "#0f1f40", "#050a10"]} position={[0, 0.0005, 0]} />

      {/* road */}
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial color="#0d0a15" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* centerline dashes */}
      <mesh geometry={centerline}>
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.8} />
      </mesh>

      {/* glowing edges - enhanced */}
      <mesh geometry={edgeL}>
        <meshStandardMaterial color="#ff2e97" emissive="#ff2e97" emissiveIntensity={1.3} />
      </mesh>
      <mesh geometry={edgeR}>
        <meshStandardMaterial color="#19e3ff" emissive="#19e3ff" emissiveIntensity={1.3} />
      </mesh>

      {/* start / finish bar - enhanced */}
      <mesh position={[start.mid.x, 0.06, start.mid.z]} rotation={[-Math.PI / 2, 0, start.angle]}>
        <planeGeometry args={[start.width, 2.4]} />
        <meshStandardMaterial color="#f4f2ff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>

      {/* pylons - enhanced with more detail */}
      {pylons.map((p, i) => (
        <group key={`pylon-${i}`} position={[p.x, 0, p.z]}>
          {/* Main pylon body */}
          <mesh position={[0, p.h / 2, 0]} castShadow>
            <boxGeometry args={[p.width, p.h, p.depth]} />
            <meshStandardMaterial color={p.c} emissive={p.c} emissiveIntensity={1.5} metalness={0.3} />
          </mesh>
          {/* Top light cap */}
          <mesh position={[0, p.h + 0.3, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color={p.c} emissive={p.c} emissiveIntensity={2} />
          </mesh>
          {/* Glow light */}
          <pointLight color={p.c} intensity={3} distance={20} position={[0, p.h + 0.3, 0]} />
        </group>
      ))}

      {/* Track barriers for collision detection */}
      {barriers.map((b, i) => (
        <mesh key={`barrier-${i}`} position={[b.pos.x, 0.8, b.pos.z]} castShadow data-barrier={`${b.side}-${b.index}`}>
          <boxGeometry args={[0.4, 1.6, 0.4]} />
          <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.8} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
