import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore, FlightPhase } from "../store/useAppStore";
import { FlightWaypoint } from "../api/client";

interface AirplaneProps {
  waypoints: FlightWaypoint[];
  signal?: string;
}

export const Airplane: React.FC<AirplaneProps> = ({ waypoints, signal }) => {
  const groupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points>(null);
  const trailInitialized = useRef(false);
  const lastSyncTime = useRef(0);

  const flightProgress = useAppStore((state) => state.flightProgress);
  const setFlightProgress = useAppStore((state) => state.setFlightProgress);
  const setFlightPhase = useAppStore((state) => state.setFlightPhase);
  const reducedMotion = useAppStore((state) => state.reducedMotion);

  // Local progress ref decouples high-FPS Three.js animation from React re-render thrashing
  const progressRef = useRef(flightProgress);

  useEffect(() => {
    progressRef.current = flightProgress;
  }, [flightProgress]);

  // Contrail particle buffer
  const trailCount = 35;
  const trailPositions = useMemo(() => new Float32Array(trailCount * 3), [trailCount]);

  useFrame((state, delta) => {
    if (!groupRef.current || waypoints.length < 2) return;

    const clampedDelta = Math.min(delta, 0.1);

    if (!reducedMotion) {
      progressRef.current += clampedDelta * 0.04;

      let currentPhase: FlightPhase = "cruise";
      if (signal === "WAIT / PRICE HIGH" && progressRef.current > 0.82) {
        currentPhase = "holding";
      } else if (progressRef.current >= 1.0) {
        progressRef.current = 0.0;
        currentPhase = "takeoff";
      } else if (progressRef.current < 0.15) {
        currentPhase = "climb";
      } else if (progressRef.current < 0.82) {
        currentPhase = "cruise";
      } else if (progressRef.current < 0.96) {
        currentPhase = "descent";
      } else {
        currentPhase = "landed";
      }

      // Throttle Zustand store updates to 8 Hz for HUD to keep React fast
      const now = state.clock.elapsedTime;
      if (now - lastSyncTime.current > 0.12) {
        lastSyncTime.current = now;
        setFlightProgress(progressRef.current);
        setFlightPhase(currentPhase);
      }
    }

    const currentProg = progressRef.current;
    let targetPos = new THREE.Vector3();
    let forwardVec = new THREE.Vector3(0, 0, -1);
    let bankRoll = 0;
    let pitchAngle = 0;

    const isHolding = signal === "WAIT / PRICE HIGH" && currentProg > 0.82;

    if (isHolding) {
      // Fly in a smooth holding orbit near destination
      const holdWp = waypoints[Math.max(0, waypoints.length - 15)];
      const holdingRadius = 1.2;
      const angle = state.clock.elapsedTime * 0.9;
      targetPos.set(
        holdWp.lon * 0.15 + Math.cos(angle) * holdingRadius,
        1.1 + Math.sin(angle * 2) * 0.05,
        -holdWp.lat * 0.15 + Math.sin(angle) * (holdingRadius * 0.7)
      );
      forwardVec.set(-Math.sin(angle), 0, Math.cos(angle) * 0.7).normalize();
      bankRoll = 0.32;
    } else {
      // Interpolate along waypoints
      const idxFloat = currentProg * (waypoints.length - 1);
      const idxA = Math.floor(idxFloat);
      const idxB = Math.min(waypoints.length - 1, idxA + 1);
      const alpha = idxFloat - idxA;

      const wpA = waypoints[idxA];
      const wpB = waypoints[idxB];

      const xA = wpA.lon * 0.15;
      const zA = -wpA.lat * 0.15;
      const yA = (wpA.alt_ft / 35000.0) * 1.5;

      const xB = wpB.lon * 0.15;
      const zB = -wpB.lat * 0.15;
      const yB = (wpB.alt_ft / 35000.0) * 1.5;

      targetPos.set(
        THREE.MathUtils.lerp(xA, xB, alpha),
        THREE.MathUtils.lerp(yA, yB, alpha),
        THREE.MathUtils.lerp(zA, zB, alpha)
      );

      const dx = xB - xA;
      const dy = yB - yA;
      const dz = zB - zA;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len > 0.0001) {
        forwardVec.set(dx / len, dy / len, dz / len);
      }

      // Heading rate of change for realistic banking
      const bearingDiff = wpB.bearing_deg - wpA.bearing_deg;
      const normalizedDiff = Math.atan2(
        Math.sin((bearingDiff * Math.PI) / 180),
        Math.cos((bearingDiff * Math.PI) / 180)
      );
      bankRoll = THREE.MathUtils.clamp(-normalizedDiff * 3.5, -0.42, 0.42);
      pitchAngle = (yB - yA) * 2.2;
    }

    groupRef.current.position.copy(targetPos);

    // Orient aircraft along forward direction safely
    const lookTarget = targetPos.clone().add(forwardVec);
    groupRef.current.lookAt(lookTarget);
    groupRef.current.rotateZ(bankRoll);
    groupRef.current.rotateX(-pitchAngle);

    // Update contrail particles
    if (trailRef.current) {
      const positions = trailRef.current.geometry.attributes.position.array as Float32Array;

      // Seed all points on frame 1 to prevent (0,0,0) streaking
      if (!trailInitialized.current) {
        for (let i = 0; i < trailCount; i++) {
          positions[i * 3] = targetPos.x;
          positions[i * 3 + 1] = targetPos.y;
          positions[i * 3 + 2] = targetPos.z;
        }
        trailInitialized.current = true;
      } else {
        for (let i = trailCount - 1; i > 0; i--) {
          positions[i * 3] = positions[(i - 1) * 3];
          positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
          positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
        }
        positions[0] = targetPos.x;
        positions[1] = targetPos.y;
        positions[2] = targetPos.z;
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Strobe light timing (<= 1Hz flash)
  const strobeIntensity = Math.sin(Date.now() * 0.004) > 0.85 ? 2.5 : 0.0;

  return (
    <>
      {/* Jet Aircraft Model - Scale 0.32 for clear visibility, nose pointing along -Z */}
      <group ref={groupRef} scale={[0.32, 0.32, 0.32]}>
        {/* Fuselage (aligned along Z axis: nose at -Z, tail at +Z) */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.26, 3.2, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Aerodynamic Nose Cone (at -Z) */}
        <mesh position={[0, 0, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.8, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.6} />
        </mesh>

        {/* Cockpit Windshield */}
        <mesh position={[0, 0.22, -1.2]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.32, 0.12, 0.35]} />
          <meshStandardMaterial color="#1E293B" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Swept Main Wings (spanning across X axis) */}
        <mesh position={[0, -0.05, -0.2]}>
          <boxGeometry args={[4.2, 0.05, 0.75]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Left & Right Winglets */}
        <mesh position={[-2.1, 0.14, -0.2]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.04, 0.32, 0.22]} />
          <meshStandardMaterial color="#38BDF8" roughness={0.4} />
        </mesh>
        <mesh position={[2.1, 0.14, -0.2]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.04, 0.32, 0.22]} />
          <meshStandardMaterial color="#38BDF8" roughness={0.4} />
        </mesh>

        {/* Twin Jet Engines (mounted under wings along Z axis) */}
        <mesh position={[-0.85, -0.26, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.15, 0.75, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0.85, -0.26, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.15, 0.75, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Engine Exhaust Afterglow */}
        <pointLight position={[-0.85, -0.26, 0.25]} color="#60A5FA" intensity={1.5} distance={1.2} />
        <pointLight position={[0.85, -0.26, 0.25]} color="#60A5FA" intensity={1.5} distance={1.2} />

        {/* Vertical Tail Fin (Swept back at tail +Z) */}
        <mesh position={[0, 0.55, 1.3]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.05, 0.85, 0.55]} />
          <meshStandardMaterial color="#2563EB" metalness={0.6} />
        </mesh>

        {/* Horizontal Tail Stabilizers */}
        <mesh position={[0, 0.15, 1.45]}>
          <boxGeometry args={[1.35, 0.04, 0.35]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.7} />
        </mesh>

        {/* Navigation Wingtip Lights (Port = Red, Starboard = Green) */}
        <mesh position={[-2.1, -0.05, -0.2]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <mesh position={[2.1, -0.05, -0.2]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#10B981" />
        </mesh>

        {/* Flashing Anti-Collision White Strobe */}
        <pointLight position={[0, 1.05, 1.2]} color="#FFFFFF" intensity={strobeIntensity} distance={3.5} />
      </group>

      {/* Contrail Vapor Trail */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={trailCount}
            array={trailPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          color="#93C5FD"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};
