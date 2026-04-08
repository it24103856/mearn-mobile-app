import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Bus,
    CalendarCheck,
    MapPin
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

const PackageOverviewPage = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [pkg, setPkg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState("Itinerary");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const backendUrl = process.env.EXPO_PUBLIC_API_URL ;

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const cleanId = typeof id === 'string' && id.includes(":") ? id.split(":")[1] : id;
                const response = await axios.get(`${backendUrl}/packages/get/${cleanId}`);
                if (response.data?.success) {
                    setPkg(response.data.data);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchPackage();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#C87941" />
                <Text style={styles.loaderText}>PREPARING YOUR JOURNEY</Text>
            </View>
        );
    }

    if (!pkg) return <View style={styles.loaderContainer}><Text>Package not found!</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
                
                {/* 1. HERO SECTION */}
                <View style={styles.heroSection}>
                    <Image 
                        source={{ uri: pkg.gallery?.[0] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1' }} 
                        style={styles.heroImage} 
                    />
                    <View style={styles.heroOverlay}>
                        <View style={styles.categoryContainer}>
                            {pkg.categories?.map((cat: string, i: number) => (
                                <View key={i} style={styles.catBadge}>
                                    <Text style={styles.catText}>{cat}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.title}>{pkg.title}</Text>
                        <View style={styles.heroFooter}>
                            <View style={styles.locationRow}>
                                <MapPin size={14} color="#FBBF24" />
                                <Text style={styles.locationText}>{pkg.location}</Text>
                            </View>
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceLabel}>LKR </Text>
                                <Text style={styles.priceValue}>{pkg.price?.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. STICKY NAV TABS */}
                <View style={styles.tabBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["Itinerary", "Destinations", "Hotels", "Transport", "FAQs"].map((tab) => (
                            <TouchableOpacity 
                                key={tab} 
                                onPress={() => setActiveSection(tab)}
                                style={[styles.tabButton, activeSection === tab && styles.activeTab]}
                            >
                                <Text style={[styles.tabLabel, activeSection === tab && styles.activeTabLabel]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 3. MAIN CONTENT */}
                <View style={styles.contentArea}>
                    
                    {/* CUSTOMIZE BANNER */}
                    <View style={styles.customCard}>
                        <Text style={styles.customTitle}>Customize your tour</Text>
                        <Text style={styles.customSub}>extend nights, change hotels, add activities</Text>
                        <TouchableOpacity style={styles.customBtn}>
                            <Text style={styles.customBtnText}>Customize Now</Text>
                        </TouchableOpacity>
                    </View>

                    {/* DYNAMIC SECTIONS */}
                    {activeSection === "Itinerary" && (
                        <View>
                            <Text style={styles.sectionTitle}>Travel Itinerary</Text>
                            {pkg.itineraries?.map((itin: any, idx: number) => (
                                <View key={idx} style={styles.itinCard}>
                                    <View style={styles.itinHeader}>
                                        <View style={styles.dayBadge}><Text style={styles.dayText}>Day {itin.day_no}</Text></View>
                                        <Text style={styles.itinTitle}>{itin.title}</Text>
                                    </View>
                                    {itin.activities?.map((act: any, i: number) => (
                                        <View key={i} style={styles.actRow}>
                                            <Text style={styles.actTime}>{act.time}</Text>
                                            <Text style={styles.actTask}>{act.task}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}

                    {activeSection === "Destinations" && (
                        <View style={styles.grid}>
                            {pkg.destinations?.map((dest: any, idx: number) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.gridCard}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/destinationOverview',
                                            params: { id: dest._id },
                                        })
                                    }
                                >
                                    <Image source={{ uri: dest.image }} style={styles.gridImage} />
                                    <Text style={styles.gridName}>{dest.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {activeSection === "Transport" && (
                        <View style={styles.grid}>
                            {pkg.transport?.map((t: string, idx: number) => (
                                <View key={idx} style={styles.transportCard}>
                                    <Bus size={24} color="#64748B" />
                                    <Text style={styles.transportLabel}>{t}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* 4. FOOTER */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerInfo}>{pkg.no_of_days} Days Journey</Text>
                    <Text style={styles.footerLocation}>{pkg.location}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.bookBtn}
                    onPress={() =>
                        router.push({
                            pathname: '/bookingpage',
                            params: { packageId: pkg._id },
                        })
                    }
                >
                    <CalendarCheck color="#1C3D58" size={20} />
                    <Text style={styles.bookBtnText}>BOOK NOW</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 10, fontWeight: '900', color: '#C87941', fontSize: 10 },
    
    heroSection: { height: 450 },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { 
        position: 'absolute', bottom: 0, width: '100%', padding: 25,
        backgroundColor: 'rgba(11, 34, 58, 0.7)'
    },
    categoryContainer: { flexDirection: 'row', marginBottom: 10 },
    catBadge: { backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 5 },
    catText: { color: '#FBBF24', fontSize: 10, fontWeight: '900' },
    title: { color: 'white', fontSize: 32, fontWeight: '900', marginBottom: 10 },
    heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { color: 'white', marginLeft: 5, fontWeight: '600' },
    priceBadge: { flexDirection: 'row', alignItems: 'baseline' },
    priceLabel: { color: '#FBBF24', fontWeight: '900', fontSize: 12 },
    priceValue: { color: 'white', fontSize: 22, fontWeight: '900' },

    tabBar: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tabButton: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#0B223A' },
    tabLabel: { fontSize: 12, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase' },
    activeTabLabel: { color: '#0B223A' },

    contentArea: { padding: 20 },
    customCard: { backgroundColor: '#FFFBEB', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 25 },
    customTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    customSub: { fontSize: 12, color: '#92400E', marginBottom: 15 },
    customBtn: { backgroundColor: '#1E293B', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    customBtnText: { color: 'white', fontWeight: '900', fontSize: 12 },

    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    itinCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: '#FDE68A' },
    itinHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    dayBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
    dayText: { fontSize: 10, fontWeight: '900', color: '#92400E' },
    itinTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
    actRow: { flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    actTime: { width: 60, fontSize: 10, fontWeight: '900', color: '#94A3B8' },
    actTask: { flex: 1, fontSize: 12, color: '#475569' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridCard: { width: '48%', backgroundColor: 'white', borderRadius: 15, marginBottom: 15, overflow: 'hidden', elevation: 2 },
    gridImage: { width: '100%', height: 120 },
    gridName: { padding: 10, fontWeight: '900', fontSize: 12, color: '#1E293B' },

    transportCard: { width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
    transportLabel: { marginTop: 10, fontWeight: '900', fontSize: 12, color: '#475569' },

    footer: { padding: 20, backgroundColor: '#0B223A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerInfo: { color: '#FBBF24', fontWeight: '900', fontSize: 12 },
    footerLocation: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    bookBtn: { backgroundColor: '#F3C26B', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center' },
    bookBtnText: { fontWeight: '900', marginLeft: 10, color: '#1C3D58' },
});

export default PackageOverviewPage;