import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Image,
    TextInput,
    Modal,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Destination {
    _id: string;
    name: string;
    city: string;
    district: string;
    province: string;
    description?: string;
    image?: string[];
}

const AdminDestinations = () => {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const router = useRouter();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    const fetchDestinations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/destinations/all`);
            setDestinations(res.data.data || []);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to fetch destinations' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDestinations();
    }, []);

    const handleDelete = (id: string) => {
        setSelectedId(id);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!selectedId) return;
        try {
            const token = ''; // Add your token logic
            await axios.delete(`${backendUrl}/destinations/delete/${selectedId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: 'success', text1: 'Destination deleted successfully' });
            fetchDestinations();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: error.response?.data?.message || 'Delete failed!' });
        } finally {
            setDeleteModalVisible(false);
            setSelectedId(null);
        }
    };

    const filteredDestinations = destinations.filter((loc) =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.district.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderDestination = ({ item }: { item: Destination }) => (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                {item.image && item.image.length > 0 ? (
                    <Image source={{ uri: item.image[0] }} style={styles.image} />
                ) : (
                    <View style={styles.noImage}>
                        <MaterialCommunityIcons name="image-off" size={40} color="#CBD5E1" />
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionOverlay}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(item._id)}
                    >
                        <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/admin/UpdateDestination?id=${item._id}`)}
                    >
                        <MaterialCommunityIcons name="pencil" size={18} color="#6366F1" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.locationRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#6366F1" />
                    <Text style={styles.location}>
                        {item.city}, {item.district}
                    </Text>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.footer}>
                    <View>
                        <Text style={styles.provinceLabel}>PROVINCE</Text>
                        <Text style={styles.province}>{item.province}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push(`/admin/UpdateDestination?id=${item._id}`)}
                    >
                        <Ionicons name="eye" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    Manage <Text style={styles.highlight}>Destinations</Text>
                </Text>
                <Text style={styles.count}>Total {destinations.length} destinations</Text>
            </View>

            {/* Search + Add Button */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search name, city or district..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/admin/adminCreateDestination')}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Syncing Data...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDestinations}
                    keyExtractor={(item) => item._id}
                    renderItem={renderDestination}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No destinations found</Text>
                        </View>
                    }
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="alert-circle" size={50} color="#EF4444" />
                        <Text style={styles.modalTitle}>Delete Destination?</Text>
                        <Text style={styles.modalSubtitle}>
                            This action cannot be undone.
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
                            >
                                <Text style={styles.confirmText}>Yes, Delete</Text>
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
    header: { padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    highlight: { color: '#6366F1' },
    count: { color: '#64748B', marginTop: 4, fontSize: 13 },

    searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: '#E5E7EB' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15 },

    addButton: {
        width: 52,
        height: 52,
        backgroundColor: '#6366F1',
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },

    listContent: { paddingHorizontal: 12, paddingBottom: 100 },
    row: { justifyContent: 'space-between' },

    card: {
        flex: 1,
        margin: 6,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
    imageContainer: { height: 180, position: 'relative' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    noImage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },

    actionOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'column',
        gap: 8,
        opacity: 0.9,
    },
    actionBtn: {
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },

    infoContainer: { padding: 16, flex: 1 },
    name: { fontSize: 17, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    location: { color: '#4B5563', fontSize: 13 },
    description: { color: '#64748B', fontSize: 13, lineHeight: 18, marginBottom: 12 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
    provinceLabel: { fontSize: 9, color: '#94A3B8', fontWeight: 'bold' },
    province: { fontSize: 12, fontWeight: '600', color: '#1F2937' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#94A3B8', fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', paddingTop: 100 },
    emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '85%', alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
    modalSubtitle: { color: '#6B7280', textAlign: 'center', marginVertical: 12 },
    modalButtons: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 20 },
    cancelBtn: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center' },
    confirmBtn: { flex: 1, padding: 16, backgroundColor: '#EF4444', borderRadius: 16, alignItems: 'center' },
    cancelText: { fontWeight: 'bold', color: '#4B5563' },
    confirmText: { fontWeight: 'bold', color: 'white' },
});

export default AdminDestinations;