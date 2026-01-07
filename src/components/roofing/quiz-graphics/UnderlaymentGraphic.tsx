import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

interface UnderlaymentGraphicProps {
  type: "synthetic" | "ice-water" | "high-temp" | "fire-barrier";
  selected?: boolean;
}

function SyntheticUnderlayment() {
  return (
    <group>
      {/* Base deck */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.4, 0.1, 1]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* Double synthetic layer */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.4, 0.04, 1]} />
        <meshStandardMaterial color="#78909c" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.4, 0.04, 1]} />
        <meshStandardMaterial color="#90a4ae" />
      </mesh>
      {/* Shingles on top */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.4, 0.08, 1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
    </group>
  );
}

function IceWaterShield() {
  return (
    <group>
      {/* Base deck */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.4, 0.1, 1]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* Ice and water shield layer - blue tint */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.4, 0.06, 1]} />
        <meshStandardMaterial color="#42a5f5" />
      </mesh>
      {/* Shingles on top */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.4, 0.08, 1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Water droplet indicators */}
      <mesh position={[-0.4, 0.2, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1976d2" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.3, 0.2, -0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1976d2" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function HighTempShield() {
  return (
    <group>
      {/* Base deck */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.4, 0.1, 1]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* High-temp layer - orange/red tint */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.4, 0.08, 1]} />
        <meshStandardMaterial color="#ff7043" />
      </mesh>
      {/* Shingles on top */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.4, 0.08, 1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Heat wave indicators */}
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[0.25, 0.015, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#ff7043" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function FireBarrier() {
  return (
    <group>
      {/* Base deck */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.4, 0.1, 1]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* Fire barrier layer - silver/metallic */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.4, 0.08, 1]} />
        <meshStandardMaterial color="#b0bec5" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Metal roof on top */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.4, 0.06, 1]} />
        <meshStandardMaterial color="#607d8b" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Fire shield icon */}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.15, 0.25, 4]} />
        <meshStandardMaterial color="#d32f2f" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffeb3b" />
      </mesh>
    </group>
  );
}

export function UnderlaymentGraphic({ type, selected }: UnderlaymentGraphicProps) {
  const UnderlaymentComponent = useMemo(() => {
    switch (type) {
      case "synthetic": return SyntheticUnderlayment;
      case "ice-water": return IceWaterShield;
      case "high-temp": return HighTempShield;
      case "fire-barrier": return FireBarrier;
      default: return SyntheticUnderlayment;
    }
  }, [type]);

  return (
    <div className={`w-20 h-20 rounded-lg overflow-hidden ${selected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}`}>
      <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <UnderlaymentComponent />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
