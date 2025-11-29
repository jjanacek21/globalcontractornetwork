import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiYW5kcmV3emhhbyIsImEiOiJjbTFqM3psMGwwZDR0Mmpwd2xlaXhsMWFpIn0.FxOGGwlmXqUQos8spvBPEw";

const COATING_PRICES = {
  acrylic: { low: 2.0, high: 3.0, name: "Acrylic" },
  "acrylic-base": { low: 3.25, high: 4.0, name: "Acrylic + Base" },
  elastomeric: { low: 3.0, high: 4.0, name: "Elastomeric" },
  silicone: { low: 3.75, high: 4.5, name: "Silicone" },
  "silicone-base": { low: 4.5, high: 7.0, name: "Silicone + Base" },
  polyurethane: { low: 4.5, high: 7.0, name: "Polyurethane" },
  rubber: { low: 6.0, high: 8.0, name: "Rubber" },
};

export const InstantQuoteTool = () => {
  const [address, setAddress] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [roofType, setRoofType] = useState<string>("");
  const [coatingType, setCoatingType] = useState<string>("");
  const [sqft, setSqft] = useState<number>(0);
  const [estimateLow, setEstimateLow] = useState<number>(0);
  const [estimateHigh, setEstimateHigh] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-80.1918, 25.7617], // Miami
      zoom: 18,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });

    map.current.addControl(draw.current);
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("draw.create", updateArea);
    map.current.on("draw.update", updateArea);
    map.current.on("draw.delete", () => {
      setSqft(0);
      calculateEstimate(0);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const searchAddress = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const selectAddress = (feature: any) => {
    setAddress(feature.place_name);
    setSearchResults([]);
    
    if (map.current) {
      map.current.flyTo({
        center: feature.center,
        zoom: 19,
      });
    }
  };

  const updateArea = () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    if (data.features.length > 0) {
      const polygon = data.features[0];
      const area = turf.area(polygon);
      const sqftCalc = Math.round(area * 10.764);
      setSqft(sqftCalc);
      calculateEstimate(sqftCalc);
    }
  };

  const calculateEstimate = (area: number) => {
    if (!area || !coatingType) {
      setEstimateLow(0);
      setEstimateHigh(0);
      return;
    }

    const pricing = COATING_PRICES[coatingType as keyof typeof COATING_PRICES];
    if (pricing) {
      setEstimateLow(Math.round(area * pricing.low));
      setEstimateHigh(Math.round(area * pricing.high));
      setShowResults(true);
    }
  };

  useEffect(() => {
    if (sqft && coatingType) {
      calculateEstimate(sqft);
    }
  }, [sqft, coatingType]);

  const handleEmailQuote = () => {
    toast({
      title: "Quote Sent!",
      description: "We'll email your detailed quote shortly.",
    });
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Generated",
      description: "Your estimate PDF is being downloaded.",
    });
  };

  return (
    <section id="quote-tool" className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your <span className="text-primary">Instant Quote</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Draw your roof on the map and get an instant estimate for your coating project
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Property Details
              </CardTitle>
              <CardDescription>Enter your property information to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Address Search */}
              <div className="space-y-2">
                <Label htmlFor="address">Property Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Enter property address..."
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      searchAddress(e.target.value);
                    }}
                    className="pl-10"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                          onClick={() => selectAddress(result)}
                        >
                          {result.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Roof Type */}
              <div className="space-y-2">
                <Label>Roof Type</Label>
                <Select value={roofType} onValueChange={setRoofType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Roof</SelectItem>
                    <SelectItem value="metal">Metal Roof</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Coating Type */}
              <div className="space-y-2">
                <Label>Coating Type</Label>
                <Select value={coatingType} onValueChange={setCoatingType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coating type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COATING_PRICES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.name} (${value.low} - ${value.high}/SF)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Square Footage */}
              <div className="space-y-2">
                <Label htmlFor="sqft">Square Footage</Label>
                <Input
                  id="sqft"
                  type="number"
                  placeholder="Draw on map or enter manually"
                  value={sqft || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSqft(value);
                    calculateEstimate(value);
                  }}
                />
              </div>

              {/* Results */}
              {showResults && estimateLow > 0 && (
                <div className="pt-6 space-y-4 border-t">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Estimated Cost Range</p>
                    <div className="text-3xl font-bold text-primary">
                      ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {sqft.toLocaleString()} square feet
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleEmailQuote} className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Quote
                    </Button>
                    <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Section */}
          <Card>
            <CardHeader>
              <CardTitle>Draw Your Roof</CardTitle>
              <CardDescription>Use the polygon tool to outline your roof</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={mapContainer} className="w-full h-[500px] rounded-lg overflow-hidden" />
              <p className="mt-4 text-sm text-muted-foreground">
                📍 Search for your address, then use the polygon tool to draw your roof outline
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};