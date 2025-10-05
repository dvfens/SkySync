import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HourlyForecast as HourlyForecastType } from '@/types/weather';
import WeatherIcon from './WeatherIcon';

interface HourlyForecastProps {
  forecasts: HourlyForecastType[];
}

export default function HourlyForecast({ forecasts }: HourlyForecastProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(400).springify()}
      style={styles.container}>
      <Text style={styles.title}>Hourly Forecast</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {forecasts.map((forecast, index) => (
          <View key={index} style={styles.forecastItem}>
            <Text style={styles.hour}>{forecast.hour}</Text>
            <WeatherIcon
              condition={forecast.condition}
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.temperature}>
              {Math.round(forecast.temperature)}°
            </Text>
            {forecast.precipitation > 0.5 && (
              <Text style={styles.precipitation}>
                {forecast.precipitation.toFixed(1)}mm
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 20,
  },
  forecastItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  hour: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  temperature: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  precipitation: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
});
