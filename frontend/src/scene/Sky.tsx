import React from "react";
import { useAppStore, TimeOfDay } from "../store/useAppStore";

export const Sky: React.FC = () => {
  const timeOfDay = useAppStore((state) => state.timeOfDay);

  const config = {
    day: {
      ambient: "#38BDF8",
      ambientInt: 0.7,
      sun: "#FFFBEB",
      sunInt: 1.8,
      sunPos: [15, 20, 10] as [number, number, number],
      fog: "#0B1528",
    },
    dusk: {
      ambient: "#7C3AED",
      ambientInt: 0.5,
      sun: "#F97316",
      sunInt: 1.5,
      sunPos: [15, 6, -15] as [number, number, number],
      fog: "#1E112A",
    },
    night: {
      ambient: "#1E293B",
      ambientInt: 0.35,
      sun: "#93C5FD",
      sunInt: 0.6,
      sunPos: [10, 15, -10] as [number, number, number],
      fog: "#050811",
    },
  }[timeOfDay];

  return (
    <>
      <color attach="background" args={[config.fog]} />
      <fog attach="fog" args={[config.fog, 10, 35]} />

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
