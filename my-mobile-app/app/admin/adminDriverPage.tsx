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
import { getAuthHeaders } from '../../lib/auth';

interface Driver {
    _id: string;
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    vehicleType: string;
    profileImage?: string;
}

const AdminDriverPage = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const router = useRouter();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Fetch Drivers
    const fetchDrivers = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${backendUrl}/driver/get-all`, {
                headers,
            });
            setDrivers(res.data.data || res.data || []);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to fetch drivers' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    // Delete Handler
    const handleDeleteClick = (driver: Driver) => {
        setSelectedDriver(driver);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!selectedDriver) return;
        setDeleting(true);

        try {
            const headers = await getAuthHeaders();
            await axios.delete(`${backendUrl}/driver/delete/${selectedDriver.email}`, {
                headers,
            });

            Toast.show({ type: 'success', text1: 'Driver deleted successfully' });
            fetchDrivers();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.response?.data?.message || 'Failed to delete driver',
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
                <Text style={styles.loadingText}>Loading drivers...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Driver Management</Text>
                <Text style={styles.subtitle}>
                    Manage your official transport staff and vehicle details
                </Text>
            </View>

            {/* Drivers List */}
            <FlatList
                data={drivers}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-tie" size={80} color="#CBD5E1" />
                        <Text style={styles.emptyText}>
                            No drivers found.{'\n'}Tap + to add a new driver.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.driverCard}>
                        <View style={styles.driverRow}>
                            {/* Profile Image */}
                            <View style={styles.avatarContainer}>
                                {item.profileImage ? (
                                    <Image
                                        source={{ uri: item.profileImage }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <MaterialCommunityIcons name="account" size={32} color="#6366F1" />
                                    </View>
                                )}
                            </View>

                            {/* Driver Info */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.driverName}>{item.name}</Text>
                                <Text style={styles.driverId}>ID: {item._id.slice(-6)}</Text>

                                <View style={styles.contactInfo}>
                                    <View style={styles.contactRow}>
                                        <MaterialCommunityIcons name="email" size={14} color="#64748B" />
                                        <Text style={styles.contactText}>{item.email}</Text>
                                    </View>
                                    <View style={styles.contactRow}>
                                        <MaterialCommunityIcons name="phone" size={14} color="#64748B" />
                                        <Text style={styles.contactText}>{item.phone}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* License & Vehicle */}
                            <View style={styles.metaContainer}>
                                <Text style={styles.license}>{item.licenseNumber}</Text>
                                <View style={styles.vehicleBadge}>
                                    <Text style={styles.vehicleText}>{item.vehicleType}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push(`/admin/EditDriverPage?email=${item.email}`)}
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
                onPress={() => router.push('/admin/addDriverPage')}
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

                        <Text style={styles.modalTitle}>Delete Driver?</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure you want to delete{' '}
                            <Text style={{ fontWeight: 'bold' }}>{selectedDriver?.name}</Text>?
                        </Text>
                        <Text style={styles.modalWarning}>This action cannot be undone.</Text>

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
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
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
    driverCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { marginRight: 16 },
    avatar: { width: 56, height: 56, borderRadius: 999 },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        backgroundColor: '#E0E7FF',
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoContainer: { flex: 1 },
    driverName: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
    driverId: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    contactInfo: { marginTop: 8, gap: 4 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactText: { fontSize: 13, color: '#4B5563' },

    metaContainer: { alignItems: 'flex-end' },
    license: { fontSize: 13, fontWeight: '600', color: '#374151' },
    vehicleBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        marginTop: 8,
    },
    vehicleText: { color: '#6366F1', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },

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

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '88%', alignItems: 'center' },
    modalIcon: { marginBottom: 16 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
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

export default AdminDriverPage;