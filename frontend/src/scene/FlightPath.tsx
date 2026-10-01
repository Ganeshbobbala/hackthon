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
      const yAir = (wp.alt_ft / 35000.0) * 1.5;
      const yGround = 0.02;

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
  let pathColor = "#4DA3FF";
  if (signal === "BUY NOW") pathColor = "#2DD4A7";
  else if (signal === "WAIT / PRICE HIGH") pathColor = "#F26D6D";
  else if (signal === "CONSIDER WAITING") pathColor = "#F5B84B";

  return (
    <group>
      {/* 3D Flight Arc in Air */}
      <mesh>
        <tubeGeometry args={[airCurve, 128, 0.025, 8, false]} />
        <meshBasicMaterial color={pathColor} transparent opacity={0.8} />
      </mesh>

      {/* Subtle outer glow on air arc */}
      <mesh>
        <tubeGeometry args={[airCurve, 128, 0.05, 8, false]} />
        <meshBasicMaterial color={pathColor} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Ground Projection Line */}
      <mesh>
        <tubeGeometry args={[groundCurve, 128, 0.015, 6, false]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};
