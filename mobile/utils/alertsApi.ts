import { WeatherAlert, LocationData, NWSAlertsResponse } from '@/types/weather';

const NWS_BASE_URL = 'https://api.weather.gov/alerts/active';

export async function fetchWeatherAlerts(
  location: LocationData
): Promise<WeatherAlert[]> {
  const { latitude, longitude } = location;

  const url = `${NWS_BASE_URL}?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherApp/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`NWS API error: ${response.status}`);
    }

    const data: NWSAlertsResponse = await response.json();

    const alerts: WeatherAlert[] = data.features.map((feature) => ({
      id: feature.id,
      event: feature.properties.event,
      severity: normalizeSeverity(feature.properties.severity),
      description: feature.properties.description,
      instruction: feature.properties.instruction || '',
      areaDesc: feature.properties.areaDesc,
      onset: feature.properties.onset,
      expires: feature.properties.expires,
    }));

    return alerts;
  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    return [];
  }
}

function normalizeSeverity(
  severity: string
): 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown' {
  const normalized = severity.toLowerCase();
  if (normalized === 'extreme') return 'Extreme';
  if (normalized === 'severe') return 'Severe';
  if (normalized === 'moderate') return 'Moderate';
  if (normalized === 'minor') return 'Minor';
  return 'Unknown';
}

export function getSeverityColor(
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'
): string {
  const colors = {
    Extreme: '#D32F2F',
    Severe: '#F57C00',
    Moderate: '#FFA000',
    Minor: '#FBC02D',
    Unknown: '#757575',
  };
  return colors[severity];
}
