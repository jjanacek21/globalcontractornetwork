import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { DoorKnock, DoorDisposition } from '@/hooks/useDoorToDoorSession';

interface DoorToDoorMapProps {
  position: { lat: number; lng: number } | null;
  route: [number, number][];
  doorKnocks: DoorKnock[];
  onMapClick?: (lat: number, lng: number) => void;
  isSessionActive: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DISPOSITION_COLORS: Record<DoorDisposition, string> = {
  not_home: '#64748b', // slate
  not_interested: '#dc2626', // red
  go_back: '#d97706', // amber
  interested: '#2563eb', // blue
  needs_inspection: '#ea580c', // orange
  appointment_set: '#16a34a', // green
  contract_signed: '#eab308', // yellow/gold
};

export function DoorToDoorMap({
  position,
  route,
  doorKnocks,
  onMapClick,
  isSessionActive
}: DoorToDoorMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const knockMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: position ? [position.lng, position.lat] : [-80.1918, 25.7617], // Default to Miami
      zoom: 17,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add route source
      map.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        }
      });

      // Add route layer
      map.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    });

    // Handle map clicks
    map.current.on('click', (e) => {
      if (isSessionActive && onMapClick) {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update user position marker
  useEffect(() => {
    if (!map.current || !position) return;

    if (!userMarker.current) {
      // Create user marker element
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg pulse-ring"></div>
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30"></div>
        </div>
      `;

      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([position.lng, position.lat]);
    }

    // Center map on user
    map.current.easeTo({
      center: [position.lng, position.lat],
      duration: 500
    });
  }, [position]);

  // Update route line
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route
        }
      });
    }
  }, [route, mapLoaded]);

  // Update door knock markers
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    knockMarkers.current.forEach(marker => marker.remove());
    knockMarkers.current = [];

    // Add new markers
    doorKnocks.forEach(knock => {
      const el = document.createElement('div');
      el.className = 'door-knock-marker';
      const color = DISPOSITION_COLORS[knock.disposition];
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs" style="background-color: ${color}">
          🚪
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <p class="font-semibold">${knock.disposition.replace('_', ' ').toUpperCase()}</p>
          ${knock.address ? `<p class="text-xs text-gray-500">${knock.address}</p>` : ''}
          <p class="text-xs text-green-600 font-medium">+${knock.points_awarded} pts</p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([knock.lng, knock.lat])
        .setPopup(popup)
        .addTo(map.current!);

      knockMarkers.current.push(marker);
    });
  }, [doorKnocks]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}

      {/* Custom CSS for markers */}
      <style>{`
        .user-location-marker {
          cursor: pointer;
        }
        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .door-knock-marker {
          cursor: pointer;
          transition: transform 0.2s;
        }
        .door-knock-marker:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
