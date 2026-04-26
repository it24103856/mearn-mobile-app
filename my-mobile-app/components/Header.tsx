import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from "expo-router";
import { LayoutDashboard, Menu, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import UserProfile from "./userProfile";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

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
    // SafeAreaView එකට padding එකක් එක් කිරීමෙන් Notch එකට යට වීම වළකී
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContent}>
        
        {/* 1. Logo Section */}
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.logoContainer} 
          onPress={() => router.push("/homePage")}
        >
          <Image 
            source={require("../assets/logo.png")} 
            style={{ width: 35, height: 35 }} 
            resizeMode="contain"
          />
          <Text style={styles.logoText}>
            Travel<Text style={{ color: "#22d3ee" }}>Ease</Text>
          </Text>
        </TouchableOpacity>

        {/* 2. Right Section */}
        <View style={styles.rightSection}>
          {isLoggedIn && isAdmin && (
            <TouchableOpacity
              style={styles.adminIconBtn}
              onPress={() => router.push('/adminPage')}
            >
              <LayoutDashboard color="white" size={18} />
            </TouchableOpacity>
          )}

          {isLoggedIn ? (
            <UserProfile />
          ) : (
            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuIcon}>
            <Menu color="white" size={28} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#111827', // තද පැහැති පසුබිමක් (Dark Blue/Gray)
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Android වල Status bar එක මග හැරීමට
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  adminIconBtn: {
    backgroundColor: '#4f46e5',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { padding: 5 },
  loginBtn: { backgroundColor: '#06b6d4', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.98)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 30, padding: 10 },
  menuLinks: { gap: 40, alignItems: 'center' },
  linkText: { color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'uppercase' },
});