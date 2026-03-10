import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface ContactPropertyMapProps {
  lat: number;
  lng: number;
  address?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function ContactPropertyMap({ lat, lng, address }: ContactPropertyMapProps) {
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

    new mapboxgl.Marker({ color: "#ef4444" })
      .setLngLat([lng, lat])
      .setPopup(
        address
          ? new mapboxgl.Popup({ offset: 25 }).setText(address)
          : undefined
      )
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, address]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[300px] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Map unavailable – Mapbox token not configured
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="h-[300px] rounded-lg overflow-hidden border border-border"
    />
  );
}
