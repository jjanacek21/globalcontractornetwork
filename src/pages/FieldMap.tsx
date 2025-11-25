import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PropertyBottomSheet } from "@/components/field-map/PropertyBottomSheet";
import { MeasurementToolbar } from "@/components/field-map/MeasurementToolbar";
import { MeasurementPanel } from "@/components/field-map/MeasurementPanel";
import { MeasurementBottomSheet } from "@/components/field-map/MeasurementBottomSheet";
import { AddressSearchBar } from "@/components/field-map/AddressSearchBar";
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
  const draw = useRef<MapboxDraw | null>(null);
  const [properties, setProperties] = useState<FieldProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<FieldProperty | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [measurements, setMeasurements] = useState({
    area: 0,
    perimeter: 0,
    pitchMultiplier: 1.118, // Default 6/12 pitch
  });
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [currentPolygonData, setCurrentPolygonData] = useState<any>(null);
  const [pendingPropertyLocation, setPendingPropertyLocation] = useState<{
    coordinates: [number, number];
    address: string;
  } | null>(null);
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);
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

    // Add click handler for dropping pins
    map.current.on("click", handleMapClick);

    // Initialize MapboxDraw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        // Custom styles for drawing
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          paint: {
            "fill-color": "#3B82F6",
            "fill-opacity": 0.3,
          },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          paint: {
            "line-color": "#3B82F6",
            "line-width": 3,
          },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          paint: {
            "circle-radius": 6,
            "circle-color": "#3B82F6",
          },
        },
      ],
    });
    
    map.current.addControl(draw.current);

    // Listen for drawing updates
    map.current.on("draw.create", updateMeasurements);
    map.current.on("draw.update", updateMeasurements);
    map.current.on("draw.delete", updateMeasurements);

    // Try to get user location on load
    getCurrentLocation();

    loadProperties();

    return () => {
      map.current?.remove();
    };
  }, []);

  const updateMeasurements = () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      setMeasurements({ area: 0, perimeter: 0, pitchMultiplier: measurements.pitchMultiplier });
      setCurrentPolygonData(null);
      return;
    }

    // Calculate total area and perimeter
    let totalArea = 0;
    let totalPerimeter = 0;

    data.features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        const polygon = turf.polygon(feature.geometry.coordinates);
        
        // Area in square meters, convert to square feet
        const areaMeters = turf.area(polygon);
        totalArea += areaMeters * 10.7639; // sq meters to sq feet
        
        // Perimeter in meters, convert to feet
        const perimeterMeters = turf.length(polygon, { units: "meters" });
        totalPerimeter += perimeterMeters * 3.28084;
      }
    });

    setMeasurements({
      area: totalArea,
      perimeter: totalPerimeter,
      pitchMultiplier: measurements.pitchMultiplier,
    });
    
    setCurrentPolygonData(data);
  };

  const handleStartDrawing = () => {
    if (draw.current) {
      draw.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  };

  const handleStopDrawing = () => {
    if (draw.current) {
      draw.current.changeMode("simple_select");
      setIsDrawing(false);
    }
  };

  const handleClearAll = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setMeasurements({ area: 0, perimeter: 0, pitchMultiplier: measurements.pitchMultiplier });
      setCurrentPolygonData(null);
    }
  };

  const reverseGeocode = async (coordinates: [number, number]): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}&types=address`
      );
      const data = await response.json();
      return data.features?.[0]?.place_name || "Unknown Address";
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return "Unknown Address";
    }
  };

  const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
    if (isDrawing) return;

    const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const address = await reverseGeocode(coordinates);

    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
    }

    const marker = new mapboxgl.Marker({ color: "#3b82f6", draggable: true })
      .setLngLat(coordinates)
      .addTo(map.current!);

    tempMarkerRef.current = marker;

    marker.on("dragend", async () => {
      const newCoords = marker.getLngLat();
      const newAddress = await reverseGeocode([newCoords.lng, newCoords.lat]);
      setPendingPropertyLocation({
        coordinates: [newCoords.lng, newCoords.lat],
        address: newAddress,
      });
      setSelectedProperty((prev) => prev ? { ...prev, address: newAddress, latitude: newCoords.lat, longitude: newCoords.lng } : null);
    });

    setPendingPropertyLocation({ coordinates, address });
    setSelectedProperty({
      id: "temp",
      address,
      latitude: coordinates[1],
      longitude: coordinates[0],
    } as FieldProperty);
  };

  const handleSearchSelect = async (coordinates: [number, number], address: string) => {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
    }

    const marker = new mapboxgl.Marker({ color: "#3b82f6", draggable: true })
      .setLngLat(coordinates)
      .addTo(map.current!);

    tempMarkerRef.current = marker;

    marker.on("dragend", async () => {
      const newCoords = marker.getLngLat();
      const newAddress = await reverseGeocode([newCoords.lng, newCoords.lat]);
      setPendingPropertyLocation({
        coordinates: [newCoords.lng, newCoords.lat],
        address: newAddress,
      });
      setSelectedProperty((prev) => prev ? { ...prev, address: newAddress, latitude: newCoords.lat, longitude: newCoords.lng } : null);
    });

    setPendingPropertyLocation({ coordinates, address });
    setSelectedProperty({
      id: "temp",
      address,
      latitude: coordinates[1],
      longitude: coordinates[0],
    } as FieldProperty);
  };

  const handleSaveMeasurement = () => {
    if (measurements.area > 0) {
      setShowSaveSheet(true);
    }
  };

  const handleMeasurementSaved = () => {
    handleClearAll();
    toast({
      title: "Success",
      description: "Measurement saved and cleared from map",
    });
  };

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
      
      {/* Address Search Bar */}
      <AddressSearchBar map={map.current} onSelectLocation={handleSearchSelect} />
      
      {/* Floating action buttons */}
      <div className="absolute bottom-24 left-4 flex flex-col gap-2">
        <Button
          size="icon"
          className="bg-background/90 hover:bg-background shadow-lg"
          onClick={getCurrentLocation}
        >
          <Locate className="h-5 w-5" />
        </Button>
      </div>

      {/* Measurement toolbar */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <MeasurementToolbar
          isDrawing={isDrawing}
          onStartDrawing={handleStartDrawing}
          onStopDrawing={handleStopDrawing}
          onClearAll={handleClearAll}
          onSave={handleSaveMeasurement}
          hasPolygons={measurements.area > 0}
        />
      </div>

      {/* Measurement panel */}
      {measurements.area > 0 && (
        <div className="absolute bottom-4 left-4">
          <MeasurementPanel
            area={measurements.area}
            perimeter={measurements.perimeter}
            pitchMultiplier={measurements.pitchMultiplier}
            onPitchChange={(multiplier) =>
              setMeasurements({ ...measurements, pitchMultiplier: multiplier })
            }
          />
        </div>
      )}

      {/* Property bottom sheet */}
      {selectedProperty && (
        <PropertyBottomSheet
          property={selectedProperty}
          onClose={() => {
            setSelectedProperty(null);
            setPendingPropertyLocation(null);
            if (tempMarkerRef.current) {
              tempMarkerRef.current.remove();
              tempMarkerRef.current = null;
            }
          }}
          onUpdate={handlePropertyUpdate}
          onAddMeasurement={handleStartDrawing}
        />
      )}

      {/* Save measurement bottom sheet */}
      <MeasurementBottomSheet
        open={showSaveSheet}
        onClose={() => setShowSaveSheet(false)}
        onSave={handleMeasurementSaved}
        measurements={{
          area: measurements.area,
          pitchedArea: measurements.area * measurements.pitchMultiplier,
          squares: (measurements.area * measurements.pitchMultiplier) / 100,
          perimeter: measurements.perimeter,
        }}
        polygonData={currentPolygonData}
      />
    </div>
  );
}
