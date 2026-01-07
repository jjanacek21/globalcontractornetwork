import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StoryGraphicProps {
  stories: 1 | 2 | 3;
  selected?: boolean;
}

const STORY_INFO: Record<number, { name: string; description: string }> = {
  1: { name: "Single Story", description: "Ranch-style home. Easier roof access, typically lower labor costs." },
  2: { name: "Two Story", description: "Standard height home. May require longer ladders and staging." },
  3: { name: "Three+ Stories", description: "Tall structure. Requires specialized equipment and safety measures." },
};

function OneStoryHouse() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Main house - ranch style wider */}
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[1.6, 0.5, 1]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Siding texture */}
        {[-0.15, -0.05, 0.05, 0.15].map((y, i) => (
          <mesh key={`siding-${i}`} position={[0, -0.45 + y, 0.51]}>
            <boxGeometry args={[1.58, 0.008, 0.01]} />
            <meshStandardMaterial color="#e0d8cd" />
          </mesh>
        ))}
        
        {/* Garage attached */}
        <mesh position={[0.55, -0.4, 0]}>
          <boxGeometry args={[0.5, 0.4, 0.9]} />
          <meshStandardMaterial color="#ebe5db" />
        </mesh>
        
        {/* Garage door */}
        <mesh position={[0.55, -0.4, 0.46]}>
          <boxGeometry args={[0.4, 0.35, 0.02]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
        {/* Garage door panels */}
        {[-0.1, 0.1].map((y, i) => (
          <mesh key={`panel-${i}`} position={[0.55, -0.4 + y, 0.475]}>
            <boxGeometry args={[0.35, 0.12, 0.01]} />
            <meshStandardMaterial color="#795548" />
          </mesh>
        ))}
        
        {/* Roof - gable style */}
        <mesh position={[-0.15, 0.05, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.85, 0.06, 1.1]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        <mesh position={[0.15, 0.05, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.85, 0.06, 1.1]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        
        {/* Garage roof - lower */}
        <mesh position={[0.55, -0.12, 0]} rotation={[0, 0, -Math.PI / 8]}>
          <boxGeometry args={[0.55, 0.04, 0.95]} />
          <meshStandardMaterial color="#4e342e" roughness={0.85} />
        </mesh>
        
        {/* Windows - larger for ranch */}
        <mesh position={[-0.5, -0.3, 0.51]}>
          <boxGeometry args={[0.35, 0.25, 0.02]} />
          <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
        </mesh>
        {/* Window frame */}
        <mesh position={[-0.5, -0.3, 0.52]}>
          <boxGeometry args={[0.38, 0.02, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.5, -0.3, 0.52]}>
          <boxGeometry args={[0.02, 0.28, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        <mesh position={[0.1, -0.3, 0.51]}>
          <boxGeometry args={[0.25, 0.25, 0.02]} />
          <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
        </mesh>
        
        {/* Front door */}
        <mesh position={[-0.15, -0.35, 0.51]}>
          <boxGeometry args={[0.18, 0.35, 0.02]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
        {/* Door handle */}
        <mesh position={[-0.1, -0.35, 0.53]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#ffc107" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Chimney */}
        <mesh position={[-0.4, 0.25, -0.3]}>
          <boxGeometry args={[0.12, 0.25, 0.12]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
        
        {/* Foundation */}
        <mesh position={[0, -0.62, 0]}>
          <boxGeometry args={[1.65, 0.06, 1.05]} />
          <meshStandardMaterial color="#9e9e9e" />
        </mesh>
      </group>
    </Float>
  );
}

function TwoStoryHouse() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Main house - two floors */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[1.3, 0.9, 0.95]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Siding texture */}
        {[-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3].map((y, i) => (
          <mesh key={`siding-${i}`} position={[0, -0.15 + y, 0.48]}>
            <boxGeometry args={[1.28, 0.008, 0.01]} />
            <meshStandardMaterial color="#e0d8cd" />
          </mesh>
        ))}
        
        {/* Roof with steeper pitch */}
        <mesh position={[-0.35, 0.5, 0]} rotation={[0, 0, Math.PI / 5]}>
          <boxGeometry args={[0.9, 0.07, 1.05]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        <mesh position={[0.35, 0.5, 0]} rotation={[0, 0, -Math.PI / 5]}>
          <boxGeometry args={[0.9, 0.07, 1.05]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        
        {/* Dormer window */}
        <mesh position={[0, 0.45, 0.35]}>
          <boxGeometry args={[0.25, 0.2, 0.2]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        <mesh position={[0, 0.45, 0.46]}>
          <boxGeometry args={[0.15, 0.12, 0.02]} />
          <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
        </mesh>
        {/* Dormer roof */}
        <mesh position={[0, 0.58, 0.35]}>
          <boxGeometry args={[0.28, 0.04, 0.25]} />
          <meshStandardMaterial color="#4e342e" />
        </mesh>
        
        {/* First floor windows */}
        {[-0.4, 0.4].map((x, i) => (
          <group key={`window1-${i}`}>
            <mesh position={[x, -0.4, 0.48]}>
              <boxGeometry args={[0.22, 0.22, 0.02]} />
              <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
            </mesh>
            {/* Shutters */}
            <mesh position={[x - 0.14, -0.4, 0.485]}>
              <boxGeometry args={[0.04, 0.24, 0.01]} />
              <meshStandardMaterial color="#37474f" />
            </mesh>
            <mesh position={[x + 0.14, -0.4, 0.485]}>
              <boxGeometry args={[0.04, 0.24, 0.01]} />
              <meshStandardMaterial color="#37474f" />
            </mesh>
          </group>
        ))}
        
        {/* Second floor windows */}
        {[-0.4, 0.4].map((x, i) => (
          <group key={`window2-${i}`}>
            <mesh position={[x, 0.1, 0.48]}>
              <boxGeometry args={[0.22, 0.22, 0.02]} />
              <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
            </mesh>
            <mesh position={[x - 0.14, 0.1, 0.485]}>
              <boxGeometry args={[0.04, 0.24, 0.01]} />
              <meshStandardMaterial color="#37474f" />
            </mesh>
            <mesh position={[x + 0.14, 0.1, 0.485]}>
              <boxGeometry args={[0.04, 0.24, 0.01]} />
              <meshStandardMaterial color="#37474f" />
            </mesh>
          </group>
        ))}
        
        {/* Front door with arch */}
        <mesh position={[0, -0.42, 0.48]}>
          <boxGeometry args={[0.18, 0.36, 0.02]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
        {/* Door frame */}
        <mesh position={[0, -0.22, 0.49]}>
          <boxGeometry args={[0.22, 0.04, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        {/* Porch overhang */}
        <mesh position={[0, -0.18, 0.58]}>
          <boxGeometry args={[0.5, 0.03, 0.15]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
        
        {/* Chimney */}
        <mesh position={[0.5, 0.55, -0.2]}>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
        
        {/* Foundation */}
        <mesh position={[0, -0.63, 0]}>
          <boxGeometry args={[1.35, 0.06, 1]} />
          <meshStandardMaterial color="#9e9e9e" />
        </mesh>
      </group>
    </Float>
  );
}

function ThreeStoryHouse() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={[0, 0.1, 0]}>
        {/* Main house - Victorian/townhouse style */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[1.15, 1.25, 0.85]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        
        {/* Decorative trim at floor levels */}
        {[-0.35, 0.05, 0.45].map((y, i) => (
          <mesh key={`trim-${i}`} position={[0, y, 0.43]}>
            <boxGeometry args={[1.18, 0.025, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
        
        {/* Victorian steep roof */}
        <mesh position={[-0.32, 0.78, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.7, 0.06, 0.9]} />
          <meshStandardMaterial color="#37474f" roughness={0.7} />
        </mesh>
        <mesh position={[0.32, 0.78, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.7, 0.06, 0.9]} />
          <meshStandardMaterial color="#37474f" roughness={0.7} />
        </mesh>
        
        {/* Decorative gable peak */}
        <mesh position={[0, 1.0, 0.35]}>
          <coneGeometry args={[0.08, 0.15, 4]} />
          <meshStandardMaterial color="#37474f" />
        </mesh>
        
        {/* Windows - 3 rows, Victorian style */}
        {[-0.5, -0.1, 0.3].map((y, row) => (
          <group key={`row-${row}`}>
            {[-0.35, 0.35].map((x, i) => (
              <group key={`win-${row}-${i}`}>
                <mesh position={[x, y, 0.43]}>
                  <boxGeometry args={[0.18, 0.2, 0.02]} />
                  <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
                </mesh>
                {/* Arched top for top floor */}
                {row === 2 && (
                  <mesh position={[x, y + 0.12, 0.43]}>
                    <cylinderGeometry args={[0.09, 0.09, 0.02, 12, 1, false, 0, Math.PI]} />
                    <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
                  </mesh>
                )}
                {/* Window sill */}
                <mesh position={[x, y - 0.11, 0.45]}>
                  <boxGeometry args={[0.22, 0.02, 0.04]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        
        {/* Bay window on first floor */}
        <mesh position={[0, -0.5, 0.52]}>
          <boxGeometry args={[0.35, 0.3, 0.12]} />
          <meshStandardMaterial color="#f5f0e8" />
        </mesh>
        <mesh position={[0, -0.5, 0.59]}>
          <boxGeometry args={[0.28, 0.22, 0.02]} />
          <meshStandardMaterial color="#90caf9" metalness={0.3} roughness={0.2} />
        </mesh>
        {/* Bay window roof */}
        <mesh position={[0, -0.33, 0.55]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.4, 0.03, 0.15]} />
          <meshStandardMaterial color="#455a64" />
        </mesh>
        
        {/* Grand entrance door */}
        <mesh position={[0, -0.55, 0.43]}>
          <boxGeometry args={[0.15, 0.28, 0.02]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
        {/* Steps */}
        <mesh position={[0, -0.7, 0.52]}>
          <boxGeometry args={[0.25, 0.03, 0.1]} />
          <meshStandardMaterial color="#9e9e9e" />
        </mesh>
        <mesh position={[0, -0.66, 0.48]}>
          <boxGeometry args={[0.22, 0.03, 0.06]} />
          <meshStandardMaterial color="#9e9e9e" />
        </mesh>
        
        {/* Chimney - taller */}
        <mesh position={[0.4, 0.9, -0.2]}>
          <boxGeometry args={[0.1, 0.45, 0.1]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
        {/* Chimney cap */}
        <mesh position={[0.4, 1.15, -0.2]}>
          <boxGeometry args={[0.12, 0.03, 0.12]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
        
        {/* Foundation */}
        <mesh position={[0, -0.72, 0]}>
          <boxGeometry args={[1.2, 0.08, 0.9]} />
          <meshStandardMaterial color="#757575" />
        </mesh>
      </group>
    </Float>
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

  const info = STORY_INFO[stories] || STORY_INFO[1];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selected ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-border hover:ring-primary/50'}`}>
            <Canvas camera={{ position: [2.5, 1.5, 2.5], fov: 35 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-3, 2, -3]} intensity={0.3} />
              <HouseComponent />
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
