import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, Image, 
    ImageBackground, ScrollView, 
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StyleSheet 
} from 'react-native';
// 1. SafeAreaView සඳහා අලුත් library එක භාවිතා කරන්න
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Camera, Mail, Lock, Phone, MapPin } from 'lucide-react-native';
import Footer from '../components/Footer';

// Supabase upload function එක
import { uploadFile } from '../lib/supabase';

const backendUrl = process.env.EXPO_PUBLIC_API_URL;
export default function RegisterScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Gallery එකෙන් පින්තූරයක් තෝරාගැනීම
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            // 2. MediaTypeOptions වෙනුවට අලුත් ක්‍රමය භාවිතා කරන්න
            mediaTypes: ['images'], 
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !password || !phone || !address) {
            Alert.alert("Error", "Please fill all fields!");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match!");
            return;
        }

        setIsLoading(true);
        try {
            let finalImageUrl = "https://vhxcjzgxczttlsoqbwnw.supabase.co/storage/v1/object/public/images/default-profile.png"; 

            if (imageUri) {
                console.log("Uploading to Supabase...");
                // lib/supabase.ts තුළ 'expo-file-system/legacy' භාවිතා කර ඇති බව තහවුරු කරගන්න
                finalImageUrl = await uploadFile(imageUri, 'profiles');
            }

            const userData = {
                firstName,
                lastName,
                email,
                password,
                address,
                phone,
                image: finalImageUrl
            };

            await axios.post(`${backendUrl}/users/create`, userData);

            Alert.alert("Success 🎉", "Registration successful!");
            router.push("/login");

        } catch (error: any) {
            console.error("Registration Error:", error);
            Alert.alert("Failed", error.response?.data?.message || "Something went wrong!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
       <ImageBackground 
    
    source={require('../assets/login.jpg')} 
    style={{ flex: 1 }}
>
            <View style={styles.overlay} />
            
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        
                        <View style={styles.header}>
                            <Text style={styles.titleText}>
                                Start Your <Text style={{ color: '#22d3ee' }}>Adventure</Text> Today.
                            </Text>
                        </View>

                        <View style={styles.glassCard}>
                            <Text style={styles.cardTitle}>Create Account</Text>

                            <View style={styles.imagePickerContainer}>
                                <TouchableOpacity onPress={pickImage} style={styles.imageCircle}>
                                    {imageUri ? (
                                        <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                                    ) : (
                                        <Camera color="rgba(255,255,255,0.5)" size={35} />
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.uploadLabel}>UPLOAD PHOTO</Text>
                            </View>

                            <View style={styles.inputGap}>
                                <View style={styles.row}>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <TextInput placeholder="First Name" value={firstName} onChangeText={setFirstName} style={styles.input} placeholderTextColor="#94a3b8" />
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <TextInput placeholder="Last Name" value={lastName} onChangeText={setLastName} style={styles.input} placeholderTextColor="#94a3b8" />
                                    </View>
                                </View>
                                
                                <View style={styles.inputContainer}>
                                    <Phone size={18} color="#94a3b8" />
                                    <TextInput placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} placeholderTextColor="#94a3b8" />
                                </View>

                                <View style={styles.inputContainer}>
                                    <MapPin size={18} color="#94a3b8" />
                                    <TextInput placeholder="Address" value={address} onChangeText={setAddress} style={styles.input} placeholderTextColor="#94a3b8" />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Mail size={18} color="#94a3b8" />
                                    <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} placeholderTextColor="#94a3b8" />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Lock size={18} color="#94a3b8" />
                                    <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholderTextColor="#94a3b8" />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Lock size={18} color="#94a3b8" />
                                    <TextInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} placeholderTextColor="#94a3b8" />
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={handleRegister}
                                disabled={isLoading}
                                style={styles.registerBtn}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.registerBtnText}>Join Now</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginLink}>
                                <Text style={styles.loginLinkText}>
                                    Already have an account? <Text style={{ color: '#22d3ee', fontWeight: 'bold' }}>Login</Text>
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

// Styles නොවෙනස්ව පවතී (කලින් දුන් Styles ම භාවිතා කරන්න)
const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    scrollContainer: { padding: 25, paddingBottom: 50 },
    header: { marginBottom: 30, marginTop: 20, alignItems: 'center' },
    titleText: { color: 'white', fontSize: 30, fontWeight: '900', textAlign: 'center', lineHeight: 40 },
    glassCard: { 
        backgroundColor: 'rgba(255, 255, 255, 0.12)', 
        borderRadius: 30, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    imagePickerContainer: { alignItems: 'center', marginBottom: 20 },
    imageCircle: { 
        width: 100, height: 100, borderRadius: 50, 
        borderWidth: 3, borderColor: '#22d3ee', 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden' 
    },
    selectedImage: { width: '100%', height: '100%' },
    uploadLabel: { color: 'white', fontSize: 10, marginTop: 8, letterSpacing: 1 },
    inputGap: { gap: 12 },
    row: { flexDirection: 'row', gap: 10 },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        borderRadius: 15, 
        paddingHorizontal: 15 
    },
    input: { flex: 1, padding: 14, color: '#1e293b', fontSize: 15 },
    registerBtn: { 
        backgroundColor: '#06b6d4', 
        padding: 18, 
        borderRadius: 15, 
        alignItems: 'center', 
        marginTop: 25,
    },
    registerBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    loginLink: { marginTop: 20, alignItems: 'center' },
    loginLinkText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 }
});