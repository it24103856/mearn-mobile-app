import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { uploadFile } from '../../lib/supabase';
import { getAuthHeaders } from '../../lib/auth';

const CATEGORY_OPTIONS = [
    { value: 'adventure', label: 'Adventure' },
    { value: 'wildlife', label: 'Wildlife' },
    { value: 'historical', label: 'Historical' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'beach', label: 'Beach' },
    { value: 'wellness', label: 'Wellness' },
    { value: 'eco', label: 'Eco / Nature' },
    { value: 'family', label: 'Family' },
];

const WEATHER_OPTIONS = [
    { value: 'sunny', label: '☀️ Sunny & Warm' },
    { value: 'tropical', label: '🌴 Tropical' },
    { value: 'humid', label: '💧 Humid' },
    { value: 'cool', label: '🍂 Cool & Crisp' },
    { value: 'dry', label: '🏜️ Hot & Dry' },
    { value: 'rainy', label: '🌧️ Rainy' },
];

const INTEREST_OPTIONS = [
    { value: 'hiking', label: '🥾 Hiking' },
    { value: 'surfing', label: '🏄 Surfing' },
    { value: 'nature_photography', label: '📷 Nature Photography' },
    { value: 'wildlife_spotting', label: '🦁 Wildlife Spotting' },
    { value: 'camping', label: '⛺ Camping' },
    { value: 'diving', label: '🤿 Diving' },
    { value: 'paddling_boats', label: '🚣 Paddling Boats' },
    { value: 'stargazing', label: '🔭 Stargazing' },
    { value: 'cycling', label: '🚴 Cycling' },
    { value: 'rock_climbing', label: '🧗 Rock Climbing' },
    { value: 'bird_watching', label: '🦜 Bird Watching' },
    { value: 'cultural_tours', label: '🏛️ Cultural Tours' },
];

