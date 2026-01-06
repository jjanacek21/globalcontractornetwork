import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Star, Home, Building2, Check } from "lucide-react";

interface ColorSwatch {
  name: string;
  hex: string;
  popular?: boolean;
}

interface HouseStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  baseColor: string;
  roofMaskGradient: string;
}

const shingleColors: ColorSwatch[] = [
  { name: "Charcoal Black", hex: "#2d2d2d", popular: true },
  { name: "Weathered Wood", hex: "#5c4a3d", popular: true },
  { name: "Desert Tan", hex: "#c2a882" },
  { name: "Slate Gray", hex: "#6b7b8c", popular: true },
  { name: "Colonial Slate", hex: "#4a5568" },
  { name: "Rustic Cedar", hex: "#8b5a3c" },
  { name: "Pewter Gray", hex: "#9ba3a9" },
  { name: "Driftwood", hex: "#7d6c5c" },
  { name: "Onyx Black", hex: "#1a1a1a" },
  { name: "Barkwood", hex: "#6d5c4c" }
];

const metalColors: ColorSwatch[] = [
  { name: "Galvalume", hex: "#b8bcc0", popular: true },
  { name: "White", hex: "#f5f5f5", popular: true },
  { name: "Charcoal", hex: "#3d3d3d", popular: true },
  { name: "Bronze", hex: "#6d4c3d" },
  { name: "Forest Green", hex: "#2d5a3d" },
  { name: "Ocean Blue", hex: "#3d5a7c" },
  { name: "Barn Red", hex: "#8b3a3a" },
  { name: "Copper", hex: "#b87333" },
  { name: "Clay", hex: "#a67c5b" },
  { name: "Black", hex: "#1a1a1a" }
];

const houseStyles: HouseStyle[] = [
  {
    id: "ranch",
    name: "Ranch",
    description: "Single-story with low-pitched roof",
    icon: <Home className="h-5 w-5" />,
    baseColor: "#e8ddd4",
    roofMaskGradient: "polygon(10% 40%, 50% 15%, 90% 40%, 90% 50%, 10% 50%)"
  },
  {
    id: "colonial",
    name: "Colonial",
    description: "Two-story traditional home",
    icon: <Building2 className="h-5 w-5" />,
    baseColor: "#f5f0e8",
    roofMaskGradient: "polygon(5% 35%, 50% 5%, 95% 35%, 95% 45%, 5% 45%)"
  },
  {
    id: "mediterranean",
    name: "Mediterranean",
    description: "Stucco with tile roof",
    icon: <Home className="h-5 w-5" />,
    baseColor: "#f0e6d3",
    roofMaskGradient: "polygon(8% 38%, 50% 10%, 92% 38%, 92% 48%, 8% 48%)"
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary flat/low-slope",
    icon: <Building2 className="h-5 w-5" />,
    baseColor: "#e5e5e5",
    roofMaskGradient: "polygon(5% 35%, 95% 35%, 95% 42%, 5% 42%)"
  }
];

