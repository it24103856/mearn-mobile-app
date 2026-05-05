import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { uploadFile } from '../../lib/supabase';
import { getAuthToken } from '../../lib/auth';

const AdminAddDriver = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        licenseNumber: '',
        vehicleType: '',
        description: '',
    });

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<any>(null);
    const [token, setToken] = useState<string>('');

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Fetch token on component mount
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const authToken = await getAuthToken();
                if (!authToken) {
                    Toast.show({ type: 'error', text1: 'Please login first' });
                    router.back();
                    return;
                }
                setToken(authToken);
            } catch (err) {
                Toast.show({ type: 'error', text1: 'Failed to get authentication' });
            }
        };
        fetchToken();
    }, [router]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const isValidEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Image Picker
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]) return;

        setPreview(result.assets[0].uri);
        setImageFile(result.assets[0]);
    };

    const handleSubmit = async () => {
        // Check if token exists
        if (!token) {
            Toast.show({ type: 'error', text1: 'Not authenticated. Please login again.' });
            return;
        }

        // Phone validation
        if (formData.phone.length !== 10) {
            Toast.show({ type: 'error', text1: 'Phone number must be exactly 10 digits!' });
            return;
        }

        // Email validation
        if (!formData.email.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter an email address' });
            return;
        }
        if (!isValidEmail(formData.email.trim())) {
            Toast.show({ type: 'error', text1: 'Please enter a valid email address' });
            return;
        }

        // License validation: must be exactly 6 digits
        if (!/^[0-9]{6}$/.test(formData.licenseNumber)) {
            Toast.show({ type: 'error', text1: 'License number must be exactly 6 digits' });
            return;
        }

        setLoading(true);
        try {
            let profileImageUrl = '';

            if (imageFile?.uri) {
                setUploading(true);
                profileImageUrl = await uploadFile(imageFile.uri, 'drivers');
            }

            const finalData = { ...formData, profileImage: profileImageUrl };

            await axios.post(`${backendUrl}/driver/create`, finalData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            Toast.show({ type: 'success', text1: 'Driver registered successfully!' });

            setTimeout(() => {
                router.push('/admin/adminDriverPage');
            }, 1500);
        } catch (error: any) {
            console.error("Add driver error:", error.response?.status, error.response?.data);
            
            if (error.response?.status === 401) {
                Toast.show({ type: 'error', text1: 'Unauthorized! You must be an admin to add drivers.' });
            } else if (error.response?.status === 403) {
                Toast.show({ type: 'error', text1: 'Access denied! Only admins can add drivers.' });
            } else {
                const errMsg = error.response?.data?.message || '';
                if (errMsg.includes('E11000') || errMsg.toLowerCase().includes('duplicate')) {
                    Toast.show({ type: 'error', text1: 'This email is already registered!' });
                } else {
                    Toast.show({ type: 'error', text1: errMsg || 'Registration failed' });
                }
            }
        } finally {
            setUploading(false);
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#4B5563" />
                </TouchableOpacity>
                <Text style={styles.title}>
                    Register <Text style={styles.highlight}>New Driver</Text>
                </Text>
            </View>

            <View style={styles.formCard}>
                {/* Profile Photo */}
                <View style={styles.photoSection}>
                    <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                        {preview ? (
                            <Image source={{ uri: preview }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <MaterialCommunityIcons name="account" size={50} color="#CBD5E1" />
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <MaterialCommunityIcons name="camera" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.photoHint}>Upload Driver Photo (Optional)</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="account" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Kamal Perera"
                            value={formData.name}
                            onChangeText={(t) => handleChange('name', t)}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="email" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="driver@example.com"
                            keyboardType="email-address"
                            value={formData.email}
                            onChangeText={(t) => handleChange('email', t)}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="phone" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="07xxxxxxxx"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={formData.phone}
                            onChangeText={(t) => handleChange('phone', t.replace(/\D/g, ''))}
                        />
                    </View>
                    {formData.phone.length > 0 && formData.phone.length < 10 && (
                        <Text style={styles.validationText}>
                            * Must be 10 digits (Current: {formData.phone.length})
                        </Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>License Number</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="card-account-details" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="123456"
                            value={formData.licenseNumber}
                            keyboardType="number-pad"
                            maxLength={6}
                            onChangeText={(t) => handleChange('licenseNumber', t.replace(/\D/g, ''))}
                        />
                    </View>
                    {formData.licenseNumber.length > 0 && formData.licenseNumber.length < 6 && (
                        <Text style={styles.validationText}>
                            * License number must be exactly 6 digits (Current: {formData.licenseNumber.length})
                        </Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Vehicle Type</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="car" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.input}
                            placeholder="Sedan, Van, SUV, etc."
                            value={formData.vehicleType}
                            onChangeText={(t) => handleChange('vehicleType', t)}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Residential Address</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        multiline
                        numberOfLines={3}
                        placeholder="Enter full address..."
                        value={formData.address}
                        onChangeText={(t) => handleChange('address', t)}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Driver Description / Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Experience, strengths, etc."
                        value={formData.description}
                        onChangeText={(t) => handleChange('description', t)}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save" size={22} color="white" />
                            <Text style={styles.submitText}>Register Driver</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
    backButton: { padding: 8 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    highlight: { color: '#F97316' },

    formCard: { backgroundColor: 'white', margin: 16, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },

    photoSection: { alignItems: 'center', marginBottom: 24 },
    photoContainer: { width: 130, height: 130, borderRadius: 999, overflow: 'hidden', borderWidth: 4, borderColor: '#F3F4F6', position: 'relative' },
    photo: { width: '100%', height: '100%', resizeMode: 'cover' },
    photoPlaceholder: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    cameraIcon: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#F97316', padding: 8, borderRadius: 999 },

    photoHint: { marginTop: 8, color: '#94A3B8', fontSize: 13 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1F2937' },
    textarea: { height: 100, textAlignVertical: 'top' },

    validationText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },

    submitButton: {
        backgroundColor: '#1F2937',
        padding: 18,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20,
    },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
});

export default AdminAddDriver;