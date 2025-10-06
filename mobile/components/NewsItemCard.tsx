import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { NewsItem } from '@/types/weather';

interface Props {
  item: NewsItem;
}

export default function NewsItemCard({ item }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.link) Linking.openURL(item.link);
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.metaRow}>
        {!!item.source && <Text style={styles.meta}>{item.source}</Text>}
        {!!item.publishedAt && <Text style={styles.meta}>{new Date(item.publishedAt).toLocaleString()}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  meta: {
    color: '#cbd5e1',
    fontSize: 12,
  },
});


