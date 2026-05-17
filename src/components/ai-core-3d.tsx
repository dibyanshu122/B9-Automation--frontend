'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

function CoreScene() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (coreRef.current) {
      const scale = 1 + Math.sin(elapsed * 2.2) * 0.045;
      coreRef.current.scale.setScalar(scale);
      coreRef.current.rotation.y = elapsed * 0.28;
      coreRef.current.rotation.x = Math.sin(elapsed * 0.45) * 0.16;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = elapsed * 0.18;
      ringRef.current.rotation.y = elapsed * 0.34;
      ringRef.current.rotation.z = elapsed * 0.12;
    }
    if (nodesRef.current) {
      nodesRef.current.rotation.y = -elapsed * 0.22;
      nodesRef.current.rotation.z = Math.sin(elapsed * 0.35) * 0.08;
    }
  });

  const nodePositions: Array<[number, number, number]> = [
    [-1.9, 0.4, 0.2],
    [1.8, -0.2, -0.15],
    [0.7, 1.35, 0.35],
    [-0.55, -1.45, -0.2],
    [1.25, 0.9, -0.55],
    [-1.3, -0.85, 0.5],
  ];

  return (
    <>
      <ambientLight intensity={0.75} />
      <pointLight position={[3, 4, 4]} intensity={5} color="#fb923c" />
      <pointLight position={[-4, -2, 3]} intensity={3.2} color="#38bdf8" />
      <pointLight position={[0, 0, 5]} intensity={1.8} color="#a855f7" />

      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2.8, 0.2, 0]}>
          <torusGeometry args={[1.55, 0.012, 16, 160]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} transparent opacity={0.68} />
        </mesh>
        <mesh rotation={[0.2, Math.PI / 2.2, 0.65]}>
          <torusGeometry args={[1.9, 0.01, 16, 160]} />
          <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.35} transparent opacity={0.62} />
        </mesh>
        <mesh rotation={[Math.PI / 2, Math.PI / 5, 1.3]}>
          <torusGeometry args={[2.22, 0.008, 16, 160]} />
          <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={0.9} transparent opacity={0.5} />
        </mesh>
      </group>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.95, 4]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#fb923c"
          emissiveIntensity={0.45}
          roughness={0.34}
          metalness={0.35}
        />
      </mesh>

      <group ref={nodesRef}>
        {nodePositions.map((position, index) => (
          <mesh key={`${position.join('-')}-${index}`} position={position}>
            <sphereGeometry args={[0.075 + (index % 2) * 0.025, 20, 20]} />
            <meshStandardMaterial
              color={index % 2 ? '#38bdf8' : '#fed7aa'}
              emissive={index % 2 ? '#0ea5e9' : '#f97316'}
              emissiveIntensity={1.4}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function AICore3D() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.22),transparent_38%),radial-gradient(circle_at_72%_65%,rgba(14,165,233,0.18),transparent_30%)]" />
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <CoreScene />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-5 bottom-5 rounded-lg border border-white/10 bg-slate-950/45 px-4 py-3 text-xs text-slate-300 backdrop-blur-xl">
        <span className="font-semibold text-orange-200">AI Core online</span>
        <span className="mx-2 text-slate-500">/</span>
        lead signals, documents, and workflow actions syncing
      </div>
    </div>
  );
}
