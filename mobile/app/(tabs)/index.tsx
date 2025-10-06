import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '@/components/GradientBackground';
import WeatherCard from '@/components/WeatherCard';
import HourlyForecast from '@/components/HourlyForecast';
import AlertBanner from '@/components/AlertBanner';
import NewsItemCard from '@/components/NewsItemCard';
import { WeatherData, HourlyForecast as HourlyForecastType, WeatherAlert, LocationData } from '@/types/weather';
import { fetchWeatherData } from '@/utils/weatherApi';
import { fetchWeatherNews } from '@/utils/newsApi';
import { fetchWeatherAlerts } from '@/utils/alertsApi';
import { getCurrentLocation, searchPlace, searchPlaceSuggestions, PlaceSuggestion } from '@/utils/locationService';
import { RefreshCw, SlidersHorizontal } from 'lucide-react-native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastType[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<import('@/types/weather').NewsItem[]>([]);

  const getTabBarBg = (cond: import('@/types/weather').WeatherCondition | null | undefined) => {
    switch (cond) {
      case 'sunny':
        return 'rgba(251, 191, 36, 0.85)'; // amber
      case 'partly-cloudy':
        return 'rgba(96, 165, 250, 0.85)'; // blue
      case 'cloudy':
        return 'rgba(100, 116, 139, 0.85)'; // slate
      case 'rainy':
        return 'rgba(59, 130, 246, 0.85)'; // blue
      case 'stormy':
        return 'rgba(37, 99, 235, 0.9)'; // darker blue
      case 'night-clear':
        return 'rgba(17, 24, 39, 0.9)'; // near black
      case 'night-cloudy':
        return 'rgba(30, 41, 59, 0.9)'; // dark slate
      default:
        return 'rgba(17, 24, 39, 0.8)';
    }
  };
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tempDateInput, setTempDateInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestionTimer, setSuggestionTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const loadWeatherData = async (
    showRefreshIndicator = false,
    overrideLocation?: LocationData,
    dateStr?: string
  ) => {
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

      const { current, hourly } = await fetchWeatherData(userLocation, dateStr || selectedDate || undefined);
      setWeather(current);
      setHourlyForecast(hourly);

      const weatherAlerts = await fetchWeatherAlerts(userLocation);
      setAlerts(weatherAlerts);

      try {
        const latestNews = await fetchWeatherNews(userLocation);
        setNews(latestNews);
      } catch (e) {
        setNews([]);
      }
    } catch (err) {
      setError('Failed to load weather data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial load only; selecting a date does not auto-fetch
    loadWeatherData(false, undefined, undefined);

    const interval = setInterval(() => {
      loadWeatherData(true, undefined, undefined);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Update bottom tab style based on current weather condition
  useEffect(() => {
    if (!weather) return;
    const bg = getTabBarBg(weather.condition);
    navigation.setOptions({
      tabBarStyle: {
        backgroundColor: bg,
        borderTopWidth: 0,
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        elevation: 0,
        height: 64,
        paddingBottom: 10,
        paddingTop: 6,
        borderRadius: 16,
        overflow: 'hidden',
      },
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.9)',
    } as any);
  }, [weather?.condition]);

  const onRefresh = useCallback(() => {
    loadWeatherData(true, undefined, selectedDate || undefined);
  }, [selectedDate]);

  const onSearch = useCallback(async () => {
    const q = query.trim();
    try {
      setSearching(true);
      setError(null);
      let targetLoc: LocationData | null = null;
      if (q) {
        // Try coordinates or place name via Open‑Meteo/Google
        targetLoc = await searchPlace(q);
        if (!targetLoc) {
          setError('Place not found. Try a different query.');
          return;
        }
      } else {
        // Use existing location (or current GPS) when no query provided
        targetLoc = location || (await getCurrentLocation());
        if (!targetLoc) {
          setError('Unable to get location. Please enable location permissions.');
          return;
        }
      }
      await loadWeatherData(false, targetLoc, selectedDate || undefined);
      setLocation(targetLoc);
    } catch (e) {
      console.error(e);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [query, selectedDate, location]);

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
          <View style={styles.searchInputWrapper}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open filters"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setFilterVisible(true)}
              style={styles.searchIcon}
            >
              <SlidersHorizontal size={18} color="#e2e8f0" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search place (e.g., London, UK)"
              placeholderTextColor="#cbd5e1"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setShowSuggestions(true);
                if (suggestionTimer) clearTimeout(suggestionTimer);
                const t = setTimeout(async () => {
                  const list = await searchPlaceSuggestions(text);
                  setSuggestions(list);
                }, 250);
                setSuggestionTimer(t);
              }}
              onSubmitEditing={onSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={onSearch} disabled={searching}>
            <Text style={styles.searchButtonText}>{searching ? '...' : 'Search'}</Text>
          </TouchableOpacity>
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionPanel}>
            {suggestions.map((s, idx) => (
              <TouchableOpacity
                key={`${s.latitude},${s.longitude}-${idx}`}
                style={styles.suggestionItem}
                onPress={async () => {
                  setQuery(s.label);
                  setShowSuggestions(false);
                  await loadWeatherData(false, { latitude: s.latitude, longitude: s.longitude, city: s.city, region: s.region }, selectedDate || undefined);
                  setLocation({ latitude: s.latitude, longitude: s.longitude, city: s.city, region: s.region });
                }}
              >
                <Text style={styles.suggestionText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filter Modal */}
        <Modal
          transparent
          visible={filterVisible}
          animationType="fade"
          onRequestClose={() => setFilterVisible(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterVisible(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Text style={styles.modalLabel}>Date (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={selectedDate || 'YYYY-MM-DD (optional date)'}
                placeholderTextColor="#94a3b8"
                value={tempDateInput}
                onChangeText={setTempDateInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancel]}
                  onPress={() => {
                    setTempDateInput('');
                    setFilterVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirm]}
                  onPress={() => {
                    const v = tempDateInput.trim();
                    if (!v) {
                      setSelectedDate(null);
                      setFilterVisible(false);
                      return;
                    }
                    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(v);
                    if (isValid) {
                      setSelectedDate(v);
                      setFilterVisible(false);
                    } else {
                      // keep open; simple inline feedback by changing placeholder
                      setTempDateInput('');
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>Set Date</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Date indicator */}
        <View style={{ marginHorizontal: 20, marginBottom: 8 }}>
          <Text style={{ color: '#e2e8f0', opacity: 0.9 }}>
            {selectedDate ? `Showing date: ${selectedDate}` : `Showing date: ${(weather.timestamp || '').slice(0, 10) || new Date().toISOString().slice(0,10)}`}
          </Text>
        </View>

        {/* Inline date selector removed; handled via Filter modal */}
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

          {news.length > 0 && (
            <View style={styles.alertsSection}>
              <Text style={styles.alertsTitle}>Weather News</Text>
              {news.map((n, i) => (
                <NewsItemCard key={`${n.link}-${i}`} item={n} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
// Style of the search and datae selector
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
  searchInputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 6,
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
  suggestionPanel: {
    marginHorizontal: 16,
    marginTop: -6,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(17,24,39,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: {
    color: '#e2e8f0',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(17,24,39,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  modalConfirm: {
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
  },
});
