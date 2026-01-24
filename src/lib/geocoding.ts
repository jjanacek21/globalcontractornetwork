// Use environment variable for Mapbox token, with fallback for backwards compatibility
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHNxcXAyMGkwMmt3MmtwOHRtZzRtdTQ0In0.r5TIIyCB7DcObd5rs4BVIw';

interface GeocodingResult {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address || address.trim().length === 0) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US`
    );

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn('No geocoding results found for address:', address);
      return null;
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;

    // Extract city and state from context
    let city: string | undefined;
    let state: string | undefined;

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('place.')) {
          city = ctx.text;
        } else if (ctx.id.startsWith('region.')) {
          state = ctx.short_code?.replace('US-', '') || ctx.text;
        }
      }
    }

    return { lat, lng, city, state };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
