import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConditionGraphicProps {
  condition: "solid" | "needs-work" | "urgent" | "emergency";
  selected?: boolean;
}

const CONDITION_INFO: Record<string, { name: string; description: string }> = {
  solid: { name: "Solid Condition", description: "Roof is in great shape. Just needs routine maintenance." },
  "needs-work": { name: "Needs Work", description: "Some wear visible. Should address within 1-2 years." },
  urgent: { name: "Getting Urgent", description: "Noticeable damage present. Repairs needed soon." },
  emergency: { name: "Emergency", description: "Active leaks or severe damage. Immediate attention required." },
};

function SolidRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* House base */}
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[1.4, 0.5, 1]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Perfect shingle rows - left side */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`left-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => (
              <mesh 
                key={`left-${rowIndex}-${i}`}
                position={[-0.52 + yOffset * 0.55, yOffset + 0.02, zOffset + (rowIndex % 2 === 0 ? 0 : 0.1)]} 
                rotation={[0, 0, Math.PI / 5.5]}
              >
                <boxGeometry args={[0.1, 0.02, 0.18]} />
                <meshStandardMaterial color="#4caf50" roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Perfect shingle rows - right side */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`right-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => (
              <mesh 
                key={`right-${rowIndex}-${i}`}
                position={[0.52 - yOffset * 0.55, yOffset + 0.02, zOffset + (rowIndex % 2 === 0 ? 0.1 : 0)]} 
                rotation={[0, 0, -Math.PI / 5.5]}
              >
                <boxGeometry args={[0.1, 0.02, 0.18]} />
                <meshStandardMaterial color="#43a047" roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Ridge cap */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.1, 0.04, 1]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.85} />
        </mesh>
        
        {/* Checkmark indicator */}
        <group position={[0, 0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#2e7d32" />
          </mesh>
          {/* Check mark */}
          <mesh position={[-0.02, 0, 0.06]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.04, 0.015, 0.015]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.025, 0.02, 0.06]} rotation={[0, 0, 0.8]}>
            <boxGeometry args={[0.06, 0.015, 0.015]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

function NeedsWorkRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[1.4, 0.5, 1]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Worn shingle rows - left side with some fading */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`left-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => (
              <mesh 
                key={`left-${rowIndex}-${i}`}
                position={[-0.52 + yOffset * 0.55, yOffset + 0.02, zOffset + (rowIndex % 2 === 0 ? 0 : 0.1)]} 
                rotation={[0, 0, Math.PI / 5.5]}
              >
                <boxGeometry args={[0.1, 0.02, 0.18]} />
                <meshStandardMaterial 
                  color={(rowIndex === 2 && i === 2) ? "#9e9e9e" : "#ffc107"} 
                  roughness={0.85} 
                />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Right side with curled shingle */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`right-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => {
              const isCurled = rowIndex === 3 && i === 1;
              return (
                <mesh 
                  key={`right-${rowIndex}-${i}`}
                  position={[
                    0.52 - yOffset * 0.55, 
                    yOffset + 0.02 + (isCurled ? 0.03 : 0), 
                    zOffset + (rowIndex % 2 === 0 ? 0.1 : 0)
                  ]} 
                  rotation={[isCurled ? 0.3 : 0, 0, -Math.PI / 5.5]}
                >
                  <boxGeometry args={[0.1, 0.02, 0.18]} />
                  <meshStandardMaterial 
                    color={isCurled ? "#8d6e63" : "#ffb300"} 
                    roughness={0.85} 
                  />
                </mesh>
              );
            })}
          </group>
        ))}
        
        {/* Moss spot */}
        <mesh position={[-0.25, 0.22, 0.25]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#558b2f" roughness={0.95} />
        </mesh>
        <mesh position={[-0.2, 0.2, 0.3]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#689f38" roughness={0.95} />
        </mesh>
        
        {/* Ridge cap */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.1, 0.04, 1]} />
          <meshStandardMaterial color="#f9a825" roughness={0.9} />
        </mesh>
        
        {/* Warning indicator */}
        <mesh position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial color="#ff8f00" />
        </mesh>
        <mesh position={[0, 0.58, 0.05]}>
          <boxGeometry args={[0.015, 0.035, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </Float>
  );
}

function UrgentRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[1.4, 0.5, 1]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Damaged shingle rows - left side with gaps */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`left-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => {
              // Missing shingles
              const isMissing = (rowIndex === 2 && i === 1) || (rowIndex === 3 && i === 3);
              if (isMissing) return null;
              
              return (
                <mesh 
                  key={`left-${rowIndex}-${i}`}
                  position={[-0.52 + yOffset * 0.55, yOffset + 0.02, zOffset + (rowIndex % 2 === 0 ? 0 : 0.1)]} 
                  rotation={[0, 0, Math.PI / 5.5]}
                >
                  <boxGeometry args={[0.1, 0.02, 0.18]} />
                  <meshStandardMaterial color="#ff9800" roughness={0.85} />
                </mesh>
              );
            })}
          </group>
        ))}
        
        {/* Exposed decking where shingles are missing - left */}
        <mesh position={[-0.35, 0.14, -0.1]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[0.12, 0.015, 0.2]} />
          <meshStandardMaterial color="#6d4c41" roughness={0.95} />
        </mesh>
        
        {/* Right side with curled and damaged shingles */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`right-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => {
              const isCurled = (rowIndex === 2 && i === 2) || (rowIndex === 4 && i === 1);
              const isMissing = rowIndex === 1 && i === 4;
              if (isMissing) return null;
              
              return (
                <mesh 
                  key={`right-${rowIndex}-${i}`}
                  position={[
                    0.52 - yOffset * 0.55, 
                    yOffset + 0.02 + (isCurled ? 0.04 : 0), 
                    zOffset + (rowIndex % 2 === 0 ? 0.1 : 0)
                  ]} 
                  rotation={[isCurled ? 0.4 : 0, 0, -Math.PI / 5.5]}
                >
                  <boxGeometry args={[0.1, 0.02, 0.18]} />
                  <meshStandardMaterial 
                    color={isCurled ? "#795548" : "#fb8c00"} 
                    roughness={0.85} 
                  />
                </mesh>
              );
            })}
          </group>
        ))}
        
        {/* Exposed decking - right */}
        <mesh position={[0.45, 0.08, 0.45]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[0.12, 0.015, 0.2]} />
          <meshStandardMaterial color="#6d4c41" roughness={0.95} />
        </mesh>
        
        {/* Multiple moss/debris spots */}
        {[
          { pos: [-0.3, 0.25, 0.3], size: 0.05 },
          { pos: [0.2, 0.18, -0.35], size: 0.04 },
          { pos: [-0.15, 0.3, -0.2], size: 0.035 },
        ].map((moss, i) => (
          <mesh key={`moss-${i}`} position={moss.pos as [number, number, number]}>
            <sphereGeometry args={[moss.size, 6, 6]} />
            <meshStandardMaterial color="#33691e" roughness={0.95} />
          </mesh>
        ))}
        
        {/* Ridge cap - damaged */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.1, 0.04, 1]} />
          <meshStandardMaterial color="#e65100" roughness={0.9} />
        </mesh>
        
        {/* Warning triangle */}
        <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.1, 0.15, 3]} />
          <meshStandardMaterial color="#ff6d00" />
        </mesh>
        <mesh position={[0, 0.58, 0.06]}>
          <boxGeometry args={[0.015, 0.06, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.53, 0.06]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </Float>
  );
}

