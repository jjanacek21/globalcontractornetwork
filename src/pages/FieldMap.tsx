import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PropertyBottomSheet } from "@/components/field-map/PropertyBottomSheet";
import { Button } from "@/components/ui/button";
import { MapPin, Locate } from "lucide-react";

mapboxgl.accessToken = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

interface FieldProperty {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  disposition?: string;
  notes?: string;
  customer_id?: string;
  last_contacted_at?: string;
}

export default function FieldMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [properties, setProperties] = useState<FieldProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<FieldProperty | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();

  // Load properties from database
  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("field_properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading properties",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(coords);
        if (map.current) {
          map.current.flyTo({ center: coords, zoom: 16 });
        }
        toast({
          title: "Location found",
          description: "Successfully located your position",
        });
      },
      (error) => {
        let description = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            description = "Please enable location permissions in your browser settings";
            break;
          case error.POSITION_UNAVAILABLE:
            description = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            description = "Location request timed out";
            break;
        }
        
        toast({
          title: "Location error",
          description,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-80.19, 25.76], // Default to Miami area
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Try to get user location on load
    getCurrentLocation();

    loadProperties();

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers to map
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    const markers = document.querySelectorAll(".property-marker");
    markers.forEach((marker) => marker.remove());

    // Add markers for properties
    properties.forEach((property) => {
      const el = document.createElement("div");
      el.className = "property-marker";
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.cursor = "pointer";
      
      // Color based on disposition
      const color = getDispositionColor(property.disposition);
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid ${color};
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${color}">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
      `;

      el.addEventListener("click", () => {
        setSelectedProperty(property);
      });

      new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .addTo(map.current!);
    });

    // Add user location marker if available
    if (userLocation) {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.style.width = "20px";
      el.style.height = "20px";
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `;

      new mapboxgl.Marker(el).setLngLat(userLocation).addTo(map.current!);
    }
  }, [properties, userLocation]);

  const getDispositionColor = (disposition?: string) => {
    switch (disposition) {
      case "interested":
      case "contracted":
        return "#22C55E"; // green
      case "storm_damage":
      case "follow_up":
        return "#EAB308"; // yellow
      case "not_interested":
      case "not_home":
        return "#EF4444"; // red
      case "inspection_scheduled":
        return "#3B82F6"; // blue
      case "new_roof":
        return "#8B5CF6"; // purple
      case "old_roof":
        return "#F97316"; // orange
      default:
        return "#D4AF37"; // gold - default
    }
  };

  const handlePropertyUpdate = async () => {
    await loadProperties();
    setSelectedProperty(null);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Floating action buttons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <Button
          size="icon"
          className="bg-background/90 hover:bg-background shadow-lg"
          onClick={getCurrentLocation}
        >
          <Locate className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="bg-background/90 hover:bg-background shadow-lg"
          onClick={() => {
            // Add new property at map center
            if (map.current) {
              const center = map.current.getCenter();
              setSelectedProperty({
                id: "new",
                address: "",
                latitude: center.lat,
                longitude: center.lng,
              } as FieldProperty);
            }
          }}
        >
          <MapPin className="h-5 w-5" />
        </Button>
      </div>

      {/* Property bottom sheet */}
      {selectedProperty && (
        <PropertyBottomSheet
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onUpdate={handlePropertyUpdate}
        />
      )}
    </div>
  );
}
