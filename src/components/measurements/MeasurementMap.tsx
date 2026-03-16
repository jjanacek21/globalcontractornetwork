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
  onFacetSelect?: (id: string | null) => void;
  selectedFacetId?: string | null;
  onMapReady?: () => void;
  showAIOverlay?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function MeasurementMap({
  center, pins, onPinDrag, facets, edges, activeTool, activeEdgeType,
  onFacetComplete, onEdgeComplete, onFacetSelect, selectedFacetId,
  onMapReady, showAIOverlay,
}: MeasurementMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const vertexMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const labelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const drawPointsRef = useRef<[number, number][]>([]);
  const mouseMoveHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const liveEdgeLabelRef = useRef<mapboxgl.Marker | null>(null);
  const liveAreaLabelRef = useRef<mapboxgl.Marker | null>(null);

  // Clean up live labels
  const clearLiveLabels = () => {
    liveEdgeLabelRef.current?.remove();
    liveEdgeLabelRef.current = null;
    liveAreaLabelRef.current?.remove();
    liveAreaLabelRef.current = null;
  };

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
      doubleClickZoom: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapRef.current = map;

      // Drawing preview layers
      map.addSource("draw-preview", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "draw-preview-fill", type: "fill", source: "draw-preview", paint: { "fill-color": "#3b82f6", "fill-opacity": 0.25 } });
      map.addLayer({ id: "draw-preview-outline", type: "line", source: "draw-preview", paint: { "line-color": "#3b82f6", "line-width": 2, "line-dasharray": [4, 3] } });

      // Facets layer
      map.addSource("facets", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "facets-fill", type: "fill", source: "facets", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.35 } });
      map.addLayer({ id: "facets-outline", type: "line", source: "facets", paint: { "line-color": "#ffffff", "line-width": 1.5, "line-opacity": 0.8 } });
      // Selected facet highlight
      map.addSource("selected-facet", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "selected-facet-outline", type: "line", source: "selected-facet", paint: { "line-color": "#facc15", "line-width": 3, "line-dasharray": [3, 2] } });

      // Edges layer
      map.addSource("edges", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "edges-line", type: "line", source: "edges", paint: { "line-color": ["get", "color"], "line-width": 3 } });

      // Edge drawing preview
      map.addSource("edge-preview", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "edge-preview-line", type: "line", source: "edge-preview", paint: { "line-color": "#ffffff", "line-width": 2, "line-dasharray": [4, 3] } });

      // Mouse-follow line (for facet drawing)
      map.addSource("mouse-follow", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "mouse-follow-line", type: "line", source: "mouse-follow", paint: { "line-color": "#60a5fa", "line-width": 1.5, "line-dasharray": [6, 4] } });

      onMapReady?.();
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      vertexMarkersRef.current.forEach(m => m.remove());
      labelMarkersRef.current.forEach(m => m.remove());
      clearLiveLabels();
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
        properties: { color: f.color, name: f.name, id: f.id },
        geometry: { type: "Polygon" as const, coordinates: [[...f.vertices, f.vertices[0]]] },
      })),
    });

    // Update selected facet highlight
    const selSrc = map.getSource("selected-facet") as mapboxgl.GeoJSONSource;
    const selFacet = selectedFacetId ? facets.find(f => f.id === selectedFacetId) : null;
    selSrc?.setData({
      type: "FeatureCollection",
      features: selFacet ? [{
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Polygon" as const, coordinates: [[...selFacet.vertices, selFacet.vertices[0]]] },
      }] : [],
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
      const isSelected = f.id === selectedFacetId;
      el.style.cssText = `background:rgba(0,0,0,${isSelected ? '0.85' : '0.7'});color:white;font-size:11px;font-weight:bold;padding:2px 6px;border-radius:4px;pointer-events:none;text-align:center;line-height:1.3;${isSelected ? 'border:1px solid #facc15;' : ''}`;
      el.innerHTML = `${f.name}<br/>${Math.round(f.areaSqft)} sqft · ${f.pitch}`;
      const m = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([cLng, cLat]).addTo(map);
      labelMarkersRef.current.push(m);
    });
  }, [facets, edges, selectedFacetId]);

  // Drawing click handler with live measurement feedback
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous mouse move handler
    if (mouseMoveHandlerRef.current) {
      map.off("mousemove", mouseMoveHandlerRef.current);
      mouseMoveHandlerRef.current = null;
    }
    clearLiveLabels();

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      // Select mode — click on facet to select it
      if (activeTool === "select") {
        const features = map.queryRenderedFeatures(e.point, { layers: ["facets-fill"] });
        if (features.length > 0 && features[0].properties?.id) {
          onFacetSelect?.(features[0].properties.id);
        } else {
          onFacetSelect?.(null);
        }
        return;
      }

      if (activeTool === "delete") return;

      const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const snapPoint = findSnapVertex(clickPoint, facets, 5);
      const point = snapPoint || clickPoint;

      if (activeTool === "facet") {
        // Check if closing the polygon (clicking near first point)
        if (drawPointsRef.current.length >= 3) {
          const firstPt = drawPointsRef.current[0];
          const closeDist = distanceFt(point, firstPt);
          if (closeDist < 4) {
            // Close polygon
            const pts = drawPointsRef.current;
            const area = polygonAreaSqft(pts);
            const perimeter = polygonPerimeterFt(pts);
            onFacetComplete({ type: "pitched", pitch: "4/12", vertices: pts, areaSqft: Math.round(area), perimeterFt: Math.round(perimeter), wastePercent: 13 });
            finishDrawing(map);
            return;
          }
        }

        drawPointsRef.current.push(point);
        addVertexDot(map, point, "#3b82f6", drawPointsRef.current.length === 1);
        updateDrawPreview(map);

        // Add segment measurement label between last two points
        const pts = drawPointsRef.current;
        if (pts.length >= 2) {
          const prev = pts[pts.length - 2];
          const curr = pts[pts.length - 1];
          addSegmentLabel(map, prev, curr);
        }
      }

      if (activeTool === "edge") {
        drawPointsRef.current.push(point);
        addVertexDot(map, point, EDGE_COLORS[activeEdgeType]);

        if (drawPointsRef.current.length === 2) {
          const [start, end] = drawPointsRef.current;
          const length = distanceFt(start, end);
          onEdgeComplete({ edgeType: activeEdgeType, startVertex: start, endVertex: end, lengthFt: Math.round(length) });
          finishDrawing(map);
        } else {
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
        onFacetComplete({ type: "pitched", pitch: "4/12", vertices: pts, areaSqft: Math.round(area), perimeterFt: Math.round(perimeter), wastePercent: 13 });
      }
      finishDrawing(map);
    };

    // Mouse move for live preview line + measurement
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (drawPointsRef.current.length === 0) return;

      const mousePoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const snapPoint = findSnapVertex(mousePoint, facets, 5);
      const point = snapPoint || mousePoint;
      const lastPt = drawPointsRef.current[drawPointsRef.current.length - 1];

      if (activeTool === "facet") {
        // Live line from last vertex to mouse
        const previewCoords = [...drawPointsRef.current, point, drawPointsRef.current[0]];
        (map.getSource("mouse-follow") as mapboxgl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature", properties: {},
            geometry: { type: "LineString", coordinates: [lastPt, point] },
          }],
        });

        // Update polygon preview
        if (drawPointsRef.current.length >= 2) {
          (map.getSource("draw-preview") as mapboxgl.GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...drawPointsRef.current, point, drawPointsRef.current[0]]] } }],
          });
        }

        // Live measurement label
        const dist = distanceFt(lastPt, point);
        updateLiveEdgeLabel(map, lastPt, point, dist);

        // Live area label
        if (drawPointsRef.current.length >= 2) {
          const tempPts = [...drawPointsRef.current, point];
          const area = polygonAreaSqft(tempPts);
          updateLiveAreaLabel(map, tempPts, area);
        }
      }

      if (activeTool === "edge" && drawPointsRef.current.length === 1) {
        (map.getSource("edge-preview") as mapboxgl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [lastPt, point] } }],
        });
        const dist = distanceFt(lastPt, point);
        updateLiveEdgeLabel(map, lastPt, point, dist);
      }
    };

    mouseMoveHandlerRef.current = handleMouseMove;
    map.on("mousemove", handleMouseMove);
    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);
    return () => {
      map.off("click", handleClick);
      map.off("dblclick", handleDblClick);
      map.off("mousemove", handleMouseMove);
      mouseMoveHandlerRef.current = null;
      clearLiveLabels();
    };
  }, [activeTool, activeEdgeType, facets, onFacetComplete, onEdgeComplete, onFacetSelect]);

  // Helper: update live edge measurement label
  const updateLiveEdgeLabel = (map: mapboxgl.Map, a: [number, number], b: [number, number], dist: number) => {
    const midLng = (a[0] + b[0]) / 2;
    const midLat = (a[1] + b[1]) / 2;
    if (!liveEdgeLabelRef.current) {
      const el = document.createElement("div");
      el.style.cssText = "background:rgba(59,130,246,0.9);color:white;font-size:11px;font-weight:bold;padding:2px 6px;border-radius:4px;pointer-events:none;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);";
      liveEdgeLabelRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([midLng, midLat]).addTo(map);
    }
    liveEdgeLabelRef.current.setLngLat([midLng, midLat]);
    liveEdgeLabelRef.current.getElement().textContent = formatFeetInches(dist);
  };

  // Helper: update live area label
  const updateLiveAreaLabel = (map: mapboxgl.Map, pts: [number, number][], area: number) => {
    const cLng = pts.reduce((s, v) => s + v[0], 0) / pts.length;
    const cLat = pts.reduce((s, v) => s + v[1], 0) / pts.length;
    if (!liveAreaLabelRef.current) {
      const el = document.createElement("div");
      el.style.cssText = "background:rgba(0,0,0,0.75);color:#60a5fa;font-size:12px;font-weight:bold;padding:3px 8px;border-radius:4px;pointer-events:none;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);";
      liveAreaLabelRef.current = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([cLng, cLat]).addTo(map);
    }
    liveAreaLabelRef.current.setLngLat([cLng, cLat]);
    liveAreaLabelRef.current.getElement().textContent = `${Math.round(area)} sqft`;
  };

  // Helper: add a vertex dot on the map
  const addVertexDot = (map: mapboxgl.Map, point: [number, number], color: string, isFirst = false) => {
    const el = document.createElement("div");
    const size = isFirst ? 14 : 10;
    el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,0.3);`;
    if (isFirst) {
      el.style.cursor = "pointer";
      el.style.pointerEvents = "auto";
    }
    const vm = new mapboxgl.Marker({ element: el }).setLngLat(point).addTo(map);
    vertexMarkersRef.current.push(vm);
  };

  // Helper: add a measurement label on a completed segment
  const addSegmentLabel = (map: mapboxgl.Map, a: [number, number], b: [number, number]) => {
    const midLng = (a[0] + b[0]) / 2;
    const midLat = (a[1] + b[1]) / 2;
    const dist = distanceFt(a, b);
    const el = document.createElement("div");
    el.style.cssText = "background:rgba(255,255,255,0.9);color:#1e3a5f;font-size:10px;font-weight:bold;padding:1px 4px;border-radius:3px;pointer-events:none;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);";
    el.textContent = formatFeetInches(dist);
    const m = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([midLng, midLat]).addTo(map);
    vertexMarkersRef.current.push(m); // Clean up with vertex markers
  };

  // Helper: update polygon preview
  const updateDrawPreview = (map: mapboxgl.Map) => {
    const pts = drawPointsRef.current;
    if (pts.length >= 2) {
      (map.getSource("draw-preview") as mapboxgl.GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] } }],
      });
    }
  };

  // Helper: finish drawing and clean up
  const finishDrawing = (map: mapboxgl.Map) => {
    drawPointsRef.current = [];
    vertexMarkersRef.current.forEach(m => m.remove());
    vertexMarkersRef.current = [];
    clearLiveLabels();
    (map.getSource("draw-preview") as mapboxgl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
    (map.getSource("edge-preview") as mapboxgl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
    (map.getSource("mouse-follow") as mapboxgl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
  };

  // Escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mapRef.current) {
        finishDrawing(mapRef.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cursor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor =
      activeTool === "facet" || activeTool === "edge" ? "crosshair"
      : activeTool === "select" ? "pointer" : "";
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
      {/* Drawing hint */}
      {(activeTool === "facet" || activeTool === "edge") && drawPointsRef.current.length === 0 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          {activeTool === "facet" ? "Click to place vertices • Double-click or click first point to close" : "Click two points to create an edge"}
        </div>
      )}
    </div>
  );
}
