import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useRouter } from 'expo-router';
import Footer from '../components/Footer';

const AdminPage = () => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = ''; // ← Add your token logic (AsyncStorage)
                if (!token) {
                    // Redirect to Login (use navigation)
                    return;
                }

                const res = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data?.role === 'admin') {
                    setUser(res.data);
                } else {
                    // Redirect to Home
                }
            } catch (err) {
                // Redirect to Login
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C8813A" />
                <Text style={styles.loadingText}>Authenticating Admin...</Text>
            </View>
        );
    }

    return <AdminDashboard />;
};

const AdminDashboard = () => {
    const router = useRouter();

    const navItems = [
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

    const addItems = [
        { label: 'Add Driver', icon: 'plus', route: '/admin/addDriverPage' },
        { label: 'Add Hotel', icon: 'plus', route: '/admin/hotelAddPage' },
        { label: 'Add Package', icon: 'plus', route: '/admin/addPackagePage' },
        { label: 'Add Destination', icon: 'plus', route: '/admin/adminCreateDestination' },
        { label: 'Add Vehicle', icon: 'plus', route: '/admin/adminVehicleCreatePage' },
    ];

    return (
        <View style={styles.container}>
            <Toast />

            {/* Custom Top Navigation */}
            <View style={styles.topNav}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
                    {navItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.navItem}
                            onPress={() => router.push(item.route as any)}
                        >
                            <MaterialCommunityIcons name={item.icon as any} size={20} color="#6366F1" />
                            <Text style={styles.navLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Main Content Area */}
            <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
                {/* Default Dashboard */}
                <View style={styles.dashboard}>
                    <Text style={styles.welcomeText}>Welcome, Admin</Text>
                    <Text style={styles.subText}>TravelMate Management Console</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.addItemsGrid}>
                        {addItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.addItemBtn}
                                onPress={() => router.push(item.route as any)}
                            >
                                <MaterialCommunityIcons name={item.icon as any} size={28} color="#6366F1" />
                                <Text style={styles.addItemLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <Footer />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD' },
    topNav: { backgroundColor: 'white', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    navScroll: { paddingHorizontal: 12, flexDirection: 'row', gap: 8 },
    navItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 999,
        minWidth: 80,
    },
    navLabel: { fontSize: 11, fontWeight: 'bold', color: '#4B5563', marginTop: 4 },

    mainContent: { flex: 1 },
    dashboard: { padding: 24, alignItems: 'center' },
    welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    subText: { color: '#6366F1', marginTop: 4 },

    quickActionsContainer: { paddingHorizontal: 16, paddingVertical: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
    addItemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    addItemBtn: {
        flex: 1,
        minWidth: '40%',
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    addItemLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 8, textAlign: 'center' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFDFD' },
    loadingText: { marginTop: 12, color: '#6B7280', fontWeight: 'bold' },
});

export default AdminPage;