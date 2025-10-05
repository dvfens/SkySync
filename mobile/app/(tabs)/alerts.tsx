import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '@/components/GradientBackground';
import AlertBanner from '@/components/AlertBanner';
import { WeatherAlert, LocationData } from '@/types/weather';
import { fetchWeatherAlerts } from '@/utils/alertsApi';
import { getCurrentLocation } from '@/utils/locationService';
import { TriangleAlert as AlertTriangle, RefreshCw } from 'lucide-react-native';

export default function AlertsScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const userLocation = await getCurrentLocation();
      if (!userLocation) {
        setError('Unable to get location. Please enable location permissions.');
        return;
      }

      setLocation(userLocation);

      const weatherAlerts = await fetchWeatherAlerts(userLocation);
      setAlerts(weatherAlerts);
    } catch (err) {
      setError('Failed to load weather alerts. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(() => {
      loadAlerts(true);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    loadAlerts(true);
  }, []);

  if (loading) {
    return (
      <GradientBackground condition="cloudy">
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <RefreshCw size={48} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.loadingText}>Loading Alerts...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground condition="cloudy">
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText} onPress={() => loadAlerts()}>
              Tap to retry
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground condition="cloudy">
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weather Alerts</Text>
          {location && (
            <Text style={styles.headerLocation}>
              {location.city}, {location.region}
            </Text>
          )}
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
          {alerts.length === 0 ? (
            <View style={styles.noAlertsContainer}>
              <AlertTriangle size={64} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.noAlertsText}>No active weather alerts</Text>
              <Text style={styles.noAlertsSubtext}>
                You'll be notified when severe weather is detected in your area
              </Text>
            </View>
          ) : (
            alerts.map((alert, index) => (
              <AlertBanner key={alert.id} alert={alert} index={index} />
            ))
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerLocation: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
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
  noAlertsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  noAlertsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
});
