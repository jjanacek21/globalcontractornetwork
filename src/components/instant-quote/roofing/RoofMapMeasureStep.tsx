import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Crosshair, Plus, X, AlertTriangle, RefreshCw } from "lucide-react";
import { AddressAutocomplete } from "@/components/homeowner/AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

// Geodesic polygon area (sq ft) using spherical excess.
function polygonAreaSqft(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 3) return 0;
  const R = 6378137; // earth radius m
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    area +=
      ((p2.lng - p1.lng) * Math.PI) / 180 *
      (2 + Math.sin((p1.lat * Math.PI) / 180) + Math.sin((p2.lat * Math.PI) / 180));
  }
  area = Math.abs((area * R * R) / 2); // sq m
  return area * 10.7639; // sq ft
}

function polygonCentroid(coords: { lat: number; lng: number }[]): { lat: number; lng: number } {
  const lat = coords.reduce((a, p) => a + p.lat, 0) / coords.length;
  const lng = coords.reduce((a, p) => a + p.lng, 0) / coords.length;
  return { lat, lng };
}

export interface FlatSection {
  id: string;
  center: { lat: number; lng: number };
  polygon: { lat: number; lng: number }[];
  area_sqft: number;
  confidence: "high" | "medium" | "low";
}

export interface MeasurementResult {
  // Surface area Solar measured (what gets shingled), excluding user-added flat sections
  total_roof_area_sqft: number;
  // User-added flat sections total
  user_added_flat_sqft: number;
  // Final combined sqft (Solar surface + user-added flats)
  combined_measured_sqft: number;
  building_footprint_sqft: number;
  pitch_multiplier: number;
  average_pitch_degrees: number;
  roof_segments_count: number;
  complexity: string;
  satellite_image: string;
  source: "google_solar" | "vision_ai";
  quality?: string;
  likely_missing_flat_section?: boolean;
  ai_roof_type_warning?: string | null;
  flat_sections: FlatSection[];
  // Backwards compat
  total_pitched_area_sqft: number;
  total_flat_area_sqft: number;
  total_with_waste_sqft: number;
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
  const flatMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const scrolledOnceRef = useRef(false);

  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [primaryMeasurement, setPrimaryMeasurement] = useState<any>(null);
  const [flatSections, setFlatSections] = useState<FlatSection[]>([]);
  const [drawingFlat, setDrawingFlat] = useState(false);
  const [draftPoints, setDraftPoints] = useState<{ lat: number; lng: number }[]>([]);

