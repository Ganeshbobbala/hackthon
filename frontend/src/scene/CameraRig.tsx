import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useAppStore } from "../store/useAppStore";
import { FlightWaypoint } from "../api/client";

interface CameraRigProps {
  waypoints: FlightWaypoint[];
}

export const CameraRig: React.FC<CameraRigProps> = ({ waypoints }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const flightPhase = useAppStore((state) => state.flightPhase);
  const flightProgress = useAppStore((state) => state.flightProgress);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const { camera } = useThree();

  const isUserInteracting = useRef(false);

  // Compute flight center for target
  const targetLook = useRef(new THREE.Vector3(11.5, 0, -3.2));

  useEffect(() => {
    if (waypoints.length > 0) {
      const mid = waypoints[Math.floor(waypoints.length / 2)];
      targetLook.current.set(mid.lon * 0.15, 0.4, -mid.lat * 0.15);
    }
  }, [waypoints]);

  useFrame((_, delta) => {
    if (reducedMotion || isUserInteracting.current || !controlsRef.current) return;

    let targetCamPos = new THREE.Vector3(11.5, 8.5, 5.5);

    if (waypoints.length > 1) {
      const idxFloat = flightProgress * (waypoints.length - 1);
      const currWp = waypoints[Math.min(waypoints.length - 1, Math.floor(idxFloat))];
      const planePos = new THREE.Vector3(
        currWp.lon * 0.15,
        (currWp.alt_ft / 35000.0) * 1.5,
        -currWp.lat * 0.15
      );

      switch (flightPhase) {
        case "takeoff":
        case "climb":
          // Low chase behind plane
          targetCamPos.set(planePos.x - 1.8, planePos.y + 1.2, planePos.z + 2.2);
          targetLook.current.lerp(planePos, delta * 3.0);
          break;
        case "cruise":
          // Side-tracking angle
          targetCamPos.set(planePos.x + 3.2, planePos.y + 2.0, planePos.z + 2.5);
          targetLook.current.lerp(planePos, delta * 2.5);
          break;
        case "holding":
          // High orbital shot looking down on holding pattern
          targetCamPos.set(planePos.x + 2.5, 5.0, planePos.z + 3.5);
          targetLook.current.lerp(planePos, delta * 2.0);
          break;
        case "approach":
        case "descent":
        case "landed":
          // Forward view towards destination
          const destWp = waypoints[waypoints.length - 1];
          const destPos = new THREE.Vector3(destWp.lon * 0.15, 0.1, -destWp.lat * 0.15);
          targetCamPos.set(destPos.x + 2.0, 3.5, destPos.z + 4.0);
          targetLook.current.lerp(destPos, delta * 2.5);
          break;
        default:
          targetCamPos.set(11.5, 8.0, 5.5);
          break;
      }
    }

    camera.position.lerp(targetCamPos, delta * 1.8);
    controlsRef.current.target.lerp(targetLook.current, delta * 2.5);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={2.5}
      maxDistance={22}
      onStart={() => {
        isUserInteracting.current = true;
      }}
      onEnd={() => {
        // Return to auto director after 4 seconds of idle
        setTimeout(() => {
          isUserInteracting.current = false;
        }, 4000);
      }}
    />
  );
};

