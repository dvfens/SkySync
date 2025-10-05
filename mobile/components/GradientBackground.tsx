import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { WeatherCondition } from '@/types/weather';

interface GradientBackgroundProps {
  condition: WeatherCondition;
  children: React.ReactNode;
}

export default function GradientBackground({
  condition,
  children,
}: GradientBackgroundProps) {
  const gradients: Record<WeatherCondition, string[]> = {
    sunny: ['#FDB813', '#FF8C42', '#FF6B6B'],
    'partly-cloudy': ['#4A90E2', '#7BB8E7', '#A8DADC'],
    cloudy: ['#607D8B', '#78909C', '#90A4AE'],
    rainy: ['#2C3E50', '#34495E', '#5D6D7E'],
    stormy: ['#1A1A2E', '#16213E', '#0F3460'],
    'night-clear': ['#0F2027', '#203A43', '#2C5364'],
    'night-cloudy': ['#232526', '#414345', '#536976'],
  };

  const colors = gradients[condition];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
