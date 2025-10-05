import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { LocationData } from '@/types/weather';

// Google Maps Geocoding API
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    const [geocode] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    return {
      latitude,
      longitude,
      city: geocode?.city || undefined,
      region: geocode?.region || undefined,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

export async function searchPlace(query: string): Promise<LocationData | null> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return null;

    // 1) Accept raw coordinates like "16.4634, 80.5067" or "16.4634°N, 80.5067°E"
    const coordComma = trimmed.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (coordComma) {
      const lat = parseFloat(coordComma[1]);
      const lon = parseFloat(coordComma[2]);
      if (isFinite(lat) && isFinite(lon)) {
        return {
          latitude: lat,
          longitude: lon,
          city: undefined,
          region: undefined,
        } as any;
      }
    }

    const coordCardinal = trimmed.match(/^\s*(\d{1,2}(?:\.\d+)?)\s*°?\s*([NSns])\s*,\s*(\d{1,3}(?:\.\d+)?)\s*°?\s*([EEWWe])\s*$/);
    if (coordCardinal) {
      const latVal = parseFloat(coordCardinal[1]);
      const latSign = coordCardinal[2].toUpperCase() === 'S' ? -1 : 1;
      const lonVal = parseFloat(coordCardinal[3]);
      const lonSign = coordCardinal[4].toUpperCase() === 'W' ? -1 : 1;
      const lat = latSign * latVal;
      const lon = lonSign * lonVal;
      if (isFinite(lat) && isFinite(lon)) {
        return {
          latitude: lat,
          longitude: lon,
          city: undefined,
          region: undefined,
        } as any;
      }
    }

    const apiKey = (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY
      || (Constants?.manifest as any)?.extra?.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'PUT_YOUR_API_KEY_HERE') {
      console.warn('Missing GOOGLE_MAPS_API_KEY in app.json extra.');
    }

    const params = new URLSearchParams({
      address: trimmed,
      key: apiKey || '',
    });
    const url = `${GOOGLE_GEOCODE_URL}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.results || data.results.length === 0) return null;
    const r = data.results[0];
    const loc: LocationData = {
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
      city: r.address_components?.find((c: any) => c.types.includes('locality'))?.long_name,
      region: r.address_components?.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || r.address_components?.find((c: any) => c.types.includes('country'))?.long_name
    } as any;
    return loc;
  } catch (e) {
    console.error('Error searching place:', e);
    return null;
  }
}
