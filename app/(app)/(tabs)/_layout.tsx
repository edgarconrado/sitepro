/**
 * SitePro — Tab Navigator
 * Solo íconos animados, sin texto
 */

import { SideMenu } from '@components/layout/SideMenu';
import { AnimatedTabIcon } from '@components/ui/Animated';
import { useMenu } from '@hooks/useMenu';
import { useAppStore } from '@store/appStore';
import { colors } from '@theme/colors';
import { fontWeight } from '@theme/tokens';
import { Tabs } from 'expo-router';
import { Camera, CheckSquare, Home, MessageSquare, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ICON_SIZE = 24;

function TabIcon({
  icon,
  focused,
  count,
}: {
  icon: React.ReactNode;
  focused: boolean;
  count?: number;
}) {
  return (
    <View style={styles.tabItem}>
      <AnimatedTabIcon focused={focused}>
        <View style={styles.iconArea}>
          {icon}
          {count && count > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
            </View>
          ) : null}
        </View>
      </AnimatedTabIcon>
      {/* Punto activo debajo del ícono */}
      <View style={[styles.dot, focused && styles.dotActive]} />
    </View>
  );
}

export default function TabsLayout() {
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);
  const { isOpen, close } = useMenu();

  const ic = (focused: boolean) => focused ? colors.primary[600] : colors.gray[400];
  const sw = (focused: boolean) => focused ? 2.5 : 1.5;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItemWrapper,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}
                icon={<Home size={ICON_SIZE} color={ic(focused)} strokeWidth={sw(focused)} />}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}
                icon={<CheckSquare size={ICON_SIZE} color={ic(focused)} strokeWidth={sw(focused)} />}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="photos"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}
                icon={<Camera size={ICON_SIZE} color={ic(focused)} strokeWidth={sw(focused)} />}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} count={unreadNotifications}
                icon={<MessageSquare size={ICON_SIZE} color={ic(focused)} strokeWidth={sw(focused)} />}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}
                icon={<Users size={ICON_SIZE} color={ic(focused)} strokeWidth={sw(focused)} />}
              />
            ),
          }}
        />
      </Tabs>

      <SideMenu visible={isOpen} onClose={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    height: 56,
  },
  tabItemWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconArea: { position: 'relative' },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: colors.primary[600],
  },
  badge: {
    position: 'absolute',
    top: -4, right: -8,
    minWidth: 16, height: 16,
    backgroundColor: colors.error[500],
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 8, fontWeight: fontWeight.bold, color: colors.white },
});