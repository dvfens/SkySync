import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '@/components/GradientBackground';
import WeatherCard from '@/components/WeatherCard';
import HourlyForecast from '@/components/HourlyForecast';
import AlertBanner from '@/components/AlertBanner';
import { WeatherData, HourlyForecast as HourlyForecastType, WeatherAlert, LocationData } from '@/types/weather';
import { fetchWeatherData } from '@/utils/weatherApi';
import { fetchWeatherAlerts } from '@/utils/alertsApi';
import { getCurrentLocation, searchPlace } from '@/utils/locationService';
import { RefreshCw } from 'lucide-react-native';

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastType[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [dateQuery, setDateQuery] = useState<string>(''); // YYYY-MM-DD

  const loadWeatherData = async (showRefreshIndicator = false, overrideLocation?: LocationData, dateStr?: string) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const userLocation = overrideLocation || await getCurrentLocation();
      if (!userLocation) {
        setError('Unable to get location. Please enable location permissions.');
        return;
      }

      setLocation(userLocation);

      const { current, hourly } = await fetchWeatherData(userLocation, dateStr);
      setWeather(current);
      setHourlyForecast(hourly);

      const weatherAlerts = await fetchWeatherAlerts(userLocation);
      setAlerts(weatherAlerts);
    } catch (err) {
      setError('Failed to load weather data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeatherData();

    const interval = setInterval(() => {
      loadWeatherData(true);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    loadWeatherData(true);
  }, []);

  const onSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    try {
      setSearching(true);
      setError(null);
      // Try coordinates or place name via Google/Open‑Meteo helper
      const newLoc = await searchPlace(q);
      if (!newLoc) {
        setError('Place not found. Try a different query.');
        return;
      }
      await loadWeatherData(false, newLoc);
      setLocation(newLoc);
    } catch (e) {
      console.error(e);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [query]);

  if (loading) {
    return (
      <GradientBackground condition="cloudy">
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <RefreshCw size={48} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.loadingText}>Fetching Weather...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (error || !weather) {
    return (
      <GradientBackground condition="cloudy">
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || 'Unable to load weather data'}</Text>
            <Text style={styles.retryText} onPress={() => loadWeatherData()}>
              Tap to retry
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground condition={weather.condition}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search place (e.g., London, UK)"
            placeholderTextColor="#cbd5e1"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={onSearch} disabled={searching}>
            <Text style={styles.searchButtonText}>{searching ? '...' : 'Search'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="YYYY-MM-DD (optional date)"
            placeholderTextColor="#cbd5e1"
            value={dateQuery}
            onChangeText={setDateQuery}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => loadWeatherData(false, undefined, dateQuery || undefined)}>
            <Text style={styles.searchButtonText}>Set Date</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }>
          <WeatherCard weather={weather} location={location || undefined} />

          {hourlyForecast.length > 0 && (
            <HourlyForecast forecasts={hourlyForecast} />
          )}

          {alerts.length > 0 && (
            <View style={styles.alertsSection}>
              <Text style={styles.alertsTitle}>Weather Alerts</Text>
              {alerts.map((alert, index) => (
                <AlertBanner key={alert.id} alert={alert} index={index} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  alertsSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#FFFFFF',
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
  },
});
