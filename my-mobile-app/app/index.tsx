import Header from '@/components/Header';
import { useRouter } from 'expo-router';
import { KeyRound, LayoutGrid, LogIn, UserPlus } from "lucide-react-native";
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
        <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerSection}>
          <Image 
            source={require("../assets/logo.png")} // ඔබේ ලෝගෝ එක මෙතැනට එක් කරන්න
            style={styles.logo} 
          />
          <Text style={styles.welcomeTitle}>Discover Sri Lanka</Text>
          <Text style={styles.subTitle}>
            The ultimate travel experience awaits you
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={[styles.mainButton, { backgroundColor: '#f97316' }]}
          >
            <LogIn size={20} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>Login to Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={[styles.mainButton, { backgroundColor: '#3b82f6' }]}
          >
            <UserPlus size={20} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>Create New Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={[styles.mainButton, { backgroundColor: '#8b5cf6' }]}
          >
            <KeyRound size={20} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => router.push('/linkPage')}
            style={[styles.mainButton, { backgroundColor: '#10b981' }]}
          >
            <LayoutGrid size={20} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>View User Dashboard</Text>
          </TouchableOpacity>
          

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 25, justifyContent: 'center', minHeight: '100%' },
  headerSection: { alignItems: 'center', marginBottom: 50 },
  logo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 20 },
  welcomeTitle: { fontSize: 32, fontWeight: '900', color: '#111827', textAlign: 'center' },
  subTitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 10 },
  buttonContainer: { width: '100%', gap: 15 },
  mainButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 15, elevation: 4 },
  icon: { marginRight: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 10, width: '80%', alignSelf: 'center' },
});