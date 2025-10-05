export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: WeatherCondition;
  timestamp: string;
}

export interface HourlyForecast {
  hour: string;
  temperature: number;
  condition: WeatherCondition;
  precipitation: number;
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  description: string;
  instruction: string;
  areaDesc: string;
  onset: string;
  expires: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
}

export type WeatherCondition =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'night-clear'
  | 'night-cloudy';

export interface NASAPowerResponse {
  properties: {
    parameter: {
      T2M: { [timestamp: string]: number };
      RH2M: { [timestamp: string]: number };
      WS10M: { [timestamp: string]: number };
      PRECTOTCORR: { [timestamp: string]: number };
    };
  };
}

export interface NWSAlertsResponse {
  features: Array<{
    id: string;
    properties: {
      event: string;
      severity: string;
      description: string;
      instruction: string;
      areaDesc: string;
      onset: string;
      expires: string;
    };
  }>;
}
