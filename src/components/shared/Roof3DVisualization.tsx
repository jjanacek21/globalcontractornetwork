import { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Html } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Box, Eye, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { RoofComplexity, getPitchDegreesFromComplexity, degreesToPitchRatio } from "@/lib/roofMeasurements";

interface Roof3DVisualizationProps {
  totalSqft: number;
  roofComplexity: RoofComplexity;
  pitchDegrees?: number;
  showDimensions?: boolean;
  className?: string;
}

interface RoofMeshProps {
  roofType: RoofComplexity;
  pitchDegrees: number;
  sqft: number;
  showWireframe: boolean;
}

function RoofMesh({ roofType, pitchDegrees, sqft, showWireframe }: RoofMeshProps) {
  // Calculate dimensions based on sqft (assuming roughly square)
  const sideLength = Math.sqrt(sqft);
  const scale = sideLength / 50; // Normalize to reasonable 3D size
  const pitchHeight = Math.tan(pitchDegrees * Math.PI / 180) * (scale * 2);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    if (roofType === 'flat') {
      // Flat roof - simple box with slight parapet
      const boxGeo = new THREE.BoxGeometry(scale * 4, 0.2, scale * 4);
      return boxGeo;
    }
    
    if (roofType === 'gable') {
      // Gable roof - two triangular sides meeting at ridge
      const vertices = new Float32Array([
        // Front face
        -scale * 2, 0, scale * 2,
        scale * 2, 0, scale * 2,
        0, pitchHeight, scale * 2,
        // Back face
        -scale * 2, 0, -scale * 2,
        scale * 2, 0, -scale * 2,
        0, pitchHeight, -scale * 2,
        // Left slope
        -scale * 2, 0, scale * 2,
        0, pitchHeight, scale * 2,
        0, pitchHeight, -scale * 2,
        -scale * 2, 0, -scale * 2,
        // Right slope
        scale * 2, 0, scale * 2,
        0, pitchHeight, scale * 2,
        0, pitchHeight, -scale * 2,
        scale * 2, 0, -scale * 2,
      ]);
      
      const indices = new Uint16Array([
        0, 1, 2,  // front
        3, 5, 4,  // back
        6, 7, 8, 6, 8, 9,  // left slope
        10, 12, 11, 10, 13, 12,  // right slope
      ]);
      
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      return geo;
    }
    
    if (roofType === 'hip') {
      // Hip roof - four triangular sides meeting at peak
      const vertices = new Float32Array([
        // Base corners
        -scale * 2, 0, scale * 2,   // 0 - front left
        scale * 2, 0, scale * 2,    // 1 - front right
        scale * 2, 0, -scale * 2,   // 2 - back right
        -scale * 2, 0, -scale * 2,  // 3 - back left
        // Peak
        0, pitchHeight, 0,          // 4 - center peak
      ]);
      
      const indices = new Uint16Array([
        0, 1, 4,  // front
        1, 2, 4,  // right
        2, 3, 4,  // back
        3, 0, 4,  // left
      ]);
      
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      return geo;
    }
    
    // Complex roof - multi-faceted with different sections
    const vertices = new Float32Array([
      // Main section (hip style)
      -scale * 2, 0, scale * 1.5,
      scale * 1, 0, scale * 1.5,
      scale * 1, 0, -scale * 1.5,
      -scale * 2, 0, -scale * 1.5,
      -0.5 * scale, pitchHeight * 0.8, 0,
      // Extension section
      scale * 1, 0, scale * 1,
      scale * 2, 0, scale * 1,
      scale * 2, 0, -scale * 1,
      scale * 1, 0, -scale * 1,
      scale * 1.5, pitchHeight * 0.5, 0,
    ]);
    
    const indices = new Uint16Array([
      0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4,  // main section
      5, 6, 9, 6, 7, 9, 7, 8, 9, 8, 5, 9,  // extension
    ]);
    
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [roofType, scale, pitchHeight]);

  const material = useMemo(() => {
    if (showWireframe) {
      return new THREE.MeshBasicMaterial({ 
        color: '#3b82f6', 
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
    }
    return new THREE.MeshStandardMaterial({
      color: '#6b7280',
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
  }, [showWireframe]);

  return (
    <mesh geometry={geometry} material={material} castShadow receiveShadow>
      {/* Add subtle edge outline */}
      {!showWireframe && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#374151" transparent opacity={0.5} />
        </lineSegments>
      )}
    </mesh>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#22c55e" transparent opacity={0.3} />
    </mesh>
  );
}

function InfoLabel({ sqft, complexity }: { sqft: number; complexity: RoofComplexity }) {
  return (
    <Html position={[0, 3, 0]} center>
      <div className="bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border text-center">
        <p className="text-sm font-bold text-primary">{sqft.toLocaleString()} sq ft</p>
        <p className="text-xs text-muted-foreground capitalize">{complexity} roof</p>
      </div>
    </Html>
  );
}

export function Roof3DVisualization({ 
  totalSqft, 
  roofComplexity, 
  pitchDegrees,
  showDimensions = true,
  className = ""
}: Roof3DVisualizationProps) {
  const [showWireframe, setShowWireframe] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const actualPitch = pitchDegrees ?? getPitchDegreesFromComplexity(roofComplexity);
  const pitchRatio = degreesToPitchRatio(actualPitch);

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={className}
      >
        <Box className="h-4 w-4 mr-2" />
        View 3D Model
      </Button>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" />
            3D Roof Visualization
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Switch
              id="wireframe"
              checked={showWireframe}
              onCheckedChange={setShowWireframe}
            />
            <Label htmlFor="wireframe" className="text-xs cursor-pointer">Wireframe</Label>
          </div>
          <span className="text-muted-foreground">
            Pitch: {pitchRatio} ({actualPitch}°)
          </span>
        </div>

        <div className="h-[200px] rounded-lg overflow-hidden bg-gradient-to-b from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-950">
          <Canvas shadows>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />
              <OrbitControls 
                enablePan={false}
                minDistance={5}
                maxDistance={15}
                autoRotate
                autoRotateSpeed={0.5}
              />
              
              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={1}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <directionalLight position={[-5, 5, -5]} intensity={0.3} />
              
              {/* Roof mesh */}
              <RoofMesh 
                roofType={roofComplexity} 
                pitchDegrees={actualPitch}
                sqft={totalSqft}
                showWireframe={showWireframe}
              />
              
              {/* Ground plane */}
              <Floor />
              
              {/* Info label */}
              {showDimensions && (
                <InfoLabel sqft={totalSqft} complexity={roofComplexity} />
              )}
            </Suspense>
          </Canvas>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Click and drag to rotate • Scroll to zoom
        </p>
      </CardContent>
    </Card>
  );
}
