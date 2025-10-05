import {
  WeatherData,
  HourlyForecast,
  LocationData,
  WeatherCondition,
  NASAPowerResponse,
} from '@/types/weather';

const NASA_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/hourly/point';

export async function fetchWeatherData(
  location: LocationData
): Promise<{ current: WeatherData; hourly: HourlyForecast[] }> {
  const { latitude, longitude } = location;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - 24);

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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data: NASAPowerResponse = await response.json();
    const { parameter } = data.properties;

    const timestamps = Object.keys(parameter.T2M).sort();
    const latestTimestamp = timestamps[timestamps.length - 1];

    const temperature = parameter.T2M[latestTimestamp];
    const humidity = parameter.RH2M[latestTimestamp];
    const windSpeed = parameter.WS10M[latestTimestamp];
    const precipitation = parameter.PRECTOTCORR[latestTimestamp];

    const condition = determineCondition(
      temperature,
      precipitation,
      humidity,
      new Date()
    );

    const current: WeatherData = {
      temperature,
      humidity,
      windSpeed,
      precipitation,
      condition,
      timestamp: latestTimestamp,
    };

    const hourly: HourlyForecast[] = timestamps.slice(-12).map((ts) => {
      const hour = ts.substring(8, 10) + ':00';
      const temp = parameter.T2M[ts];
      const precip = parameter.PRECTOTCORR[ts];
      const hum = parameter.RH2M[ts];

      return {
        hour,
        temperature: temp,
        condition: determineCondition(temp, precip, hum, new Date(ts)),
        precipitation: precip,
      };
    });

    return { current, hourly };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
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
