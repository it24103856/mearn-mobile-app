import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { getAuthHeaders } from '../../lib/auth';

interface Booking {
    _id: string;
    userId?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        image?: string;
    };
    date?: string;
    category?: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled';
}

const AdminBookingPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const navigation = useNavigation<any>();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Fetch Bookings
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const res = await axios.get(`${backendUrl}/bookings/all`, {
                headers,
            });

            if (res.data?.success) {
                setBookings(res.data.data || []);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Could not load bookings.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Update Status
    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        const loadingToast = 'updating';
        try {
            const headers = await getAuthHeaders();
            await axios.put(
                `${backendUrl}/bookings/update-status/${bookingId}`,
                { status: newStatus },
                { headers }
            );

            Toast.show({ type: 'success', text1: `Booking updated to ${newStatus}` });
            fetchBookings();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.response?.data?.message || 'Could not update status.',
            });
        }
    };

    // Delete Booking
    const handleDeleteBooking = (booking: Booking) => {
        setSelectedBooking(booking);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!selectedBooking) return;
        setDeletingId(selectedBooking._id);

        try {
            const headers = await getAuthHeaders();
            await axios.delete(`${backendUrl}/bookings/delete/${selectedBooking._id}`, {
                headers,
            });

            Toast.show({ type: 'success', text1: 'Booking deleted successfully!' });
            fetchBookings();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Could not delete booking.' });
        } finally {
            setDeleteModalVisible(false);
            setDeletingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmed': return { bg: '#DCFCE7', text: '#16A34A' };
            case 'Cancelled': return { bg: '#FEE2E2', text: '#EF4444' };
            default: return { bg: '#FEF3C7', text: '#D97706' };
        }
    };

    return (
        <View style={styles.container}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="calendar-check" size={24} color="white" />
                    </View>
                    <View>
                        <Text style={styles.title}>Booking Management</Text>
                        <Text style={styles.subtitle}>Monitor customer reservations</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchBookings}
                    disabled={loading}
                >
                    <MaterialCommunityIcons
                        name="refresh"
                        size={18}
                        color="#6366F1"
                        style={loading ? { transform: [{ rotate: '45deg' }] } : {}}
                    />
                    <Text style={styles.refreshText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
                </TouchableOpacity>
            </View>

            {/* Bookings List */}
            {loading && bookings.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-remove" size={70} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No bookings found</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const statusStyle = getStatusColor(item.status);

                        return (
                            <View style={styles.bookingCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.bookingIdContainer}>
                                        <Text style={styles.bookingId}>
                                            #{item._id?.slice(-8).toUpperCase()}
                                        </Text>
                                    </View>

                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Customer Info */}
                                <View style={styles.customerRow}>
                                    <View style={styles.avatar}>
                                        {item.userId?.image ? (
                                            <Image source={{ uri: item.userId.image }} style={styles.avatarImage} />
                                        ) : (
                                            <MaterialCommunityIcons name="account" size={28} color="#6366F1" />
                                        )}
                                    </View>
                                    <View style={styles.customerInfo}>
                                        <Text style={styles.customerName}>
                                            {item.userId ? `${item.userId.firstName} ${item.userId.lastName}` : 'Unknown Guest'}
                                        </Text>
                                        <Text style={styles.customerEmail}>{item.userId?.email}</Text>
                                    </View>
                                </View>

                                {/* Date & Package */}
                                <View style={styles.infoRow}>
                                    <Text style={styles.date}>
                                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                                    </Text>
                                    <Text style={styles.category}>{item.category || 'GENERAL TOUR'}</Text>
                                </View>

                                {/* Status Selector */}
                                <View style={styles.statusSelector}>
                                    <Text style={styles.statusLabel}>Change Status:</Text>
                                    <View style={styles.statusButtons}>
                                        {['Pending', 'Confirmed', 'Cancelled'].map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                style={[
                                                    styles.statusOption,
                                                    item.status === status && styles.statusOptionActive,
                                                ]}
                                                onPress={() => handleStatusChange(item._id, status)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusOptionText,
                                                        item.status === status && styles.statusOptionTextActive,
                                                    ]}
                                                >
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Delete Button */}
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteBooking(item)}
                                >
                                    <MaterialCommunityIcons name="trash-can" size={20} color="#EF4444" />
                                    <Text style={styles.deleteText}>Delete Booking</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="trash-can" size={50} color="#EF4444" />
                        <Text style={styles.modalTitle}>Delete Booking?</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure? This action cannot be undone.
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
                                disabled={deletingId === selectedBooking?._id}
                            >
                                <Text style={styles.confirmText}>
                                    {deletingId === selectedBooking?._id ? 'Deleting...' : 'Confirm Delete'}
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconContainer: { backgroundColor: '#6366F1', padding: 12, borderRadius: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    subtitle: { color: '#6B7280', fontSize: 13 },

    refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
    refreshText: { color: '#6366F1', fontWeight: 'bold', fontSize: 13 },

    listContent: { padding: 16, paddingBottom: 100 },
    bookingCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    bookingIdContainer: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    bookingId: { fontFamily: 'monospace', fontWeight: 'bold', color: '#1F2937' },

    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
    statusText: { fontSize: 12, fontWeight: 'bold' },

    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    avatar: { width: 48, height: 48, borderRadius: 999, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    customerInfo: { flex: 1 },
    customerName: { fontWeight: '600', fontSize: 16 },
    customerEmail: { fontSize: 13, color: '#64748B' },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    date: { fontSize: 15, color: '#1F2937' },
    category: { fontSize: 12, color: '#6366F1', fontWeight: 'bold', textTransform: 'uppercase' },

    statusSelector: { marginBottom: 16 },
    statusLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
    statusButtons: { flexDirection: 'row', gap: 8 },
    statusOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9' },
    statusOptionActive: { backgroundColor: '#6366F1' },
    statusOptionText: { fontSize: 12, fontWeight: '600' },
    statusOptionTextActive: { color: 'white' },

    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 12 },
    deleteText: { color: '#EF4444', fontWeight: '700' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 12 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '85%', alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
    modalSubtitle: { color: '#6B7280', textAlign: 'center', marginVertical: 12 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center' },
    confirmBtn: { flex: 1, padding: 16, backgroundColor: '#EF4444', borderRadius: 16, alignItems: 'center' },
    cancelText: { fontWeight: 'bold', color: '#4B5563' },
    confirmText: { fontWeight: 'bold', color: 'white' },
});

export default AdminBookingPage;