  // Init map ONCE on mount — wait for container to have a real height
  useEffect(() => {
    if (mapRef.current) return;
    let cancelled = false;

    const tryInit = (attempt = 0) => {
      const el = mapContainer.current;
      if (!el || cancelled) return;
      // Force a guaranteed height in case Tailwind arbitrary class was purged
      if (el.clientHeight < 100) {
        el.style.height = "460px";
        el.style.minHeight = "460px";
      }
      if (el.clientHeight < 50 && attempt < 10) {
        requestAnimationFrame(() => tryInit(attempt + 1));
        return;
      }
      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: el,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [-80.1, 26.35],
          zoom: 4,
          pitch: 0,
          attributionControl: false,
        });
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
        map.on("load", () => {
          requestAnimationFrame(() => map.resize());
          console.log("[RoofMap] map loaded, container size:", el.clientWidth, "x", el.clientHeight);
        });
        mapRef.current = map;

        // Resize observer to fix late layout shifts
        const ro = new ResizeObserver(() => {
          if (mapRef.current) mapRef.current.resize();
        });
        ro.observe(el);
        (mapRef as any).__ro = ro;
      } catch (err) {
        console.error("[RoofMap] init error", err);
        setError("Map preview unavailable. You can still measure your roof.");
      }
    };

    tryInit();

    return () => {
      cancelled = true;
      const ro = (mapRef as any).__ro as ResizeObserver | undefined;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      flatMarkersRef.current = [];
    };
  }, []);

  // When coords change (address picked), recenter and create/move marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coords) return;
    map.resize();
    map.flyTo({ center: [coords.lng, coords.lat], zoom: 19, duration: 1000 });

    if (!markerRef.current) {
      const marker = new mapboxgl.Marker({ color: "#dc2626", draggable: true })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        setPinCoords({ lat: pos.lat, lng: pos.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([coords.lng, coords.lat]);
    }
    setPinCoords(coords);

    if (!scrolledOnceRef.current && mapContainer.current) {
      mapContainer.current.scrollIntoView({ behavior: "smooth", block: "center" });
      scrolledOnceRef.current = true;
    }
  }, [coords]);

  // Click handler — either move main pin or add a vertex to the flat polygon being drawn
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: mapboxgl.MapMouseEvent) => {
      if (drawingFlat) {
        setDraftPoints((prev) => [...prev, { lat: e.lngLat.lat, lng: e.lngLat.lng }]);
      } else if (markerRef.current) {
        markerRef.current.setLngLat(e.lngLat);
        setPinCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    };
    map.on("click", handler);
    map.getCanvas().style.cursor = drawingFlat ? "crosshair" : "";
    return () => {
      map.off("click", handler);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [drawingFlat]);

  // Render in-progress draft polygon (vertices + line)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const SRC = "flat-draft";
    const FILL = "flat-draft-fill";
    const LINE = "flat-draft-line";
    const POINTS = "flat-draft-points";

    const cleanup = () => {
      [FILL, LINE, POINTS].forEach((id) => map.getLayer(id) && map.removeLayer(id));
      [SRC, `${SRC}-pts`].forEach((id) => map.getSource(id) && map.removeSource(id));
    };
    cleanup();

    if (!drawingFlat || draftPoints.length === 0) return;

    const coords = draftPoints.map((p) => [p.lng, p.lat]);
    if (draftPoints.length >= 3) {
      map.addSource(SRC, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
        },
      });
      map.addLayer({ id: FILL, type: "fill", source: SRC, paint: { "fill-color": "#3b82f6", "fill-opacity": 0.25 } });
      map.addLayer({ id: LINE, type: "line", source: SRC, paint: { "line-color": "#1d4ed8", "line-width": 2 } });
    } else if (draftPoints.length === 2) {
      map.addSource(SRC, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
      });
      map.addLayer({ id: LINE, type: "line", source: SRC, paint: { "line-color": "#1d4ed8", "line-width": 2 } });
    }

    map.addSource(`${SRC}-pts`, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: draftPoints.map((p) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        })),
      },
    });
    map.addLayer({
      id: POINTS,
      type: "circle",
      source: `${SRC}-pts`,
      paint: { "circle-radius": 5, "circle-color": "#1d4ed8", "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
    });

    return cleanup;
  }, [drawingFlat, draftPoints]);

  const startDrawingFlat = () => {
    setDrawingFlat(true);
    setDraftPoints([]);
  };

  const cancelDrawingFlat = () => {
    setDrawingFlat(false);
    setDraftPoints([]);
  };

  const finishDrawingFlat = () => {
    if (draftPoints.length < 3) return;
    const area = polygonAreaSqft(draftPoints);
    const center = polygonCentroid(draftPoints);
    const sec: FlatSection = {
      id: `flat-${Date.now()}`,
      center,
      polygon: draftPoints,
      area_sqft: +area.toFixed(2),
      confidence: "high",
    };
    setFlatSections((prev) => [...prev, sec]);
    setDrawingFlat(false);
    setDraftPoints([]);
  };

  const removeFlatSection = (id: string) => {
    setFlatSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMeasure = async () => {
    if (!pinCoords || !address) return;
    setMeasuring(true);
    setError(null);
    setPrimaryMeasurement(null);
    setFlatSections([]);
    try {
      const { data: solarRes } = await supabase.functions.invoke("solar-roof-measure", {
        body: { latitude: pinCoords.lat, longitude: pinCoords.lng, address },
      });

      if (solarRes?.success && solarRes?.data) {
        setPrimaryMeasurement({ ...solarRes.data, source: "google_solar" });
        return;
      }

      // Fallback to vision AI
      const { data: visionRes, error: visionErr } = await supabase.functions.invoke("roof-vision-ai", {
        body: { latitude: pinCoords.lat, longitude: pinCoords.lng, address, zoomLevel: 19 },
      });
      if (visionErr || !visionRes?.estimation) {
        throw new Error(visionErr?.message || "Could not measure this roof. Try moving the pin.");
      }
      const est = visionRes.estimation;
      setPrimaryMeasurement({
        total_roof_area_sqft: est.estimatedSqft || 0,
        building_footprint_sqft: est.estimatedSqft || 0,
        pitch_multiplier: 1.15,
        average_pitch_degrees: 18,
        roof_segments_count: 1,
        complexity: est.roofComplexity || "Unknown",
        satellite_image: est.satelliteImageUrl || "",
        source: "vision_ai",
        likely_missing_flat_section: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Measurement failed");
    } finally {
      setMeasuring(false);
    }
  };

  const continueToNext = () => {
    if (!primaryMeasurement || !pinCoords) return;
    const userAddedFlat = flatSections.reduce((acc, s) => acc + s.area_sqft, 0);
    const surface = primaryMeasurement.total_roof_area_sqft || 0;
    const measurement: MeasurementResult = {
      total_roof_area_sqft: surface,
      user_added_flat_sqft: +userAddedFlat.toFixed(2),
      combined_measured_sqft: +(surface + userAddedFlat).toFixed(2),
      building_footprint_sqft: primaryMeasurement.building_footprint_sqft || 0,
      pitch_multiplier: primaryMeasurement.pitch_multiplier || 1,
      average_pitch_degrees: primaryMeasurement.average_pitch_degrees || 0,
      roof_segments_count: primaryMeasurement.roof_segments_count || 0,
      complexity: primaryMeasurement.complexity || "Unknown",
      satellite_image: primaryMeasurement.satellite_image || "",
      source: primaryMeasurement.source,
      quality: primaryMeasurement.quality,
      likely_missing_flat_section: !!primaryMeasurement.likely_missing_flat_section,
      ai_roof_type_warning: primaryMeasurement.ai_roof_type_warning,
      flat_sections: flatSections,
      total_pitched_area_sqft: surface,
      total_flat_area_sqft: userAddedFlat,
      total_with_waste_sqft: surface + userAddedFlat,
    };
    onComplete({ address, coords: pinCoords, measurement });
  };

  const surfaceSqft = primaryMeasurement?.total_roof_area_sqft || 0;
  const flatAddedSqft = flatSections.reduce((a, s) => a + s.area_sqft, 0);
  const combined = surfaceSqft + flatAddedSqft;

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
            setPrimaryMeasurement(null);
            setFlatSections([]);
            setError(null);
          }}
          placeholder="Start typing your address..."
        />
      </div>

      <div className="rounded-2xl overflow-hidden border bg-card mb-4 relative">
        <div
          ref={mapContainer}
          className="w-full"
          style={{ height: 460, minHeight: 460 }}
        />
        {!coords && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 pointer-events-none">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Enter your address above to load a satellite view.
            </div>
          </div>
        )}
        <div className="px-4 py-3 border-t bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Crosshair className="h-3.5 w-3.5" />
          {drawingFlat
            ? `Click each corner of the flat roof to trace it (${draftPoints.length} point${draftPoints.length === 1 ? "" : "s"} placed). Add 3+ points then press Finish.`
            : "Drag the red pin or click on the main roof to position it."}
        </div>
      </div>

      {coords && !primaryMeasurement && (
        <Button
          onClick={handleMeasure}
          disabled={!pinCoords || measuring}
          className="w-full h-12 text-base gap-2"
        >
          {measuring ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> AI is measuring your roof...</>
          ) : (
            <><MapPin className="h-4 w-4" /> Measure this roof <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      )}

      {primaryMeasurement && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Pitched / main roof (Google Solar)</p>
            <p className="text-2xl font-bold">{Math.round(surfaceSqft).toLocaleString()} sqft</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg pitch {(primaryMeasurement.average_pitch_degrees ?? 0).toFixed(1)}° •{" "}
              {primaryMeasurement.roof_segments_count} segments • {primaryMeasurement.complexity}
            </p>
          </div>

          {(primaryMeasurement.likely_missing_flat_section || primaryMeasurement.ai_roof_type_warning) && (
            <div className="rounded-xl border-2 border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-200">Flat section may be missing</p>
                <p className="text-amber-800 dark:text-amber-300 mt-1">
                  {primaryMeasurement.ai_roof_type_warning ||
                    `The measured roof (${Math.round(surfaceSqft).toLocaleString()} sqft) is smaller than the building footprint (${Math.round(primaryMeasurement.building_footprint_sqft || 0).toLocaleString()} sqft). Common in Florida — drop a blue pin on any flat / low-slope sections.`}
                </p>
              </div>
            </div>
          )}

          {flatSections.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-2">Added flat sections</p>
              {flatSections.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span>Flat section {i + 1} — <strong>{Math.round(s.area_sqft).toLocaleString()} sqft</strong></span>
                  <button
                    onClick={() => removeFlatSection(s.id)}
                    className="text-destructive hover:text-destructive/80 p-1"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between text-sm font-semibold">
                <span>Total measured</span>
                <span>{Math.round(combined).toLocaleString()} sqft</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setAddFlatMode(true)}
              disabled={addFlatMode || tracingFlat}
              className="h-11 gap-2"
            >
              {tracingFlat ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Tracing...</>
              ) : addFlatMode ? (
                <>Click the map…</>
              ) : (
                <><Plus className="h-4 w-4" /> Add flat section</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleMeasure}
              disabled={measuring}
              className="h-11 gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Re-measure
            </Button>
          </div>

          <Button onClick={continueToNext} className="w-full h-12 text-base gap-2">
            Analyze roof condition ({Math.round(combined).toLocaleString()} sqft) <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
