import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropertyIQSearch } from "@/hooks/usePropertyIQ";
import { Filter, X } from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const PROPERTY_TYPES = ["Commercial", "Residential", "Industrial", "Mixed Use", "Office", "Retail"];

export function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();

  const { data: allProperties, isLoading } = usePropertyIQSearch("");

  const [showFilters, setShowFilters] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [roofScoreRange, setRoofScoreRange] = useState([0, 100]);
  const [sqftRange, setSqftRange] = useState([0, 500000]);
  const [yearRange, setYearRange] = useState([1900, 2025]);

  const filtered = useMemo(() => {
    if (!allProperties) return [];
    return allProperties.filter((p) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.property_type || "")) return false;
      const score = p.piq_property_scores?.[0]?.roof_replacement_score ?? 0;
      if (score < roofScoreRange[0] || score > roofScoreRange[1]) return false;
      const sqft = p.building_sqft ?? 0;
      if (sqft < sqftRange[0] || sqft > sqftRange[1]) return false;
      const year = p.year_built ?? 2000;
      if (year < yearRange[0] || year > yearRange[1]) return false;
      return true;
    });
  }, [allProperties, selectedTypes, roofScoreRange, sqftRange, yearRange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-80.19, 25.76],
      zoom: 10,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filtered.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      const score = p.piq_property_scores?.[0]?.roof_replacement_score ?? 0;
      const color = score >= 80 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#22c55e";
      const ownerName = p.piq_property_ownership?.[0]?.piq_owners?.name || "Unknown";

      const popup = new mapboxgl.Popup({ offset: 25, maxWidth: "280px" }).setHTML(`
        <div style="font-family:system-ui;font-size:13px;">
          <p style="font-weight:600;margin:0 0 4px;">${p.address}</p>
          <p style="color:#666;margin:0 0 6px;">${p.property_type || "—"} · ${(p.building_sqft || 0).toLocaleString()} sqft</p>
          <p style="margin:0 0 4px;">Roof Score: <strong style="color:${color};">${score}/100</strong></p>
          <p style="margin:0 0 8px;">Owner: ${ownerName}</p>
          <a href="/property-iq/property/${p.id}" style="color:#2563eb;text-decoration:underline;font-weight:500;">View Report →</a>
        </div>
      `);

      const marker = new mapboxgl.Marker({ color })
        .setLngLat([p.longitude, p.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [filtered]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (isLoading) return <Skeleton className="h-[600px] w-full rounded-lg" />;

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {showFilters && (
        <Card className="w-72 shrink-0 overflow-y-auto">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Filters</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-xs font-medium mb-2 block">Property Type</Label>
              <div className="space-y-2">
                {PROPERTY_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      id={`type-${type}`}
                    />
                    <label htmlFor={`type-${type}`} className="text-xs cursor-pointer">{type}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium mb-2 block">
                Roof Score: {roofScoreRange[0]} – {roofScoreRange[1]}
              </Label>
              <Slider
                value={roofScoreRange}
                onValueChange={setRoofScoreRange}
                min={0} max={100} step={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-2 block">
                Building Sqft: {sqftRange[0].toLocaleString()} – {sqftRange[1].toLocaleString()}
              </Label>
              <Slider
                value={sqftRange}
                onValueChange={setSqftRange}
                min={0} max={500000} step={5000}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-2 block">
                Year Built: {yearRange[0]} – {yearRange[1]}
              </Label>
              <Slider
                value={yearRange}
                onValueChange={setYearRange}
                min={1900} max={2025} step={1}
                className="mt-2"
              />
            </div>

            <div className="pt-2">
              <Badge variant="secondary" className="text-xs">
                {filtered.length} properties
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 relative">
        {!showFilters && (
          <Button
            variant="outline" size="sm"
            className="absolute top-3 left-3 z-10 gap-1.5"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="h-4 w-4" /> Filters
          </Button>
        )}
        <div ref={mapContainer} className="w-full h-full rounded-lg border border-border overflow-hidden" />
      </div>
    </div>
  );
}
