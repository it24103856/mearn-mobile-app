import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Image,
    Modal,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Hotel {
    _id: string;
    name: string;
    city: string;
    district?: string;
    province?: string;
    rating?: number;
    category?: string;
    images?: string[];
    roomTypes?: Array<{ finalPrice: number }>;
}

const AdminHotelPage = () => {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const router = useRouter();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Fetch Hotels
    const fetchHotels = async () => {
        try {
            const token = ''; // ← Replace with your token logic (AsyncStorage recommended)
            const res = await axios.get(`${backendUrl}/hotels/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setHotels(res.data.data || res.data || []);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to fetch hotels' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    // Delete Handler
    const handleDeleteClick = (hotel: Hotel) => {
        setSelectedHotel(hotel);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!selectedHotel) return;
        setDeleting(true);

        try {
            const token = ''; // Add token
            await axios.delete(`${backendUrl}/hotels/delete/${selectedHotel._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Toast.show({ type: 'success', text1: 'Hotel deleted successfully' });
            fetchHotels();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.response?.data?.message || 'Failed to delete hotel',
            });
        } finally {
            setDeleting(false);
            setDeleteModalVisible(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Hotel Management</Text>
                <Text style={styles.subtitle}>Manage your partner hotels and properties</Text>
            </View>

            {/* Hotels List */}
            <FlatList
                data={hotels}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="office-building" size={80} color="#CBD5E1" />
                        <Text style={styles.emptyText}>
                            No hotels registered yet.{'\n'}Tap + to add your first property.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.hotelCard}>
                        <View style={styles.hotelRow}>
                            {/* Image */}
                            <View style={styles.imageContainer}>
                                {item.images?.[0] ? (
                                    <Image
                                        source={{ uri: item.images[0] }}
                                        style={styles.hotelImage}
                                    />
                                ) : (
                                    <View style={styles.placeholder}>
                                        <MaterialCommunityIcons name="office-building" size={32} color="#6366F1" />
                                    </View>
                                )}
                            </View>

                            {/* Info */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.hotelName}>{item.name}</Text>

                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text style={styles.rating}>
                                        {item.rating || 'N/A'} • {item.category}
                                    </Text>
                                </View>

                                <View style={styles.locationRow}>
                                    <MaterialCommunityIcons name="map-marker" size={16} color="#6366F1" />
                                    <Text style={styles.location}>
                                        {item.city}
                                        {item.district && `, ${item.district}`}
                                    </Text>
                                </View>

                                <View style={styles.priceRow}>
                                    <Text style={styles.price}>
                                        LKR{' '}
                                        {item.roomTypes?.[0]?.finalPrice?.toLocaleString() || 'N/A'}
                                    </Text>
                                    <Text style={styles.perNight}>/ night</Text>
                                </View>
                            </View>

                            {/* Rooms Count */}
                            <View style={styles.roomsContainer}>
                                <Text style={styles.roomsCount}>
                                    {item.roomTypes?.length || 0}
                                </Text>
                                <Text style={styles.roomsLabel}>Rooms</Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push(`/admin/editHotelPage?id=${item._id}`)}
                            >
                                <MaterialCommunityIcons name="pencil" size={20} color="#6366F1" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteClick(item)}
                            >
                                <MaterialCommunityIcons name="trash-can" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/admin/hotelAddPage')}
            >
                <MaterialCommunityIcons name="plus" size={28} color="white" />
            </TouchableOpacity>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <MaterialCommunityIcons name="trash-can" size={50} color="#EF4444" />
                        </View>

                        <Text style={styles.modalTitle}>Delete Hotel?</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure you want to remove{' '}
                            <Text style={{ fontWeight: 'bold' }}>{selectedHotel?.name}</Text>?
                        </Text>
                        <Text style={styles.modalWarning}>
                            This property and all its room details will be deleted permanently.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={confirmDelete}
                                disabled={deleting}
                            >
                                <Text style={styles.confirmText}>
                                    {deleting ? 'Removing...' : 'Confirm Delete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD' },
    header: { padding: 20, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    subtitle: { color: '#6B7280', marginTop: 4 },

    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    hotelCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    hotelRow: { flexDirection: 'row', alignItems: 'center' },
    imageContainer: { width: 72, height: 72, borderRadius: 16, overflow: 'hidden', marginRight: 16 },
    hotelImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoContainer: { flex: 1 },
    hotelName: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 4 },
    rating: { fontSize: 13, color: '#4B5563' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    location: { color: '#4B5563', fontSize: 14 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
    price: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    perNight: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },

    roomsContainer: { alignItems: 'center', backgroundColor: '#F0F9FF', padding: 10, borderRadius: 12 },
    roomsCount: { fontSize: 18, fontWeight: 'bold', color: '#6366F1' },
    roomsLabel: { fontSize: 11, color: '#6366F1', fontWeight: '600' },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
    editButton: { padding: 10, backgroundColor: '#EFF6FF', borderRadius: 12 },
    deleteButton: { padding: 10, backgroundColor: '#FEE2E2', borderRadius: 12 },

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 64,
        height: 64,
        backgroundColor: '#6366F1',
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '88%', alignItems: 'center' },
    modalIcon: { marginBottom: 16 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
    modalSubtitle: { marginTop: 8, textAlign: 'center', color: '#374151', fontSize: 16 },
    modalWarning: { marginTop: 12, textAlign: 'center', color: '#6B7280', fontSize: 14 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center' },
    confirmBtn: { flex: 1, padding: 16, backgroundColor: '#EF4444', borderRadius: 16, alignItems: 'center' },
    cancelText: { fontWeight: 'bold', color: '#4B5563' },
    confirmText: { fontWeight: 'bold', color: 'white' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 16, marginTop: 16, lineHeight: 24 },
});

export default AdminHotelPage;