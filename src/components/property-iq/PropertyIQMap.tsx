import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { PIQPropertySummary } from "@/hooks/usePropertyIQ";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface PropertyIQMapProps {
  properties: PIQPropertySummary[];
  flyTo?: { lat: number; lng: number } | null;
}

export function PropertyIQMap({ properties, flyTo }: PropertyIQMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-80.15, 26.12],
      zoom: 10,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    properties.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      hasPoints = true;

      const scores = p.piq_property_scores?.[0];
      const roofScore = scores?.roof_replacement_score;

      const color = roofScore != null
        ? roofScore >= 70 ? "#ef4444" : roofScore >= 40 ? "#f59e0b" : "#22c55e"
        : "#3b82f6";

      const popup = new mapboxgl.Popup({ offset: 25, maxWidth: "260px" }).setHTML(`
        <div style="font-family: system-ui; font-size: 13px;">
          <p style="font-weight: 600; margin: 0 0 4px;">${p.address}</p>
          <p style="color: #666; margin: 0 0 6px;">${p.city}, ${p.state} ${p.zip || ""}</p>
          ${p.property_type ? `<p style="margin: 0 0 4px;">Type: <strong>${p.property_type}</strong></p>` : ""}
          ${roofScore != null ? `<p style="margin: 0 0 8px;">Roof Score: <strong style="color: ${color};">${roofScore}/100</strong></p>` : ""}
          <a href="/property-iq/property/${p.id}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">View Full Report →</a>
        </div>
      `);

      const marker = new mapboxgl.Marker({ color })
        .setLngLat([p.longitude, p.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
      bounds.extend([p.longitude, p.latitude]);
    });

    if (hasPoints && !flyTo) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [properties, flyTo]);

  // Fly to searched location
  useEffect(() => {
    if (!mapRef.current || !flyTo) return;
    mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 18, duration: 2000 });
  }, [flyTo]);

  return (
    <div ref={mapContainer} className="w-full h-[500px] rounded-lg border border-border overflow-hidden" />
  );
}
