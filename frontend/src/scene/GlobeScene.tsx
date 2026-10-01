import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Sky } from "./Sky";
import { Airplane } from "./Airplane";
import { FlightPath } from "./FlightPath";
import { AirportMarkers } from "./AirportMarkers";
import { Clouds } from "./Clouds";
import { CameraRig } from "./CameraRig";
import { FlightPathData } from "../api/client";
import { useAppStore } from "../store/useAppStore";

interface GlobeSceneProps {
  flightData?: FlightPathData;
  signal?: string;
}

const IndiaTerrain: React.FC = () => {
  return (
    <group position={[11.5, 0, -3.2]}>
      {/* Base Geological Plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[5.2, 5.4, 0.1, 48]} />
        <meshStandardMaterial color="#0A111E" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Topographic Land Mass Representation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 0]}>
        <circleGeometry args={[4.8, 36]} />
        <meshStandardMaterial color="#101D33" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Lat/Lon Reference Grid Lines */}
      <gridHelper args={[10, 20, "#1E3A8A", "#172554"]} position={[0, 0.02, 0]} />

      {/* Outer Atmospheric Glow Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[4.8, 5.1, 48]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const GlobeScene: React.FC<GlobeSceneProps> = ({ flightData, signal }) => {
  const perfTier = useAppStore((state) => state.perfTier);

  if (!flightData || flightData.waypoints.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-sky-950 text-slate-400 font-mono text-sm">
        Awaiting flight trajectory waypoints...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [11.5, 9.0, 6.0], fov: 42 }}
        dpr={perfTier === "high" ? [1, 1.75] : [1, 1]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        shadows={perfTier === "high"}
      >
        <Suspense fallback={null}>
          <Sky />
          <IndiaTerrain />
          <AirportMarkers origin={flightData.origin} destination={flightData.destination} />
          <FlightPath waypoints={flightData.waypoints} signal={signal} />
          <Airplane waypoints={flightData.waypoints} signal={signal} />
          <Clouds />
          <CameraRig waypoints={flightData.waypoints} />
        </Suspense>
      </Canvas>
    </div>
  );
};
