import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Bed,
    CalendarCheck,
    Crown,
    Info,
    MapPin,
    Phone,
    Star,
    Users,
    Utensils,
    Wifi
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
import Footer from './Footer';

const { width } = Dimensions.get('window');

const HotelOverviewPage = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Overview");

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

    useEffect(() => {
        const fetchHotelDetails = async () => {
            try {
                const cleanId = typeof id === 'string' && id.includes(":") ? id.split(":")[1] : id;
                const response = await axios.get(`${backendUrl}/hotels/get/${cleanId}`);
                if (response.data?.success) {
                    setHotel(response.data.data);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchHotelDetails();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0B223A" />
                <Text style={styles.loaderText}>PREPARING LUXURY</Text>
            </View>
        );
    }

    if (!hotel) return <View style={styles.loaderContainer}><Text>Hotel not found!</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
                
                {/* 1. HERO SECTION */}
                <View style={styles.heroSection}>
                    <Image 
                        source={{ uri: hotel.images?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb' }} 
                        style={styles.heroImage} 
                    />
                    <View style={styles.heroOverlay}>
                        <View>
                            <Text style={styles.hotelName}>{hotel.name}</Text>
                            <View style={styles.locationRow}>
                                <MapPin size={16} color="#FBBF24" />
                                <Text style={styles.locationText}>{hotel.city}, {hotel.district}</Text>
                            </View>
                        </View>
                        <View style={styles.ratingBadge}>
                            <Star size={16} color="#FBBF24" fill="#FBBF24" />
                            <Text style={styles.ratingText}>{hotel.rating}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. NAVIGATION TABS */}
                <View style={styles.tabBar}>
                    <TabButton label="Overview" active={activeTab === "Overview"} onPress={() => setActiveTab("Overview")} icon={Info} />
                    <TabButton label="Rooms" active={activeTab === "Rooms"} onPress={() => setActiveTab("Rooms")} icon={Bed} />
                    <TabButton label="Dining" active={activeTab === "Dining"} onPress={() => setActiveTab("Dining")} icon={Utensils} />
                </View>

                {/* 3. CONTENT AREA */}
                <View style={styles.contentArea}>
                    {activeTab === "Overview" && (
                        <View>
                            <Text style={styles.sectionTitle}>Rooms & Suites</Text>
                            {hotel.roomTypes?.slice(0, 2).map((room: any, idx: number) => (
                                <RoomItem key={idx} room={room} hotelImg={hotel.images?.[0]} />
                            ))}
                            <TouchableOpacity onPress={() => setActiveTab("Rooms")}>
                                <Text style={styles.viewAllText}>View All Accommodations →</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === "Rooms" && (
                        <View>
                            {hotel.roomTypes?.map((room: any, idx: number) => (
                                <RoomItem key={idx} room={room} hotelImg={hotel.images?.[0]} fullView />
                            ))}
                        </View>
                    )}

                    {activeTab === "Dining" && (
                        <View style={styles.diningContainer}>
                            <Text style={styles.diningTitle}>The Pacific Grill</Text>
                            <FoodCard name="Lobster Thermidor" price="LKR 8,500" />
                            <FoodCard name="Wagyu Steak" price="LKR 12,400" />
                        </View>
                    )}

                    
                </View>
            </ScrollView>

            {/* 4. FOOTER / BOOK BUTTON */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.phoneText}><Phone size={14} color="#FBBF24" /> {hotel.phone}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.bookBtn}
                    onPress={() =>
                        router.push({
                            pathname: '/bookingpage',
                            params: { hotelId: hotel._id },
                        })
                    }
                >
                    <CalendarCheck color="#1C3D58" size={20} />
                    <Text style={styles.bookBtnText}>BOOK STAY</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- HELPER COMPONENTS ---

const TabButton = ({ label, active, onPress, icon: Icon }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.tabButton, active && styles.activeTab]}>
        <Icon size={18} color={active ? "#0B223A" : "#94A3B8"} />
        <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
);

const RoomItem = ({ room, hotelImg, fullView }: any) => (
    <View style={[styles.roomCard, fullView && styles.shadow]}>
        <Text style={styles.roomType}><Crown size={16} color="#F59E0B" /> {room.type}</Text>
        <Image source={{ uri: room.images?.[0] || hotelImg }} style={styles.roomImage} />
        <View style={styles.roomFooter}>
            <View style={styles.amenityRow}>
                <View style={styles.tag}><Users size={12} color="#1D4C79" /><Text style={styles.tagText}>{room.maxGuests}</Text></View>
                <View style={styles.tag}><Wifi size={12} color="#1D4C79" /><Text style={styles.tagText}>WiFi</Text></View>
            </View>
            <Text style={styles.priceText}>LKR {room.finalPrice || room.originalPrice}</Text>
        </View>
    </View>
);

const FoodCard = ({ name, price }: any) => (
    <View style={styles.foodCard}>
        <Text style={styles.foodName}>{name}</Text>
        <Text style={styles.foodPrice}>{price}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 10, fontWeight: '900', letterSpacing: 2, color: '#0B223A' },
    
    heroSection: { height: 400, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { 
        position: 'absolute', bottom: 0, width: '100%', 
        padding: 20, backgroundColor: 'rgba(11, 34, 58, 0.6)',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'
    },
    hotelName: { color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'capitalize' },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    locationText: { color: 'rgba(255,255,255,0.8)', marginLeft: 5 },
    ratingBadge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    ratingText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },

    tabBar: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tabButton: { paddingVertical: 15, marginRight: 25, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#0B223A' },
    tabLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: '#94A3B8', marginLeft: 5 },
    activeTabLabel: { color: '#0B223A' },

    contentArea: { padding: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
    viewAllText: { color: '#0B223A', fontWeight: '900', fontSize: 12, marginTop: 10, textDecorationLine: 'underline' },

    roomCard: { marginBottom: 20, backgroundColor: 'white', borderRadius: 20, padding: 15 },
    roomType: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
    roomImage: { width: '100%', height: 200, borderRadius: 15 },
    roomFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    amenityRow: { flexDirection: 'row' },
    tag: { backgroundColor: '#F0F5FB', padding: 5, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginRight: 5 },
    tagText: { fontSize: 10, fontWeight: '900', color: '#1D4C79', marginLeft: 3 },
    priceText: { fontSize: 18, fontWeight: '900', color: '#1D4C79' },

    diningContainer: { alignItems: 'center' },
    diningTitle: { fontSize: 24, fontWeight: '900', fontStyle: 'italic', color: '#1E293B', marginBottom: 20 },
    foodCard: { backgroundColor: 'white', width: '100%', padding: 20, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, elevation: 2 },
    foodName: { fontWeight: 'bold', color: '#1E293B' },
    foodPrice: { color: '#1D4C79', fontWeight: '900' },

    footer: { 
        padding: 20, backgroundColor: '#0B223A', 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
    },
    phoneText: { color: 'white', fontWeight: 'bold' },
    bookBtn: { backgroundColor: '#F3C26B', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center' },
    bookBtnText: { fontWeight: '900', marginLeft: 10, color: '#1C3D58' },
    shadow: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 }
});

export default HotelOverviewPage;