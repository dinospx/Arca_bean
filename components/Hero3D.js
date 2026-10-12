"use client";
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";


// Coffee bean ellipsoid, textured with the real product photos (see Bean
// below) rather than shaded from a procedural crease — carving a geometric
// groove here would fight the crease already baked into those photos,
// since the two aren't at the same angular position once the texture is
// rotated to face the camera (see texture.offset.x in Bean).
function buildBeanGeometry(segments = 128) {
  const geo = new THREE.SphereGeometry(1, segments, segments);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Bean proportions: longer on Y, flattened on Z.
    v.x *= 0.6;
    v.y *= 1;
    v.z *= 0.42;

    // Cheap organic irregularity: layered sine noise, sub-percent amplitude.
    const n =
      Math.sin(v.x * 18 + v.y * 7) * 0.006 +
      Math.sin(v.y * 23 - v.z * 11) * 0.005 +
      Math.sin(v.x * 9 + v.z * 29) * 0.004;
    const len = v.length() || 1;
    v.addScaledVector(v.clone().divideScalar(len), n);

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

function Particles({ count, reducedMotion }) {
  const ref = useRef(null);
  const { positions, phases, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 2.2 + Math.random() * 1.6;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius * (0.5 + Math.random() * 0.5);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius * (0.3 + Math.random() * 0.4);
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.15 + Math.random() * 0.2;
    }
    return { positions, phases, speeds };
  }, [count]);

  const base = useMemo(() => positions.slice(), [positions]);

  useFrame(({ clock }) => {
    if (reducedMotion || !ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * speeds[i] + phases[i]) * 0.25;
      arr[i * 3] = base[i * 3] + Math.cos(t * speeds[i] * 0.6 + phases[i]) * 0.12;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#c9a06a"
        transparent
        opacity={0.45}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// High-density coffee powder particles: 12,000 grounds in roasted coffee tones
// that emerge directly from the bean volume and swirl outward as the user scrolls.
function buildPowderData(count) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const palette = [
    [0.18, 0.09, 0.04], // dark espresso
    [0.28, 0.15, 0.07], // deep roast
    [0.42, 0.23, 0.12], // medium brown
    [0.58, 0.35, 0.18], // warm roasted
    [0.75, 0.52, 0.32], // golden crema chaff
  ];

  for (let i = 0; i < count; i++) {
    const onSurface = Math.random() < 0.35;
    const r = onSurface ? (0.92 + Math.random() * 0.12) : Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.cos(phi);
    let z = r * Math.sin(phi) * Math.sin(theta);

    // Match bean proportions
    x *= 0.6;
    y *= 1.0;
    z *= 0.42;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const speed = 0.8 + Math.random() * 1.6;
    const dirX = x * 1.5 + (Math.random() - 0.5) * 0.6;
    const dirY = y * 0.9 + (Math.random() - 0.5) * 1.0;
    const dirZ = z * 1.8 + (Math.random() - 0.5) * 0.8;
    const len = Math.hypot(dirX, dirY, dirZ) || 1;

    velocities[i * 3] = (dirX / len) * speed;
    velocities[i * 3 + 1] = (dirY / len) * speed;
    velocities[i * 3 + 2] = (dirZ / len) * speed;

    phases[i] = Math.random();
    sizes[i] = 1.2 + Math.random() * 2.8;

    const c = palette[Math.floor(Math.random() * palette.length)];
    const tint = 0.85 + Math.random() * 0.3;
    colors[i * 3] = Math.min(1, c[0] * tint);
    colors[i * 3 + 1] = Math.min(1, c[1] * tint);
    colors[i * 3 + 2] = Math.min(1, c[2] * tint);
  }
  return { positions, velocities, phases, sizes, colors };
}

const powderVertexShader = `
uniform float uProgress;
uniform float uTime;
uniform float uPixelRatio;

attribute vec3 aVelocity;
attribute float aPhase;
attribute float aSize;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;
  float p = clamp(uProgress, 0.0, 1.0);
  
  float burst = pow(p, 0.85);
  vec3 disp = aVelocity * (burst * 2.8);
  
  float angle = burst * (2.4 + aPhase * 1.6);
  float s = sin(angle);
  float c = cos(angle);
  vec3 swirled = disp;
  swirled.x = disp.x * c - disp.z * s;
  swirled.z = disp.x * s + disp.z * c;
  
  float vertDrift = sin(p * 3.14159) * 0.35 - pow(p, 1.6) * 1.1;
  float flutter = sin(uTime * 2.0 + aPhase * 6.28) * 0.06 * burst;
  
  vec3 newPos = position + swirled;
  newPos.y += vertDrift + flutter;
  newPos.x += cos(uTime * 1.4 + aPhase) * 0.05 * burst;
  
  vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  float sizeFactor = (1.0 + burst * 0.7);
  gl_PointSize = aSize * sizeFactor * uPixelRatio * (28.0 / -mvPosition.z);
  
  float fadeIn = smoothstep(0.02, 0.16, p);
  float fadeOut = 1.0 - smoothstep(0.80, 1.0, p);
  vAlpha = fadeIn * fadeOut;
}
`;

const powderFragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  if (vAlpha <= 0.001) discard;
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float edge = smoothstep(0.5, 0.25, dist);
  vec3 col = vColor * (0.85 + 0.3 * (1.0 - dist * 2.0));
  gl_FragColor = vec4(col, vAlpha * edge * 0.95);
}
`;

function CoffeePowder({ scrollProgress, reducedMotion }) {
  const matRef = useRef(null);
  const count = 12000;
  
  const { positions, velocities, phases, sizes, colors } = useMemo(() => buildPowderData(count), [count]);
  
  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 }
  }), []);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uProgress.value = reducedMotion ? 0 : scrollProgress.current;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aVelocity" args={[velocities, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={powderVertexShader}
        fragmentShader={powderFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

// A continuous fall of real coffee beans behind the hero bean: one wide photo
// of scattered beans, scrolled down a plane and looped with RepeatWrapping.
// bean-curtain.webp has its edge-cut beans removed so the loop has no seam.
const CURTAIN_ASPECT = 1671 / 941;
const CURTAIN_Z = -2.6;
const CURTAIN_MIN_TILE_W = 7;
const CURTAIN_SPEED = 0.45;

function BeanCurtain({ reducedMotion }) {
  const texture = useTexture("/bean-curtain.webp");
  const { camera, size } = useThree();

  // Cover the view at the farthest camera position, with margin for pointer sway.
  const viewH = 2 * (6.4 - CURTAIN_Z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const height = viewH * 1.25;
  const width = height * (size.width / size.height) * 1.1;
  // Never shrink a tile below a phone-friendly width; narrow screens crop the centre instead.
  const tileW = Math.max(width, CURTAIN_MIN_TILE_W);
  const tileH = tileW / CURTAIN_ASPECT;

  useMemo(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  texture.repeat.set(width / tileW, height / tileH);
  texture.offset.x = (1 - width / tileW) / 2;

  useFrame((_, delta) => {
    if (reducedMotion) return;
    texture.offset.y = (texture.offset.y + (delta * CURTAIN_SPEED) / tileH) % 1;
  });

  return (
    <mesh position={[0, 0, CURTAIN_Z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent opacity={0.6} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

function Bean({ reducedMotion, scrollProgress, pointer, narrow }) {
  const group = useRef(null);
  const material = useRef(null);
  const geometry = useMemo(() => buildBeanGeometry(), []);
  const texture = useTexture("/arka-bean-texture.jpg");
  const { viewport, gl } = useThree();
  const restX = narrow ? 0 : Math.max(0.6, viewport.width * 0.14);
  const baseScale = narrow ? 0.65 : Math.min(1.15, Math.max(0.85, viewport.width * 0.21));

  useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = gl ? gl.capabilities.getMaxAnisotropy() : 8;
    texture.needsUpdate = true;
  }, [texture, gl]);

  // arka-bean-texture.jpg is seamless across the entire bean.
  // Offset 0 keeps the Arka logo centered with NO gap on either side.
  texture.offset.x = 0;

  useFrame((_, delta) => {
    if (!group.current) return;
    const progress = scrollProgress.current;

    if (!reducedMotion) {
      group.current.rotation.y += delta * (0.18 + progress * 0.6);
      const targetRotX = pointer.current.y * 0.15;
      const targetRotZOffset = pointer.current.x * 0.1;
      group.current.rotation.x += (targetRotX - group.current.rotation.x) * 0.04;
      group.current.rotation.z += (targetRotZOffset * 0.3 - group.current.rotation.z) * 0.04;
    }

    // Bean stays in its position — does NOT move right!
    group.current.position.x += (restX - group.current.position.x) * 0.08;

    // Solid bean dissolves as coffee powder emerges
    if (material.current) {
      const targetOpacity = Math.max(0, 1 - progress * 3.5);
      material.current.opacity = targetOpacity;
      material.current.transparent = targetOpacity < 0.999;
    }

    // Subtle scale transition as the bean crumbles
    const targetScale = THREE.MathUtils.lerp(baseScale, baseScale * 0.85, Math.min(1, progress * 2.0));
    const s = group.current.scale.x + (targetScale - group.current.scale.x) * 0.08;
    group.current.scale.setScalar(s);
  });

  return (
    <group ref={group} position={[restX, 0, 0]} scale={baseScale}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={material}
          map={texture}
          roughness={0.55}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          sheen={0.15}
          sheenColor="#a9784d"
          transparent
          opacity={1}
        />
      </mesh>
      <CoffeePowder scrollProgress={scrollProgress} reducedMotion={reducedMotion} />
    </group>
  );
}

function Rig({ pointer, scrollProgress, narrow }) {
  useFrame(({ camera }) => {
    const targetX = pointer.current.x * 0.35;
    const targetY = pointer.current.y * -0.2 + 0.1;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z = THREE.MathUtils.lerp(narrow ? 6.4 : 5.2, narrow ? 5.6 : 4.4, scrollProgress.current);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Hero3D({ reducedMotion, particleCount, scrollProgressRef, narrow, active = true }) {
  const pointer = useRef({ x: 0, y: 0 });

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 32, position: [0, 0.1, 5.2] }}
      onPointerMove={(e) => {
        if (!e.pointer) return;
        pointer.current.x = e.pointer.x || 0;
        pointer.current.y = e.pointer.y || 0;
      }}
      style={{ pointerEvents: reducedMotion ? "none" : "auto" }}
    >
      <color attach="background" args={["#140b06"]} />
      <fogExp2 attach="fog" args={["#140b06", 0.09]} />
      <ambientLight intensity={0.45} color="#5a3d24" />
      <directionalLight position={[3, 4, 3]} intensity={1.4} color="#ffb877" castShadow={false} />
      <directionalLight position={[-3, -1, -2]} intensity={0.9} color="#8a6a4a" />
      <pointLight position={[1.5, -1.5, 2]} intensity={0.6} color="#ffcf9c" />

      <Suspense fallback={null}>
        <BeanCurtain reducedMotion={reducedMotion} />
      </Suspense>
      <Particles count={particleCount} reducedMotion={reducedMotion} />
      <Rig pointer={pointer} scrollProgress={scrollProgressRef} narrow={narrow} />
    </Canvas>
  );
}
