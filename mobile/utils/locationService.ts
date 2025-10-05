import * as Location from 'expo-location';
import { LocationData } from '@/types/weather';

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
