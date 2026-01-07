import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnderlaymentGraphicProps {
  type: "synthetic" | "ice-water" | "high-temp" | "fire-barrier";
  selected?: boolean;
}

const UNDERLAYMENT_INFO: Record<string, { name: string; description: string }> = {
  synthetic: { name: "Double Synthetic", description: "Two layers of synthetic felt. Standard protection, great for most roofs." },
  "ice-water": { name: "Ice & Water Shield", description: "Self-sealing membrane. Prevents ice dams and water intrusion at eaves." },
  "high-temp": { name: "High-Temp Shield", description: "Heat-resistant underlayment. Essential for metal roofs and hot climates." },
  "fire-barrier": { name: "Fire Barrier", description: "Class A fire-rated protection. Required in high fire-risk zones." },
};

function SyntheticUnderlayment() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Plywood deck showing wood grain */}
        <mesh position={[0, -0.18, 0]}>
          <boxGeometry args={[1.4, 0.08, 1]} />
          <meshStandardMaterial color="#a1887f" roughness={0.9} />
        </mesh>
        
        {/* Wood grain lines */}
        {[-0.3, 0, 0.3].map((z, i) => (
          <mesh key={`grain-${i}`} position={[0, -0.135, z]}>
            <boxGeometry args={[1.38, 0.005, 0.02]} />
            <meshStandardMaterial color="#8d6e63" />
          </mesh>
        ))}
        
        {/* First synthetic layer - rolled sheet appearance */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[1.38, 0.035, 0.98]} />
          <meshStandardMaterial color="#607d8b" roughness={0.7} />
        </mesh>
        
        {/* Roll overlap seam on first layer */}
        <mesh position={[0, -0.06, 0.25]}>
          <boxGeometry args={[1.38, 0.015, 0.08]} />
          <meshStandardMaterial color="#546e7a" roughness={0.65} />
        </mesh>
        
        {/* Second synthetic layer */}
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[1.38, 0.035, 0.98]} />
          <meshStandardMaterial color="#78909c" roughness={0.65} />
        </mesh>
        
        {/* Roll overlap seam on second layer - offset */}
        <mesh position={[0, -0.01, -0.15]}>
          <boxGeometry args={[1.38, 0.015, 0.08]} />
          <meshStandardMaterial color="#607d8b" roughness={0.6} />
        </mesh>
        
        {/* Shingles on top showing tabs */}
        {[0.02, 0.07, 0.12].map((y, row) => (
          <group key={`shingle-row-${row}`}>
            {[-0.45, -0.15, 0.15, 0.45].map((z, i) => (
              <mesh 
                key={`shingle-${row}-${i}`}
                position={[0, y, z + (row % 2 === 0 ? 0 : 0.15)]}
              >
                <boxGeometry args={[1.38, 0.025, 0.28]} />
                <meshStandardMaterial 
                  color={row % 2 === 0 ? "#4a3728" : "#5d4037"} 
                  roughness={0.9} 
                />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Nail indicators */}
        {[-0.5, 0, 0.5].map((z, i) => (
          <mesh key={`nail-${i}`} position={[0, 0.15, z]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 6]} />
            <meshStandardMaterial color="#9e9e9e" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function IceWaterShield() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Plywood deck */}
        <mesh position={[0, -0.18, 0]}>
          <boxGeometry args={[1.4, 0.08, 1]} />
          <meshStandardMaterial color="#a1887f" roughness={0.9} />
        </mesh>
        
        {/* Ice and water shield - blue self-adhesive membrane */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[1.38, 0.05, 0.98]} />
          <meshStandardMaterial color="#1976d2" roughness={0.3} />
        </mesh>
        
        {/* Peel-off backing showing adhesive */}
        <mesh position={[0.6, -0.06, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.2, 0.02, 0.98]} />
          <meshStandardMaterial color="#e3f2fd" roughness={0.2} />
        </mesh>
        
        {/* Adhesive strips visible */}
        {[-0.3, 0, 0.3].map((z, i) => (
          <mesh key={`adhesive-${i}`} position={[0, -0.05, z]}>
            <boxGeometry args={[1.38, 0.008, 0.15]} />
            <meshStandardMaterial color="#0d47a1" roughness={0.4} />
          </mesh>
        ))}
        
        {/* Shingles on top */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1.38, 0.06, 0.98]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
        
        {/* Ice crystal indicators */}
        {[
          { pos: [-0.5, 0.22, 0.35], scale: 0.08 },
          { pos: [0.45, 0.2, -0.3], scale: 0.06 },
          { pos: [-0.2, 0.25, -0.4], scale: 0.05 },
        ].map((crystal, i) => (
          <group key={`ice-${i}`} position={crystal.pos as [number, number, number]}>
            {/* Snowflake-like crystal */}
            <mesh rotation={[0, 0, 0]}>
              <octahedronGeometry args={[crystal.scale, 0]} />
              <meshStandardMaterial 
                color="#b3e5fc" 
                transparent 
                opacity={0.8}
                metalness={0.3}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
        
        {/* Water droplets being blocked */}
        {[
          { pos: [-0.35, 0.15, 0.2] },
          { pos: [0.3, 0.18, -0.15] },
        ].map((drop, i) => (
          <mesh key={`drop-${i}`} position={drop.pos as [number, number, number]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial 
              color="#42a5f5" 
              transparent 
              opacity={0.7}
              metalness={0.1}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function HighTempShield() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Plywood deck */}
        <mesh position={[0, -0.18, 0]}>
          <boxGeometry args={[1.4, 0.08, 1]} />
          <meshStandardMaterial color="#a1887f" roughness={0.9} />
        </mesh>
        
        {/* High-temp underlayment - orange/red heat resistant */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[1.38, 0.06, 0.98]} />
          <meshStandardMaterial color="#e65100" roughness={0.6} />
        </mesh>
        
        {/* Heat-resistant fiber pattern */}
        {[-0.35, 0, 0.35].map((z, i) => (
          <mesh key={`fiber-${i}`} position={[0, -0.045, z]}>
            <boxGeometry args={[1.36, 0.01, 0.12]} />
            <meshStandardMaterial color="#bf360c" roughness={0.7} />
          </mesh>
        ))}
        
        {/* Metal roof on top */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1.38, 0.04, 0.98]} />
          <meshStandardMaterial color="#607d8b" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Standing seam ridges */}
        {[-0.35, 0, 0.35].map((z, i) => (
          <mesh key={`seam-${i}`} position={[0, 0.05, z]}>
            <boxGeometry args={[1.38, 0.03, 0.03]} />
            <meshStandardMaterial color="#455a64" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
        
        {/* Heat wave indicators */}
        {[0.2, 0.3, 0.4].map((y, i) => (
          <mesh key={`heat-wave-${i}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25 - i * 0.05, 0.015, 8, 24, Math.PI]} />
            <meshStandardMaterial 
              color={i === 0 ? "#ff5722" : i === 1 ? "#ff7043" : "#ffab91"}
              transparent 
              opacity={0.7 - i * 0.15}
            />
          </mesh>
        ))}
        
        {/* Sun indicator */}
        <mesh position={[0.45, 0.35, 0.35]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#ffeb3b" emissive="#ff9800" emissiveIntensity={0.3} />
        </mesh>
        
        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <mesh 
            key={`ray-${i}`}
            position={[
              0.45 + Math.cos((angle * Math.PI) / 180) * 0.12, 
              0.35, 
              0.35 + Math.sin((angle * Math.PI) / 180) * 0.12
            ]}
            rotation={[0, 0, (angle * Math.PI) / 180]}
          >
            <boxGeometry args={[0.04, 0.01, 0.01]} />
            <meshStandardMaterial color="#ffc107" />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function FireBarrier() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Plywood deck */}
        <mesh position={[0, -0.18, 0]}>
          <boxGeometry args={[1.4, 0.08, 1]} />
          <meshStandardMaterial color="#a1887f" roughness={0.9} />
        </mesh>
        
        {/* Fire barrier layer - reflective silver/aluminum */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[1.38, 0.06, 0.98]} />
          <meshStandardMaterial 
            color="#cfd8dc" 
            metalness={0.8} 
            roughness={0.2} 
          />
        </mesh>
        
        {/* Foil-like reflection pattern */}
        {[-0.3, 0, 0.3].map((z, i) => (
          <mesh key={`foil-${i}`} position={[0, -0.045, z]}>
            <boxGeometry args={[1.36, 0.008, 0.18]} />
            <meshStandardMaterial color="#b0bec5" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        
        {/* Metal roof on top */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1.38, 0.04, 0.98]} />
          <meshStandardMaterial color="#546e7a" metalness={0.75} roughness={0.25} />
        </mesh>
        
        {/* Fire shield emblem */}
        <group position={[0, 0.25, 0]}>
          {/* Shield shape */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.18, 0.2, 0.03]} />
            <meshStandardMaterial color="#c62828" />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <coneGeometry args={[0.09, 0.08, 4]} />
            <meshStandardMaterial color="#c62828" />
          </mesh>
          
          {/* Fire icon inside shield */}
          <mesh position={[0, 0.02, 0.02]}>
            <coneGeometry args={[0.04, 0.1, 8]} />
            <meshStandardMaterial 
              color="#ff5722" 
              emissive="#ff9800" 
              emissiveIntensity={0.2}
            />
          </mesh>
          <mesh position={[0, -0.02, 0.02]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial 
              color="#ffeb3b"
              emissive="#ffc107"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
        
        {/* Flame particles being blocked */}
        {[
          { pos: [-0.4, 0.15, 0.3], scale: 0.03 },
          { pos: [0.35, 0.18, -0.25], scale: 0.025 },
          { pos: [-0.25, 0.2, -0.35], scale: 0.02 },
        ].map((flame, i) => (
          <mesh key={`flame-${i}`} position={flame.pos as [number, number, number]}>
            <coneGeometry args={[flame.scale, flame.scale * 2, 6]} />
            <meshStandardMaterial 
              color="#ff5722" 
              transparent 
              opacity={0.6}
              emissive="#ff9800"
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>
    </Float>
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

  const info = UNDERLAYMENT_INFO[type] || UNDERLAYMENT_INFO.synthetic;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selected ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-border hover:ring-primary/50'}`}>
            <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-3, 2, -3]} intensity={0.3} />
              <UnderlaymentComponent />
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
