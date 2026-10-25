import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Points } from "three";
import * as THREE from "three";
import { useReducedMotionPreference } from "../hooks/useReducedMotion";

function StarMesh({ count, reduced }: { count: number; reduced: boolean }) {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const buffer = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      buffer[i * 3] = (Math.random() - 0.5) * 16;
      buffer[i * 3 + 1] = (Math.random() - 0.5) * 9;
      buffer[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    return buffer;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * (reduced ? 0.006 : 0.055);
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * (reduced ? 0.04 : 0.22)) * (reduced ? 0.008 : 0.035);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#315c43" size={0.028} transparent opacity={0.68} blending={THREE.NormalBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function RedMoon() {
  return (
    <Float speed={0.55} rotationIntensity={0.18} floatIntensity={0.22}>
      <mesh position={[2.75, 0.7, -2.2]}>
        <sphereGeometry args={[1.65, 64, 64]} />
        <meshStandardMaterial color="#244b35" emissive="#6fbd78" emissiveIntensity={0.42} roughness={0.9} />
      </mesh>
      <mesh position={[2.72, 0.66, -2.18]}>
        <sphereGeometry args={[1.68, 64, 64]} />
        <meshBasicMaterial color="#a8d5a2" wireframe transparent opacity={0.08} />
      </mesh>
    </Float>
  );
}

export function ParticleField() {
  const reduced = useReducedMotionPreference();

  return (
    <div className="foldersapling-particle-field" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5.5], fov: 52 }} gl={{ antialias: false, alpha: true }}>
        <StarMesh count={reduced ? 260 : 950} reduced={reduced} />
        {/* <RedMoon /> */}
      </Canvas>
    </div>
  );
}
