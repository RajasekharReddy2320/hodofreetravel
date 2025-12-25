import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { Earth } from "@/components/globe/Earth";
import { Starfield } from "@/components/globe/Starfield";

const RealisticGlobe = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Starfield background */}
        <Starfield count={1500} />

        <ambientLight intensity={0.25} />
        {/* Sun light - creates day/night effect */}
        <directionalLight position={[8, 2, 5]} intensity={1.5} color="#fff4d6" />
        <directionalLight position={[-6, -3, -6]} intensity={0.35} color="#4a90d9" />
        <pointLight position={[10, 10, 10]} intensity={0.3} />

        <Earth />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
};

export default RealisticGlobe;

