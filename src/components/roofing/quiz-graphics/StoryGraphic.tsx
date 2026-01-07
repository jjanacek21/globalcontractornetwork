import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

interface StoryGraphicProps {
  stories: 1 | 2 | 3;
  selected?: boolean;
}

function OneStoryHouse() {
  return (
    <group>
      {/* Single floor */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.4, 0.6, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.35, 0.15, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.35, 0.15, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.35, -0.25, 0.51]}>
        <boxGeometry args={[0.25, 0.25, 0.02]} />
        <meshStandardMaterial color="#90caf9" />
      </mesh>
      <mesh position={[0.35, -0.25, 0.51]}>
        <boxGeometry args={[0.25, 0.25, 0.02]} />
        <meshStandardMaterial color="#90caf9" />
      </mesh>
      {/* Door */}
      <mesh position={[0, -0.35, 0.51]}>
        <boxGeometry args={[0.2, 0.35, 0.02]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    </group>
  );
}

function TwoStoryHouse() {
  return (
    <group>
      {/* Two floors */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.4, 1, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.35, 0.55, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.35, 0.55, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.9, 0.08, 1.1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* First floor windows */}
      <mesh position={[-0.35, -0.4, 0.51]}>
        <boxGeometry args={[0.22, 0.22, 0.02]} />
        <meshStandardMaterial color="#90caf9" />
      </mesh>
      <mesh position={[0.35, -0.4, 0.51]}>
        <boxGeometry args={[0.22, 0.22, 0.02]} />
        <meshStandardMaterial color="#90caf9" />
      </mesh>
      {/* Second floor windows */}
      <mesh position={[-0.35, 0.1, 0.51]}>
        <boxGeometry args={[0.22, 0.22, 0.02]} />
        <meshStandardMaterial color="#90caf9" />
      </mesh>
      <mesh position={[0.35, 0.1, 0.51]}>
        <boxGeometry args={[0.22, 0.22, 0.02]} />
        <meshStandardMaterial color="#90caf9" />
      </mesh>
      {/* Door */}
      <mesh position={[0, -0.45, 0.51]}>
        <boxGeometry args={[0.18, 0.3, 0.02]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    </group>
  );
}

function ThreeStoryHouse() {
  return (
    <group position={[0, -0.1, 0]}>
      {/* Three floors */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.3, 1.4, 0.9]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.32, 0.9, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.85, 0.07, 1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.32, 0.9, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.85, 0.07, 1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Windows - 3 rows */}
      {[-0.35, 0.05, 0.45].map((y, i) => (
        <group key={i}>
          <mesh position={[-0.32, y, 0.46]}>
            <boxGeometry args={[0.18, 0.18, 0.02]} />
            <meshStandardMaterial color="#90caf9" />
          </mesh>
          <mesh position={[0.32, y, 0.46]}>
            <boxGeometry args={[0.18, 0.18, 0.02]} />
            <meshStandardMaterial color="#90caf9" />
          </mesh>
        </group>
      ))}
      {/* Door */}
      <mesh position={[0, -0.45, 0.46]}>
        <boxGeometry args={[0.15, 0.28, 0.02]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    </group>
  );
}

export function StoryGraphic({ stories, selected }: StoryGraphicProps) {
  const HouseComponent = useMemo(() => {
    switch (stories) {
      case 1: return OneStoryHouse;
      case 2: return TwoStoryHouse;
      case 3: return ThreeStoryHouse;
      default: return OneStoryHouse;
    }
  }, [stories]);

  return (
    <div className={`w-20 h-20 rounded-lg overflow-hidden ${selected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}`}>
      <Canvas camera={{ position: [2.5, 1.5, 2.5], fov: 35 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <HouseComponent />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
