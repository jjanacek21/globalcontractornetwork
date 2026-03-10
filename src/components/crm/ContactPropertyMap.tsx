import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Loader2, Ruler } from "lucide-react";

export interface MeasurementPin {
  id: string;
  lat: number;
  lng: number;
  roof_type: string | null;
  total_squares: number;
  label?: string;
}

interface ContactPropertyMapProps {
  lat: number;
  lng: number;
  address?: string;
  measurements?: MeasurementPin[];
  onPinDragged?: (id: string, lat: number, lng: number) => void;
  onPinTypeToggle?: (id: string, newType: string) => void;
  onMeasureAll?: () => Promise<void>;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

function pinColor(roofType: string | null): string {
  const t = roofType?.toLowerCase();
  return t === "flat" || t === "low slope" ? "#3b82f6" : "#ef4444";
}

function pinLabel(roofType: string | null): string {
  const t = roofType?.toLowerCase();
  return t === "flat" || t === "low slope" ? "Flat" : "Pitched";
}

export function ContactPropertyMap({
  lat, lng, address, measurements = [],
  onPinDragged, onPinTypeToggle, onMeasureAll,
}: ContactPropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [measuring, setMeasuring] = useState(false);

  const isDraggable = !!onPinDragged;

  const rebuildMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    if (measurements.length === 0) {
      const marker = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat])
        .setPopup(address ? new mapboxgl.Popup({ offset: 25 }).setText(address) : undefined)
        .addTo(map);
      markersRef.current.set("__default", marker);
      return;
    }

    measurements.forEach((m) => {
      const color = pinColor(m.roof_type);
      const label = pinLabel(m.roof_type);
      const isFlat = label === "Flat";

      const toggleBtnHtml = onPinTypeToggle
        ? `<button data-pin-toggle="${m.id}" style="margin-top:6px;padding:2px 8px;font-size:11px;border:1px solid #888;border-radius:4px;cursor:pointer;background:${isFlat ? "#ef4444" : "#3b82f6"};color:#fff;border:none;">
            Switch to ${isFlat ? "Pitched" : "Flat"}
          </button>`
        : "";

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<div style="font-family:system-ui;font-size:13px;text-align:center;">
          <strong style="color:${color}">${label}</strong><br/>
          <span>${m.total_squares.toFixed(1)} sq</span>
          ${isDraggable ? '<br/><span style="font-size:10px;color:#888;">Drag to reposition</span>' : ""}
          ${toggleBtnHtml}
        </div>`
      );

      const marker = new mapboxgl.Marker({ color, draggable: isDraggable })
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(map);

      if (isDraggable) {
        marker.on("dragend", () => {
          const { lng: newLng, lat: newLat } = marker.getLngLat();
          onPinDragged!(m.id, newLat, newLng);
        });
      }

      // Toggle click handler via event delegation
      if (onPinTypeToggle) {
        popup.on("open", () => {
          setTimeout(() => {
            const btn = document.querySelector(`[data-pin-toggle="${m.id}"]`);
            if (btn) {
              btn.addEventListener("click", () => {
                const newType = isFlat ? "Pitched" : "Flat";
                onPinTypeToggle(m.id, newType);
              });
            }
          }, 0);
        });
      }

      markersRef.current.set(m.id, marker);
    });

    if (measurements.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      measurements.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 19 });
    }
  }, [measurements, lat, lng, address, isDraggable, onPinDragged, onPinTypeToggle]);

  // Init map once
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [lng, lat],
      zoom: 19,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => rebuildMarkers());

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Update markers when measurements change
  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) {
      rebuildMarkers();
    }
  }, [rebuildMarkers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[300px] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Map unavailable – Mapbox token not configured
      </div>
    );
  }

  const handleMeasureAll = async () => {
    if (!onMeasureAll) return;
    setMeasuring(true);
    try {
      await onMeasureAll();
    } finally {
      setMeasuring(false);
    }
  };

  return (
    <div className="space-y-2">
      <div ref={mapContainer} className="h-[300px] rounded-lg overflow-hidden border border-border" />
      {measurements.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Pitched
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Flat
          </span>
          {isDraggable && (
            <span className="ml-auto italic">Drag pins to reposition</span>
          )}
        </div>
      )}
      {onMeasureAll && measurements.length > 0 && (
        <Button
          size="sm"
          className="w-full"
          variant="outline"
          disabled={measuring}
          onClick={handleMeasureAll}
        >
          {measuring ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Measuring {measurements.length} pin{measurements.length > 1 ? "s" : ""}…</>
          ) : (
            <><Ruler className="mr-2 h-4 w-4" /> Measure All Pins ({measurements.length})</>
          )}
        </Button>
      )}
    </div>
  );
}
