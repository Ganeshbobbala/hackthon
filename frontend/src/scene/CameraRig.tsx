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
  const idleTimer = useRef<number | null>(null);

  // Compute flight center for target
  const targetLook = useRef(new THREE.Vector3(11.5, 0.4, -3.2));

  // Initialize camera and target when route changes
  useEffect(() => {
    if (waypoints.length > 0) {
      const mid = waypoints[Math.floor(waypoints.length / 2)];
      const midPos = new THREE.Vector3(mid.lon * 0.15, 0.4, -mid.lat * 0.15);
      targetLook.current.copy(midPos);

      if (controlsRef.current) {
        controlsRef.current.target.copy(midPos);
        controlsRef.current.update();
      }
    }
  }, [waypoints]);

  useFrame((_, delta) => {
    if (reducedMotion || isUserInteracting.current || !controlsRef.current) return;

    const clampedDelta = Math.min(delta, 0.08);

    if (waypoints.length > 1) {
      const idxFloat = flightProgress * (waypoints.length - 1);
      const currWp = waypoints[Math.min(waypoints.length - 1, Math.floor(idxFloat))];
      const planePos = new THREE.Vector3(
        currWp.lon * 0.15,
        (currWp.alt_ft / 35000.0) * 1.5,
        -currWp.lat * 0.15
      );

      let targetCamPos = new THREE.Vector3(planePos.x + 3.0, planePos.y + 2.2, planePos.z + 2.5);

      switch (flightPhase) {
        case "takeoff":
        case "climb":
          targetCamPos.set(planePos.x - 1.8, planePos.y + 1.2, planePos.z + 2.2);
          targetLook.current.lerp(planePos, clampedDelta * 3.0);
          break;
        case "holding":
          targetCamPos.set(planePos.x + 2.2, 4.2, planePos.z + 3.0);
          targetLook.current.lerp(planePos, clampedDelta * 2.0);
          break;
        case "approach":
        case "descent":
        case "landed": {
          const destWp = waypoints[waypoints.length - 1];
          const destPos = new THREE.Vector3(destWp.lon * 0.15, 0.2, -destWp.lat * 0.15);
          targetCamPos.set(destPos.x + 2.0, 3.2, destPos.z + 3.8);
          targetLook.current.lerp(destPos, clampedDelta * 2.2);
          break;
        }
        case "cruise":
        default:
          targetCamPos.set(planePos.x + 3.0, planePos.y + 2.2, planePos.z + 2.5);
          targetLook.current.lerp(planePos, clampedDelta * 2.5);
          break;
      }

      camera.position.lerp(targetCamPos, clampedDelta * 1.6);
      controlsRef.current.target.lerp(targetLook.current, clampedDelta * 2.4);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2.15}
      minDistance={2.0}
      maxDistance={25}
      onStart={() => {
        isUserInteracting.current = true;
        if (idleTimer.current) clearTimeout(idleTimer.current);
      }}
      onEnd={() => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = window.setTimeout(() => {
          isUserInteracting.current = false;
        }, 3500);
      }}
    />
  );
};
