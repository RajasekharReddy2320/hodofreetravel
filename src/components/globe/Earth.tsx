import { useMemo, useRef } from "react";
import { Sphere, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import earthDay from "@/assets/earth/earth_day.jpg";
import earthNormal from "@/assets/earth/earth_normal.jpg";
import earthSpecular from "@/assets/earth/earth_specular.jpg";
import earthClouds from "@/assets/earth/earth_clouds.png";
import earthLights from "@/assets/earth/earth_lights.png";

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const lightsRef = useRef<THREE.Mesh>(null);

  const [dayMap, normalMap, specMap, cloudsMap, lightsMap] = useTexture([
    earthDay,
    earthNormal,
    earthSpecular,
    earthClouds,
    earthLights,
  ]);

  useMemo(() => {
    [dayMap, normalMap, specMap, cloudsMap, lightsMap].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
    });
  }, [dayMap, normalMap, specMap, cloudsMap, lightsMap]);

  useFrame((_, delta) => {
    // Slow, calm rotation
    const step = delta * 0.06;
    if (earthRef.current) earthRef.current.rotation.y += step;
    if (cloudsRef.current) cloudsRef.current.rotation.y += step * 1.15;
    if (lightsRef.current) lightsRef.current.rotation.y += step;
  });

  return (
    <group>
      {/* Atmosphere glow */}
      <Sphere args={[2.18, 96, 96]}>
        <meshBasicMaterial
          color={new THREE.Color("#6fd2ff")}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Earth day side */}
      <Sphere ref={earthRef} args={[2, 96, 96]}>
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          specularMap={specMap}
          specular={new THREE.Color("#9fd7ff")}
          shininess={12}
        />
      </Sphere>

      {/* Night lights (city lights on dark side) */}
      <Sphere ref={lightsRef} args={[2.005, 96, 96]}>
        <meshBasicMaterial
          map={lightsMap}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.85}
        />
      </Sphere>

      {/* Clouds */}
      <Sphere ref={cloudsRef} args={[2.03, 96, 96]}>
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.38}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
}
