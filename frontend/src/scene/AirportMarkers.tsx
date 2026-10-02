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
    const scaleOrigin = 1.0 + Math.sin(t * 3.5) * 0.4;
    const scaleDest = 1.0 + Math.sin(t * 3.5 + 1.5) * 0.4;

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
      {/* Origin Airport Beacon Tower & Base */}
      <group position={originPos}>
        {/* Ground Landing Pad */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.25, 0.28, 0.06, 16]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Vertical Light Column */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.7, 8]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
        </mesh>

        {/* Luminous Beacon Sphere */}
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#60A5FA" emissive="#3B82F6" emissiveIntensity={1.2} />
        </mesh>
        <pointLight position={[0, 0.75, 0]} color="#38BDF8" intensity={1.5} distance={2.5} />

        {/* Expanding Pulsing Radio Wave Ring */}
        <mesh ref={originRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.3, 0.45, 24]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>

        <Html position={[0, 0.95, 0]} center distanceFactor={14}>
          <div className="bg-sky-950/90 border border-blue-500/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-xl pointer-events-none select-none flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span className="text-blue-300 font-mono tracking-wider">{origin.code}</span>
            <span className="text-[10px] text-slate-300 font-normal">({origin.city})</span>
          </div>
        </Html>
      </group>

      {/* Destination Airport Beacon Tower & Base */}
      <group position={destPos}>
        {/* Ground Landing Pad */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.25, 0.28, 0.06, 16]} />
          <meshStandardMaterial color="#064E3B" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Vertical Light Column */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.7, 8]} />
          <meshBasicMaterial color="#34D399" transparent opacity={0.6} />
        </mesh>

        {/* Luminous Beacon Sphere */}
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#34D399" emissive="#10B981" emissiveIntensity={1.2} />
        </mesh>
        <pointLight position={[0, 0.75, 0]} color="#10B981" intensity={1.5} distance={2.5} />

        {/* Expanding Pulsing Radio Wave Ring */}
        <mesh ref={destRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.3, 0.45, 24]} />
          <meshBasicMaterial color="#34D399" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>

        <Html position={[0, 0.95, 0]} center distanceFactor={14}>
          <div className="bg-sky-950/90 border border-emerald-500/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-xl pointer-events-none select-none flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-300 font-mono tracking-wider">{destination.code}</span>
            <span className="text-[10px] text-slate-300 font-normal">({destination.city})</span>
          </div>
        </Html>
      </group>
    </group>
  );
};
