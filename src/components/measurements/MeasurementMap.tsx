import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RoofPin, DrawnPolygon } from "./types";
import { PIN_COLORS } from "./types";
import { polygonAreaSqft, polygonPerimeterFt } from "./utils";

interface MeasurementMapProps {
  center: { lat: number; lng: number } | null;
  pins: RoofPin[];
  onPinDrag: (id: string, lat: number, lng: number) => void;
  drawingMode: boolean;
  polygons: DrawnPolygon[];
  onPolygonComplete: (polygon: DrawnPolygon) => void;
  onMapReady?: () => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function MeasurementMap({
  center,
  pins,
  onPinDrag,
  drawingMode,
  polygons,
  onPolygonComplete,
  onMapReady,
}: MeasurementMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const drawPointsRef = useRef<[number, number][]>([]);
  const drawMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN || !center) return;
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [center.lng, center.lat], zoom: 19 });
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [center.lng, center.lat],
      zoom: 19,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      // Add polygon source/layer for drawing
      map.addSource("draw-polygon", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-polygon-fill",
        type: "fill",
        source: "draw-polygon",
        paint: { "fill-color": "#ef4444", "fill-opacity": 0.25 },
      });
      map.addLayer({
        id: "draw-polygon-outline",
        type: "line",
        source: "draw-polygon",
        paint: { "line-color": "#ef4444", "line-width": 2 },
      });

      // Add saved polygons source/layer
      map.addSource("saved-polygons", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "saved-polygons-fill",
        type: "fill",
        source: "saved-polygons",
        paint: { "fill-color": "#22c55e", "fill-opacity": 0.2 },
      });
      map.addLayer({
        id: "saved-polygons-outline",
        type: "line",
        source: "saved-polygons",
        paint: { "line-color": "#22c55e", "line-width": 2, "line-dasharray": [2, 2] },
      });

      onMapReady?.();
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      drawMarkersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [center?.lat, center?.lng]);

  // Sync pin markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(pins.map(p => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    pins.forEach((pin) => {
      let marker = markersRef.current.get(pin.id);
      if (!marker) {
        const el = document.createElement("div");
        el.style.cssText = "width:28px;height:28px;border-radius:50%;border:3px solid white;cursor:grab;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;color:white;";
        el.title = pin.label;

        marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);

        marker.on("dragend", () => {
          const { lng, lat } = marker!.getLngLat();
          onPinDrag(pin.id, lat, lng);
        });

        markersRef.current.set(pin.id, marker);
      }

      const el = marker.getElement();
      el.style.backgroundColor = PIN_COLORS[pin.roofType];
      el.title = pin.label;

      const pos = marker.getLngLat();
      if (Math.abs(pos.lat - pin.lat) > 0.000001 || Math.abs(pos.lng - pin.lng) > 0.000001) {
        marker.setLngLat([pin.lng, pin.lat]);
      }
    });
  }, [pins, onPinDrag]);

  // Drawing mode click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!drawingMode) return;
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      drawPointsRef.current = [...drawPointsRef.current, point];
      setDrawPoints([...drawPointsRef.current]);

      // Add vertex marker
      const el = document.createElement("div");
      el.style.cssText = "width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid white;";
      const vertexMarker = new mapboxgl.Marker({ element: el })
        .setLngLat(point)
        .addTo(map);
      drawMarkersRef.current.push(vertexMarker);

      // Update polygon preview
      const pts = drawPointsRef.current;
      if (pts.length >= 2) {
        const coords = [...pts, pts[0]];
        (map.getSource("draw-polygon") as mapboxgl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [coords] },
          }],
        });
      }
    };

    const handleDblClick = (e: mapboxgl.MapMouseEvent) => {
      if (!drawingMode) return;
      e.preventDefault();
      const pts = drawPointsRef.current;
      if (pts.length >= 3) {
        const area = polygonAreaSqft(pts);
        const perimeter = polygonPerimeterFt(pts);
        onPolygonComplete({
          id: crypto.randomUUID(),
          coordinates: pts,
          areaSqft: area,
          perimeterFt: perimeter,
          label: `Section ${polygons.length + 1}`,
        });
      }
      // Clear drawing state
      drawPointsRef.current = [];
      setDrawPoints([]);
      drawMarkersRef.current.forEach(m => m.remove());
      drawMarkersRef.current = [];
      (map.getSource("draw-polygon") as mapboxgl.GeoJSONSource)?.setData({
        type: "FeatureCollection", features: [],
      });
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("click", handleClick);
      map.off("dblclick", handleDblClick);
    };
  }, [drawingMode, polygons.length, onPolygonComplete]);

  // Render saved polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("saved-polygons") as mapboxgl.GeoJSONSource;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: polygons.map(p => ({
        type: "Feature" as const,
        properties: { label: p.label },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[...p.coordinates, p.coordinates[0]]],
        },
      })),
    });
  }, [polygons]);

  // Update cursor for drawing mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = drawingMode ? "crosshair" : "";
  }, [drawingMode]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
        Map unavailable – Mapbox token not configured
      </div>
    );
  }

  if (!center) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
        Enter an address to load the satellite map
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
