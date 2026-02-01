import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { DoorToDoorMap } from "@/components/door-to-door/DoorToDoorMap";
import { SessionControls } from "@/components/door-to-door/SessionControls";
import { SessionStats } from "@/components/door-to-door/SessionStats";
import { PropertySidePanel } from "@/components/door-to-door/PropertySidePanel";
import { VideoVerificationModal } from "@/components/door-to-door/VideoVerificationModal";
import { useDoorToDoorSession, type DoorDisposition } from "@/hooks/useDoorToDoorSession";
import { usePropertyDispositions, generateLatLngHash, type PropertyDisposition } from "@/hooks/usePropertyDispositions";
import { useGPSTracking } from "@/hooks/useGPSTracking";
import { useToast } from "@/hooks/use-toast";

const VIDEO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

interface SelectedProperty {
  lat: number;
  lng: number;
  address?: string;
  disposition?: PropertyDisposition;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
}

export default function DoorToDoor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Side panel state
  const [selectedProperty, setSelectedProperty] = useState<SelectedProperty | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [lastVideoCheck, setLastVideoCheck] = useState<number>(Date.now());

  // Session hook
  const {
    activeSession,
    doorKnocks,
    stats,
    loading: sessionLoading,
    startSession,
    endSession,
    recordDoorKnock,
    recordVideoVerification,
    updateRoute,
    saveLocation
  } = useDoorToDoorSession(userId || undefined);

  // Property dispositions hook
  const {
    properties,
    loading: propertiesLoading,
    fetchPropertiesInBounds,
    setPropertyDisposition,
    generatePropertyGrid,
  } = usePropertyDispositions(userId || undefined);

  // GPS tracking hook
  const {
    position,
    error: gpsError,
    route,
    startTracking,
    stopTracking,
    clearRoute,
  } = useGPSTracking({
    onPositionChange: (pos) => {
      if (activeSession) {
        saveLocation(pos.lat, pos.lng, pos.accuracy);
      }
    },
    saveInterval: 5000
  });

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/network-login');
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Update route in DB
  useEffect(() => {
    if (activeSession && route.length > 0) {
      updateRoute(route);
    }
  }, [route, activeSession]);

  // Video check timer
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastVideoCheck >= VIDEO_CHECK_INTERVAL) {
        setShowVideoModal(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeSession, lastVideoCheck]);

  // Handle bounds change - fetch properties and generate grid
  const handleBoundsChange = useCallback(async (bounds: { north: number; south: number; east: number; west: number }) => {
    if (!userId) return;

    // Fetch existing dispositions
    const existingProperties = await fetchPropertiesInBounds(bounds);
    
    // Generate grid points for the visible area (only if we don't have many existing)
    if ((existingProperties?.length || 0) < 50) {
      const gridPoints = generatePropertyGrid(bounds, 0.0003); // ~30 meter spacing
      
      // Add grid points that don't already exist
      const existingHashes = new Set((existingProperties || []).map(p => p.latLngHash));
      const newPoints = gridPoints
        .filter(p => !existingHashes.has(p.latLngHash))
        .slice(0, 100); // Limit to 100 new points per view
      
      // Create placeholder properties for grid points
      for (const point of newPoints) {
        await setPropertyDisposition(point.lat, point.lng, 'not_contacted', {});
      }
    }
  }, [userId, fetchPropertiesInBounds, generatePropertyGrid, setPropertyDisposition]);

  // Handle start session
  const handleStartSession = async () => {
    const session = await startSession();
    if (session) {
      startTracking();
      setSessionStartTime(new Date());
      setLastVideoCheck(Date.now());
    }
  };

  // Handle end session
  const handleEndSession = async () => {
    await endSession();
    stopTracking();
    clearRoute();
    setSessionStartTime(null);
  };

  // Handle property click from map
  const handlePropertyClick = (property: { lat: number; lng: number; address?: string; existingData?: any }) => {
    setSelectedProperty({
      lat: property.lat,
      lng: property.lng,
      address: property.address,
      disposition: property.existingData?.disposition || 'not_contacted',
      customerName: property.existingData?.customerName,
      customerPhone: property.existingData?.customerPhone,
      customerEmail: property.existingData?.customerEmail,
      notes: property.existingData?.notes,
    });
    setIsPanelOpen(true);
  };

  // Handle map click (for adding new property markers)
  const handleMapClick = async (lat: number, lng: number) => {
    // Create a new property marker at this location
    await setPropertyDisposition(lat, lng, 'not_contacted', {});
    
    // Open the panel for this new property
    setSelectedProperty({
      lat,
      lng,
      disposition: 'not_contacted',
    });
    setIsPanelOpen(true);
  };

  // Handle disposition save from panel
  const handleSaveDisposition = async (
    disposition: PropertyDisposition,
    customerInfo: { name?: string; phone?: string; email?: string; notes?: string }
  ) => {
    if (!selectedProperty) return;

    await setPropertyDisposition(
      selectedProperty.lat,
      selectedProperty.lng,
      disposition,
      customerInfo,
      selectedProperty.address
    );

    // Also record as a door knock for session tracking
    if (activeSession && disposition !== 'not_contacted') {
      await recordDoorKnock(
        selectedProperty.lat,
        selectedProperty.lng,
        disposition as DoorDisposition,
        0, // No dwell time for this workflow
        customerInfo.name || customerInfo.phone || customerInfo.email ? {
          name: customerInfo.name || '',
          phone: customerInfo.phone,
          email: customerInfo.email,
        } : undefined,
        customerInfo.notes
      );
    }

    // Update selected property state
    setSelectedProperty(prev => prev ? {
      ...prev,
      disposition,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      notes: customerInfo.notes,
    } : null);

    toast({
      title: "Saved",
      description: `Property marked as ${disposition.replace('_', ' ')}`,
    });
  };

  // Handle video upload
  const handleVideoUpload = async (videoUrl: string, duration: number) => {
    const success = await recordVideoVerification(videoUrl, duration);
    if (success) {
      setLastVideoCheck(Date.now());
    }
    return success;
  };

  // Handle knock door button
  const handleKnockDoor = async () => {
    if (!position) {
      toast({
        title: "GPS Required",
        description: "Please wait for GPS lock",
        variant: "destructive"
      });
      return;
    }
    handleMapClick(position.lat, position.lng);
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground">Loading Door to Door...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => navigate('/member/dashboard')}
          className="rounded-full shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Session Stats */}
      <SessionStats
        session={activeSession}
        allTimeStats={stats}
        sessionStartTime={sessionStartTime || undefined}
      />

      {/* GPS Error Banner */}
      {gpsError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {gpsError}
        </div>
      )}

      {/* Map */}
      <DoorToDoorMap
        position={position}
        route={route}
        doorKnocks={doorKnocks}
        properties={properties}
        onMapClick={handleMapClick}
        onPropertyClick={handlePropertyClick}
        isSessionActive={!!activeSession}
        onBoundsChange={handleBoundsChange}
      />

      {/* Session Controls */}
      <SessionControls
        isActive={!!activeSession}
        onStart={handleStartSession}
        onStop={handleEndSession}
        onKnockDoor={handleKnockDoor}
        canKnock={!!position}
      />

      {/* Property Side Panel */}
      <PropertySidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        property={selectedProperty}
        onSave={handleSaveDisposition}
        loading={propertiesLoading}
      />

      {/* Video Verification Modal */}
      {activeSession && userId && (
        <VideoVerificationModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          onUpload={handleVideoUpload}
          sessionId={activeSession.id}
          userId={userId}
        />
      )}
    </div>
  );
}
