import axios from 'axios';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, Mail, ShieldCheck } from "lucide-react-native";
import React, { useState } from 'react';
import Footer from '../components/Footer';
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 1 වන පියවර: OTP එක යැවීම
  const handleSendOtp = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email");
    
    setIsLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/users/send-otp/${email}`);
      Alert.alert("Success", res.data.message);
      setStep(2);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // 2 වන පියවර: OTP පරීක්ෂා කර Password reset කිරීම
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) return Alert.alert("Error", "Passwords do not match!");
    if (newPassword.length < 6) return Alert.alert("Error", "Password too short!");

    setIsLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/users/validate-otp`, {
        email, otp, newPassword
      });
      Alert.alert("Success 🎉", res.data.message);
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground 
    
    source={require('../assets/login.jpg')} 
    style={{ flex: 1 }}
>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 25 }}>
            
            <View style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: 30, 
              padding: 30, 
              borderWidth: 1, 
              borderColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center'
            }}>
              
              <Image source={require("../assets/logo.png")} style={{ width: 80, height: 80, resizeMode: 'contain', marginBottom: 20 }} />
              
              <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold', textAlign: 'center' }}>
                {step === 1 ? "Forgot Password?" : "Set New Password"}
              </Text>
              
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginVertical: 15 }}>
                {step === 1 
                  ? "Enter your email to receive a 6-digit verification code." 
                  : "Verify OTP and secure your account with a new password."}
              </Text>

              {/* Step 1: Email Form */}
              {step === 1 ? (
                <View style={{ width: '100%', gap: 15 }}>
                  <View style={inputWrapper}>
                    <Mail size={20} color="rgba(255,255,255,0.6)" />
                    <TextInput 
                      placeholder="Email Address"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={inputField}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity 
                    onPress={handleSendOtp}
                    disabled={isLoading}
                    style={primaryButton}
                  >
                    {isLoading ? <ActivityIndicator color="white" /> : <Text style={buttonText}>Send OTP</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Step 2: OTP & New Password Form */
                <View style={{ width: '100%', gap: 12 }}>
                  <View style={inputWrapper}>
                    <ShieldCheck size={20} color="rgba(255,255,255,0.6)" />
                    <TextInput 
                      placeholder="6-digit OTP"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={inputField}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={inputWrapper}>
                    <Lock size={20} color="rgba(255,255,255,0.6)" />
                    <TextInput 
                      placeholder="New Password"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={inputField}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={[inputWrapper, confirmPassword && newPassword !== confirmPassword && { borderColor: '#f87171', borderWidth: 1 }]}>
                    <Lock size={20} color="rgba(255,255,255,0.6)" />
                    <TextInput 
                      placeholder="Confirm New Password"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={inputField}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>

                  {confirmPassword && newPassword !== confirmPassword && (
                    <Text style={{ color: '#f87171', fontSize: 12, textAlign: 'center' }}>* Passwords do not match</Text>
                  )}

                  <TouchableOpacity 
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    style={primaryButton}
                  >
                    {isLoading ? <ActivityIndicator color="white" /> : <Text style={buttonText}>Reset Password</Text>}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                onPress={() => step === 2 ? setStep(1) : router.push('/login')} 
                style={{ marginTop: 25, flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <ArrowLeft size={16} color="#22d3ee" />
                <Text style={{ color: '#22d3ee', fontWeight: 'bold' }}>Back to Sign In</Text>
              </TouchableOpacity>

            </View>

            <View style={{ marginHorizontal: -25 }}>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Styles
const inputWrapper = { 
  flexDirection: 'row' as 'row', 
  alignItems: 'center' as 'center', 
  backgroundColor: 'rgba(255,255,255,0.9)', 
  borderRadius: 15, 
  paddingHorizontal: 15 
};

const inputField = { flex: 1, padding: 15, color: '#1f2937' };

const primaryButton = { 
  backgroundColor: '#06b6d4', 
  padding: 16, 
  borderRadius: 15, 
  alignItems: 'center' as 'center', 
  marginTop: 10,
  shadowColor: '#06b6d4',
  shadowOpacity: 0.4,
  shadowRadius: 10,
  elevation: 5
};

const buttonText = { color: 'white', fontWeight: 'bold' as 'bold', fontSize: 16 };