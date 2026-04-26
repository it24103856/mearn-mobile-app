import React from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'view-dashboard', route: '/adminPage' },
  { label: 'Customer', icon: 'home-account', route: '/homePage' },
  { label: 'Contact', icon: 'phone', route: '/admin/adminContactPage' },
  { label: 'Messages', icon: 'email', route: '/admin/AdminMessages' },
  { label: 'Users', icon: 'account-group', route: '/admin/adminUserPage' },
  { label: 'Drivers', icon: 'car', route: '/admin/adminDriverPage' },
  { label: 'Hotels', icon: 'office-building', route: '/admin/AdminHotelPage' },
  { label: 'Bookings', icon: 'calendar-check', route: '/admin/AdminBookingPage' },
  { label: 'Payments', icon: 'cash', route: '/admin/adminPaymentpage' },
  { label: 'Packages', icon: 'package-variant', route: '/admin/AdminPackagePage' },
  { label: 'Destinations', icon: 'map-marker', route: '/admin/adminDestination' },
  { label: 'Vehicles', icon: 'truck', route: '/admin/AdminVehiclePage' },
  { label: 'Feedback', icon: 'comment-quote', route: '/admin/AdminFeedbackPage' },
];

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.route;

            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => router.push(item.route as any)}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={20}
                  color={isActive ? '#ffffff' : '#6366F1'}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  topNav: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navScroll: { paddingHorizontal: 12, flexDirection: 'row', gap: 8 },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    minWidth: 80,
  },
  navItemActive: {
    backgroundColor: '#6366F1',
  },
  navLabel: { fontSize: 11, fontWeight: 'bold', color: '#4B5563', marginTop: 4 },
  navLabelActive: { color: '#ffffff' },
  content: { flex: 1 },
});
