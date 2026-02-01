import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { DoorToDoorMap } from "@/components/door-to-door/DoorToDoorMap";
import { SessionControls } from "@/components/door-to-door/SessionControls";
import { SessionStats } from "@/components/door-to-door/SessionStats";
import { DoorKnockPanel } from "@/components/door-to-door/DoorKnockPanel";
import { DwellTimeIndicator } from "@/components/door-to-door/DwellTimeIndicator";
import { VideoVerificationModal } from "@/components/door-to-door/VideoVerificationModal";
import { useDoorToDoorSession, type DoorDisposition } from "@/hooks/useDoorToDoorSession";
import { useGPSTracking } from "@/hooks/useGPSTracking";
import { useToast } from "@/hooks/use-toast";
import type { CustomerInfo } from "@/components/door-to-door/CustomerInfoForm";

const DWELL_TIME_REQUIRED = 20; // 20 seconds
const VIDEO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function DoorToDoor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Door knock flow states
  const [pendingKnockLocation, setPendingKnockLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDwellTimer, setShowDwellTimer] = useState(false);
  const [showKnockPanel, setShowKnockPanel] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Video check timer
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

  // GPS tracking hook
  const {
    position,
    error: gpsError,
    isTracking,
    route,
    startTracking,
    stopTracking,
    clearRoute,
    getCurrentPosition
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
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activeSession, lastVideoCheck]);

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

  // Handle knock door button or map click
  const handleKnockDoor = async () => {
    if (!position) {
      toast({
        title: "GPS Required",
        description: "Please wait for GPS lock to record a door knock",
        variant: "destructive"
      });
      return;
    }

    setPendingKnockLocation({ lat: position.lat, lng: position.lng });
    setShowDwellTimer(true);
  };

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    if (!activeSession) return;
    setPendingKnockLocation({ lat, lng });
    setShowDwellTimer(true);
  };

  // Handle dwell time complete
  const handleDwellComplete = () => {
    setShowDwellTimer(false);
    setShowKnockPanel(true);
  };

  // Handle dwell time cancel
  const handleDwellCancel = () => {
    setShowDwellTimer(false);
    setPendingKnockLocation(null);
  };

  // Handle knock panel submit
  const handleKnockSubmit = async (disposition: DoorDisposition, customerInfo?: CustomerInfo) => {
    if (!pendingKnockLocation) return;

    await recordDoorKnock(
      pendingKnockLocation.lat,
      pendingKnockLocation.lng,
      disposition,
      DWELL_TIME_REQUIRED,
      customerInfo,
      customerInfo?.notes
    );

    setShowKnockPanel(false);
    setPendingKnockLocation(null);
  };

  // Handle video upload
  const handleVideoUpload = async (videoUrl: string, duration: number) => {
    const success = await recordVideoVerification(videoUrl, duration);
    if (success) {
      setLastVideoCheck(Date.now());
    }
    return success;
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
        onMapClick={handleMapClick}
        isSessionActive={!!activeSession}
      />

      {/* Session Controls */}
      <SessionControls
        isActive={!!activeSession}
        onStart={handleStartSession}
        onStop={handleEndSession}
        onKnockDoor={handleKnockDoor}
        canKnock={!!position}
      />

      {/* Dwell Time Indicator */}
      {showDwellTimer && (
        <DwellTimeIndicator
          requiredSeconds={DWELL_TIME_REQUIRED}
          onComplete={handleDwellComplete}
          onCancel={handleDwellCancel}
        />
      )}

      {/* Door Knock Panel */}
      {showKnockPanel && (
        <DoorKnockPanel
          onSubmit={handleKnockSubmit}
          onClose={() => {
            setShowKnockPanel(false);
            setPendingKnockLocation(null);
          }}
        />
      )}

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
