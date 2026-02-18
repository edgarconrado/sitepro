/**
 * SitePro — Tab Navigator (Bottom Navigation)
 * 5 tabs: Home | Tareas | Fotos | Mensajes | Equipo
 */

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Home, CheckSquare, Camera, MessageSquare, Users } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { fontSize, fontWeight, touchSize, iconSize } from '@theme/tokens';
import { useAppStore } from '@store/appStore';

interface TabIconProps {
  icon: React.ReactNode;
  label: string;
  focused: boolean;
  badgeCount?: number;
}

function TabIcon({ icon, label, focused, badgeCount }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View style={styles.iconWrapper}>
        {icon}
        {badgeCount && badgeCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.primary[600] : colors.gray[400] },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={
                <Home
                  size={iconSize.lg}
                  color={focused ? colors.primary[600] : colors.gray[400]}
                  strokeWidth={focused ? 2.5 : 1.5}
                />
              }
              label="Inicio"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={
                <CheckSquare
                  size={iconSize.lg}
                  color={focused ? colors.primary[600] : colors.gray[400]}
                  strokeWidth={focused ? 2.5 : 1.5}
                />
              }
              label="Tareas"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={
                <Camera
                  size={iconSize.lg}
                  color={focused ? colors.primary[600] : colors.gray[400]}
                  strokeWidth={focused ? 2.5 : 1.5}
                />
              }
              label="Fotos"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={
                <MessageSquare
                  size={iconSize.lg}
                  color={focused ? colors.primary[600] : colors.gray[400]}
                  strokeWidth={focused ? 2.5 : 1.5}
                />
              }
              label="Mensajes"
              focused={focused}
              badgeCount={unreadNotifications}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={
                <Users
                  size={iconSize.lg}
                  color={focused ? colors.primary[600] : colors.gray[400]}
                  strokeWidth={focused ? 2.5 : 1.5}
                />
              }
              label="Equipo"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: touchSize.navBar,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    backgroundColor: colors.error[500],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  tabLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
});
