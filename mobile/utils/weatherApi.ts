import {
  WeatherData,
  HourlyForecast,
  LocationData,
  WeatherCondition,
  NASAPowerResponse,
} from '@/types/weather';

const NASA_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/hourly/point';

async function fetchFromOpenMeteo(location: LocationData): Promise<{ current: WeatherData; hourly: HourlyForecast[] }> {
  const { latitude, longitude } = location;
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
    timezone: 'auto'
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenMeteo error: ${res.status}`);
  const data = await res.json();
  const nowIdx = 0;
  const current: WeatherData = {
    temperature: data.current?.temperature_2m ?? data.hourly?.temperature_2m?.[nowIdx] ?? 0,
    humidity: data.current?.relative_humidity_2m ?? data.hourly?.relative_humidity_2m?.[nowIdx] ?? 0,
    windSpeed: data.current?.wind_speed_10m ?? data.hourly?.wind_speed_10m?.[nowIdx] ?? 0,
    precipitation: data.current?.precipitation ?? data.hourly?.precipitation?.[nowIdx] ?? 0,
    condition: determineCondition(
      data.current?.temperature_2m ?? 0,
      data.current?.precipitation ?? 0,
      data.current?.relative_humidity_2m ?? 0,
      new Date()
    ),
    timestamp: new Date().toISOString(),
  };
  const hourly: HourlyForecast[] = (data.hourly?.time || []).slice(0, 12).map((t: string, i: number) => ({
    hour: new Date(t).toTimeString().slice(0, 5),
    temperature: data.hourly.temperature_2m?.[i] ?? 0,
    condition: determineCondition(
      data.hourly.temperature_2m?.[i] ?? 0,
      data.hourly.precipitation?.[i] ?? 0,
      data.hourly.relative_humidity_2m?.[i] ?? 0,
      new Date(t)
    ),
    precipitation: data.hourly.precipitation?.[i] ?? 0,
  }));
  return { current, hourly };
}

export async function fetchWeatherData(
  location: LocationData,
  targetDate?: string
): Promise<{ current: WeatherData; hourly: HourlyForecast[] }> {
  const { latitude, longitude } = location;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - 24);

  // If a targetDate (YYYY-MM-DD) is provided, fetch that day's hourly forecast via Open‑Meteo
  if (targetDate) {
    console.log('[weatherApi] Using Open-Meteo date mode', {
      latitude: Number(latitude.toFixed(4)),
      longitude: Number(longitude.toFixed(4)),
      targetDate,
    });
    const today = new Date().toISOString().slice(0, 10);
    const isPast = targetDate < today;
    const base = isPast
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast';
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
      timezone: 'auto',
    });
    if (isPast) {
      params.set('start_date', targetDate);
      params.set('end_date', targetDate);
    } else {
      // Forecast API: request enough days and filter client-side
      params.set('forecast_days', '16');
    }
    const url = `${base}?${params.toString()}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenMeteo date error: ${res.status}`);
      const data = await res.json();
      const times: string[] = data.hourly?.time || [];
      const filteredIdx: number[] = times
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.startsWith(targetDate))
        .map(({ i }) => i);
      const pick = () => {
        const noon = filteredIdx.find((i) => new Date(times[i]).getHours() === 12);
        return noon !== undefined ? noon : (filteredIdx[0] ?? 0);
      };
      const idx = pick();
      const current: WeatherData = {
        temperature: data.hourly?.temperature_2m?.[idx] ?? 0,
        humidity: data.hourly?.relative_humidity_2m?.[idx] ?? 0,
        windSpeed: data.hourly?.wind_speed_10m?.[idx] ?? 0,
        precipitation: data.hourly?.precipitation?.[idx] ?? 0,
        condition: determineCondition(
          data.hourly?.temperature_2m?.[idx] ?? 0,
          data.hourly?.precipitation?.[idx] ?? 0,
          data.hourly?.relative_humidity_2m?.[idx] ?? 0,
          new Date(times[idx] || `${targetDate}T12:00:00`)
        ),
        timestamp: times[idx] || `${targetDate}T12:00:00`,
      };
      const hourly: HourlyForecast[] = (filteredIdx.length ? filteredIdx : times.map((_, i) => i))
        .slice(0, 12)
        .map((i) => ({
          hour: new Date(times[i]).toTimeString().slice(0, 5),
          temperature: data.hourly?.temperature_2m?.[i] ?? 0,
          condition: determineCondition(
            data.hourly?.temperature_2m?.[i] ?? 0,
            data.hourly?.precipitation?.[i] ?? 0,
            data.hourly?.relative_humidity_2m?.[i] ?? 0,
            new Date(times[i])
          ),
          precipitation: data.hourly?.precipitation?.[i] ?? 0,
        }));
      return { current, hourly };
    } catch (e) {
      // Fall through to default path which will try NASA or Open‑Meteo current
      console.error('Date-based fetch failed, falling back to current:', e);
    }
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const params = new URLSearchParams({
    parameters: 'T2M,RH2M,WS10M,PRECTOTCORR',
    community: 'RE',
    longitude: longitude.toFixed(4),
    latitude: latitude.toFixed(4),
    start: formatDate(startDate),
    end: formatDate(endDate),
    format: 'JSON',
  });

  const url = `${NASA_BASE_URL}?${params.toString()}`;

  try {
    console.log('[weatherApi] Using NASA POWER (current window)', {
      latitude: Number(latitude.toFixed(4)),
      longitude: Number(longitude.toFixed(4)),
      range: { start: formatDate(startDate), end: formatDate(endDate) },
    });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data: NASAPowerResponse = await response.json();
    const { parameter } = data.properties;
    const timestamps = Object.keys(parameter.T2M || {}).sort();
    if (timestamps.length === 0) throw new Error('NASA POWER returned no data');
    const latestTimestamp = timestamps[timestamps.length - 1];

    const t = parameter.T2M?.[latestTimestamp];
    const h = parameter.RH2M?.[latestTimestamp];
    const w = parameter.WS10M?.[latestTimestamp];
    const p = parameter.PRECTOTCORR?.[latestTimestamp];

    const hasValid = [t, h, w, p].every((v) => typeof v === 'number' && v > -900);

    if (!hasValid) {
      // Fallback to Open-Meteo to avoid -999 values
      console.log('[weatherApi] NASA returned invalid values, falling back to Open-Meteo');
      return await fetchFromOpenMeteo(location);
    }

    const condition = determineCondition(t, p, h, new Date());

    const current: WeatherData = {
      temperature: t,
      humidity: h,
      windSpeed: w,
      precipitation: p,
      condition,
      timestamp: latestTimestamp,
    };

    const hourly: HourlyForecast[] = timestamps.slice(-12).map((ts) => {
      const hour = ts.substring(8, 10) + ':00';
      const temp = parameter.T2M?.[ts] ?? 0;
      const precip = parameter.PRECTOTCORR?.[ts] ?? 0;
      const hum = parameter.RH2M?.[ts] ?? 0;

      return {
        hour,
        temperature: temp,
        condition: determineCondition(temp, precip, hum, new Date(ts)),
        precipitation: precip,
      };
    });

    return { current, hourly };
  } catch (error) {
    // Any failure -> fallback
    console.error('Error fetching NASA POWER data, falling back to Open-Meteo:', error);
    return await fetchFromOpenMeteo(location);
  }
}

function determineCondition(
  temperature: number,
  precipitation: number,
  humidity: number,
  date: Date
): WeatherCondition {
  const hour = date.getHours();
  const isNight = hour < 6 || hour > 18;

  if (precipitation > 5) {
    return 'stormy';
  } else if (precipitation > 1) {
    return 'rainy';
  } else if (humidity > 80) {
    return isNight ? 'night-cloudy' : 'cloudy';
  } else if (humidity > 60) {
    return isNight ? 'night-cloudy' : 'partly-cloudy';
  } else {
    return isNight ? 'night-clear' : 'sunny';
  }
}

export function getConditionDescription(condition: WeatherCondition): string {
  const descriptions: Record<WeatherCondition, string> = {
    sunny: 'Sunny',
    'partly-cloudy': 'Partly Cloudy',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    stormy: 'Stormy',
    'night-clear': 'Clear Night',
    'night-cloudy': 'Cloudy Night',
  };
  return descriptions[condition];
}
