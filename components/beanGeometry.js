import * as THREE from "three";

// Proportions measured from the reference photo: long axis on y, width ≈ 70% of length,
// thickness ≈ 40% of length, split into a gently convex crease face (+z) and a domed back (−z).
export const BEAN = {
  halfLength: 1.16,
  halfWidth: 0.8,
  frontHeight: 0.24,
  frontExponent: 0.4, // keeps the rim pillowy rather than a sharp edge
  backHeight: 0.72,
  backExponent: 0.52,
  uvExtent: 1.2, // face-space square [-1.2, 1.2]² that each half of the texture atlas covers
};

const RADIAL_SAMPLES = 512;

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Gently S-shaped centre line of the crease (x offset at height y). scratch/bake_arka_bean.py uses the same formula.
export const creaseCenter = (y) => 0.05 * Math.sin(2.1 * y + 0.5) + 0.018 * Math.sin(5.3 * y);

// Distance along a face's profile from its centre to radius r, normalised to 1 at the rim.
// Used to spread UVs over the steep rim so the texture doesn't streak. Mirrored in the bake script.
function arcTable(height, exponent) {
  const step = (BEAN.halfLength + BEAN.halfWidth) / 2 / RADIAL_SAMPLES;
  const table = new Float32Array(RADIAL_SAMPLES + 1);
  let prev = height;
  for (let i = 1; i <= RADIAL_SAMPLES; i++) {
    const r = i / RADIAL_SAMPLES;
    const z = height * (1 - r * r) ** exponent;
    table[i] = table[i - 1] + Math.hypot(step, z - prev);
    prev = z;
  }
  const total = table[RADIAL_SAMPLES];
  for (let i = 0; i <= RADIAL_SAMPLES; i++) table[i] /= total;
  return table;
}

const lookup = (table, r) => {
  const f = r * RADIAL_SAMPLES;
  const i = Math.min(RADIAL_SAMPLES - 1, Math.floor(f));
  return table[i] + (table[i + 1] - table[i]) * (f - i);
};

// Organic lumpiness: layered sines at unrelated frequencies (cheap, deterministic, no seams).
const lumps = (x, y) =>
  0.016 * Math.sin(3.1 * x + 1.7 * y) +
  0.011 * Math.sin(5.3 * y - 2.2 * x + 1.1) +
  0.007 * Math.sin(9.7 * x + 6.1 * y + 2.3) +
  0.004 * Math.sin(17.3 * y - 11.9 * x + 0.7) +
  0.0025 * Math.sin(29.1 * x + 23.7 * y + 4.1);

/**
 * Two height-field faces over the bean outline, stitched at the rim.
 * A square grid is mapped onto the disc so grid lines run straight through the crease,
 * giving it even vertex density (a spherical mesh would put a pole right on the crease).
 * UVs: front face → left half of the atlas, back face → right half (mirrored in x).
 */
export function buildBeanGeometry(segments = 200) {
  const { halfLength: A, halfWidth: B, frontHeight: TF, frontExponent: EF, backHeight: TB, backExponent: EB, uvExtent: E } = BEAN;
  const tables = [arcTable(TF, EF), arcTable(TB, EB)];
  const n = segments + 1;
  const perFace = n * n;
  const positions = new Float32Array(perFace * 2 * 3);
  const uvs = new Float32Array(perFace * 2 * 2);
  const indices = [];

  for (let face = 0; face < 2; face++) {
    const front = face === 0;
    const base = face * perFace;
    const table = tables[face];

    for (let j = 0; j < n; j++) {
      const t = (j / segments) * 2 - 1;
      for (let i = 0; i < n; i++) {
        const s = (i / segments) * 2 - 1;
        const p = s * Math.sqrt(1 - (t * t) / 2);
        const q = t * Math.sqrt(1 - (s * s) / 2);
        const r2 = Math.min(1, p * p + q * q);
        const r = Math.sqrt(r2);
        const y = A * q;
        const x = B * (1 + 0.05 * q) * p; // slightly fuller at one end, like the reference
        const shell = Math.sqrt(1 - r2); // 0 at the rim so both faces meet exactly
        const d = x - creaseCenter(y);

        let z;
        if (front) {
          // Shallow, flat-bottomed fissure: in the reference the silverskin nearly fills it.
          const groove = 0.16 * (1 - smoothstep(0.84, 0.99, r)) * Math.exp(-((d / 0.058) ** 6));
          const lobes = 0.07 * Math.exp(-(((Math.abs(d) - 0.3) / 0.22) ** 2)) * shell;
          // Fine ridges running across the lobes, strongest just beside the crease.
          const ridges = 0.009 * Math.sin(y * 38 + 3 * Math.sin(y * 7 + d * 9)) * Math.exp(-(((Math.abs(d) - 0.16) / 0.12) ** 2));
          z = TF * (1 - r2) ** EF + lobes + ridges * shell - groove;
        } else {
          // Small notch where the crease wraps over the top tip onto the back.
          const notch = 0.09 * Math.exp(-((d / 0.06) ** 2) - ((y - A * 0.93) / 0.12) ** 2);
          z = -TB * (1 - r2) ** EB + notch;
        }
        z += (front ? 0.7 : 1) * lumps(x, y) * shell;

        const k = base + j * n + i;
        positions[k * 3] = x;
        positions[k * 3 + 1] = y;
        positions[k * 3 + 2] = z;
        // Spread UVs by distance along the surface; the factor is 1 at the rim so both faces meet in UV space too.
        const spread = r > 1e-4 ? lookup(table, r) / r : table[1] * RADIAL_SAMPLES;
        uvs[k * 2] = (front ? 0.25 : 0.75) + ((front ? 1 : -1) * x * spread) / (4 * E);
        uvs[k * 2 + 1] = 0.5 + (y * spread) / (2 * E);
      }
    }

    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < segments; i++) {
        const a = base + j * n + i;
        const b = a + 1;
        const c = a + n;
        const dd = c + 1;
        if (front) indices.push(a, b, c, b, dd, c);
        else indices.push(a, c, b, b, c, dd);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Faces are separate vertex sets (their UVs differ), so average normals along the rim for a smooth seam.
  const normals = geometry.attributes.normal.array;
  const v = new THREE.Vector3();
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (i !== 0 && i !== segments && j !== 0 && j !== segments) continue;
      const f = (j * n + i) * 3;
      const bk = (perFace + j * n + i) * 3;
      v.set(normals[f] + normals[bk], normals[f + 1] + normals[bk + 1], normals[f + 2] + normals[bk + 2]).normalize();
      normals[f] = normals[bk] = v.x;
      normals[f + 1] = normals[bk + 1] = v.y;
      normals[f + 2] = normals[bk + 2] = v.z;
    }
  }
  geometry.attributes.normal.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
}
