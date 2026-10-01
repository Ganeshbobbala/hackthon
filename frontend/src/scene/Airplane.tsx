import React, { useRef, useMemo } from "react";
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
  const flightProgress = useAppStore((state) => state.flightProgress);
  const setFlightProgress = useAppStore((state) => state.setFlightProgress);
  const flightPhase = useAppStore((state) => state.flightPhase);
  const setFlightPhase = useAppStore((state) => state.setFlightPhase);
  const reducedMotion = useAppStore((state) => state.reducedMotion);

  // Pre-generate trail particle buffer
  const trailCount = 40;
  const trailPositions = useMemo(() => new Float32Array(trailCount * 3), [trailCount]);

  useFrame((state, delta) => {
    if (!groupRef.current || waypoints.length < 2) return;

    if (!reducedMotion) {
      // Advance flight progress along the 200 waypoints
      let nextProgress = flightProgress + delta * 0.04;

      if (signal === "WAIT / PRICE HIGH" && nextProgress > 0.85) {
        // Holding pattern at 85% progress
        setFlightPhase("holding");
      } else if (nextProgress >= 1.0) {
        nextProgress = 0.0;
        setFlightPhase("takeoff");
      } else if (nextProgress < 0.15) {
        setFlightPhase("climb");
      } else if (nextProgress < 0.82) {
        setFlightPhase("cruise");
      } else if (nextProgress < 0.96) {
        setFlightPhase("descent");
      } else {
        setFlightPhase("landed");
      }

      setFlightProgress(nextProgress);
    }

    // Determine position based on flightPhase
    let targetPos = new THREE.Vector3();
    let forwardVec = new THREE.Vector3(0, 0, -1);
    let bankRoll = 0;
    let pitchAngle = 0;

    if (flightPhase === "holding") {
      // Fly in a smooth racetrack holding pattern near destination
      const lastWp = waypoints[waypoints.length - 20];
      const holdingRadius = 1.8;
      const angle = state.clock.elapsedTime * 0.8;
      targetPos.set(
        lastWp.lon * 0.15 + Math.cos(angle) * holdingRadius,
        1.2 + Math.sin(angle * 2) * 0.08,
        -lastWp.lat * 0.15 + Math.sin(angle) * (holdingRadius * 0.7)
      );
      forwardVec.set(-Math.sin(angle), 0, Math.cos(angle) * 0.7).normalize();
      bankRoll = 0.35; // constant bank in orbit
    } else {
      // Interpolate along waypoints
      const idxFloat = flightProgress * (waypoints.length - 1);
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

      forwardVec.set(xB - xA, yB - yA, zB - zA).normalize();

      // Heading rate of change for realistic banking
      const bearingDiff = (wpB.bearing_deg - wpA.bearing_deg);
      const normalizedDiff = Math.atan2(Math.sin((bearingDiff * Math.PI) / 180), Math.cos((bearingDiff * Math.PI) / 180));
      bankRoll = THREE.MathUtils.clamp(-normalizedDiff * 4.0, -0.42, 0.42); // Clamped ~24 deg

      // Pitch based on climb / descent
      pitchAngle = (yB - yA) * 2.5;
    }

    groupRef.current.position.copy(targetPos);

    // Orientation: Look along forward vector with pitch and bank
    const rotMatrix = new THREE.Matrix4();
    const upVec = new THREE.Vector3(0, 1, 0);
    rotMatrix.lookAt(new THREE.Vector3(0, 0, 0), forwardVec, upVec);
    groupRef.current.quaternion.setFromRotationMatrix(rotMatrix);
    groupRef.current.rotateZ(bankRoll);
    groupRef.current.rotateX(-pitchAngle);

    // Update contrail
    if (trailRef.current) {
      const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = trailCount - 1; i > 0; i--) {
        positions[i * 3] = positions[(i - 1) * 3];
        positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
        positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
      }
      positions[0] = targetPos.x;
      positions[1] = targetPos.y;
      positions[2] = targetPos.z;
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Strobe light timing (<= 1Hz)
  const strobeIntensity = Math.sin(Date.now() * 0.003) > 0.8 ? 2.5 : 0.0;

  return (
    <>
      {/* Jet Aircraft Model */}
      <group ref={groupRef} scale={[0.18, 0.18, 0.18]}>
        {/* Fuselage */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.28, 3.4, 16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.25} metalness={0.8} />
        </mesh>

        {/* Nose Cone */}
        <mesh position={[0, 1.9, 0]} castShadow>
          <coneGeometry args={[0.32, 0.8, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Swept Main Wings */}
        <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.06, 4.4, 0.75]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Winglets */}
        <mesh position={[-2.2, -0.15, 0.1]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.04, 0.35, 0.25]} />
          <meshStandardMaterial color="#4DA3FF" />
        </mesh>
        <mesh position={[2.2, -0.15, 0.1]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.04, 0.35, 0.25]} />
          <meshStandardMaterial color="#4DA3FF" />
        </mesh>

        {/* Twin Jet Engines */}
        <mesh position={[-0.9, -0.4, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.15, 0.8, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.9, -0.4, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.15, 0.8, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Engine Exhaust Glow */}
        <pointLight position={[-0.9, -0.4, -0.3]} color="#60A5FA" intensity={1.5} distance={1.2} />
        <pointLight position={[0.9, -0.4, -0.3]} color="#60A5FA" intensity={1.5} distance={1.2} />

        {/* Vertical Tail Fin */}
        <mesh position={[0, -1.3, 0.55]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.05, 0.9, 0.5]} />
          <meshStandardMaterial color="#2563EB" metalness={0.6} />
        </mesh>

        {/* Horizontal Stabilizers */}
        <mesh position={[0, -1.5, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.04, 1.4, 0.35]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.7} />
        </mesh>

        {/* Navigation Lights (Red Port, Green Starboard) */}
        <mesh position={[-2.2, -0.15, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <mesh position={[2.2, -0.15, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#10B981" />
        </mesh>

        {/* Anti-collision White Strobe (<= 1Hz) */}
        <pointLight position={[0, -1.6, 0.9]} color="#FFFFFF" intensity={strobeIntensity} distance={3} />
      </group>

      {/* Jet Contrail Ribbon */}
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
          size={0.12}
          color="#93C5FD"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

