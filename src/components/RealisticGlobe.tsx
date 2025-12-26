import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Earth } from "@/components/globe/Earth";
import { Starfield } from "@/components/globe/Starfield";

function AnimatedSun() {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (sunRef.current && targetRef.current) {
      sunRef.current.target = targetRef.current;
    }
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // ~60s per full day/night cycle
    const a = (t / 60) * Math.PI * 2;

    const r = 8;
    if (sunRef.current) {
      sunRef.current.position.set(Math.cos(a) * r, 2, Math.sin(a) * r);
    }
    if (targetRef.current) {
      targetRef.current.position.set(0, 0, 0);
      targetRef.current.updateMatrixWorld();
    }
  });

  return (
    <>
      <directionalLight ref={sunRef} intensity={1.5} color={"#fff4d6"} />
      <object3D ref={targetRef} />
    </>
  );
}

const RealisticGlobe = () => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Starfield count={1500} />

        <ambientLight intensity={0.25} />
        <AnimatedSun />
        <directionalLight position={[-6, -3, -6]} intensity={0.35} color="#4a90d9" />
        <pointLight position={[10, 10, 10]} intensity={0.3} />

        <Earth />
      </Canvas>
    </div>
  );
};

export default RealisticGlobe;

