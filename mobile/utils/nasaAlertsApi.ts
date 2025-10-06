import { WeatherAlert, LocationData } from '@/types/weather';

const DONKI_BASE_URL = 'https://api.nasa.gov/DONKI/alerts';

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchNasaSpaceWeatherAlerts(_location?: LocationData): Promise<WeatherAlert[]> {
  // DONKI alerts are global space-weather alerts; not location-specific
  try {
    const apiKey = process.env.EXPO_PUBLIC_NASA_API_KEY || 'DEMO_KEY';
    if (apiKey === 'DEMO_KEY') {
      console.log('[nasaAlertsApi] Using DEMO_KEY (rate-limited). Set EXPO_PUBLIC_NASA_API_KEY for production.');
    }

    const end = new Date();
    const start = new Date();
    // Fetch last 3 days to ensure we capture recent alerts
    start.setDate(start.getDate() - 3);

    const params = new URLSearchParams({
      startDate: toISODate(start),
      endDate: toISODate(end),
      status: 'all',
      api_key: apiKey,
    });

    const url = `${DONKI_BASE_URL}?${params.toString()}`;
    console.log('[nasaAlertsApi] DONKI request', { start: params.get('startDate'), end: params.get('endDate') });
    const res = await fetch(url);
    if (!res.ok) {
      // If DONKI throttles or key is missing, just return no alerts
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const alerts: WeatherAlert[] = data.map((item: any) => {
      const id: string = item.id || item.messageID || `${item.messageType}-${item.messageIssueTime}`;
      const event: string = item.messageType || 'Space Weather Alert';
      const description: string = item.messageBody || '';
      const areaDesc: string = (item.regions || []).join(', ') || 'Global';
      const onset: string = item.messageIssueTime || new Date().toISOString();
      const expires: string = '';

      return {
        id,
        event,
        severity: 'Unknown',
        description,
        instruction: '',
        areaDesc,
        onset,
        expires,
      };
    });

    return alerts;
  } catch (e) {
    console.error('Error fetching NASA DONKI alerts:', e);
    return [];
  }
}


