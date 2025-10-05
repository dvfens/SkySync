import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { WeatherData, LocationData } from '@/types/weather';
import { getConditionDescription } from '@/utils/weatherApi';
import WeatherIcon from './WeatherIcon';
import { MapPin } from 'lucide-react-native';

interface WeatherCardProps {
  weather: WeatherData;
  location?: LocationData;
}

export default function WeatherCard({ weather, location }: WeatherCardProps) {
  const locationName = location?.city
    ? `${location.city}, ${location.region}`
    : 'Current Location';

  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify()}
      style={styles.card}>
      <View style={styles.locationContainer}>
        <MapPin size={20} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.location}>{locationName}</Text>
      </View>

      {location && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinates}>
            {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°
            {location.longitude >= 0 ? 'E' : 'W'}
          </Text>
        </View>
      )}

      <View style={styles.mainWeather}>
        <WeatherIcon condition={weather.condition} size={120} color="#FFFFFF" />
        <Text style={styles.temperature}>
          {Math.round(weather.temperature)}°
        </Text>
      </View>

      <Text style={styles.condition}>
        {getConditionDescription(weather.condition)}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>
            {Math.round(weather.humidity)}%
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>
            {weather.windSpeed.toFixed(1)} m/s
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Precip</Text>
          <Text style={styles.detailValue}>
            {weather.precipitation.toFixed(1)} mm
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  location: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  coordinatesContainer: {
    marginBottom: 16,
  },
  coordinates: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.75,
    textAlign: 'center',
    fontWeight: '400',
  },
  mainWeather: {
    alignItems: 'center',
    marginVertical: 20,
  },
  temperature: {
    fontSize: 72,
    fontWeight: '300',
    color: '#FFFFFF',
    marginTop: 16,
  },
  condition: {
    fontSize: 24,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 24,
    opacity: 0.9,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
