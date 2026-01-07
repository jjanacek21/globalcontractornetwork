import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

interface ConditionGraphicProps {
  condition: "solid" | "needs-work" | "urgent" | "emergency";
  selected?: boolean;
}

function SolidRoof() {
  return (
    <group>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[1.4, 0.5, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Perfect roof */}
      <mesh position={[-0.35, 0.25, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
      <mesh position={[0.35, 0.25, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
      {/* Checkmark indicator */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
    </group>
  );
}

function NeedsWorkRoof() {
  return (
    <group>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[1.4, 0.5, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Slightly worn roof */}
      <mesh position={[-0.35, 0.25, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#ffc107" />
      </mesh>
      <mesh position={[0.35, 0.25, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#ffc107" />
      </mesh>
      {/* Warning spot */}
      <mesh position={[0.2, 0.35, 0.3]}>
        <boxGeometry args={[0.15, 0.12, 0.15]} />
        <meshStandardMaterial color="#f57c00" />
      </mesh>
    </group>
  );
}

function UrgentRoof() {
  return (
    <group>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[1.4, 0.5, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Damaged roof */}
      <mesh position={[-0.35, 0.25, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#ff9800" />
      </mesh>
      <mesh position={[0.35, 0.25, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#ff9800" />
      </mesh>
      {/* Damage spots */}
      <mesh position={[-0.2, 0.35, 0.2]}>
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshStandardMaterial color="#e65100" />
      </mesh>
      <mesh position={[0.3, 0.3, -0.2]}>
        <boxGeometry args={[0.15, 0.12, 0.15]} />
        <meshStandardMaterial color="#e65100" />
      </mesh>
    </group>
  );
}

function EmergencyRoof() {
  return (
    <group>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[1.4, 0.5, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Severely damaged roof */}
      <mesh position={[-0.35, 0.25, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#f44336" />
      </mesh>
      <mesh position={[0.35, 0.25, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#f44336" />
      </mesh>
      {/* Multiple damage areas */}
      <mesh position={[-0.3, 0.35, 0.2]}>
        <boxGeometry args={[0.25, 0.2, 0.2]} />
        <meshStandardMaterial color="#b71c1c" />
      </mesh>
      <mesh position={[0.25, 0.32, -0.15]}>
        <boxGeometry args={[0.2, 0.18, 0.2]} />
        <meshStandardMaterial color="#b71c1c" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#b71c1c" />
      </mesh>
      {/* Warning triangle */}
      <mesh position={[0, 0.65, 0]}>
        <coneGeometry args={[0.12, 0.2, 3]} />
        <meshStandardMaterial color="#ff1744" />
      </mesh>
    </group>
  );
}

export function ConditionGraphic({ condition, selected }: ConditionGraphicProps) {
  const ConditionComponent = useMemo(() => {
    switch (condition) {
      case "solid": return SolidRoof;
      case "needs-work": return NeedsWorkRoof;
      case "urgent": return UrgentRoof;
      case "emergency": return EmergencyRoof;
      default: return SolidRoof;
    }
  }, [condition]);

  return (
    <div className={`w-20 h-20 rounded-lg overflow-hidden ${selected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}`}>
      <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <ConditionComponent />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
