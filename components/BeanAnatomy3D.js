"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { buildBeanGeometry } from "./beanGeometry";

// Gentle rising aroma and golden coffee chaff particles
function AromaParticles({ count = 80, reducedMotion }) {
  const pointsRef = useRef(null);

  const { positions, speeds, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 0.8 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius * 0.7;
      pos[i * 3 + 1] = (Math.random() - 0.4) * 3.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
      spd[i] = 0.2 + Math.random() * 0.35;
      off[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, speeds: spd, offsets: off };
  }, [count]);

  const initialY = useMemo(() => positions.slice(), [positions]);

  useFrame(({ clock }) => {
    if (reducedMotion || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    const arr = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      // Drift upwards gently
      let y = arr[i * 3 + 1] + speeds[i] * 0.015;
      if (y > 2.8) y = -1.8;
      arr[i * 3 + 1] = y;

      // Subtle horizontal sway
      arr[i * 3] = initialY[i * 3] + Math.sin(t * 0.8 + offsets[i]) * 0.12;
      arr[i * 3 + 2] = initialY[i * 3 + 2] + Math.cos(t * 0.6 + offsets[i]) * 0.08;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        color="#dfccbf"
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function HeroBean({ scrollProgress, pointer, reducedMotion, narrow }) {
  const groupRef = useRef(null);
  const geometry = useMemo(() => buildBeanGeometry(narrow ? 140 : 200), [narrow]);

  // Baked by scratch/bake_arka_bean.py to match beanGeometry's UV layout.
  const [colorMap, bumpMap, roughnessMap] = useTexture([
    "/models/arka-bean-color.jpg",
    "/models/arka-bean-bump.jpg",
    "/models/arka-bean-roughness.jpg",
  ]);

  const { viewport, gl } = useThree();

  useMemo(() => {
    const anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    colorMap.colorSpace = THREE.SRGBColorSpace;
    for (const tex of [colorMap, bumpMap, roughnessMap]) {
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.anisotropy = anisotropy;
      tex.needsUpdate = true;
    }
  }, [colorMap, bumpMap, roughnessMap, gl]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const p = scrollProgress.current;

    // Zoom and scale choreographed by scroll progress:
    // Phase 1 (0 to 0.25): initial presentation (scale 1.0 to 1.35)
    // Phase 2 (0.25 to 0.65): macro inspection zoom (scale up to 1.75)
    // Phase 3 (0.65 to 1.0): smooth exit transition
    const baseScale = narrow ? 0.8 : Math.min(1.3, Math.max(0.95, viewport.width * 0.21));
    let currentScaleMultiplier = 1.0;

    if (p < 0.25) {
      currentScaleMultiplier = 1.0 + (p / 0.25) * 0.35;
    } else if (p < 0.65) {
      const macroFactor = (p - 0.25) / 0.4;
      currentScaleMultiplier = 1.35 + macroFactor * 0.4;
    } else {
      const exitFactor = (p - 0.65) / 0.35;
      currentScaleMultiplier = 1.75 - exitFactor * 0.25;
    }

    const finalScale = baseScale * currentScaleMultiplier;
    groupRef.current.scale.set(finalScale, finalScale, finalScale);

    if (!reducedMotion) {
      // Rotation: continuous gentle spin + scroll choreography
      const spinSpeed = 0.14 + p * 0.45;
      groupRef.current.rotation.y += delta * spinSpeed;

      // Pointer tilt & natural dynamic angle
      const targetRotX = pointer.current.y * 0.25 + 0.12;
      const targetRotZ = pointer.current.x * 0.16 - 0.08 - p * 0.15;
      groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.z += (targetRotZ - groupRef.current.rotation.z) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh geometry={geometry}>
        {/* Matte roasted surface: rough base, a faint waxy sheen, very light clearcoat for the oils. */}
        <meshPhysicalMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={2.5}
          roughnessMap={roughnessMap}
          roughness={1}
          metalness={0}
          clearcoat={0.08}
          clearcoatRoughness={0.7}
          sheen={0.35}
          sheenRoughness={0.9}
          sheenColor="#8a5a38"
        />
      </mesh>
    </group>
  );
}

export default function BeanAnatomy3D({ scrollProgress, pointer, reducedMotion, narrow }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.0], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {/* Warm artisan studio lighting; ambient kept low so the rough surface relief reads. */}
      <ambientLight intensity={0.5} color="#f8f1ea" />

      {/* Primary Key Light: warm sunlight highlighting the roasted lobe curves */}
      <directionalLight position={[3.8, 3.5, 3.4]} intensity={2.6} color="#faeedb" />

      {/* Rich Fill Light: subtle warm chocolate tone */}
      <directionalLight position={[-3.8, -1.8, 1.8]} intensity={1.1} color="#a67c58" />

      {/* Top Studio Light: accentuates the crease and upper contours */}
      <spotLight
        position={[0, 4.5, 2.0]}
        angle={0.7}
        penumbra={0.75}
        intensity={1.8}
        color="#fff4e6"
      />

      {/* Golden Rim Lights: traces the bean silhouette */}
      <pointLight position={[0, -2.8, -2.6]} intensity={3.5} color="#e6a45e" />
      <pointLight position={[0, 3.2, -2.4]} intensity={2.4} color="#d49454" />

      <Suspense fallback={null}>
        <HeroBean
          scrollProgress={scrollProgress}
          pointer={pointer}
          reducedMotion={reducedMotion}
          narrow={narrow}
        />
        <AromaParticles count={narrow ? 40 : 80} reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}
