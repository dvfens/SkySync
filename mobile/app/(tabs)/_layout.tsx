import { Tabs } from 'expo-router';
import { Cloud, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
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
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Weather',
          tabBarIcon: ({ focused, size, color }) => (
            <Cloud size={focused ? size + 2 : size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused, size, color }) => (
            <AlertTriangle size={focused ? size + 2 : size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
