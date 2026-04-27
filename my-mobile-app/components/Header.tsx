import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from "expo-router";
import { LayoutDashboard, Menu, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserProfile from "./userProfile";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compactHeader = width < 390;

  useEffect(() => {
    const checkLogin = async () => {
      try {
        let token: string | null = null;
        let role: string | null = null;

        if (Platform.OS === 'web') {
          token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null;
          role = typeof localStorage !== 'undefined' ? localStorage.getItem("role") : null;
        } else {
          token = await SecureStore.getItemAsync("token");
          role = await SecureStore.getItemAsync("role");

          if (!token) {
            token = await AsyncStorage.getItem("token");
          }

          if (!role) {
            role = await AsyncStorage.getItem("role");
          }
        }

        setIsLoggedIn(!!token);
        setIsAdmin(role === 'admin');
      } catch (error) {
        console.error("Error checking token:", error);
      }
    };
    checkLogin();
  }, []);

  const navigateTo = (path: string) => {
    setMenuOpen(false);
    router.push(path as any);
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, marginTop: -insets.top }]}>
      <View style={[styles.headerContent, compactHeader && styles.headerContentCompact]}>
        
        {/* 1. Logo Section */}
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.logoContainer, compactHeader && styles.logoContainerCompact]} 
          onPress={() => router.push("/homePage")}
        >
          <Image 
            source={require("../assets/logo.png")} 
            style={{ width: compactHeader ? 26 : 30, height: compactHeader ? 26 : 30 }} 
            resizeMode="contain"
          />
          <Text style={[styles.logoText, compactHeader && styles.logoTextCompact]} numberOfLines={1}>
            Travel<Text style={{ color: "#22d3ee" }}>Ease</Text>
          </Text>
        </TouchableOpacity>

        {/* 2. Right Section */}
        <View style={[styles.rightSection, compactHeader && styles.rightSectionCompact]}>
          {isLoggedIn && isAdmin && (
            <TouchableOpacity
              style={[styles.adminIconBtn, compactHeader && styles.adminIconBtnCompact]}
              onPress={() => router.push('/adminPage')}
            >
              <LayoutDashboard color="white" size={compactHeader ? 16 : 18} />
            </TouchableOpacity>
          )}

          {isLoggedIn ? (
            <UserProfile />
          ) : (
            <TouchableOpacity 
              style={[styles.loginBtn, compactHeader && styles.loginBtnCompact]}
              onPress={() => router.push("/login")}
            >
              <Text style={[styles.loginBtnText, compactHeader && styles.loginBtnTextCompact]}>Login</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setMenuOpen(true)} style={[styles.menuIcon, compactHeader && styles.menuIconCompact]}>
            <Menu color="white" size={compactHeader ? 22 : 24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Modal Menu */}
      <Modal visible={menuOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setMenuOpen(false)}>
            <X color="white" size={35} />
          </TouchableOpacity>

          <View style={styles.menuLinks}>
            <TouchableOpacity onPress={() => navigateTo("/")}><Text style={styles.linkText}>Home</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/about")}><Text style={styles.linkText}>About Us</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/contact")}><Text style={styles.linkText}>Contact Us</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/vehiclePage")}><Text style={styles.linkText}>Vehicles</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/driverpage")}><Text style={styles.linkText}>Drivers</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/hotel")}><Text style={styles.linkText}>Hotels</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/destination")}><Text style={styles.linkText}>Destinations</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/packages")}><Text style={styles.linkText}>Packages</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo("/feedback")}><Text style={styles.linkText}>Feedback</Text></TouchableOpacity>
            {isLoggedIn && isAdmin && (
              <TouchableOpacity onPress={() => navigateTo("/adminPage")}><Text style={styles.linkText}>Admin Dashboard</Text></TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#111827', // තද පැහැති පසුබිමක් (Dark Blue/Gray)
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 54,
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
  },
  headerContentCompact: {
    paddingHorizontal: 12,
    minHeight: 50,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  logoContainerCompact: { gap: 4 },
  logoText: { color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.15, flexShrink: 1 },
  logoTextCompact: { fontSize: 15 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  rightSectionCompact: { gap: 6 },
  adminIconBtn: {
    backgroundColor: '#4f46e5',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminIconBtnCompact: { width: 26, height: 26, borderRadius: 13 },
  menuIcon: { padding: 2 },
  menuIconCompact: { padding: 1 },
  loginBtn: { backgroundColor: '#06b6d4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  loginBtnCompact: { paddingHorizontal: 9, paddingVertical: 4 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  loginBtnTextCompact: { fontSize: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.98)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 30, padding: 10 },
  menuLinks: { gap: 40, alignItems: 'center' },
  linkText: { color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'uppercase' },
});