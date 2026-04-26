import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import Footer from "../components/Footer";
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

// Helper to save token
const saveToken = async (token: string, role: string) => {
  if (Platform.OS === "web") {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
  } else {
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("role", role);
  }
};
// TODO: Get your Google OAuth Client ID from Google Cloud Console
// Replace with your actual Google OAuth Client ID
const GOOGLE_CLIENT_ID = "601712598116-ckm9o17glc4rkas75394cfdcp74glbig.apps.googleusercontent.com";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID.includes("apps.googleusercontent.com")) {
      Alert.alert("Setup Required", "Please add your Google OAuth Client ID to enable Google login.\n\n1. Go to Google Cloud Console\n2. Create OAuth 2.0 credentials\n3. Replace GOOGLE_CLIENT_ID in login.tsx");
      return;
    }

    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { authentication } = result;
        
        // Send to backend for verification
        try {
          const res = await axios.post(`${backendUrl}/users/google-login`, {
            token: authentication?.accessToken,
          });
          
          await saveToken(res.data.token, res.data.role);
          
          Alert.alert("Welcome! 🎉", "Google login successful");
          if (res.data.role === "admin") {
            router.replace("/adminPage");
          } else {
            router.replace("/homePage");
          }
        } catch (backendErr: any) {
          Alert.alert("Server Error", backendErr.response?.data?.message || "Failed to sync with server");
        }
      }
    } catch (err: any) {
      Alert.alert("Google Login Error", err.message || "Failed to authenticate with Google");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/users/login`, { email, password });
      
      await saveToken(res.data.token, res.data.role);

      Alert.alert("Welcome back! ✨", "Ready for your next adventure?");
      
      if (res.data.role === "admin") {
        router.replace("/adminPage");
      } else {
        router.replace("/homePage");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground 
    
    source={require('../assets/login.jpg')} 
    style={{ flex: 1 }}
>
      {/* Dark Overlay for Glassmorphism effect */}
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 25 }}>
            
            {/* Left Side Equivalent: Brand Identity */}
            <View style={{ marginBottom: 40 }}>
              <Image 
                source={require("../assets/logo.png")} 
                style={{ width: 100, height: 60, resizeMode: 'contain', marginBottom: 20 }} 
              />
              <Text style={{ color: 'white', fontSize: 42, fontWeight: '900', lineHeight: 45 }}>
                Explore the <Text style={{ color: '#22d3ee' }}>World</Text> with Ease.
              </Text>
              <Text style={{ color: '#f1f5f9', fontSize: 16, marginTop: 15, fontStyle: 'italic', opacity: 0.9 }}>
                "Your journey of a thousand miles begins with a single click."
              </Text>
            </View>

            {/* Right Side Equivalent: Glassmorphism Form */}
            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: 30, 
              padding: 30, 
              borderWidth: 1, 
              borderColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)' // Note: Standard RN doesn't support blur on View, but we simulate it with background opacity
            }}>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>Sign In</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 25, marginTop: 5 }}>
                Welcome back! Please enter your details.
              </Text>

              {/* Inputs */}
              <View style={{ gap: 15 }}>
                <View style={inputContainerStyle}>
                  <Mail size={20} color="rgba(255,255,255,0.6)" />
                  <TextInput 
                    placeholder="Email Address"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={inputStyle}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={inputContainerStyle}>
                  <Lock size={20} color="rgba(255,255,255,0.6)" />
                  <TextInput 
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={inputStyle}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 10 }} onPress={() => router.push('/forgot-password')}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontStyle: 'italic' }}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={isLoading}
                style={{ 
                  backgroundColor: '#06b6d4', padding: 16, borderRadius: 15, 
                  alignItems: 'center', marginTop: 25, elevation: 10, shadowColor: '#06b6d4', shadowOpacity: 0.5, shadowRadius: 10
                }}
              >
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Sign In</Text>}
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <Text style={{ color: 'rgba(255,255,255,0.4)', marginHorizontal: 10, fontSize: 12 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </View>

              {/* Google Button */}
              <TouchableOpacity 
                onPress={handleGoogleLogin}
                style={{ 
                  backgroundColor: 'white', padding: 14, borderRadius: 15, 
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 
                }}
              >
                <FontAwesome name="google" size={20} color="#db4437" />
                <Text style={{ color: '#374151', fontWeight: 'bold' }}>Sign in with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('./register')} style={{ marginTop: 25, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  Not a member? <Text style={{ color: '#22d3ee', fontWeight: 'bold' }}>Join for Free</Text>
                </Text>
              </TouchableOpacity>

            </View>

            <View style={{ marginHorizontal: -25 }}>
              <Footer />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Inline Styles Helpers
const inputContainerStyle = { 
  flexDirection: 'row' as 'row', 
  alignItems: 'center' as 'center', 
  backgroundColor: 'rgba(255,255,255,0.9)', 
  borderRadius: 15, 
  paddingHorizontal: 15 
};

const inputStyle = { 
  flex: 1, 
  padding: 15, 
  color: '#1f2937', 
  fontSize: 16 
};