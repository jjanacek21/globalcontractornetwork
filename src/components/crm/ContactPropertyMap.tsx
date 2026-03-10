import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function ContactPropertyMap({ lat, lng, address, measurements = [] }: ContactPropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

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

    // Property pin (red, default)
    if (measurements.length === 0) {
      new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat])
        .setPopup(
          address
            ? new mapboxgl.Popup({ offset: 25 }).setText(address)
            : undefined
        )
        .addTo(map);
    }

    // Measurement pins
    measurements.forEach((m) => {
      const isFlat = m.roof_type?.toLowerCase() === "flat" || m.roof_type?.toLowerCase() === "low slope";
      const color = isFlat ? "#3b82f6" : "#ef4444"; // blue for flat, red for pitched
      const label = m.roof_type || "Pitched";

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="font-family:system-ui;font-size:13px;">
          <strong style="color:${color}">${label}</strong><br/>
          <span>${m.total_squares.toFixed(1)} squares</span>
        </div>`
      );

      new mapboxgl.Marker({ color })
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(map);
    });

    // Fit bounds if multiple pins
    if (measurements.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      measurements.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 19 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, address, measurements]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[300px] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Map unavailable – Mapbox token not configured
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapContainer}
        className="h-[300px] rounded-lg overflow-hidden border border-border"
      />
      {measurements.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Pitched
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Flat
          </span>
        </div>
      )}
    </div>
  );
}
