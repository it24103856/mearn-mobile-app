import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient'; // npx expo install expo-linear-gradient
import { router } from 'expo-router';
import { Edit3, Mail, MapPin, Phone } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import Footer from '../components/Footer';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Header from '../components/Header';

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await axios.get(`${backendUrl}/users/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data);
            } catch (err) {
                console.error("Profile Fetch Error:", err);
                Alert.alert("Error", "Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#06b6d4" />
                <Text style={{ marginTop: 10, color: '#6b7280' }}>Loading Profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <Header />
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* 1. Top Banner - Gradient */}
                <LinearGradient
                    colors={['#06b6d4', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 200, width: '100%' }}
                />

                <View style={{ paddingHorizontal: 20 }}>
                    {/* 2. Overlapping Card */}
                    <View style={{ 
                        backgroundColor: 'white', 
                        borderRadius: 40, 
                        marginTop: -80, 
                        padding: 30, 
                        alignItems: 'center',
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        borderWidth: 1,
                        borderColor: '#f1f5f9'
                    }}>
                        
                        {/* Profile Photo */}
                        <View style={{ 
                            marginTop: -90, 
                            width: 150, 
                            height: 150, 
                            borderRadius: 75, 
                            borderWidth: 6, 
                            borderColor: 'white', 
                            elevation: 15,
                            overflow: 'hidden',
                            backgroundColor: 'white'
                        }}>
                            <Image 
                                source={{ uri: user?.image || "https://via.placeholder.com/150" }} 
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                        </View>

                        {/* User Name & Location */}
                        <View style={{ alignItems: 'center', marginTop: 15 }}>
                            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1f2937' }}>
                                {user?.firstName} {user?.lastName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 }}>
                                <MapPin size={16} color="#06b6d4" />
                                <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '500' }}>
                                    {user?.address || "Location not provided"}
                                </Text>
                            </View>
                        </View>

                        {/* Information Grid Equivalent */}
                        <View style={{ width: '100%', marginTop: 40, gap: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 30 }}>
                            
                            <InfoBox 
                                icon={<Mail size={22} color="#0891b2" />} 
                                label="Email Address" 
                                value={user?.email} 
                                bgColor="#ecfeff"
                            />

                            <InfoBox 
                                icon={<Phone size={22} color="#16a34a" />} 
                                label="Phone Number" 
                                value={user?.phone || "Not provided"} 
                                bgColor="#f0fdf4"
                            />

                        </View>

                        {/* Edit Button */}
                        <TouchableOpacity 
                            onPress={() => router.push("/edit-profile")}
                            style={{ 
                                marginTop: 40, 
                                backgroundColor: '#111827', 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                gap: 10, 
                                paddingVertical: 15, 
                                paddingHorizontal: 40, 
                                borderRadius: 100,
                                elevation: 5
                            }}
                        >
                            <Edit3 size={20} color="white" />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Edit Profile</Text>
                        </TouchableOpacity>

                    </View>
                </View>

                <View style={{ height: 50 }} />

                <Footer />
            </ScrollView>
        </SafeAreaView>
    );
}

// Helper Component for Info Rows
const InfoBox = ({ icon, label, value, bgColor }: any) => (
    <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 15, 
        backgroundColor: '#f8fafc', 
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    }}>
        <View style={{ 
            width: 50, 
            height: 50, 
            backgroundColor: 'white', 
            borderRadius: 15, 
            justifyContent: 'center', 
            alignItems: 'center',
            elevation: 2
        }}>
            {icon}
        </View>
        <View style={{ marginLeft: 15 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 2 }}>{value}</Text>
        </View>
    </View>
);