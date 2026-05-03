import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, X, MapPin, Clock, Target, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CanvassingDisposition = Database["public"]["Enums"]["canvassing_disposition"];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DISPOSITIONS: { label: string; value: CanvassingDisposition; color: string; markerColor: string }[] = [
  { label: "Not Home", value: "not_home", color: "bg-muted text-muted-foreground hover:bg-muted/80", markerColor: "#9ca3af" },
  { label: "Not Interested", value: "not_interested", color: "bg-destructive text-destructive-foreground hover:bg-destructive/90", markerColor: "#ef4444" },
  { label: "Follow Up", value: "follow_up", color: "bg-amber-500 text-white hover:bg-amber-600", markerColor: "#f59e0b" },
  { label: "Appointment Set", value: "appointment_set", color: "bg-green-600 text-white hover:bg-green-700", markerColor: "#16a34a" },
  { label: "Come Back Later", value: "bad_data", color: "bg-blue-600 text-white hover:bg-blue-700", markerColor: "#2563eb" },
  { label: "Do Not Knock", value: "sold", color: "bg-foreground text-background hover:bg-foreground/90", markerColor: "#000000" },
];

interface KnockedDoor {
  id: string;
  lat: number;
  lng: number;
  address: string;
  disposition: CanvassingDisposition;
}

export default function CanvassMap() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [knockedDoors, setKnockedDoors] = useState<KnockedDoor[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [selectedDisposition, setSelectedDisposition] = useState<CanvassingDisposition | null>(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [elapsed, setElapsed] = useState("00:00");

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStart) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Reverse geocode
  const reverseGeocode = useCallback(async (lng: number, lat: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address`
      );
      const data = await res.json();
      return data.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-80.13, 26.37],
      zoom: 16,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      "top-right"
    );

    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      const address = await reverseGeocode(lng, lat);

      // Remove previous temp marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }

      const marker = new mapboxgl.Marker({ color: "#6366f1" })
        .setLngLat([lng, lat])
        .addTo(map.current!);
      tempMarkerRef.current = marker;

      setSelectedPoint({ lat, lng, address });
      setSelectedDisposition(null);
      setNotes("");
    });

    // Load existing knocks for today
    loadTodayKnocks();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [reverseGeocode]);

  const loadTodayKnocks = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("canvassing_logs")
      .select("*")
      .gte("created_at", today)
      .order("created_at", { ascending: false });

    if (data) {
      const doors: KnockedDoor[] = data
        .filter((d) => d.lat && d.lng)
        .map((d) => ({
          id: d.id,
          lat: d.lat!,
          lng: d.lng!,
          address: d.address || "",
          disposition: d.disposition,
        }));
      setKnockedDoors(doors);
    }
  };

  // Render knocked door markers
  useEffect(() => {
    if (!map.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    knockedDoors.forEach((door) => {
      const disp = DISPOSITIONS.find((d) => d.value === door.disposition);
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer";
      el.style.backgroundColor = disp?.markerColor || "#9ca3af";
      el.title = `${door.address}\n${disp?.label || door.disposition}`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([door.lng, door.lat])
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [knockedDoors]);

  const handleSave = async () => {
    if (!selectedPoint || !selectedDisposition) {
      toast({ title: "Select a disposition", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.from("canvassing_logs").insert({
        lat: selectedPoint.lat,
        lng: selectedPoint.lng,
        address: selectedPoint.address,
        disposition: selectedDisposition,
        notes: notes || null,
      }).select().single();

      if (error) throw error;

      setKnockedDoors((prev) => [
        ...prev,
        {
          id: data.id,
          lat: selectedPoint.lat,
          lng: selectedPoint.lng,
          address: selectedPoint.address,
          disposition: selectedDisposition,
        },
      ]);

      // Remove temp marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }

      setSelectedPoint(null);
      setSelectedDisposition(null);
      setNotes("");
      toast({ title: "Door knock saved!" });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const closePanel = () => {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
    setSelectedPoint(null);
    setSelectedDisposition(null);
    setNotes("");
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 p-3 bg-background border-b z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/member/crm/storm-canvas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold text-foreground">Canvassing</h1>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="flex-1 w-full" />

      {/* Floating stats bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <Card className="px-5 py-2.5 flex items-center gap-5 shadow-lg bg-background/95 backdrop-blur-sm border">
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{knockedDoors.length}</span>
            <span className="text-xs text-muted-foreground">doors</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold font-mono">{elapsed}</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1.5">
            <UserPlus className="h-4 w-4 text-green-600" />
            <span className="text-sm font-bold">
              {knockedDoors.filter((d) => d.disposition === "appointment_set").length}
            </span>
            <span className="text-xs text-muted-foreground">appts</span>
          </div>
        </Card>
      </div>

      {/* Disposition panel */}
      {selectedPoint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[360px] max-w-[calc(100%-2rem)]">
          <Card className="p-4 shadow-xl bg-background border space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-tight truncate">{selectedPoint.address}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={closePanel}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DISPOSITIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDisposition(d.value)}
                  className={`px-2 py-2 rounded-md text-xs font-medium transition-all border ${
                    selectedDisposition === d.value
                      ? `${d.color} ring-2 ring-primary ring-offset-1`
                      : `${d.color} opacity-70`
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 text-sm resize-none"
            />

            <Button
              className="w-full"
              disabled={!selectedDisposition || isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save & Log Door"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
