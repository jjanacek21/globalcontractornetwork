import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PropertyDisposition = 
  | 'not_contacted' 
  | 'not_home' 
  | 'not_interested' 
  | 'go_back' 
  | 'interested' 
  | 'needs_inspection' 
  | 'appointment_set' 
  | 'contract_signed';

export interface PropertyData {
  id?: string;
  lat: number;
  lng: number;
  latLngHash: string;
  address?: string;
  disposition: PropertyDisposition;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
}

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Generate a hash from lat/lng for deduplication (rounded to 5 decimal places)
export function generateLatLngHash(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 100000) / 100000;
  const roundedLng = Math.round(lng * 100000) / 100000;
  return `${roundedLat}_${roundedLng}`;
}

export function usePropertyDispositions(userId?: string) {
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch properties within map bounds
  const fetchPropertiesInBounds = useCallback(async (bounds: Bounds) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('property_dispositions')
        .select('*')
        .eq('user_id', userId)
        .gte('lat', bounds.south)
        .lte('lat', bounds.north)
        .gte('lng', bounds.west)
        .lte('lng', bounds.east);

      if (error) throw error;

      const mapped: PropertyData[] = (data || []).map(p => ({
        id: p.id,
        lat: Number(p.lat),
        lng: Number(p.lng),
        latLngHash: p.lat_lng_hash,
        address: p.address || undefined,
        disposition: p.disposition as PropertyDisposition,
        customerName: p.customer_name || undefined,
        customerPhone: p.customer_phone || undefined,
        customerEmail: p.customer_email || undefined,
        notes: p.notes || undefined,
      }));

      setProperties(mapped);
      return mapped;
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }, [userId]);

  // Set or update property disposition
  const setPropertyDisposition = useCallback(async (
    lat: number,
    lng: number,
    disposition: PropertyDisposition,
    customerInfo?: {
      name?: string;
      phone?: string;
      email?: string;
      notes?: string;
    },
    address?: string
  ) => {
    if (!userId) return null;

    setLoading(true);
    const latLngHash = generateLatLngHash(lat, lng);

    try {
      // Upsert the property disposition
      const { data, error } = await supabase
        .from('property_dispositions')
        .upsert({
          user_id: userId,
          lat,
          lng,
          lat_lng_hash: latLngHash,
          address: address || null,
          disposition,
          customer_name: customerInfo?.name || null,
          customer_phone: customerInfo?.phone || null,
          customer_email: customerInfo?.email || null,
          notes: customerInfo?.notes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lat_lng_hash',
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProperties(prev => {
        const existing = prev.findIndex(p => p.latLngHash === latLngHash);
        const newProperty: PropertyData = {
          id: data.id,
          lat: Number(data.lat),
          lng: Number(data.lng),
          latLngHash: data.lat_lng_hash,
          address: data.address || undefined,
          disposition: data.disposition as PropertyDisposition,
          customerName: data.customer_name || undefined,
          customerPhone: data.customer_phone || undefined,
          customerEmail: data.customer_email || undefined,
          notes: data.notes || undefined,
        };

        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newProperty;
          return updated;
        }
        return [...prev, newProperty];
      });

      return data;
    } catch (error) {
      console.error('Error setting disposition:', error);
      toast({
        title: "Error",
        description: "Failed to save disposition",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Generate a grid of property points for the visible area
  const generatePropertyGrid = useCallback((bounds: Bounds, spacing: number = 0.0002) => {
    const gridPoints: { lat: number; lng: number; latLngHash: string }[] = [];
    
    for (let lat = bounds.south; lat <= bounds.north; lat += spacing) {
      for (let lng = bounds.west; lng <= bounds.east; lng += spacing) {
        gridPoints.push({
          lat,
          lng,
          latLngHash: generateLatLngHash(lat, lng),
        });
      }
    }
    
    return gridPoints;
  }, []);

  // Get property by lat/lng hash
  const getPropertyByHash = useCallback((latLngHash: string) => {
    return properties.find(p => p.latLngHash === latLngHash);
  }, [properties]);

  return {
    properties,
    loading,
    fetchPropertiesInBounds,
    setPropertyDisposition,
    generatePropertyGrid,
    getPropertyByHash,
  };
}
