import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    StyleSheet,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { getAuthHeaders } from '../../lib/auth';

const { width } = Dimensions.get('window');

interface Package {
    _id: string;
    title: string;
    description?: string;
    location: string;
    no_of_days: number;
    price: number;
    categories?: string[];
    gallery?: string[];
}

interface StatItem {
    pkg: Package;
    count?: number;
    avg?: string;
}

const AdminPackagePage = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // Search & Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDays, setSelectedDays] = useState('');

    // Stats
    const [mostViewed, setMostViewed] = useState<StatItem[]>([]);
    const [mostBooked, setMostBooked] = useState<StatItem[]>([]);
    const [mostRated, setMostRated] = useState<StatItem[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    const router = useRouter();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Fetch Packages
    const fetchPackages = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${backendUrl}/packages/all`, {
                headers,
            });
            setPackages(res.data.data || res.data || []);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to fetch packages' });
        } finally {
            setLoading(false);
        }
    };

    // Fetch Stats (Most Viewed, Booked, Rated)
    const fetchStats = async () => {
        try {
            const headers = await getAuthHeaders();
            const [bookingsRes, pkgsRes] = await Promise.all([
                axios.get(`${backendUrl}/bookings/all`, { headers }),
                axios.get(`${backendUrl}/packages/all`, { headers }),
            ]);

            const bookings = bookingsRes.data?.data || [];
            const pkgs = pkgsRes.data?.data || [];

            const pkgMap: any = {};
            pkgs.forEach((p: any) => { pkgMap[p._id] = p; });

            // Not available from current backend routes
            const topViewed: StatItem[] = [];

            // Most Booked
            const bookingCounts: any = {};
            bookings.forEach((b: any) => {
                const pid = b.packageId?._id || b.packageId;
                if (pid) bookingCounts[pid] = (bookingCounts[pid] || 0) + 1;
            });
            const topBooked = Object.entries(bookingCounts)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 3)
                .map(([pid, count]: any) => ({ pkg: pkgMap[pid], count }))
                .filter((x: any) => x.pkg);

            const topRated: StatItem[] = [];

            setMostViewed(topViewed);
            setMostBooked(topBooked);
            setMostRated(topRated);
        } catch (err) {
            setMostViewed([]);
            setMostBooked([]);
            setMostRated([]);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
        fetchStats();
    }, []);

    // Filters
    const allLocations = [...new Set(packages.map(p => p.location).filter(Boolean))];
    const allCategories = [...new Set(packages.flatMap(p => p.categories || []))];
    const dayOptions = ['1-3', '4-5', '6-7', '8+'];

    const matchesDays = (pkg: Package) => {
        if (!selectedDays) return true;
        const d = pkg.no_of_days;
        if (selectedDays === '1-3') return d >= 1 && d <= 3;
        if (selectedDays === '4-5') return d >= 4 && d <= 5;
        if (selectedDays === '6-7') return d >= 6 && d <= 7;
        if (selectedDays === '8+') return d >= 8;
        return true;
    };

    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const matchesSearch =
                pkg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.location?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLocation = !selectedLocation || pkg.location === selectedLocation;
            const matchesCategory = !selectedCategory || pkg.categories?.includes(selectedCategory);
            return matchesSearch && matchesLocation && matchesCategory && matchesDays(pkg);
        });
    }, [packages, searchTerm, selectedLocation, selectedCategory, selectedDays]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedLocation('');
        setSelectedCategory('');
        setSelectedDays('');
    };

    const hasFilters = searchTerm || selectedLocation || selectedCategory || selectedDays;

    const handleDelete = (pkg: Package) => {
        setSelectedPackage(pkg);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!selectedPackage) return;
        setDeleting(true);
        try {
            const headers = await getAuthHeaders();
            await axios.delete(`${backendUrl}/packages/delete/${selectedPackage._id}`, {
                headers,
            });
            Toast.show({ type: 'success', text1: 'Package deleted successfully' });
            fetchPackages();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to delete' });
        } finally {
            setDeleting(false);
            setDeleteModalVisible(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading packages...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Package Management</Text>
                <Text style={styles.subtitle}>Manage your tour packages</Text>
            </View>

            {/* Stats Section */}
            {statsLoading ? (
                <View style={styles.statsGrid}>
                    {[1, 2, 3].map(i => <View key={i} style={styles.statSkeleton} />)}
                </View>
            ) : (
                <View style={styles.statsGrid}>
                    {/* Most Viewed */}
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="eye" size={20} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.statTitle}>Most Viewed</Text>
                                <Text style={styles.statSubtitle}>By page views</Text>
                            </View>
                        </View>
                        {mostViewed.map((item, i) => (
                            <View key={item.pkg._id} style={styles.statRow}>
                                <Text style={[styles.rank, i === 0 && styles.rankGold]}>{i + 1}</Text>
                                {item.pkg.gallery?.[0] ? (
                                    <Image source={{ uri: item.pkg.gallery[0] }} style={styles.miniImage} />
                                ) : (
                                    <View style={styles.miniImagePlaceholder}><MaterialCommunityIcons name="briefcase-variant" size={18} color="#9CA3AF" /></View>
                                )}
                                <View style={styles.statInfo}>
                                    <Text style={styles.pkgTitle} numberOfLines={1}>{item.pkg.title}</Text>
                                    <Text style={styles.pkgLocation}>{item.pkg.location}</Text>
                                </View>
                                <Text style={styles.statCount}>{item.count} views</Text>
                            </View>
                        ))}
                    </View>

                    {/* Most Booked & Most Rated - Similar structure */}
                    {/* (Add Most Booked and Most Rated similarly) */}
                </View>
            )}

            {/* Search & Filters */}
            <View style={styles.filterContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search packages..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        style={styles.searchInput}
                    />
                </View>

                {/* Location, Category, Days Selects using Picker or custom dropdowns */}
                {/* For simplicity, using TextInput + onPress with Alert or Modal in real app */}

                {hasFilters && (
                    <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                        <Text style={styles.clearText}>Clear Filters</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Packages List */}
            <FlatList
                data={filteredPackages}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                renderItem={({ item }) => {
                    const bookingCount = mostBooked.find(b => b.pkg._id === item._id)?.count || 0;

                    return (
                        <View style={styles.packageCard}>
                            <View style={styles.packageRow}>
                                {item.gallery?.[0] ? (
                                    <Image source={{ uri: item.gallery[0] }} style={styles.packageImage} />
                                ) : (
                                    <View style={styles.packageImagePlaceholder}>
                                        <MaterialCommunityIcons name="briefcase-variant" size={32} color="#D1D5DB" />
                                    </View>
                                )}

                                <View style={styles.packageInfo}>
                                    <Text style={styles.packageTitle}>{item.title}</Text>
                                    <Text style={styles.packageDesc} numberOfLines={2}>{item.description}</Text>

                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaText}>
                                            📍 {item.location}
                                        </Text>
                                        <Text style={styles.metaText}>
                                            ⏱ {item.no_of_days} Days
                                        </Text>
                                    </View>

                                    <Text style={styles.price}>
                                        LKR {item.price?.toLocaleString()} <Text style={styles.perPerson}>/ person</Text>
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    onPress={() => router.push(`/admin/editPackagePage?id=${item._id}`)}
                                >
                                    <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDelete(item)}
                                >
                                    <MaterialCommunityIcons name="trash-can" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {hasFilters ? 'No packages match your filters.' : 'No packages found.'}
                    </Text>
                }
            />

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/admin/addPackagePage')}
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
                        <Text style={styles.modalTitle}>Delete Package?</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure you want to delete{"\n"}
                            <Text style={{ fontWeight: 'bold' }}>{selectedPackage?.title}</Text>?
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmDeleteBtn}
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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
    header: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    subtitle: { color: '#6B7280', marginTop: 4 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, flex: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statTitle: { fontWeight: 'bold', color: '#1F2937' },
    statSubtitle: { fontSize: 12, color: '#9CA3AF' },
    statRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    rank: { width: 24, textAlign: 'center', fontWeight: 'bold', color: '#6B7280' },
    rankGold: { color: '#F59E0B' },
    miniImage: { width: 40, height: 40, borderRadius: 8 },
    miniImagePlaceholder: { width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    statInfo: { flex: 1, marginLeft: 10 },
    pkgTitle: { fontWeight: '600', fontSize: 13 },
    pkgLocation: { fontSize: 11, color: '#9CA3AF' },
    statCount: { fontWeight: 'bold', color: '#3B82F6', fontSize: 12 },
    filterContainer: { marginBottom: 16 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#E5E7EB' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15 },
    clearBtn: { marginTop: 10, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EEF2FF', borderRadius: 999 },
    clearText: { color: '#4338CA', fontWeight: '600', fontSize: 12 },
    packageCard: { backgroundColor: 'white', borderRadius: 20, marginBottom: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    packageRow: { flexDirection: 'row', gap: 16 },
    packageImage: { width: 80, height: 80, borderRadius: 12 },
    packageImagePlaceholder: { width: 80, height: 80, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    packageInfo: { flex: 1 },
    packageTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    packageDesc: { color: '#6B7280', fontSize: 13, marginVertical: 4 },
    metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
    metaText: { color: '#4B5563', fontSize: 13 },
    price: { fontSize: 17, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
    perPerson: { fontSize: 12, color: '#9CA3AF' },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
    editBtn: { padding: 10, backgroundColor: '#EFF6FF', borderRadius: 12 },
    deleteBtn: { padding: 10, backgroundColor: '#FEE2E2', borderRadius: 12 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 64,
        height: 64,
        backgroundColor: '#1F2937',
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '85%', alignItems: 'center' },
    modalIcon: { marginBottom: 16 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
    modalSubtitle: { textAlign: 'center', color: '#6B7280', marginVertical: 12 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center' },
    confirmDeleteBtn: { flex: 1, padding: 16, backgroundColor: '#EF4444', borderRadius: 16, alignItems: 'center' },
    cancelText: { fontWeight: 'bold', color: '#4B5563' },
    confirmText: { fontWeight: 'bold', color: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#6B7280', fontSize: 16 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
    statSkeleton: { height: 200, backgroundColor: '#E5E7EB', borderRadius: 20 },
});

export default AdminPackagePage;