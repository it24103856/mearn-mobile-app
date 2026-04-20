import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Contact {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
}

const AdminContactPage = () => {
    const navigation = useNavigation();
    const [contact, setContact] = useState<Contact | null>(null);
    const [formData, setFormData] = useState<Contact>({
        name: '',
        email: '',
        phone: '',
        address: '',
    });

    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Fetch Contact
    const fetchContact = async () => {
        try {
            const token = ''; // ← Add your token logic
            const res = await axios.get(`${backendUrl}/contact/get`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.data) {
                setContact(res.data.data);
                setFormData(res.data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    useEffect(() => {
        fetchContact();
    }, []);

    const handleChange = (field: keyof Contact, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = ''; // Add token
            const url = contact
                ? `${backendUrl}/contact/update/${contact._id}`
                : `${backendUrl}/contact/create`;
            const method = contact ? 'put' : 'post';

            const res = await axios({
                method,
                url,
                data: formData,
                headers: { Authorization: `Bearer ${token}` },
            });

            Toast.show({ type: 'success', text1: res.data.message || 'Contact saved successfully!' });
            setContact(res.data.data);
            setIsEditing(false);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.response?.data?.message || 'Failed to save contact',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!contact) return;
        setDeleting(true);
        try {
            const token = ''; // Add token
            await axios.delete(`${backendUrl}/contact/delete/${contact._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Toast.show({ type: 'success', text1: 'Contact deleted successfully!' });
            setContact(null);
            setFormData({ name: '', email: '', phone: '', address: '' });
            setDeleteModalVisible(false);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to delete contact' });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Toast />

            <View style={styles.header}>
                <Text style={styles.title}>
                    Contact <Text style={styles.highlight}>Management</Text>
                </Text>
                <Text style={styles.subtitle}>
                    Configure official contact details
                </Text>
            </View>

            <View style={styles.card}>
                {/* Header Bar */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                        {isEditing ? 'Update Information' : 'Official Business Details'}
                    </Text>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons
                            name={isEditing ? 'pencil' : 'account'}
                            size={28}
                            color="#6366F1"
                        />
                    </View>
                </View>

                {!isEditing && contact ? (
                    // View Mode
                    <View style={styles.viewMode}>
                        <InfoBlock icon="account" label="Full Name" value={contact.name} />
                        <InfoBlock icon="email" label="Email Address" value={contact.email} />
                        <InfoBlock icon="phone" label="Phone Number" value={contact.phone} />
                        <InfoBlock icon="map-marker" label="Office Address" value={contact.address} />

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setIsEditing(true)}
                            >
                                <MaterialCommunityIcons name="pencil" size={20} color="white" />
                                <Text style={styles.editText}>Edit Details</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => setDeleteModalVisible(true)}
                            >
                                <MaterialCommunityIcons name="trash-can" size={22} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // Edit / Create Mode
                    <View style={styles.form}>
                        <InputField
                            icon="account"
                            label="Full Name"
                            value={formData.name}
                            onChangeText={(text: string) => handleChange('name', text)}
                            placeholder="John Doe"
                        />
                        <InputField
                            icon="email"
                            label="Email Address"
                            value={formData.email}
                            onChangeText={(text: string) => handleChange('email', text)}
                            placeholder="admin@company.com"
                            keyboardType="email-address"
                        />
                        <InputField
                            icon="phone"
                            label="Phone Number"
                            value={formData.phone}
                            onChangeText={(text: string) => handleChange('phone', text)}
                            placeholder="+94 77 123 4567"
                            keyboardType="phone-pad"
                        />
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Office Address</Text>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                multiline
                                numberOfLines={4}
                                value={formData.address}
                                onChangeText={(text: string) => handleChange('address', text)}
                                placeholder="123 Galle Road, Colombo 03"
                            />
                        </View>

                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="content-save" size={20} color="white" />
                                        <Text style={styles.submitText}>
                                            {contact ? 'Update Contact' : 'Create Contact'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {isEditing && (
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setIsEditing(false)}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="trash-can" size={50} color="#EF4444" />
                        <Text style={styles.modalTitle}>Delete Contact?</Text>
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
                                onPress={handleDelete}
                                disabled={deleting}
                            >
                                <Text style={styles.confirmText}>
                                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

// Reusable Components
const InfoBlock = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoBlock}>
        <View style={styles.infoIcon}>
            <MaterialCommunityIcons name={icon as any} size={22} color="#6366F1" />
        </View>
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || 'Not Set'}</Text>
        </View>
    </View>
);

const InputField = ({ icon, label, ...props }: any) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name={icon} size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput style={styles.input} {...props} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD' },
    header: { padding: 20, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    highlight: { color: '#6366F1' },
    subtitle: { color: '#6B7280', marginTop: 4 },

    card: { backgroundColor: 'white', margin: 16, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 },
    cardHeader: { backgroundColor: '#1F2937', padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    iconCircle: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 16 },

    viewMode: { padding: 24 },
    infoBlock: { flexDirection: 'row', gap: 16, marginBottom: 20, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16 },
    infoIcon: { backgroundColor: 'white', padding: 12, borderRadius: 12 },
    infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
    infoValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },

    actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
    editButton: { flex: 1, backgroundColor: '#6366F1', padding: 16, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    editText: { color: 'white', fontWeight: 'bold' },
    deleteButton: { padding: 16, backgroundColor: '#FEE2E2', borderRadius: 999 },

    form: { padding: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    inputIcon: { paddingLeft: 16 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16 },
    textarea: { height: 100, textAlignVertical: 'top' },

    formActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    submitButton: { flex: 1, backgroundColor: '#6366F1', padding: 18, borderRadius: 999, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    submitText: { color: 'white', fontWeight: 'bold' },
    cancelButton: { padding: 18, backgroundColor: '#F3F4F6', borderRadius: 999, alignItems: 'center' },
    cancelText: { color: '#4B5563', fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '85%', alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
    modalSubtitle: { color: '#6B7280', textAlign: 'center', marginVertical: 12 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
    cancelBtn: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center' },
    confirmBtn: { flex: 1, padding: 16, backgroundColor: '#EF4444', borderRadius: 16, alignItems: 'center' },
    confirmText: { color: 'white', fontWeight: 'bold' },
});

export default AdminContactPage;