import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

interface RoofTypeGraphicProps {
  type: "shingle" | "metal" | "tile" | "flat" | "stone-coated" | "tpo" | "modified";
  selected?: boolean;
}

function ShingleRoof() {
  return (
    <group>
      {/* House base */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.5, 0.6, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      {/* Roof - two planes forming a peak */}
      <mesh position={[-0.4, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.4, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.1]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
    </group>
  );
}

function MetalRoof() {
  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.5, 0.6, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      <mesh position={[-0.4, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.06, 1.1]} />
        <meshStandardMaterial color="#607d8b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.4, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.06, 1.1]} />
        <meshStandardMaterial color="#607d8b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function TileRoof() {
  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.5, 0.6, 1]} />
        <meshStandardMaterial color="#faf8f5" />
      </mesh>
      <mesh position={[-0.4, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.1, 1.1]} />
        <meshStandardMaterial color="#c75b39" />
      </mesh>
      <mesh position={[0.4, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.1, 1.1]} />
        <meshStandardMaterial color="#c75b39" />
      </mesh>
    </group>
  );
}

function FlatRoof() {
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.5, 0.9, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.1, 1.1]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </group>
  );
}

function StoneCoatedRoof() {
  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.5, 0.6, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      <mesh position={[-0.4, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.1]} />
        <meshStandardMaterial color="#4a635d" roughness={0.6} />
      </mesh>
      <mesh position={[0.4, 0.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1, 0.08, 1.1]} />
        <meshStandardMaterial color="#4a635d" roughness={0.6} />
      </mesh>
    </group>
  );
}

function TPORoof() {
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.5, 0.9, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.08, 1.1]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
}

function ModifiedBitumenRoof() {
  return (
    <group>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.5, 0.9, 1]} />
        <meshStandardMaterial color="#e8e0d5" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.1, 1.1]} />
        <meshStandardMaterial color="#2e2e2e" />
      </mesh>
    </group>
  );
}

export function RoofTypeGraphic({ type, selected }: RoofTypeGraphicProps) {
  const RoofComponent = useMemo(() => {
    switch (type) {
      case "shingle": return ShingleRoof;
      case "metal": return MetalRoof;
      case "tile": return TileRoof;
      case "flat": return FlatRoof;
      case "stone-coated": return StoneCoatedRoof;
      case "tpo": return TPORoof;
      case "modified": return ModifiedBitumenRoof;
      default: return ShingleRoof;
    }
  }, [type]);

  return (
    <div className={`w-20 h-20 rounded-lg overflow-hidden ${selected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}`}>
      <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <RoofComponent />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