export const RoofColorVisualizer = () => {
  const [materialType, setMaterialType] = useState<"shingles" | "metal">("shingles");
  const [selectedColor, setSelectedColor] = useState<ColorSwatch>(shingleColors[0]);
  const [selectedHouse, setSelectedHouse] = useState<HouseStyle>(houseStyles[0]);

  const colors = materialType === "shingles" ? shingleColors : metalColors;

  // When switching material, reset to first color of that type
  const handleMaterialChange = (type: "shingles" | "metal") => {
    setMaterialType(type);
    setSelectedColor(type === "shingles" ? shingleColors[0] : metalColors[0]);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="text-sm">
            <Palette className="h-3 w-3 mr-1" />
            Color Visualizer
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            See Your New <span className="text-primary">Roof in Color</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preview different roofing colors on various house styles. 
            Find the perfect color to complement your home.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Roof Color Preview</CardTitle>
              <CardDescription>
                Select a material type, house style, and color to see a preview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Material Type Toggle */}
              <Tabs value={materialType} onValueChange={(v) => handleMaterialChange(v as "shingles" | "metal")}>
                <TabsList className="grid w-full max-w-xs grid-cols-2">
                  <TabsTrigger value="shingles">Shingles</TabsTrigger>
                  <TabsTrigger value="metal">Metal</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid md:grid-cols-2 gap-8">
                {/* House Preview */}
                <div className="space-y-4">
                  <div 
                    className="aspect-[4/3] rounded-xl overflow-hidden relative border-2 border-border shadow-lg"
                    style={{ backgroundColor: selectedHouse.baseColor }}
                  >
                    {/* Simple SVG House Illustration */}
                    <svg viewBox="0 0 400 300" className="w-full h-full">
                      {/* Sky */}
                      <rect x="0" y="0" width="400" height="150" fill="#87CEEB" opacity="0.3" />
                      
                      {/* Ground */}
                      <rect x="0" y="250" width="400" height="50" fill="#7cb342" opacity="0.4" />
                      
                      {/* House Body */}
                      <rect x="60" y="150" width="280" height="100" fill={selectedHouse.baseColor} stroke="#333" strokeWidth="2" />
                      
                      {/* Roof */}
                      <polygon 
                        points="40,150 200,60 360,150" 
                        fill={selectedColor.hex}
                        stroke="#333"
                        strokeWidth="2"
                      />
                      
                      {/* Roof Texture Lines for Shingles */}
                      {materialType === "shingles" && (
                        <>
                          <line x1="60" y1="130" x2="340" y2="130" stroke="#00000020" strokeWidth="1" />
                          <line x1="75" y1="115" x2="325" y2="115" stroke="#00000020" strokeWidth="1" />
                          <line x1="95" y1="100" x2="305" y2="100" stroke="#00000020" strokeWidth="1" />
                          <line x1="115" y1="85" x2="285" y2="85" stroke="#00000020" strokeWidth="1" />
                        </>
                      )}
                      
                      {/* Metal Roof Lines */}
                      {materialType === "metal" && (
                        <>
                          <line x1="120" y1="150" x2="160" y2="75" stroke="#ffffff30" strokeWidth="2" />
                          <line x1="170" y1="150" x2="190" y2="68" stroke="#ffffff30" strokeWidth="2" />
                          <line x1="220" y1="150" x2="210" y2="65" stroke="#ffffff30" strokeWidth="2" />
                          <line x1="270" y1="150" x2="230" y2="68" stroke="#ffffff30" strokeWidth="2" />
                          <line x1="320" y1="150" x2="255" y2="75" stroke="#ffffff30" strokeWidth="2" />
                        </>
                      )}
                      
                      {/* Door */}
                      <rect x="175" y="190" width="50" height="60" fill="#5c4033" stroke="#333" strokeWidth="1" />
                      <circle cx="215" cy="220" r="3" fill="#c9a959" />
                      
                      {/* Windows */}
                      <rect x="90" y="180" width="50" height="40" fill="#87CEEB" stroke="#333" strokeWidth="1" />
                      <line x1="115" y1="180" x2="115" y2="220" stroke="#333" strokeWidth="1" />
                      <line x1="90" y1="200" x2="140" y2="200" stroke="#333" strokeWidth="1" />
                      
                      <rect x="260" y="180" width="50" height="40" fill="#87CEEB" stroke="#333" strokeWidth="1" />
                      <line x1="285" y1="180" x2="285" y2="220" stroke="#333" strokeWidth="1" />
                      <line x1="260" y1="200" x2="310" y2="200" stroke="#333" strokeWidth="1" />
                      
                      {/* Chimney */}
                      <rect x="280" y="70" width="30" height="50" fill="#8b7355" stroke="#333" strokeWidth="1" />
                    </svg>
                    
                    {/* Color Overlay Label */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-border"
                            style={{ backgroundColor: selectedColor.hex }}
                          />
                          <span className="font-medium text-sm">{selectedColor.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {materialType === "shingles" ? "Shingle" : "Metal"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* House Style Selector */}
                  <div className="grid grid-cols-4 gap-2">
                    {houseStyles.map(style => (
                      <Button
                        key={style.id}
                        variant={selectedHouse.id === style.id ? "default" : "outline"}
                        size="sm"
                        className="flex flex-col h-auto py-2 gap-1"
                        onClick={() => setSelectedHouse(style)}
                      >
                        {style.icon}
                        <span className="text-xs">{style.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      {materialType === "shingles" ? "Shingle Colors" : "Metal Colors"}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {colors.length} options
                    </Badge>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {colors.map(color => (
                      <button
                        key={color.name}
                        className={`group relative aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                          selectedColor.name === color.name 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => setSelectedColor(color)}
                        title={color.name}
                      >
                        {color.popular && (
                          <Star className="absolute -top-1 -right-1 h-4 w-4 text-amber-500 fill-amber-500" />
                        )}
                        {selectedColor.name === color.name && (
                          <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Selected Color Info */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-border shadow-inner"
                          style={{ backgroundColor: selectedColor.hex }}
                        />
                        <div>
                          <div className="font-semibold text-lg">{selectedColor.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {materialType === "shingles" ? "Asphalt Shingle" : "Metal Panel"}
                          </div>
                          {selectedColor.popular && (
                            <Badge className="mt-1 bg-amber-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Most Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tips */}
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>💡 <strong>Tip:</strong> Dark colors absorb more heat, while light colors reflect it. Consider your climate!</p>
                    <p>🏠 <strong>Pro tip:</strong> {materialType === "shingles" 
                      ? "Architectural shingles offer more dimension and better curb appeal."
                      : "Kynar-coated metal provides superior fade resistance."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
