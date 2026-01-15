import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import type { JobRequest } from '@/hooks/useJobBoard';

// Mapbox access token - using env variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNtMnRhZWs5ZzAwNHcya3NjMGQ5Z3YxemkifQ.tq96a3nNJOxAjdQPKhKD2g';

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
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter: [number, number] = contractorLocation
      ? [contractorLocation.lng, contractorLocation.lat]
      : [-81.5158, 27.6648]; // Default to Florida center

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: 9,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update contractor location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !contractorLocation) return;

    // Add contractor location marker (blue)
    const el = document.createElement('div');
    el.className = 'contractor-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.backgroundColor = '#3b82f6';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

    new mapboxgl.Marker(el)
      .setLngLat([contractorLocation.lng, contractorLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Your Location</strong>'))
      .addTo(map.current);

    // Center map on contractor location
    map.current.flyTo({
      center: [contractorLocation.lng, contractorLocation.lat],
      zoom: 10,
    });
  }, [contractorLocation, mapLoaded]);

  // Update job markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add job markers
    const jobsWithLocation = jobs.filter(job => job.lat && job.lng);

    jobsWithLocation.forEach(job => {
      if (!job.lat || !job.lng) return;

      const color = getBudgetColor(job.budget_min, job.budget_max);

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'job-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundColor = color;
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontSize = '12px';
      el.style.fontWeight = 'bold';

      // Show match score if available
      if (job.match_score) {
        el.textContent = `${job.match_score.total}`;
      }

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="max-width: 200px;">
          <h4 style="font-weight: 600; margin-bottom: 4px;">${job.title}</h4>
          <p style="color: #666; font-size: 12px; margin-bottom: 4px;">${job.service_category}</p>
          <p style="color: #22c55e; font-weight: 500; font-size: 14px;">
            ${job.budget_min && job.budget_max 
              ? `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`
              : job.budget_max 
                ? `Up to $${job.budget_max.toLocaleString()}`
                : 'Budget TBD'
            }
          </p>
          ${job.match_score ? `<p style="font-size: 12px; color: #666;">Match: ${job.match_score.total}%</p>` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([job.lng, job.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onJobClick(job);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all jobs
    if (jobsWithLocation.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      jobsWithLocation.forEach(job => {
        if (job.lat && job.lng) {
          bounds.extend([job.lng, job.lat]);
        }
      });

      if (contractorLocation) {
        bounds.extend([contractorLocation.lng, contractorLocation.lat]);
      }

      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [jobs, mapLoaded, onJobClick, contractorLocation]);

  return (
    <Card className="overflow-hidden h-[600px]">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
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
    </Card>
  );
}
