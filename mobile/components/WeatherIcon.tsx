import { WeatherCondition } from '@/types/weather';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  Moon,
  CloudMoon,
} from 'lucide-react-native';

interface WeatherIconProps {
  condition: WeatherCondition;
  size?: number;
  color?: string;
}

export default function WeatherIcon({
  condition,
  size = 64,
  color = '#FFFFFF',
}: WeatherIconProps) {
  const iconProps = { size, color, strokeWidth: 2 };

  switch (condition) {
    case 'sunny':
      return <Sun {...iconProps} />;
    case 'partly-cloudy':
      return <Cloud {...iconProps} />;
    case 'cloudy':
      return <Cloud {...iconProps} />;
    case 'rainy':
      return <CloudDrizzle {...iconProps} />;
    case 'stormy':
      return <CloudRain {...iconProps} />;
    case 'night-clear':
      return <Moon {...iconProps} />;
    case 'night-cloudy':
      return <CloudMoon {...iconProps} />;
    default:
      return <Sun {...iconProps} />;
  }
}
