import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VentGraphicProps {
  type: "ridge" | "off-ridge" | "solar" | "attic-breeze";
  selected?: boolean;
}

const VENT_INFO: Record<string, { name: string; description: string }> = {
  ridge: { name: "Ridge Vent", description: "Low-profile continuous vent along the roof peak. Provides even airflow." },
  "off-ridge": { name: "Off-Ridge Vents", description: "Box-style vents placed near the ridge. Good for complex roof designs." },
  solar: { name: "Solar Attic Fan", description: "Powered by the sun. Actively removes hot air from your attic." },
  "attic-breeze": { name: "Attic Breeze Premium", description: "High-performance solar fan with larger capacity. Best cooling power." },
};

function RidgeVent() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Roof section - left */}
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        {/* Roof section - right */}
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        
        {/* Ridge vent base with baffles */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.18, 0.04, 1]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        
        {/* Ridge vent cap - aluminum profile */}
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.22, 0.03, 1.02]} />
          <meshStandardMaterial color="#424242" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Airflow slots on sides */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((z, i) => (
          <group key={`vent-slot-${i}`}>
            <mesh position={[-0.1, 0.3, z]}>
              <boxGeometry args={[0.02, 0.03, 0.12]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.1, 0.3, z]}>
              <boxGeometry args={[0.02, 0.03, 0.12]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </group>
        ))}
        
        {/* Airflow arrows indicator */}
        <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.04, 0.08, 4]} />
          <meshStandardMaterial color="#64b5f6" transparent opacity={0.7} />
        </mesh>
      </group>
    </Float>
  );
}

function OffRidgeVent() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Roof section */}
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        
        {/* Off-ridge box vents with domed tops */}
        {[0.3, -0.3].map((z, i) => (
          <group key={`box-vent-${i}`} position={[-0.25, 0.18, z]} rotation={[0, 0, Math.PI / 5.5]}>
            {/* Base flange */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.22, 0.02, 0.22]} />
              <meshStandardMaterial color="#37474f" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Domed cap */}
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#455a64" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Screen/louvers */}
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.09, 0.1, 0.04, 8]} />
              <meshStandardMaterial color="#263238" />
            </mesh>
          </group>
        ))}
        
        {/* Ridge cap */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.12, 0.04, 1]} />
          <meshStandardMaterial color="#3d2817" roughness={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

function SolarVent() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Roof section */}
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        
        {/* Solar fan housing */}
        <group position={[-0.22, 0.18, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          {/* Base flange */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.18, 0.2, 0.03, 16]} />
            <meshStandardMaterial color="#37474f" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* Fan housing dome */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.15, 0.17, 0.1, 16]} />
            <meshStandardMaterial color="#455a64" metalness={0.4} roughness={0.5} />
          </mesh>
          
          {/* Fan blades inside */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <mesh 
              key={`blade-${i}`}
              position={[
                Math.cos((angle * Math.PI) / 180) * 0.08, 
                0.08, 
                Math.sin((angle * Math.PI) / 180) * 0.08
              ]}
              rotation={[0, (angle * Math.PI) / 180, 0]}
            >
              <boxGeometry args={[0.08, 0.01, 0.02]} />
              <meshStandardMaterial color="#78909c" />
            </mesh>
          ))}
          
          {/* Solar panel on top */}
          <mesh position={[0, 0.14, 0]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.22]} />
            <meshStandardMaterial color="#1565c0" metalness={0.7} roughness={0.2} />
          </mesh>
          
          {/* Solar cell grid lines */}
          {[-0.06, 0, 0.06].map((x, i) => (
            <mesh key={`grid-h-${i}`} position={[x, 0.155, 0]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.005, 0.005, 0.2]} />
              <meshStandardMaterial color="#0d47a1" />
            </mesh>
          ))}
          {[-0.06, 0, 0.06].map((z, i) => (
            <mesh key={`grid-v-${i}`} position={[0, 0.155, z]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.2, 0.005, 0.005]} />
              <meshStandardMaterial color="#0d47a1" />
            </mesh>
          ))}
        </group>
        
        {/* Ridge cap */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.12, 0.04, 1]} />
          <meshStandardMaterial color="#3d2817" roughness={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

function AtticBreezeVent() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {/* Roof section */}
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
          <boxGeometry args={[1, 0.06, 1.2]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        
        {/* Premium Attic Breeze unit - larger */}
        <group position={[-0.22, 0.2, 0]} rotation={[0, 0, Math.PI / 5.5]}>
          {/* Large base flange */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.22, 0.25, 0.04, 20]} />
            <meshStandardMaterial color="#37474f" metalness={0.6} roughness={0.4} />
          </mesh>
          
          {/* Premium brushed steel housing */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.19, 0.21, 0.14, 20]} />
            <meshStandardMaterial color="#546e7a" metalness={0.7} roughness={0.3} />
          </mesh>
          
          {/* Larger fan blades */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <mesh 
              key={`blade-${i}`}
              position={[
                Math.cos((angle * Math.PI) / 180) * 0.1, 
                0.1, 
                Math.sin((angle * Math.PI) / 180) * 0.1
              ]}
              rotation={[0, (angle * Math.PI) / 180, 0.3]}
            >
              <boxGeometry args={[0.1, 0.015, 0.03]} />
              <meshStandardMaterial color="#90a4ae" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
          
          {/* Large premium solar panel */}
          <mesh position={[0, 0.2, 0]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.32, 0.025, 0.32]} />
            <meshStandardMaterial color="#1a237e" metalness={0.8} roughness={0.15} />
          </mesh>
          
          {/* Solar cell grid */}
          {[-0.1, -0.033, 0.033, 0.1].map((x, i) => (
            <mesh key={`grid-h-${i}`} position={[x, 0.215, 0]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[0.006, 0.006, 0.3]} />
              <meshStandardMaterial color="#0d47a1" />
            </mesh>
          ))}
          {[-0.1, -0.033, 0.033, 0.1].map((z, i) => (
            <mesh key={`grid-v-${i}`} position={[0, 0.215, z]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[0.3, 0.006, 0.006]} />
              <meshStandardMaterial color="#0d47a1" />
            </mesh>
          ))}
          
          {/* Gold premium accent ring */}
          <mesh position={[0, 0.16, 0]}>
            <torusGeometry args={[0.2, 0.015, 8, 24]} />
            <meshStandardMaterial color="#ffc107" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
        
        {/* Ridge cap */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.12, 0.04, 1]} />
          <meshStandardMaterial color="#3d2817" roughness={0.9} />
        </mesh>
      </group>
    </Float>
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

  const info = VENT_INFO[type] || VENT_INFO.ridge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selected ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-border hover:ring-primary/50'}`}>
            <Canvas camera={{ position: [2, 1.5, 2], fov: 40 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-3, 2, -3]} intensity={0.3} />
              <VentComponent />
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
