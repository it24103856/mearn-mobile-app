import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { getAuthHeaders } from '../../lib/auth';

interface Feedback {
    _id: string;
    feedback: string;
    rating: number;
    category: string;
    createdAt: string;
    userId?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        image?: string;
    };
}

interface Stats {
    rating?: Array<{ _id: number; count: number }>;
    category?: Array<{ _id: string; count: number }>;
}

const COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#F43F5E'];

const AdminFeedback = () => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ category: '', rating: '' });

    const navigation = useNavigation<any>();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const headers = await getAuthHeaders();
            const config = { headers };

            const [fbRes, statsRes] = await Promise.all([
                axios.get(`${backendUrl}/feedback/get-all?category=${filters.category}&rating=${filters.rating}`, config),
                axios.get(`${backendUrl}/feedback/stats`, config),
            ]);

            setFeedbacks(fbRes.data.feedbacks || []);

            if (statsRes.data.success) {
                const rawStats = statsRes.data.stats;
                if (rawStats?.category) {
                    rawStats.category = rawStats.category.map((item: any) => ({
                        ...item,
                        _id: item._id?.toLowerCase() === 'driverse' ? 'drivers' : item._id,
                    }));
                }
                setStats(rawStats);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Data synchronization failed.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleDelete = (id: string) => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to permanently delete this feedback?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            await axios.delete(`${backendUrl}/feedback/delete/${id}`, {
                                headers,
                            });
                            Toast.show({ type: 'success', text1: 'Record purged' });
                            fetchData();
                        } catch {
                            Toast.show({ type: 'error', text1: 'Delete failed' });
                        }
                    },
                },
            ]
        );
    };

    const ratingChartData = stats?.rating?.map(item => ({
        name: `${item._id} Star`,
        count: item.count,
    })) || [];

    const categoryChartData = stats?.category?.map((item, index) => ({
        x: item._id,
        y: item.count,
        fill: COLORS[index % COLORS.length],
    })) || [];

    const maxRatingCount = Math.max(...ratingChartData.map(item => item.count), 1);
    const totalCategoryCount = categoryChartData.reduce((sum, item) => sum + item.y, 0);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Feedback <Text style={styles.highlight}>Intelligence</Text></Text>
                    <Text style={styles.subtitle}>Advanced analytics for customer satisfaction</Text>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <View style={styles.selectContainer}>
                    <MaterialCommunityIcons name="filter" size={18} color="#6366F1" />
                    <Picker
                        style={styles.select}
                        selectedValue={filters.category}
                        onValueChange={(value: string) => setFilters({ ...filters, category: value })}
                    >
                        <Picker.Item label="All Services" value="" />
                        <Picker.Item label="Vehicles" value="Vehicles" />
                        <Picker.Item label="Drivers" value="drivers" />
                    </Picker>
                </View>

                <View style={styles.selectContainer}>
                    <MaterialCommunityIcons name="star" size={18} color="#6366F1" />
                    <Picker
                        style={styles.select}
                        selectedValue={filters.rating}
                        onValueChange={(value: string) => setFilters({ ...filters, rating: value })}
                    >
                        <Picker.Item label="All Ratings" value="" />
                        <Picker.Item label="5 Stars" value="5" />
                        <Picker.Item label="4 Stars" value="4" />
                        <Picker.Item label="3 Stars" value="3" />
                        <Picker.Item label="2 Stars" value="2" />
                        <Picker.Item label="1 Star" value="1" />
                    </Picker>
                </View>
            </View>

            {/* Charts */}
            <View style={styles.chartsGrid}>
                {/* Rating Bar Chart */}
                <View style={[styles.chartCard, { flex: 2 }]}>
                    <View style={styles.chartHeader}>
                        <MaterialCommunityIcons name="chart-bar" size={20} color="#6366F1" />
                        <Text style={styles.chartTitle}>Rating Distribution</Text>
                    </View>
                    <View style={styles.chartBody}>
                        {ratingChartData.map((item) => (
                            <View key={item.name} style={styles.barRow}>
                                <Text style={styles.barLabel}>{item.name}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${(item.count / maxRatingCount) * 100}%` }]} />
                                </View>
                                <Text style={styles.barValue}>{item.count}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Category Pie Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <MaterialCommunityIcons name="chart-pie" size={20} color="#6366F1" />
                        <Text style={styles.chartTitle}>Category Share</Text>
                    </View>
                    <View style={styles.legendList}>
                        {categoryChartData.map((item) => (
                            <View key={item.x} style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: item.fill }]} />
                                <Text style={styles.legendName}>{item.x}</Text>
                                <Text style={styles.legendPercent}>
                                    {totalCategoryCount ? `${Math.round((item.y / totalCategoryCount) * 100)}%` : '0%'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Feedback List */}
            <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableTitle}>Review Archive</Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#6366F1" style={{ margin: 40 }} />
                ) : (
                    <FlatList
                        data={feedbacks}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <View style={styles.feedbackRow}>
                                {/* User Info */}
                                <View style={styles.userSection}>
                                    {item.userId?.image ? (
                                        <Image source={{ uri: item.userId.image }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatarFallback}>
                                            <Text style={styles.avatarText}>
                                                {(item.userId?.firstName || 'U').charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View>
                                        <Text style={styles.userName}>
                                            {item.userId?.firstName} {item.userId?.lastName}
                                        </Text>
                                        <Text style={styles.userEmail}>{item.userId?.email}</Text>
                                    </View>
                                </View>

                                {/* Feedback */}
                                <Text style={styles.feedbackText} numberOfLines={2}>
                                    "{item.feedback}"
                                </Text>

                                {/* Rating & Category */}
                                <View style={styles.metricSection}>
                                    <View style={styles.stars}>
                                        {[...Array(item.rating)].map((_, i) => (
                                            <Ionicons key={i} name="star" size={14} color="#6366F1" />
                                        ))}
                                    </View>
                                    <Text style={styles.categoryBadge}>
                                        {(item.category?.toLowerCase() === 'driverse' ? 'drivers' : item.category) || 'Other'}
                                    </Text>
                                </View>

                                {/* Delete */}
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDelete(item._id)}
                                >
                                    <MaterialCommunityIcons name="trash-can" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No feedback found for selected filters.</Text>
                        }
                    />
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD', padding: 16 },
    header: { marginBottom: 20 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1F2937' },
    highlight: { color: '#6366F1' },
    subtitle: { color: '#6B7280', marginTop: 4 },

    filterContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    selectContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: '#E5E7EB' },
    select: { flex: 1, marginLeft: 8 },

    chartsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    chartCard: { backgroundColor: 'white', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
    chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    chartTitle: { fontWeight: 'bold', color: '#1F2937' },
    chartBody: { gap: 12, paddingTop: 8 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    barLabel: { width: 56, fontSize: 11, fontWeight: '700', color: '#475569' },
    barTrack: { flex: 1, height: 10, backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 999 },
    barValue: { width: 24, textAlign: 'right', fontWeight: '700', color: '#334155' },
    legendList: { gap: 10, paddingTop: 6 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 999 },
    legendName: { flex: 1, color: '#475569', fontWeight: '600' },
    legendPercent: { color: '#1F2937', fontWeight: '800' },

    tableCard: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12 },
    tableHeader: { padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    tableTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },

    feedbackRow: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 12 },
    userSection: { flexDirection: 'row', alignItems: 'center', gap: 12, width: 160 },
    avatar: { width: 44, height: 44, borderRadius: 999 },
    avatarFallback: { width: 44, height: 44, backgroundColor: '#6366F1', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    userName: { fontWeight: '600' },
    userEmail: { fontSize: 12, color: '#64748B' },

    feedbackText: { flex: 1, color: '#374151', fontSize: 14, lineHeight: 20 },
    metricSection: { alignItems: 'center', gap: 6 },
    stars: { flexDirection: 'row' },
    categoryBadge: { fontSize: 11, backgroundColor: '#E0E7FF', color: '#6366F1', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, fontWeight: 'bold' },

    deleteBtn: { padding: 10, backgroundColor: '#FEE2E2', borderRadius: 12 },

    emptyText: { textAlign: 'center', color: '#94A3B8', padding: 40, fontSize: 16 },
});

export default AdminFeedback;