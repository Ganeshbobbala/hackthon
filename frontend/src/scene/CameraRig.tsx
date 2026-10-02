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
  const flightProgress = useAppStore((state) => state.flightProgress);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const { camera } = useThree();

  const isUserInteracting = useRef(false);
  const idleTimer = useRef<number | null>(null);

  // Compute flight center for target
  const targetLook = useRef(new THREE.Vector3(11.5, 0.4, -3.0));

  // Initialize camera and target when route changes
  useEffect(() => {
    if (waypoints.length > 0 && controlsRef.current) {
      const mid = waypoints[Math.floor(waypoints.length / 2)];
      const midPos = new THREE.Vector3(mid.lon * 0.15, 0.5, -mid.lat * 0.15);
      targetLook.current.copy(midPos);

      // Set target to route center
      controlsRef.current.target.copy(midPos);
      camera.position.set(midPos.x, midPos.y + 6.5, midPos.z + 5.5);
      camera.lookAt(midPos);
      controlsRef.current.update();
    }
  }, [waypoints, camera]);

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

      // Smoothly update target towards the aircraft
      targetLook.current.lerp(planePos, clampedDelta * 2.2);
      controlsRef.current.target.copy(targetLook.current);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[11.5, 0.4, -3.0]}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2.15}
      minDistance={1.8}
      maxDistance={25}
      onStart={() => {
        isUserInteracting.current = true;
        if (idleTimer.current) clearTimeout(idleTimer.current);
      }}
      onEnd={() => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = window.setTimeout(() => {
          isUserInteracting.current = false;
        }, 4000);
      }}
    />
  );
};
