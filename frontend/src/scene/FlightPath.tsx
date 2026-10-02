import React, { useMemo } from "react";
import * as THREE from "three";
import { FlightWaypoint } from "../api/client";

interface FlightPathProps {
  waypoints: FlightWaypoint[];
  signal?: string;
}

export const FlightPath: React.FC<FlightPathProps> = ({ waypoints, signal }) => {
  // Convert 200 waypoints to 3D curve vectors
  const { airPoints, groundPoints } = useMemo(() => {
    if (!waypoints || waypoints.length === 0) {
      return { airPoints: [], groundPoints: [] };
    }

    const air: THREE.Vector3[] = [];
    const ground: THREE.Vector3[] = [];

    for (const wp of waypoints) {
      const x = wp.lon * 0.15;
      const z = -wp.lat * 0.15;
      const yAir = Math.max(0.08, (wp.alt_ft / 35000.0) * 1.6);
      const yGround = 0.03;

      air.push(new THREE.Vector3(x, yAir, z));
      ground.push(new THREE.Vector3(x, yGround, z));
    }

    return { airPoints: air, groundPoints: ground };
  }, [waypoints]);

  const airCurve = useMemo(() => {
    if (airPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(airPoints);
  }, [airPoints]);

  const groundCurve = useMemo(() => {
    if (groundPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(groundPoints);
  }, [groundPoints]);

  if (!airCurve || !groundCurve) return null;

  // Signal-linked path color
  let pathColor = "#38BDF8";
  if (signal === "BUY NOW") pathColor = "#10B981";
  else if (signal === "WAIT / PRICE HIGH") pathColor = "#EF4444";
  else if (signal === "CONSIDER WAITING") pathColor = "#F59E0B";

  return (
    <group>
      {/* 3D Flight Arc in Air (Solid Core) */}
      <mesh>
        <tubeGeometry args={[airCurve, 128, 0.045, 8, false]} />
        <meshStandardMaterial
          color={pathColor}
          emissive={pathColor}
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Atmospheric Luminous Outer Glow Ribbon */}
      <mesh>
        <tubeGeometry args={[airCurve, 128, 0.09, 8, false]} />
        <meshBasicMaterial
          color={pathColor}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ground Projection Shadow Ribbon */}
      <mesh>
        <tubeGeometry args={[groundCurve, 128, 0.02, 6, false]} />
        <meshBasicMaterial color="#1E293B" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};
