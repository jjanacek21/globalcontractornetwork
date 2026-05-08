import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle } from 'lucide-react';

export interface PublicMapJob {
  id: string;
  title: string;
  service_category: string;
  budget_min: number | null;
  budget_max: number | null;
  lat: number | null;
  lng: number | null;
}

interface Props {
  jobs: PublicMapJob[];
  onJobClick?: (id: string) => void;
}

function budgetColor(min?: number | null, max?: number | null) {
  const b = max || min || 0;
  if (b < 1000) return '#22c55e';
  if (b < 5000) return '#eab308';
  if (b < 15000) return '#f97316';
  return '#ef4444';
}

// Jitter coords ~500m for privacy (deterministic per id)
function jitter(id: string, lat: number, lng: number): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const dLat = (((h & 0xffff) / 0xffff) - 0.5) * 0.01;
  const dLng = ((((h >> 16) & 0xffff) / 0xffff) - 0.5) * 0.01;
  return [lng + dLng, lat + dLat];
}

export function PublicMarketplaceMap({ jobs, onJobClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      setError('Map not configured');
      return;
    }
    mapboxgl.accessToken = token;
    try {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-81.5158, 27.6648],
        zoom: 6,
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapRef.current.on('load', () => setLoaded(true));
      mapRef.current.on('error', () => setError('Failed to load map'));
    } catch {
      setError('Failed to initialize map');
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const valid = jobs.filter((j) => typeof j.lat === 'number' && typeof j.lng === 'number');
    const bounds = new mapboxgl.LngLatBounds();
    valid.forEach((j) => {
      const [lng, lat] = jitter(j.id, j.lat as number, j.lng as number);
      const el = document.createElement('div');
      const color = budgetColor(j.budget_min, j.budget_max);
      el.style.cssText = `width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:pointer;`;
      const budgetText =
        j.budget_max
          ? `$${(j.budget_min || 0).toLocaleString()} – $${j.budget_max.toLocaleString()}`
          : j.budget_min
          ? `From $${j.budget_min.toLocaleString()}`
          : 'Budget undisclosed';
      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
        `<div style="font-family:inherit;min-width:160px"><strong>${j.title}</strong><br/><span style="opacity:.7">${j.service_category}</span><br/><span style="color:${color};font-weight:600">${budgetText}</span><br/><em style="font-size:11px;opacity:.6">Approximate area — address hidden</em></div>`
      );
      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current!);
      el.addEventListener('click', () => onJobClick?.(j.id));
      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });
    if (valid.length > 0 && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 600 });
    }
  }, [jobs, loaded, onJobClick]);

  if (error) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center bg-muted rounded-lg gap-2 text-muted-foreground">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-[500px] w-full rounded-lg overflow-hidden border" />;
}