function EmergencyRoof() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[1.4, 0.5, 1]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Severely damaged shingles - left with many gaps */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`left-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => {
              // Many missing shingles
              const isMissing = (rowIndex === 1 && i === 2) || (rowIndex === 2 && (i === 1 || i === 2)) || (rowIndex === 3 && i === 3) || (rowIndex === 4 && i === 0);
              if (isMissing) return null;
              
              const isCurled = rowIndex === 3 && i === 0;
              return (
                <mesh 
                  key={`left-${rowIndex}-${i}`}
                  position={[
                    -0.52 + yOffset * 0.55, 
                    yOffset + 0.02 + (isCurled ? 0.05 : 0), 
                    zOffset + (rowIndex % 2 === 0 ? 0 : 0.1)
                  ]} 
                  rotation={[isCurled ? 0.5 : 0, 0, Math.PI / 5.5]}
                >
                  <boxGeometry args={[0.1, 0.02, 0.18]} />
                  <meshStandardMaterial color={isCurled ? "#5d4037" : "#f44336"} roughness={0.85} />
                </mesh>
              );
            })}
          </group>
        ))}
        
        {/* Large exposed decking area - left */}
        <mesh position={[-0.38, 0.12, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[0.2, 0.015, 0.45]} />
          <meshStandardMaterial color="#5d4037" roughness={0.95} />
        </mesh>
        
        {/* Right side - severely damaged */}
        {[0.05, 0.12, 0.19, 0.26, 0.33].map((yOffset, rowIndex) => (
          <group key={`right-row-${rowIndex}`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => {
              const isMissing = (rowIndex === 0 && i === 3) || (rowIndex === 1 && i === 4) || (rowIndex === 2 && i === 2) || (rowIndex === 3 && (i === 1 || i === 2));
              if (isMissing) return null;
              
              const isCurled = (rowIndex === 1 && i === 1) || (rowIndex === 4 && i === 3);
              return (
                <mesh 
                  key={`right-${rowIndex}-${i}`}
                  position={[
                    0.52 - yOffset * 0.55, 
                    yOffset + 0.02 + (isCurled ? 0.05 : 0), 
                    zOffset + (rowIndex % 2 === 0 ? 0.1 : 0)
                  ]} 
                  rotation={[isCurled ? 0.5 : 0, 0, -Math.PI / 5.5]}
                >
                  <boxGeometry args={[0.1, 0.02, 0.18]} />
                  <meshStandardMaterial color={isCurled ? "#4e342e" : "#e53935"} roughness={0.85} />
                </mesh>
              );
            })}
          </group>
        ))}
        
        {/* Hole in roof with visible interior */}
        <mesh position={[0.3, 0.18, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[0.25, 0.015, 0.35]} />
          <meshStandardMaterial color="#4e342e" roughness={0.95} />
        </mesh>
        <mesh position={[0.32, 0.16, 0.02]}>
          <boxGeometry args={[0.15, 0.03, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        
        {/* Tarp patch */}
        <mesh position={[-0.25, 0.25, -0.2]} rotation={[0.1, 0.1, Math.PI / 5.5]}>
          <boxGeometry args={[0.35, 0.01, 0.35]} />
          <meshStandardMaterial color="#1565c0" roughness={0.6} />
        </mesh>
        
        {/* Water stain */}
        <mesh position={[0.15, 0.05, 0.3]}>
          <cylinderGeometry args={[0.08, 0.1, 0.01, 12]} />
          <meshStandardMaterial color="#5d4037" transparent opacity={0.6} roughness={0.7} />
        </mesh>
        
        {/* Sagging section indicator */}
        <mesh position={[0.35, 0.12, -0.25]} rotation={[0.15, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[0.2, 0.02, 0.25]} />
          <meshStandardMaterial color="#b71c1c" roughness={0.85} />
        </mesh>
        
        {/* Ridge cap - broken */}
        <mesh position={[-0.2, 0.42, 0]}>
          <boxGeometry args={[0.4, 0.04, 1]} />
          <meshStandardMaterial color="#c62828" roughness={0.9} />
        </mesh>
        <mesh position={[0.3, 0.4, 0]}>
          <boxGeometry args={[0.3, 0.04, 1]} />
          <meshStandardMaterial color="#b71c1c" roughness={0.9} />
        </mesh>
        
        {/* Emergency indicator */}
        <group position={[0, 0.62, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.16, 0.04, 0.04]} />
            <meshStandardMaterial color="#d50000" emissive="#ff1744" emissiveIntensity={0.3} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.16, 0.04, 0.04]} />
            <meshStandardMaterial color="#d50000" emissive="#ff1744" emissiveIntensity={0.3} />
          </mesh>
        </group>
      </group>
    </Float>
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

  const info = CONDITION_INFO[condition] || CONDITION_INFO.solid;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selected ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-border hover:ring-primary/50'}`}>
            <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-3, 2, -3]} intensity={0.3} />
              <ConditionComponent />
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
