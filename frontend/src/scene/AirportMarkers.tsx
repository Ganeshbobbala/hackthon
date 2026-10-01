import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Airport } from "../api/client";

interface AirportMarkersProps {
  origin: Airport;
  destination: Airport;
}

export const AirportMarkers: React.FC<AirportMarkersProps> = ({ origin, destination }) => {
  const originRingRef = useRef<THREE.Mesh>(null);
  const destRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const scaleOrigin = 1.0 + Math.sin(t * 3) * 0.3;
    const scaleDest = 1.0 + Math.sin(t * 3 + 1.5) * 0.3;

    if (originRingRef.current) {
      originRingRef.current.scale.set(scaleOrigin, 1, scaleOrigin);
    }
    if (destRingRef.current) {
      destRingRef.current.scale.set(scaleDest, 1, scaleDest);
    }
  });

  const originPos: [number, number, number] = [origin.lon * 0.15, 0.05, -origin.lat * 0.15];
  const destPos: [number, number, number] = [destination.lon * 0.15, 0.05, -destination.lat * 0.15];

  return (
    <group>
      {/* Origin Airport Beacon */}
      <group position={originPos}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
          <meshStandardMaterial color="#3B82F6" emissive="#2563EB" emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={originRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.15, 0.25, 24]} />
          <meshBasicMaterial color="#60A5FA" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 0.45, 0]} center distanceFactor={14}>
          <div className="bg-sky-900/90 border border-blue-500/50 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-lg pointer-events-none select-none flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
            <span>{origin.code}</span>
            <span className="text-[9px] text-blue-300 font-normal">({origin.city})</span>
          </div>
        </Html>
      </group>

      {/* Destination Airport Beacon */}
      <group position={destPos}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
          <meshStandardMaterial color="#10B981" emissive="#059669" emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={destRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.15, 0.25, 24]} />
          <meshBasicMaterial color="#34D399" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 0.45, 0]} center distanceFactor={14}>
          <div className="bg-sky-900/90 border border-emerald-500/50 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-lg pointer-events-none select-none flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{destination.code}</span>
            <span className="text-[9px] text-emerald-300 font-normal">({destination.city})</span>
          </div>
        </Html>
      </group>
    </group>
  );
};

