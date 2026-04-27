import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { ChevronDown, Key, LogOut, Package, User as UserIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const backendUrl = process.env.EXPO_PUBLIC_API_URL;
export default function UserProfile() {
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const getStoredToken = useCallback(async () => {
        if (Platform.OS === 'web') {
            return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        }

        const secureToken = await SecureStore.getItemAsync('token');
        if (secureToken) return secureToken;

        return AsyncStorage.getItem('token');
    }, []);

    const clearStoredAuth = useCallback(async () => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
            }
            return;
        }

        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('role');
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('role');
    }, []);

    const fetchUserData = useCallback(async () => {
        try {
            const token = await getStoredToken();
            if (token) {
                // සටහන: ඔබ ලබා දුන් දත්ත අනුව API එකෙන් User Array එකක් හෝ Object එකක් ලැබිය හැක
                const response = await axios.get(`${backendUrl}/users/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // ලැබෙන දත්ත Array එකක් නම් පළමු index එක ගන්න (උදා: response.data[0])
                // සාමාන්‍යයෙන් Object එකක් නම් response.data කෙලින්ම ගත හැක
                setUser(Array.isArray(response.data) ? response.data[0] : response.data);
            }
        } catch (err: any) {
            console.error("User Profile Fetch Error:", err);

            if (err?.response?.status === 401) {
                await clearStoredAuth();
            }

            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [clearStoredAuth, getStoredToken]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleLogout = async () => {
        await clearStoredAuth();
        setIsOpen(false);
        router.replace("/login"); 
    };

    if (loading) {
        return <ActivityIndicator size="small" color="#22d3ee" />;
    }

    if (!user) {
        return (
            <TouchableOpacity
                onPress={() => router.push('/login')}
                style={styles.triggerButton}
            >
                <View style={styles.fallbackAvatar}>
                    <UserIcon size={16} color="white" />
                </View>
                <ChevronDown size={14} color="white" />
            </TouchableOpacity>
        );
    }

    // --- පින්තූරය පෙන්වීමේ තර්කය (Image Logic) ---
    // ඔබ ලබා දුන් User Object එකේ image: "https://example.com/..." ලෙස ඇති නිසා 
    // එය මුලින්ම පරීක්ෂා කර බලයි.
    const profileImg = user.image && (user.image.startsWith("http") || user.image.includes("googleusercontent"))
        ? user.image 
        : `${backendUrl?.replace('/api', '')}/uploads/${user.image || 'default.png'}`;

    return (
        <View>
            {/* Header එකේ පෙනෙන කුඩා Profile Button එක */}
            <TouchableOpacity 
                onPress={() => setIsOpen(true)}
                style={styles.triggerButton}
            >
                <View style={styles.imageWrapper}>
                    <Image 
                        source={{ uri: profileImg }} 
                        style={styles.profileThumbnail}
                        resizeMode="cover"
                    />
                    <View style={styles.onlineStatus} />
                </View>
                <ChevronDown size={14} color="white" />
            </TouchableOpacity>

            {/* Profile Dropdown (Modal) */}
            <Modal
                visible={isOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setIsOpen(false)}
                >
                    <View style={styles.menuCard}>
                        {/* පාරිභෝගිකයාගේ විස්තර සහිත Header කොටස */}
                        <View style={styles.menuHeader}>
                            <Image source={{ uri: profileImg }} style={styles.largeProfileImg} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userNameText}>
                                    {user.firstName || 'User'} {user.lastName || ''}
                                </Text>
                                <Text style={styles.userEmailText}>{user.email}</Text>
                            </View>
                        </View>

                        {/* Menu Options */}
                        <View style={styles.menuLinksWrapper}>
                            <MenuBtn 
                                icon={<Package size={20} color="#64748b" />} 
                                text="My Bookings" 
                                onPress={() => {setIsOpen(false); router.push("/my-bookings")}} 
                            />
                            <MenuBtn 
                                icon={<UserIcon size={20} color="#64748b" />} 
                                text="Account Settings" 
                                onPress={() => {setIsOpen(false); router.push("/profile")}} 
                            />

                            <MenuBtn 
                                icon={<Key size={20} color="#64748b" />}
                                text="My Payments"
                                onPress={() => {setIsOpen(false); router.push("/my-payments")}}
                            />
                            
                            <View style={styles.divider} />

                            <TouchableOpacity 
                                onPress={handleLogout}
                                style={styles.logoutBtn}
                            >
                                <LogOut size={20} color="#ef4444" />
                                <Text style={styles.logoutText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// Menu වල Button එක සරල කර ලිවීම
const MenuBtn = ({ icon, text, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.menuBtnStyle}>
        {icon}
        <Text style={styles.menuBtnText}>{text}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    triggerButton: {
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        padding: 4, 
        paddingRight: 10, 
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 100, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.2)' 
    },
    imageWrapper: { position: 'relative' },
    fallbackAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    profileThumbnail: { 
        width: 34, 
        height: 34, 
        borderRadius: 17, 
        borderWidth: 1.5, 
        borderColor: '#22d3ee' 
    },
    onlineStatus: { 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        width: 10, 
        height: 10, 
        backgroundColor: '#22c55e', 
        borderRadius: 5, 
        borderWidth: 2, 
        borderColor: '#111827' 
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.4)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    menuCard: { 
        width: '85%', 
        backgroundColor: 'white', 
        borderRadius: 24, 
        overflow: 'hidden',
        elevation: 10
    },
    menuHeader: { 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc', 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f1f5f9',
        gap: 15
    },
    largeProfileImg: { width: 55, height: 55, borderRadius: 27.5 },
    userNameText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    userEmailText: { fontSize: 13, color: '#64748b' },
    menuLinksWrapper: { padding: 8 },
    menuBtnStyle: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        padding: 14, 
        borderRadius: 12 
    },
    menuBtnText: { fontSize: 15, color: '#475569', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
    logoutBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        padding: 14, 
        borderRadius: 12 
    },
    logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 15 }
});