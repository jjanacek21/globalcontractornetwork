import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

interface VentGraphicProps {
  type: "ridge" | "off-ridge" | "solar" | "attic-breeze";
  selected?: boolean;
}

function RidgeVent() {
  return (
    <group>
      {/* Roof section */}
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Ridge vent - subtle cap */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.15, 0.06, 1]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
    </group>
  );
}

function OffRidgeVent() {
  return (
    <group>
      {/* Roof section */}
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Off-ridge vents */}
      <mesh position={[-0.25, 0.15, 0.25]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#616161" />
      </mesh>
      <mesh position={[-0.25, 0.15, -0.25]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#616161" />
      </mesh>
    </group>
  );
}

function SolarVent() {
  return (
    <group>
      {/* Roof section */}
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Solar fan unit */}
      <mesh position={[-0.2, 0.2, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.25, 0.1, 0.25]} />
        <meshStandardMaterial color="#1565c0" />
      </mesh>
      {/* Solar panel on top */}
      <mesh position={[-0.2, 0.28, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.2, 0.02, 0.2]} />
        <meshStandardMaterial color="#0d47a1" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function AtticBreezeVent() {
  return (
    <group>
      {/* Roof section */}
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.2]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Premium Attic Breeze unit - larger */}
      <mesh position={[-0.2, 0.22, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.15, 0.17, 0.15, 16]} />
        <meshStandardMaterial color="#2196f3" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Premium solar panel */}
      <mesh position={[-0.2, 0.35, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.28, 0.02, 0.28]} />
        <meshStandardMaterial color="#1a237e" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Gold accent - premium indicator */}
      <mesh position={[-0.2, 0.38, 0]} rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[0.12, 0.015, 8, 16]} />
        <meshStandardMaterial color="#ffc107" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function VentGraphic({ type, selected }: VentGraphicProps) {
  const VentComponent = useMemo(() => {
    switch (type) {
      case "ridge": return RidgeVent;
      case "off-ridge": return OffRidgeVent;
      case "solar": return SolarVent;
      case "attic-breeze": return AtticBreezeVent;
      default: return RidgeVent;
    }
  }, [type]);

  return (
    <div className={`w-20 h-20 rounded-lg overflow-hidden ${selected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}`}>
      <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <VentComponent />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
