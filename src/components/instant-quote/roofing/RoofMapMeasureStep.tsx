import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Crosshair } from "lucide-react";
import { AddressAutocomplete } from "@/components/homeowner/AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export interface MeasurementResult {
  total_pitched_area_sqft: number;
  total_flat_area_sqft: number;
  total_with_waste_sqft: number;
  pitch_multiplier: number;
  average_pitch_degrees: number;
  roof_segments_count: number;
  complexity: string;
  satellite_image: string;
  source: "google_solar" | "vision_ai";
  quality?: string;
}

interface Props {
  onBack: () => void;
  onComplete: (data: {
    address: string;
    coords: { lat: number; lng: number };
    measurement: MeasurementResult;
  }) => void;
}

export function RoofMapMeasureStep({ onBack, onComplete }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Init map once we have coords
  useEffect(() => {
    if (!coords || !mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [coords.lng, coords.lat],
      zoom: 19,
      pitch: 0,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    const marker = new mapboxgl.Marker({ color: "#dc2626", draggable: true })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      setPinCoords({ lat: pos.lat, lng: pos.lng });
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      setPinCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    setPinCoords(coords);
    mapRef.current = map;
    markerRef.current = marker;
  }, [coords]);

  // Recenter when address changes
  useEffect(() => {
    if (!mapRef.current || !coords) return;
    mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 19 });
    markerRef.current?.setLngLat([coords.lng, coords.lat]);
    setPinCoords(coords);
  }, [coords]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handleMeasure = async () => {
    if (!pinCoords || !address) return;
    setMeasuring(true);
    setError(null);
    try {
      // 1) Try Google Solar first
      const { data: solarRes } = await supabase.functions.invoke("solar-roof-measure", {
        body: { latitude: pinCoords.lat, longitude: pinCoords.lng, address },
      });

      if (solarRes?.success && solarRes?.data) {
        const d = solarRes.data;
        const measurement: MeasurementResult = {
          total_pitched_area_sqft: d.total_pitched_area_sqft || d.total_flat_area_sqft || 0,
          total_flat_area_sqft: d.total_flat_area_sqft || 0,
          total_with_waste_sqft: d.total_with_waste_sqft || 0,
          pitch_multiplier: d.pitch_multiplier || 1,
          average_pitch_degrees: d.average_pitch_degrees || 0,
          roof_segments_count: d.roof_segments_count || 0,
          complexity: d.complexity || "Unknown",
          satellite_image: d.satellite_image || "",
          source: "google_solar",
          quality: d.quality,
        };
        onComplete({ address, coords: pinCoords, measurement });
        return;
      }

      // 2) Fallback to vision AI
      const { data: visionRes, error: visionErr } = await supabase.functions.invoke("roof-vision-ai", {
        body: { latitude: pinCoords.lat, longitude: pinCoords.lng, address, zoomLevel: 19 },
      });
      if (visionErr || !visionRes?.estimation) {
        throw new Error(visionErr?.message || "Could not measure this roof. Try moving the pin.");
      }
      const est = visionRes.estimation;
      const sqft = est.estimatedSqft || 0;
      const measurement: MeasurementResult = {
        total_pitched_area_sqft: sqft,
        total_flat_area_sqft: sqft,
        total_with_waste_sqft: sqft,
        pitch_multiplier: 1.15,
        average_pitch_degrees: 18,
        roof_segments_count: 1,
        complexity: est.roofComplexity || "Unknown",
        satellite_image: est.satelliteImageUrl || "",
        source: "vision_ai",
      };
      onComplete({ address, coords: pinCoords, measurement });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Measurement failed");
    } finally {
      setMeasuring(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-4 mb-4">
        <Label className="text-lg font-semibold">Property Address</Label>
        <AddressAutocomplete
          value={address}
          onChange={setAddress}
          onSelect={(addr, c) => {
            setAddress(addr);
            setCoords({ lat: c.lat, lng: c.lng });
          }}
          placeholder="Start typing your address..."
        />
      </div>

      {coords ? (
        <>
          <div className="rounded-2xl overflow-hidden border bg-card mb-4">
            <div ref={mapContainer} className="w-full h-[420px]" />
            <div className="px-4 py-3 border-t bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
              <Crosshair className="h-3.5 w-3.5" />
              Drag the pin or click on your roof to position it precisely.
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive mb-3 text-center">{error}</p>
          )}

          <Button
            onClick={handleMeasure}
            disabled={!pinCoords || measuring}
            className="w-full h-12 text-base gap-2"
          >
            {measuring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> AI is measuring your roof...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" /> Measure this roof
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
          Enter your address above to load a satellite view of your roof.
        </div>
      )}
    </div>
  );
}