const AdminAddPackage = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        price: '',
        no_of_days: '',
        min_group_size: 1,
        max_group_size: 20,
    });

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedWeather, setSelectedWeather] = useState<string[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const [allHotels, setAllHotels] = useState<any[]>([]);
    const [allDestinations, setAllDestinations] = useState<any[]>([]);
    const [selectedHotelIds, setSelectedHotelIds] = useState<string[]>([]);
    const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);

    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<any[]>([]);

    const [itineraries, setItineraries] = useState<any[]>([
        { day_no: 1, title: '', activities: [{ time: '', task: '' }] },
    ]);
    const [transport, setTransport] = useState<string[]>(['']);
    const [faqs, setFaqs] = useState<any[]>([{ question: '', answer: '' }]);
    const [travellerTips, setTravellerTips] = useState<any[]>([{ title: '', description: '' }]);

    // Fetch supporting data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = await getAuthHeaders();
                const [hotelsRes, destsRes] = await Promise.all([
                    axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/hotels/all`, { headers }),
                    axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/destinations/all`, { headers }),
                ]);
                setAllHotels(hotelsRes.data?.data || []);
                setAllDestinations(destsRes.data?.data || []);
            } catch {
                Toast.show({ type: 'error', text1: 'Failed to load hotels/destinations' });
            }
        };
        fetchData();
    }, []);

    // Load existing package if editing
    useEffect(() => {
        if (isEditing) {
            // Add your fetch package logic here (similar to web version)
        }
    }, [id, isEditing]);

    const toggleSelection = (setter: any, value: string) => {
        setter((prev: string[]) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (result.canceled) return;

        setUploading(true);
        const newPreviews: string[] = [];
        const newFiles: any[] = [];

        for (const asset of result.assets || []) {
            newPreviews.push(asset.uri);
            newFiles.push(asset);
        }

        setGalleryPreviews((prev) => [...prev, ...newPreviews]);
        setGalleryFiles((prev) => [...prev, ...newFiles]);
        setUploading(false);
    };

    const removeGalleryImage = (index: number) => {
        setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
        setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Dynamic Itinerary Handlers
    const addItineraryDay = () => {
        setItineraries((prev) => [
            ...prev,
            { day_no: prev.length + 1, title: '', activities: [{ time: '', task: '' }] },
        ]);
    };

    const removeItineraryDay = (index: number) => {
        setItineraries((prev) => prev.filter((_, i) => i !== index));
    };

    // Submit
    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.price) {
            return Toast.show({ type: 'error', text1: 'Please fill required fields' });
        }

        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            let galleryUrls: string[] = [];

            // Upload new images
            for (const file of galleryFiles) {
                const url = await uploadFile(file.uri, 'packages');
                galleryUrls.push(url);
            }

            const payload = {
                ...formData,
                categories: selectedCategories,
                weather: selectedWeather,
                interests: selectedInterests,
                gallery: galleryUrls,
                itineraries,
                transport: transport.filter((t) => t.trim()),
                faqs: faqs.filter((f) => f.question.trim()),
                traveller_tips: travellerTips.filter((t) => t.title.trim()),
                included_hotels: selectedHotelIds,
                destinations: selectedDestinationIds,
            };

            if (isEditing) {
                await axios.put(`${process.env.EXPO_PUBLIC_BACKEND_URL}/packages/update/${id}`, payload, { headers });
                Toast.show({ type: 'success', text1: 'Package updated!' });
            } else {
                await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/packages/create`, payload, { headers });
                Toast.show({ type: 'success', text1: 'Package created!' });
            }

            router.back();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Toast />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#4B5563" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? 'Edit Package' : 'Create New Package'}</Text>
            </View>

            {/* Basic Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <TextInput style={styles.input} placeholder="Package Title *" value={formData.title} onChangeText={(t) => setFormData({ ...formData, title: t })} />
                <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Description *" value={formData.description} onChangeText={(t) => setFormData({ ...formData, description: t })} />
                {/* Add other basic fields similarly */}
            </View>

            {/* Categories, Weather, Interests - Chip Style */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.chipContainer}>
                    {CATEGORY_OPTIONS.map((cat) => (
                        <TouchableOpacity
                            key={cat.value}
                            style={[styles.chip, selectedCategories.includes(cat.value) && styles.chipActive]}
                            onPress={() => toggleSelection(setSelectedCategories, cat.value)}
                        >
                            <Text style={[styles.chipText, selectedCategories.includes(cat.value) && styles.chipTextActive]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Gallery */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gallery</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
                    <MaterialCommunityIcons name="cloud-upload" size={40} color="#6366F1" />
                    <Text style={styles.uploadText}>Add Photos</Text>
                </TouchableOpacity>

                <FlatList
                    horizontal
                    data={galleryPreviews}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item, index }) => (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: item }} style={styles.previewImage} />
                            <TouchableOpacity style={styles.removePreview} onPress={() => removeGalleryImage(index)}>
                                <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>{isEditing ? 'UPDATE PACKAGE' : 'CREATE PACKAGE'}</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    section: { backgroundColor: 'white', margin: 16, padding: 20, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' },
    input: { backgroundColor: '#F1F5F9', borderRadius: 16, padding: 16, marginBottom: 12, fontSize: 16 },
    textarea: { height: 120, textAlignVertical: 'top' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: 'white' },
    chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    chipText: { fontWeight: 'bold', color: '#64748B' },
    chipTextActive: { color: 'white' },
    uploadBox: { height: 140, borderWidth: 2, borderStyle: 'dashed', borderColor: '#6366F1', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    uploadText: { marginTop: 8, color: '#6366F1', fontWeight: '600' },
    previewContainer: { width: 100, height: 100, marginRight: 12, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removePreview: { position: 'absolute', top: 6, right: 6 },
    submitButton: { backgroundColor: '#1F2937', margin: 16, padding: 20, borderRadius: 999, alignItems: 'center' },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default AdminAddPackage;