import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { uploadFile } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker'; // Add this for image selection

// Sri Lanka Data (same as web)
const SRI_LANKA_DATA: any = {};

const AdminCreateDestination = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        province: '',
        district: '',
        city: '',
        image: [] as string[],
    });

    const handleChange = (field: string, value: string) => {
        if (field === 'province') {
            setFormData({ ...formData, province: value, district: '', city: '' });
        } else if (field === 'district') {
            setFormData({ ...formData, district: value, city: '' });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    // Image Picker + Upload
    const pickAndUploadImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]) return;

        setUploading(true);
        try {
            const imageUrl = await uploadFile(result.assets[0].uri, 'destinations');

            setFormData((prev) => ({ ...prev, image: [...prev.image, imageUrl] }));
            Toast.show({ type: 'success', text1: 'Image added!' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Upload failed!' });
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            image: prev.image.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (formData.image.length === 0) {
            return Toast.show({ type: 'error', text1: 'Upload at least one image!' });
        }

        setLoading(true);
        try {
            const token = ''; // ← Add your token logic
            await axios.post(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/destinations/create`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Toast.show({ type: 'success', text1: 'Destination created successfully!' });
            navigation.goBack();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.response?.data?.message || 'Error saving destination',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#4B5563" />
                    <Text style={styles.backText}>Back to List</Text>
                </TouchableOpacity>
                <Text style={styles.title}>
                    Add <Text style={styles.highlight}>Destination</Text>
                </Text>
            </View>

            <View style={styles.formCard}>
                {/* Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Destination Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Sigiriya Rock Fortress"
                        value={formData.name}
                        onChangeText={(text) => handleChange('name', text)}
                    />
                </View>

                {/* Location Selects */}
                <View style={styles.row}>
                    <View style={styles.half}>
                        <Text style={styles.label}>Province</Text>
                        <TouchableOpacity style={styles.select} onPress={() => { /* Use Picker Modal */ }}>
                            <Text style={styles.selectText}>
                                {formData.province || 'Select Province'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.half}>
                        <Text style={styles.label}>District</Text>
                        <TouchableOpacity style={styles.select} disabled={!formData.province}>
                            <Text style={styles.selectText}>
                                {formData.district || 'Select District'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>
                    <TouchableOpacity style={styles.select} disabled={!formData.district}>
                        <Text style={styles.selectText}>
                            {formData.city || 'Select City'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        multiline
                        numberOfLines={5}
                        placeholder="Describe this destination..."
                        value={formData.description}
                        onChangeText={(text) => handleChange('description', text)}
                    />
                </View>

                {/* Images */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Images</Text>

                    <TouchableOpacity style={styles.uploadBox} onPress={pickAndUploadImage} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator color="#C8813A" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="cloud-upload" size={32} color="#C8813A" />
                                <Text style={styles.uploadText}>Upload Image</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.imageGrid}>
                        {formData.image.map((url, index) => (
                            <View key={index} style={styles.imagePreviewContainer}>
                                <Image source={{ uri: url }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => removeImage(index)}
                                >
                                    <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading || uploading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitText}>Create Destination</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backText: { fontSize: 16, color: '#4B5563', fontWeight: '600' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginLeft: 'auto' },
    highlight: { color: '#C8813A' },

    formCard: { backgroundColor: 'white', margin: 16, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, fontSize: 16 },
    textarea: { height: 120, textAlignVertical: 'top' },

    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },

    select: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, justifyContent: 'center' },
    selectText: { color: '#4B5563', fontSize: 16 },

    uploadBox: {
        height: 120,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#C8813A',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadText: { marginTop: 8, color: '#C8813A', fontWeight: '600' },

    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    imagePreviewContainer: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeBtn: { position: 'absolute', top: 6, right: 6 },

    submitButton: {
        backgroundColor: '#C8813A',
        padding: 18,
        borderRadius: 999,
        alignItems: 'center',
        marginTop: 20,
    },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
});

export default AdminCreateDestination;