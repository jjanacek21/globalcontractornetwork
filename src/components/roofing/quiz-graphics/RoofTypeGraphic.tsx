import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoofTypeGraphicProps {
  type: "shingle" | "metal" | "tile" | "flat" | "stone-coated" | "tpo" | "modified";
  selected?: boolean;
}

const ROOF_INFO: Record<string, { name: string; description: string }> = {
  shingle: { name: "Asphalt Shingles", description: "Most popular choice. Durable, affordable, and available in many colors." },
  metal: { name: "Standing Seam Metal", description: "Long-lasting with raised seams. Energy efficient and modern look." },
  tile: { name: "Clay/Concrete Tile", description: "Classic barrel tiles. Excellent for hot climates and Mediterranean style." },
  flat: { name: "Flat Roof (Built-Up)", description: "Low-slope design for commercial or modern residential buildings." },
  "stone-coated": { name: "Stone-Coated Steel", description: "Metal durability with stone granule finish. Hurricane resistant." },
  tpo: { name: "TPO Membrane", description: "White reflective membrane. Great for energy savings on flat roofs." },
  modified: { name: "Modified Bitumen", description: "Multi-layer flat roof system. Excellent waterproofing for low slopes." },
};

function ShingleRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* House base with more detail */}
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[1.5, 0.55, 1]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Roof deck base - left side */}
        <mesh position={[-0.42, 0.2, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[1.05, 0.04, 1.12]} />
          <meshStandardMaterial color="#8d7355" />
        </mesh>
        
        {/* Roof deck base - right side */}
        <mesh position={[0.42, 0.2, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[1.05, 0.04, 1.12]} />
          <meshStandardMaterial color="#8d7355" />
        </mesh>
        
        {/* Shingle rows - left side (staggered) */}
        {[0.08, 0.18, 0.28, 0.38].map((yOffset, rowIndex) => (
          <group key={`left-${rowIndex}`}>
            {[-0.45, -0.3, -0.15, 0].map((zOffset, i) => (
              <mesh 
                key={`left-shingle-${rowIndex}-${i}`}
                position={[-0.55 + yOffset * 0.6, yOffset + 0.02, zOffset + (rowIndex % 2 === 0 ? 0 : 0.075)]} 
                rotation={[0, 0, Math.PI / 5.5]}
              >
                <boxGeometry args={[0.14, 0.025, 0.14]} />
                <meshStandardMaterial 
                  color={rowIndex % 2 === 0 ? "#4a3728" : "#5d4037"} 
                  roughness={0.9}
                />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Shingle rows - right side (staggered) */}
        {[0.08, 0.18, 0.28, 0.38].map((yOffset, rowIndex) => (
          <group key={`right-${rowIndex}`}>
            {[0, 0.15, 0.3, 0.45].map((zOffset, i) => (
              <mesh 
                key={`right-shingle-${rowIndex}-${i}`}
                position={[0.55 - yOffset * 0.6, yOffset + 0.02, zOffset - 0.45 + (rowIndex % 2 === 0 ? 0 : 0.075)]} 
                rotation={[0, 0, -Math.PI / 5.5]}
              >
                <boxGeometry args={[0.14, 0.025, 0.14]} />
                <meshStandardMaterial 
                  color={rowIndex % 2 === 0 ? "#5d4037" : "#4a3728"} 
                  roughness={0.9}
                />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Ridge cap */}
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[0.12, 0.05, 1.1]} />
          <meshStandardMaterial color="#3d2817" roughness={0.85} />
        </mesh>
      </group>
    </Float>
  );
}

function MetalRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[1.5, 0.55, 1]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Standing seam panels - left side */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((z, i) => (
          <group key={`left-panel-${i}`}>
            <mesh position={[-0.42, 0.22, z]} rotation={[0, 0, Math.PI / 5.5]}>
              <boxGeometry args={[1.02, 0.03, 0.18]} />
              <meshStandardMaterial color="#546e7a" metalness={0.85} roughness={0.15} />
            </mesh>
            {/* Raised seam */}
            <mesh position={[-0.42, 0.25, z + 0.09]} rotation={[0, 0, Math.PI / 5.5]}>
              <boxGeometry args={[1.02, 0.04, 0.02]} />
              <meshStandardMaterial color="#37474f" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        ))}
        
        {/* Standing seam panels - right side */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((z, i) => (
          <group key={`right-panel-${i}`}>
            <mesh position={[0.42, 0.22, z]} rotation={[0, 0, -Math.PI / 5.5]}>
              <boxGeometry args={[1.02, 0.03, 0.18]} />
              <meshStandardMaterial color="#546e7a" metalness={0.85} roughness={0.15} />
            </mesh>
            {/* Raised seam */}
            <mesh position={[0.42, 0.25, z - 0.09]} rotation={[0, 0, -Math.PI / 5.5]}>
              <boxGeometry args={[1.02, 0.04, 0.02]} />
              <meshStandardMaterial color="#37474f" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        ))}
        
        {/* Metal ridge cap */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.15, 0.06, 1.1]} />
          <meshStandardMaterial color="#455a64" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </Float>
  );
}

function TileRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[1.5, 0.55, 1]} />
          <meshStandardMaterial color="#faf8f5" />
        </mesh>
        
        {/* Barrel tiles - left side */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((z, i) => (
          <group key={`left-tile-row-${i}`}>
            {[0.1, 0.25, 0.4].map((offset, j) => (
              <mesh 
                key={`left-tile-${i}-${j}`}
                position={[-0.55 + offset * 0.65, offset + 0.05, z]} 
                rotation={[Math.PI / 2, 0, Math.PI / 5.5]}
              >
                <cylinderGeometry args={[0.045, 0.045, 0.18, 8, 1, false, 0, Math.PI]} />
                <meshStandardMaterial 
                  color={j % 2 === 0 ? "#c75b39" : "#b8512f"} 
                  roughness={0.7}
                />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Barrel tiles - right side */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((z, i) => (
          <group key={`right-tile-row-${i}`}>
            {[0.1, 0.25, 0.4].map((offset, j) => (
              <mesh 
                key={`right-tile-${i}-${j}`}
                position={[0.55 - offset * 0.65, offset + 0.05, z]} 
                rotation={[Math.PI / 2, 0, -Math.PI / 5.5]}
              >
                <cylinderGeometry args={[0.045, 0.045, 0.18, 8, 1, false, 0, Math.PI]} />
                <meshStandardMaterial 
                  color={j % 2 === 0 ? "#b8512f" : "#c75b39"} 
                  roughness={0.7}
                />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Ridge tiles */}
        {[-0.3, 0, 0.3].map((z, i) => (
          <mesh key={`ridge-${i}`} position={[0, 0.52, z]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.25, 8, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#9e3d26" roughness={0.65} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function FlatRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Commercial building base */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[1.5, 0.85, 1]} />
          <meshStandardMaterial color="#e8e0d5" />
        </mesh>
        
        {/* Flat roof membrane with slight slope */}
        <mesh position={[0, 0.38, 0]} rotation={[0.03, 0, 0]}>
          <boxGeometry args={[1.6, 0.06, 1.1]} />
          <meshStandardMaterial color="#37474f" roughness={0.8} />
        </mesh>
        
        {/* Gravel/ballast texture */}
        {[...Array(12)].map((_, i) => (
          <mesh 
            key={`gravel-${i}`}
            position={[
              (Math.random() - 0.5) * 1.3,
              0.42,
              (Math.random() - 0.5) * 0.9
            ]}
          >
            <sphereGeometry args={[0.03 + Math.random() * 0.02, 6, 6]} />
            <meshStandardMaterial color="#546e7a" roughness={0.9} />
          </mesh>
        ))}
        
        {/* Parapet walls */}
        <mesh position={[0, 0.48, 0.55]}>
          <boxGeometry args={[1.6, 0.15, 0.05]} />
          <meshStandardMaterial color="#d5cfc7" />
        </mesh>
        <mesh position={[0, 0.48, -0.55]}>
          <boxGeometry args={[1.6, 0.15, 0.05]} />
          <meshStandardMaterial color="#d5cfc7" />
        </mesh>
        
        {/* HVAC unit */}
        <mesh position={[0.4, 0.52, -0.2]}>
          <boxGeometry args={[0.3, 0.2, 0.25]} />
          <meshStandardMaterial color="#78909c" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

function StoneCoatedRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[1.5, 0.55, 1]} />
          <meshStandardMaterial color="#e8e0d5" />
        </mesh>
        
        {/* Stone-coated steel panels - left */}
        <mesh position={[-0.42, 0.22, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[1.02, 0.05, 1.08]} />
          <meshStandardMaterial color="#3d5c4a" roughness={0.85} metalness={0.3} />
        </mesh>
        
        {/* Granular texture - left side */}
        {[...Array(25)].map((_, i) => (
          <mesh 
            key={`left-grain-${i}`}
            position={[
              -0.65 + (i % 5) * 0.15 + Math.random() * 0.05,
              0.1 + Math.floor(i / 5) * 0.1 + Math.random() * 0.02,
              (Math.random() - 0.5) * 0.9
            ]}
            rotation={[0, 0, Math.PI / 5.5]}
          >
            <sphereGeometry args={[0.015 + Math.random() * 0.01, 4, 4]} />
            <meshStandardMaterial 
              color={Math.random() > 0.5 ? "#4a6b55" : "#2d4436"} 
              roughness={0.95} 
            />
          </mesh>
        ))}
        
        {/* Stone-coated steel panels - right */}
        <mesh position={[0.42, 0.22, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[1.02, 0.05, 1.08]} />
          <meshStandardMaterial color="#3d5c4a" roughness={0.85} metalness={0.3} />
        </mesh>
        
        {/* Granular texture - right side */}
        {[...Array(25)].map((_, i) => (
          <mesh 
            key={`right-grain-${i}`}
            position={[
              0.65 - (i % 5) * 0.15 - Math.random() * 0.05,
              0.1 + Math.floor(i / 5) * 0.1 + Math.random() * 0.02,
              (Math.random() - 0.5) * 0.9
            ]}
            rotation={[0, 0, -Math.PI / 5.5]}
          >
            <sphereGeometry args={[0.015 + Math.random() * 0.01, 4, 4]} />
            <meshStandardMaterial 
              color={Math.random() > 0.5 ? "#4a6b55" : "#2d4436"} 
              roughness={0.95} 
            />
          </mesh>
        ))}
        
        {/* Ridge */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.14, 0.06, 1.1]} />
          <meshStandardMaterial color="#2d4436" roughness={0.9} metalness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

function TPORoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[1.5, 0.85, 1]} />
          <meshStandardMaterial color="#e8e0d5" />
        </mesh>
        
        {/* TPO membrane - bright white */}
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[1.6, 0.05, 1.1]} />
          <meshStandardMaterial color="#fafafa" roughness={0.3} />
        </mesh>
        
        {/* Welded seams */}
        {[-0.5, 0, 0.5].map((x, i) => (
          <mesh key={`seam-${i}`} position={[x, 0.42, 0]}>
            <boxGeometry args={[0.04, 0.015, 1.1]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.4} />
          </mesh>
        ))}
        
        {/* Parapet walls */}
        <mesh position={[0, 0.48, 0.55]}>
          <boxGeometry args={[1.6, 0.15, 0.05]} />
          <meshStandardMaterial color="#d5cfc7" />
        </mesh>
        <mesh position={[0, 0.48, -0.55]}>
          <boxGeometry args={[1.6, 0.15, 0.05]} />
          <meshStandardMaterial color="#d5cfc7" />
        </mesh>
        
        {/* Edge termination */}
        <mesh position={[0.8, 0.41, 0]}>
          <boxGeometry args={[0.06, 0.08, 1.1]} />
          <meshStandardMaterial color="#bdbdbd" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function ModifiedBitumenRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[1.5, 0.85, 1]} />
          <meshStandardMaterial color="#e8e0d5" />
        </mesh>
        
        {/* Base layer */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.6, 0.04, 1.1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        
        {/* Cap sheet with granules */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.6, 0.05, 1.1]} />
          <meshStandardMaterial color="#2e2e2e" roughness={0.95} />
        </mesh>
        
        {/* Visible overlap seams */}
        {[-0.35, 0.35].map((z, i) => (
          <mesh key={`overlap-${i}`} position={[0, 0.44, z]}>
            <boxGeometry args={[1.6, 0.02, 0.08]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
          </mesh>
        ))}
        
        {/* Granular texture */}
        {[...Array(20)].map((_, i) => (
          <mesh 
            key={`granule-${i}`}
            position={[
              (Math.random() - 0.5) * 1.4,
              0.44,
              (Math.random() - 0.5) * 0.9
            ]}
          >
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshStandardMaterial color="#3a3a3a" roughness={1} />
          </mesh>
        ))}
        
        {/* Parapet */}
        <mesh position={[0, 0.52, 0.55]}>
          <boxGeometry args={[1.6, 0.18, 0.05]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
      </group>
    </Float>
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

  const info = ROOF_INFO[type] || ROOF_INFO.shingle;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selected ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-border hover:ring-primary/50'}`}>
            <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-3, 2, -3]} intensity={0.3} />
              <RoofComponent />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
            </Canvas>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="font-semibold">{info.name}</p>
          <p className="text-xs text-muted-foreground">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
