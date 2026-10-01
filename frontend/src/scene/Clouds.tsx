import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../store/useAppStore";

export const Clouds: React.FC = () => {
  const perfTier = useAppStore((state) => state.perfTier);
  const cloudsGroupRef = useRef<THREE.Group>(null);

  const cloudCount = perfTier === "high" ? 18 : perfTier === "medium" ? 8 : 0;

  const cloudData = useMemo(() => {
    const list = [];
    for (let i = 0; i < cloudCount; i++) {
      list.push({
        x: 10 + (Math.random() - 0.5) * 8,
        y: 0.8 + Math.random() * 0.8,
        z: -3 - Math.random() * 4,
        scale: 0.35 + Math.random() * 0.45,
        speed: 0.05 + Math.random() * 0.08,
      });
    }
    return list;
  }, [cloudCount]);

  useFrame((_, delta) => {
    if (!cloudsGroupRef.current) return;
    cloudsGroupRef.current.children.forEach((child, idx) => {
      const data = cloudData[idx];
      if (data) {
        child.position.x += delta * data.speed;
        if (child.position.x > 16) {
          child.position.x = 6;
        }
      }
    });
  });

  if (cloudCount === 0) return null;

  return (
    <group ref={cloudsGroupRef}>
      {cloudData.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={[c.scale, c.scale * 0.5, c.scale]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.5, 7, 7]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.4} roughness={0.9} />
          </mesh>
          <mesh position={[0.3, 0.05, 0.1]}>
            <sphereGeometry args={[0.38, 6, 6]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.35} roughness={0.9} />
          </mesh>
          <mesh position={[-0.3, -0.05, -0.1]}>
            <sphereGeometry args={[0.42, 6, 6]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.35} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
