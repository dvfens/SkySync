import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { WeatherAlert } from '@/types/weather';
import { getSeverityColor } from '@/utils/alertsApi';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';

interface AlertBannerProps {
  alert: WeatherAlert;
  index: number;
}

export default function AlertBanner({ alert, index }: AlertBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const severityColor = getSeverityColor(alert.severity);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).springify()}
      style={styles.container}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={[styles.banner, { borderLeftColor: severityColor }]}
        activeOpacity={0.8}>
        <View style={styles.header}>
          <AlertTriangle size={24} color={severityColor} strokeWidth={2} />
          <View style={styles.headerText}>
            <Text style={styles.event}>{alert.event}</Text>
            <Text style={styles.severity}>{alert.severity}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.details}>
            <Text style={styles.area}>{alert.areaDesc}</Text>

            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>Until:</Text>
              <Text style={styles.time}>{formatDate(alert.expires)}</Text>
            </View>

            {alert.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{alert.description}</Text>
              </View>
            )}

            {alert.instruction && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instruction}>{alert.instruction}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  banner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  event: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  severity: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  area: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  time: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    lineHeight: 18,
  },
  instruction: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    lineHeight: 18,
    fontWeight: '500',
  },
});
