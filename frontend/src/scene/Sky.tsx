import React from "react";
import { useAppStore, TimeOfDay } from "../store/useAppStore";

export const Sky: React.FC = () => {
  const timeOfDay = useAppStore((state) => state.timeOfDay);

  const config = {
    day: {
      ambient: "#38BDF8",
      ambientInt: 0.85,
      sun: "#FFFBEB",
      sunInt: 2.0,
      sunPos: [15, 20, 10] as [number, number, number],
      fog: "#070E1B",
    },
    dusk: {
      ambient: "#7C3AED",
      ambientInt: 0.65,
      sun: "#F97316",
      sunInt: 1.6,
      sunPos: [15, 6, -15] as [number, number, number],
      fog: "#150B1E",
    },
    night: {
      ambient: "#3B82F6",
      ambientInt: 0.5,
      sun: "#93C5FD",
      sunInt: 0.8,
      sunPos: [10, 15, -10] as [number, number, number],
      fog: "#03060E",
    },
  }[timeOfDay];

  return (
    <>
      <color attach="background" args={[config.fog]} />
      <fog attach="fog" args={[config.fog, 20, 75]} />

      {/* Atmospheric Ambient Light */}
      <ambientLight color={config.ambient} intensity={config.ambientInt} />

      {/* Sun / Moon Directional Light */}
      <directionalLight
        position={config.sunPos}
        intensity={config.sunInt}
        color={config.sun}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Subtle fill light */}
      <directionalLight position={[-10, 5, -10]} intensity={0.2} color="#60A5FA" />
    </>
  );
};
