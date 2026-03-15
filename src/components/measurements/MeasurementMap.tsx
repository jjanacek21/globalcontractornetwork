import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { RoofPin, RoofFacet, RoofEdge, DrawingTool, EdgeType } from "./types";
import { EDGE_COLORS, getPinColor } from "./types";
import { polygonAreaSqft, polygonPerimeterFt, distanceFt, findSnapVertex, formatFeetInches } from "./utils";

interface MeasurementMapProps {
  center: { lat: number; lng: number } | null;
  pins: RoofPin[];
  onPinDrag: (id: string, lat: number, lng: number) => void;
  facets: RoofFacet[];
  edges: RoofEdge[];
  activeTool: DrawingTool;
  activeEdgeType: EdgeType;
  onFacetComplete: (facet: Omit<RoofFacet, "id" | "name" | "color">) => void;
  onEdgeComplete: (edge: Omit<RoofEdge, "id">) => void;
  onMapReady?: () => void;
  showAIOverlay?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function MeasurementMap({
  center, pins, onPinDrag, facets, edges, activeTool, activeEdgeType,
  onFacetComplete, onEdgeComplete, onMapReady, showAIOverlay,
}: MeasurementMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const vertexMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const labelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const drawPointsRef = useRef<[number, number][]>([]);

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

      // Drawing preview layers
      map.addSource("draw-preview", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "draw-preview-fill", type: "fill", source: "draw-preview", paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 } });
      map.addLayer({ id: "draw-preview-outline", type: "line", source: "draw-preview", paint: { "line-color": "#3b82f6", "line-width": 2 } });

      // Facets layer
      map.addSource("facets", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "facets-fill", type: "fill", source: "facets", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.35 } });
      map.addLayer({ id: "facets-outline", type: "line", source: "facets", paint: { "line-color": "#ffffff", "line-width": 1.5, "line-opacity": 0.8 } });

      // Edges layer
      map.addSource("edges", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "edges-line", type: "line", source: "edges", paint: { "line-color": ["get", "color"], "line-width": 3 } });

      // Edge drawing preview
      map.addSource("edge-preview", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "edge-preview-line", type: "line", source: "edge-preview", paint: { "line-color": "#ffffff", "line-width": 2, "line-dasharray": [4, 3] } });

      onMapReady?.();
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      vertexMarkersRef.current.forEach(m => m.remove());
      labelMarkersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [center?.lat, center?.lng]);

  // Sync pin markers (AI mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentIds = new Set(pins.map(p => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); markersRef.current.delete(id); }
    });
    pins.forEach(pin => {
      let marker = markersRef.current.get(pin.id);
      if (!marker) {
        const el = document.createElement("div");
        el.style.cssText = "width:28px;height:28px;border-radius:50%;border:3px solid white;cursor:grab;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;color:white;";
        marker = new mapboxgl.Marker({ element: el, draggable: true }).setLngLat([pin.lng, pin.lat]).addTo(map);
        marker.on("dragend", () => {
          const { lng, lat } = marker!.getLngLat();
          onPinDrag(pin.id, lat, lng);
        });
        markersRef.current.set(pin.id, marker);
      }
      marker.getElement().style.backgroundColor = getPinColor(pin.pitch);
      marker.getElement().title = pin.label;
      const pos = marker.getLngLat();
      if (Math.abs(pos.lat - pin.lat) > 0.000001 || Math.abs(pos.lng - pin.lng) > 0.000001) {
        marker.setLngLat([pin.lng, pin.lat]);
      }
    });
  }, [pins, onPinDrag]);

  // Render facets & edges on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Update facets
    const facetSrc = map.getSource("facets") as mapboxgl.GeoJSONSource;
    facetSrc?.setData({
      type: "FeatureCollection",
      features: facets.map(f => ({
        type: "Feature" as const,
        properties: { color: f.color, name: f.name },
        geometry: { type: "Polygon" as const, coordinates: [[...f.vertices, f.vertices[0]]] },
      })),
    });

    // Update edges
    const edgeSrc = map.getSource("edges") as mapboxgl.GeoJSONSource;
    edgeSrc?.setData({
      type: "FeatureCollection",
      features: edges.map(e => ({
        type: "Feature" as const,
        properties: { color: EDGE_COLORS[e.edgeType], type: e.edgeType },
        geometry: { type: "LineString" as const, coordinates: [e.startVertex, e.endVertex] },
      })),
    });

    // Clear old label markers
    labelMarkersRef.current.forEach(m => m.remove());
    labelMarkersRef.current = [];

    // Add edge length labels
    edges.forEach(e => {
      const midLng = (e.startVertex[0] + e.endVertex[0]) / 2;
      const midLat = (e.startVertex[1] + e.endVertex[1]) / 2;
      const el = document.createElement("div");
      el.style.cssText = `
        background:${EDGE_COLORS[e.edgeType]};color:white;font-size:10px;font-weight:bold;
        padding:1px 5px;border-radius:3px;white-space:nowrap;pointer-events:none;
        box-shadow:0 1px 3px rgba(0,0,0,0.4);
      `;
      el.textContent = formatFeetInches(e.lengthFt);
      const m = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([midLng, midLat]).addTo(map);
      labelMarkersRef.current.push(m);
    });

    // Add facet area labels
    facets.forEach(f => {
      const cLng = f.vertices.reduce((s, v) => s + v[0], 0) / f.vertices.length;
      const cLat = f.vertices.reduce((s, v) => s + v[1], 0) / f.vertices.length;
      const el = document.createElement("div");
      el.style.cssText = "background:rgba(0,0,0,0.7);color:white;font-size:11px;font-weight:bold;padding:2px 6px;border-radius:4px;pointer-events:none;text-align:center;line-height:1.3;";
      el.innerHTML = `${f.name}<br/>${Math.round(f.areaSqft)} sqft · ${f.pitch}`;
      const m = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([cLng, cLat]).addTo(map);
      labelMarkersRef.current.push(m);
    });
  }, [facets, edges]);

  // Drawing click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (activeTool === "select" || activeTool === "delete") return;

      const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // Snap-to-vertex check
      const snapPoint = findSnapVertex(clickPoint, facets, 5);
      const point = snapPoint || clickPoint;

      if (activeTool === "facet") {
        drawPointsRef.current.push(point);

        // Add vertex dot
        const el = document.createElement("div");
        el.style.cssText = "width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid white;pointer-events:none;";
        const vm = new mapboxgl.Marker({ element: el }).setLngLat(point).addTo(map);
        vertexMarkersRef.current.push(vm);

        // Update preview polygon
        const pts = drawPointsRef.current;
        if (pts.length >= 2) {
          (map.getSource("draw-preview") as mapboxgl.GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] } }],
          });
        }
      }

      if (activeTool === "edge") {
        drawPointsRef.current.push(point);

        const el = document.createElement("div");
        el.style.cssText = `width:10px;height:10px;border-radius:50%;background:${EDGE_COLORS[activeEdgeType]};border:2px solid white;pointer-events:none;`;
        const vm = new mapboxgl.Marker({ element: el }).setLngLat(point).addTo(map);
        vertexMarkersRef.current.push(vm);

        if (drawPointsRef.current.length === 2) {
          const [start, end] = drawPointsRef.current;
          const length = distanceFt(start, end);
          onEdgeComplete({ edgeType: activeEdgeType, startVertex: start, endVertex: end, lengthFt: Math.round(length) });
          // Reset
          drawPointsRef.current = [];
          vertexMarkersRef.current.forEach(m => m.remove());
          vertexMarkersRef.current = [];
          (map.getSource("edge-preview") as mapboxgl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
        } else {
          // Show edge preview line
          (map.getSource("edge-preview") as mapboxgl.GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [drawPointsRef.current[0], point] } }],
          });
        }
      }
    };

    const handleDblClick = (e: mapboxgl.MapMouseEvent) => {
      if (activeTool !== "facet") return;
      e.preventDefault();
      const pts = drawPointsRef.current;
      if (pts.length >= 3) {
        const area = polygonAreaSqft(pts);
        const perimeter = polygonPerimeterFt(pts);
        onFacetComplete({ type: "pitched", pitch: "4/12", vertices: pts, areaSqft: Math.round(area), perimeterFt: Math.round(perimeter) });
      }
      drawPointsRef.current = [];
      vertexMarkersRef.current.forEach(m => m.remove());
      vertexMarkersRef.current = [];
      (map.getSource("draw-preview") as mapboxgl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);
    return () => { map.off("click", handleClick); map.off("dblclick", handleDblClick); };
  }, [activeTool, activeEdgeType, facets, onFacetComplete, onEdgeComplete]);

  // Cursor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = activeTool === "facet" || activeTool === "edge" ? "crosshair" : "";
  }, [activeTool]);

  if (!MAPBOX_TOKEN) {
    return <div className="h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">Map unavailable – Mapbox token not configured</div>;
  }

  if (!center) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <p className="text-sm font-medium">Enter an address above to load the satellite map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {showAIOverlay && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
            <p className="text-white font-semibold text-lg">AI Analyzing Roof...</p>
            <p className="text-white/60 text-sm">Detecting facets, edges, and pitch from satellite imagery</p>
          </div>
        </div>
      )}
    </div>
  );
}
