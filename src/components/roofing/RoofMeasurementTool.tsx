import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Pencil, Trash2, Calculator } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

interface RoofMeasurements {
  flatArea: number;
  pitchedArea: number;
  totalSquares: number;
  address: string;
  pitchMultiplier: number;
  wasteFactor: number;
}

interface RoofMeasurementToolProps {
  onMeasurementComplete: (measurements: RoofMeasurements) => void;
}

const PITCH_MULTIPLIERS: { [key: string]: number } = {
  "3/12": 1.031,
  "4/12": 1.054,
  "5/12": 1.083,
  "6/12": 1.118,
  "7/12": 1.158,
  "8/12": 1.202,
  "9/12": 1.250,
  "10/12": 1.302,
  "11/12": 1.357,
  "12/12": 1.414,
};

export function RoofMeasurementTool({ onMeasurementComplete }: RoofMeasurementToolProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [pitch, setPitch] = useState("6/12");
  const [wasteFactor, setWasteFactor] = useState(10);
  const [flatArea, setFlatArea] = useState(0);
  const [pitchedArea, setPitchedArea] = useState(0);
  const [totalSquares, setTotalSquares] = useState(0);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
    });

    map.current.addControl(draw.current as any);

    map.current.on("draw.create", updateMeasurements);
    map.current.on("draw.update", updateMeasurements);
    map.current.on("draw.delete", updateMeasurements);

    return () => {
      map.current?.remove();
    };
  }, []);

  // Search for addresses
  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${mapboxgl.accessToken}&limit=5&types=address`
        );
        const data = await response.json();
        setResults(data.features || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching address:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectResult = (result: any) => {
    setQuery(result.place_name);
    setSelectedAddress(result.place_name);
    setShowResults(false);
    setResults([]);
    
    if (map.current) {
      map.current.flyTo({
        center: result.center,
        zoom: 19,
        pitch: 0,
        bearing: 0,
        essential: true,
      });
    }
  };

  const updateMeasurements = () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      setFlatArea(0);
      setPitchedArea(0);
      setTotalSquares(0);
      return;
    }

    let totalArea = 0;
    data.features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        const polygon = turf.polygon(feature.geometry.coordinates);
        const areaMeters = turf.area(polygon);
        totalArea += areaMeters * 10.7639; // Convert sq meters to sq feet
      }
    });

    setFlatArea(totalArea);
    
    const pitchMult = PITCH_MULTIPLIERS[pitch];
    const pitched = totalArea * pitchMult;
    setPitchedArea(pitched);
    
    const withWaste = pitched * (1 + wasteFactor / 100);
    const squares = withWaste / 100;
    setTotalSquares(squares);
  };

  useEffect(() => {
    updateMeasurements();
  }, [pitch, wasteFactor]);

  const handleStartDrawing = () => {
    if (draw.current) {
      draw.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  };

  const handleClear = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setFlatArea(0);
      setPitchedArea(0);
      setTotalSquares(0);
    }
  };

  const handleGenerateReport = () => {
    if (totalSquares === 0 || !selectedAddress) {
      return;
    }

    onMeasurementComplete({
      flatArea,
      pitchedArea,
      totalSquares,
      address: selectedAddress,
      pitchMultiplier: PITCH_MULTIPLIERS[pitch],
      wasteFactor,
    });
  };

  return (
    <div className="space-y-4">
      {/* Address Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="address-search">Enter Your Property Address</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address-search"
                  type="text"
                  placeholder="123 Main St, City, State"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  className="pl-10"
                />
                {showResults && results.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full px-4 py-2 text-left hover:bg-accent text-sm transition-colors"
                      >
                        {result.place_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedAddress && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedAddress}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
            
            {/* Drawing Controls */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Button
                onClick={handleStartDrawing}
                disabled={!selectedAddress}
                size="sm"
                variant={isDrawing ? "default" : "secondary"}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {isDrawing ? "Drawing..." : "Draw Roof"}
              </Button>
              <Button
                onClick={handleClear}
                size="sm"
                variant="destructive"
                disabled={flatArea === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {/* Measurement Display */}
            {flatArea > 0 && (
              <Card className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Flat Area</Label>
                      <div className="text-lg font-bold">{flatArea.toFixed(0)} sq ft</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pitched Area</Label>
                      <div className="text-lg font-bold">{pitchedArea.toFixed(0)} sq ft</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">With {wasteFactor}% Waste</Label>
                      <div className="text-lg font-bold">{(pitchedArea * (1 + wasteFactor / 100)).toFixed(0)} sq ft</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Squares</Label>
                      <div className="text-lg font-bold text-primary">{totalSquares.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calculation Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pitch">Roof Pitch</Label>
              <Select value={pitch} onValueChange={setPitch}>
                <SelectTrigger id="pitch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PITCH_MULTIPLIERS).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p} (×{PITCH_MULTIPLIERS[p].toFixed(3)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="waste">Waste Factor (%)</Label>
              <Select value={String(wasteFactor)} onValueChange={(v) => setWasteFactor(Number(v))}>
                <SelectTrigger id="waste">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Report Button */}
      <Button
        onClick={handleGenerateReport}
        disabled={totalSquares === 0 || !selectedAddress}
        size="lg"
        className="w-full"
      >
        <Calculator className="h-5 w-5 mr-2" />
        Get My Free Measurement Report
      </Button>
    </div>
  );
}
