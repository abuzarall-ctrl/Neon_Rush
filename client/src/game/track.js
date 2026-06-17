// Pure geometry for the track. No Three.js objects here so both the renderer
// (Track.jsx) and the physics step (Car.jsx) can share one source of truth.

export const TRACK = buildTrack({
  rx: 78,
  rz: 52,
  width: 16,
  segments: 240,
  // Gentle "peanut" pinch so the oval has two distinct corner characters.
  pinch: 0.22,
});

function buildTrack({ rx, rz, width, segments, pinch }) {
  const center = []; // {x, z}
  const left = [];
  const right = [];
  const tangents = []; // unit forward {x, z}
  const cumLen = [];

  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // Base ellipse with a sinusoidal pinch on X to break symmetry.
    const squeeze = 1 - pinch * Math.cos(t * 2) * 0.5;
    const x = Math.cos(t) * rx * squeeze;
    const z = Math.sin(t) * rz;
    center.push({ x, z });
  }

  // Tangents via central differences, then left/right offsets.
  for (let i = 0; i < segments; i++) {
    const a = center[(i - 1 + segments) % segments];
    const b = center[(i + 1) % segments];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    tangents.push({ x: tx, z: tz });
    // Left normal = rotate tangent +90°: (-tz, tx)
    const nx = -tz;
    const nz = tx;
    const c = center[i];
    left.push({ x: c.x + nx * (width / 2), z: c.z + nz * (width / 2) });
    right.push({ x: c.x - nx * (width / 2), z: c.z - nz * (width / 2) });
  }

  // Cumulative arc length for progress %.
  let total = 0;
  cumLen.push(0);
  for (let i = 1; i <= segments; i++) {
    const a = center[i - 1];
    const b = center[i % segments];
    total += Math.hypot(b.x - a.x, b.z - a.z);
    cumLen.push(total);
  }

  const startIndex = 0; // start/finish line sits at segment 0

  return {
    center,
    left,
    right,
    tangents,
    cumLen,
    totalLength: total,
    width,
    segments,
    startIndex,
    startPoint: center[startIndex],
    startTangent: tangents[startIndex],
  };
}

// Brute-force nearest centerline sample. segments=240 is cheap to scan once a
// frame for the single local car.
export function nearestSample(x, z) {
  const { center, segments } = TRACK;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < segments; i++) {
    const c = center[i];
    const dx = c.x - x;
    const dz = c.z - z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { index: best, dist: Math.sqrt(bestD) };
}

// Lateral distance from the racing line; > width/2 means off-road.
export function offRoadAmount(x, z) {
  const { dist } = nearestSample(x, z);
  return Math.max(0, dist - TRACK.width / 2);
}

// Progress around the lap as 0..1 from the nearest sample index.
export function lapProgress(index) {
  return TRACK.cumLen[index] / TRACK.totalLength;
}

// A heading (radians around Y) that points along the track at a sample.
export function tangentHeading(index) {
  const t = TRACK.tangents[index];
  return Math.atan2(t.x, t.z);
}

// Starting-grid slot for the i-th racer: staggered rows behind the line so cars
// don't spawn on top of each other.
export function gridSlot(i) {
  const f = TRACK.startTangent; // forward unit vector
  const nx = -f.z; // left normal
  const nz = f.x;
  const base = TRACK.startPoint;
  const lane = (i % 4) - 1.5; // -1.5 .. 1.5 across the road
  const row = Math.floor(i / 4);
  const back = 6 + row * 6; // metres behind the line
  const side = lane * 3.4;
  return {
    x: base.x - f.x * back + nx * side,
    z: base.z - f.z * back + nz * side,
    heading: Math.atan2(f.x, f.z),
  };
}

// Check for barrier collisions
export function checkBarrierCollision(x, z) {
  // Barriers are placed on the outside of the track
  const barriers = [];
  
  // Left side barriers
  for (let i = 0; i < TRACK.segments; i += 5) {
    const t = TRACK.tangents[i];
    const e = TRACK.left[i];
    const nx = -t.z;
    const nz = t.x;
    barriers.push({
      x: e.x + nx * 1.5,
      z: e.z + nz * 1.5,
      radius: 0.5,
    });
  }
  
  // Right side barriers
  for (let i = 0; i < TRACK.segments; i += 5) {
    const t = TRACK.tangents[i];
    const e = TRACK.right[i];
    const nx = -t.z;
    const nz = t.x;
    barriers.push({
      x: e.x - nx * 1.5,
      z: e.z - nz * 1.5,
      radius: 0.5,
    });
  }
  
  // Check distance to each barrier
  for (const barrier of barriers) {
    const dx = barrier.x - x;
    const dz = barrier.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist < barrier.radius + 1.2) { // 1.2 is roughly the car radius
      return true;
    }
  }
  return false;
}
