import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import type { JobRequest } from '@/hooks/useJobBoard';

interface JobBoardMapProps {
  jobs: JobRequest[];
  contractorLocation?: { lat: number; lng: number } | null;
  onJobClick: (job: JobRequest) => void;
}

function getBudgetColor(budgetMin?: number | null, budgetMax?: number | null): string {
  const budget = budgetMax || budgetMin || 0;
  if (budget < 1000) return '#22c55e'; // Green
  if (budget < 5000) return '#eab308'; // Yellow
  if (budget < 15000) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

export function JobBoardMap({ jobs, contractorLocation, onJobClick }: JobBoardMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Get user's current location - only on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      (error) => {
        console.log('Geolocation error:', error.message);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []); // Empty deps - only runs once on mount

  // Initialize map ONCE - separate from location updates
  useEffect(() => {
    if (!mapContainer.current || map.current || mapInitialized) return;
    if (gettingLocation) return; // Wait for location attempt to complete

    // Use environment variable with hardcoded fallback for reliability
    const token = import.meta.env.VITE_MAPBOX_TOKEN || 
      'pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g';
    
    if (!token) {
      setMapError('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = token;

    // Use best available location for initial center
    const location = userLocation || contractorLocation;
    const initialCenter: [number, number] = location
      ? [location.lng, location.lat]
      : [-81.5158, 27.6648]; // Florida center default
    const initialZoom = location ? 11 : 7;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
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
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        const errorStatus = (e.error as { status?: number })?.status;
        if (errorStatus === 401) {
          setMapError('Invalid Mapbox token. Please check your configuration.');
        } else {
          setMapError('Failed to load map. Please try again.');
        }
      });

      setMapInitialized(true);
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      // Cleanup only on unmount
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapInitialized(false);
        setMapLoaded(false);
      }
    };
  }, [gettingLocation]); // Only depends on gettingLocation completing

  // Update user location marker when location changes (doesn't re-init map)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const location = userLocation || contractorLocation;
    if (!location) return;

    // Create user location marker (blue pulsing dot)
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 2px #3b82f6, 0 2px 6px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
    `;

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<strong>Your Location</strong>'))
      .addTo(map.current);
  }, [userLocation, contractorLocation, mapLoaded]);

  // Update job markers when jobs change (doesn't re-init map)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing job markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filter jobs with valid numeric coordinates
    const jobsWithLocation = jobs.filter((job) => {
      const lat = typeof job.lat === 'number' ? job.lat : null;
      const lng = typeof job.lng === 'number' ? job.lng : null;
      return lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);
    });

    jobsWithLocation.forEach((job) => {
      const lat = job.lat as number;
      const lng = job.lng as number;
      const color = getBudgetColor(job.budget_min, job.budget_max);

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'job-marker';
      el.style.cssText = `
        width: 36px;
        height: 36px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        transition: transform 0.2s;
      `;

      // Show match score or $ icon
      if (job.match_score) {
        el.textContent = `${job.match_score.total}`;
      } else {
        el.innerHTML = '<span style="font-size: 16px;">$</span>';
      }

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="max-width: 220px; padding: 4px;">
          <h4 style="font-weight: 600; margin-bottom: 6px; color: #1f2937;">${job.title}</h4>
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">${job.service_category}</p>
          <p style="color: #16a34a; font-weight: 600; font-size: 14px; margin-bottom: 8px;">
            ${
              job.budget_min && job.budget_max
                ? `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`
                : job.budget_max
                  ? `Up to $${job.budget_max.toLocaleString()}`
                  : 'Budget TBD'
            }
          </p>
          ${job.match_score ? `<p style="font-size: 11px; color: #6b7280;">Match Score: ${job.match_score.total}%</p>` : ''}
          <p style="font-size: 11px; color: #3b82f6; margin-top: 4px; cursor: pointer;">Click for details →</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onJobClick(job);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all jobs if there are any with valid coordinates
    if (jobsWithLocation.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();

      jobsWithLocation.forEach((job) => {
        bounds.extend([job.lng as number, job.lat as number]);
      });

      const location = userLocation || contractorLocation;
      if (location) {
        bounds.extend([location.lng, location.lat]);
      }

      // Only fit bounds if we have multiple points or significant distance
      if (jobsWithLocation.length > 1 || location) {
        map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
      }
    }
  }, [jobs, mapLoaded, onJobClick, userLocation, contractorLocation]);

  // Retry function for errors
  const handleRetry = useCallback(() => {
    setMapError(null);
    setMapLoaded(false);
    setMapInitialized(false);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    // Re-trigger location fetch
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
        },
        () => setGettingLocation(false),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGettingLocation(false);
    }
  }, []);

  // Count jobs with valid coordinates
  const mappableJobsCount = jobs.filter(j => 
    typeof j.lat === 'number' && typeof j.lng === 'number' && !isNaN(j.lat) && !isNaN(j.lng)
  ).length;

  // Error state
  if (mapError) {
    return (
      <Card className="overflow-hidden h-[600px] relative flex items-center justify-center bg-muted/30">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Map Failed to Load</h3>
          <p className="text-muted-foreground mb-4">{mapError}</p>
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Show message when jobs exist but none have coordinates
  if (mapLoaded && jobs.length > 0 && mappableJobsCount === 0) {
    return (
      <Card className="overflow-hidden h-[600px] relative">
        <div ref={mapContainer} className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center p-6">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Mappable Jobs</h3>
            <p className="text-muted-foreground">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} available but missing location data.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Switch to List View to see all jobs.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-[600px] relative">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading State */}
      {(!mapLoaded || gettingLocation) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {gettingLocation ? 'Getting your location...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card p-3 rounded-lg shadow-lg z-10 border">
        <p className="text-xs font-semibold mb-2">Budget Range</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs">Under $1,000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs">$1,000 - $5,000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs">$5,000 - $15,000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs">Over $15,000</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs">Your Location</span>
          </div>
        </div>
      </div>

      {/* Job count badge */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 bg-card px-3 py-1.5 rounded-full shadow-lg z-10 border">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {mappableJobsCount} job{mappableJobsCount !== 1 ? 's' : ''} on map
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
