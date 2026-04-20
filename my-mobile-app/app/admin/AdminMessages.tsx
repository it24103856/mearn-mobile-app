import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuthHeaders } from '../../lib/auth';

const { width } = Dimensions.get('window');

interface Message {
    _id: string;
    firstName?: string;
    customerName?: string;
    customerEmail?: string;
    subject?: string;
    message: string;
    createdAt: string;
    adminReply?: string;
}

const AdminMessages = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const navigation = useNavigation();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Fetch Messages
    const fetchMessages = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${backendUrl}/contact/messages`, {
                headers,
            });

            setMessages(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
            console.error(err);
            Toast.show({ type: 'error', text1: 'Failed to load messages!' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Send Reply
    const handleReply = async () => {
        if (!replyText.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter a reply!' });
            return;
        }

        setIsSending(true);
        try {
            const headers = await getAuthHeaders();
            await axios.put(
                `${backendUrl}/contact/reply-message/${selectedMsg?._id}`,
                { adminReply: replyText },
                { headers }
            );

            Toast.show({ type: 'success', text1: 'Reply sent successfully!' });
            setReplyText('');
            setSelectedMsg(null);
            fetchMessages();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to send reply' });
        } finally {
            setIsSending(false);
        }
    };

    // Delete Message
    const handleDelete = (id: string) => {
        Alert.alert(
            'Are you sure?',
            'This message will be permanently deleted!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const deleteToast = 'deleting';
                        try {
                            const headers = await getAuthHeaders();
                            await axios.delete(`${backendUrl}/contact/delete-message/${id}`, {
                                headers,
                            });

                            Toast.show({ type: 'success', text1: 'Message deleted successfully!' });
                            setMessages((prev) => prev.filter((msg) => msg._id !== id));
                        } catch (err) {
                            Toast.show({ type: 'error', text1: 'Could not delete message.' });
                        }
                    },
                },
            ]
        );
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => (
        <View style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
            <View style={styles.dateCell}>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.customerCell}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(item.firstName || item.customerName || 'C').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View>
                    <Text style={styles.customerName}>
                        {item.firstName || item.customerName || 'Unknown'}
                    </Text>
                    <Text style={styles.email}>{item.customerEmail || 'No Email'}</Text>
                </View>
            </View>

            <Text style={styles.subject} numberOfLines={1}>
                {item.subject || 'No Subject'}
            </Text>

            <View style={styles.statusCell}>
                {item.adminReply ? (
                    <View style={styles.repliedBadge}>
                        <Text style={styles.repliedText}>Replied</Text>
                    </View>
                ) : (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                )}
            </View>

            <View style={styles.actionCell}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setSelectedMsg(item)}
                >
                    <MaterialCommunityIcons name="eye" size={20} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item._id)}
                >
                    <MaterialCommunityIcons name="trash-can" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Toast />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="email" size={28} color="white" />
                    </View>
                    <View>
                        <Text style={styles.title}>Customer Inquiries</Text>
                        <Text style={styles.subtitle}>Manage and respond to messages</Text>
                    </View>
                </View>

                <View style={styles.totalContainer}>
                    <View style={styles.dot} />
                    <Text style={styles.totalLabel}>Total Messages</Text>
                    <Text style={styles.totalCount}>{messages.length}</Text>
                </View>
            </View>

            {/* Messages List */}
            <View style={styles.tableContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                ) : messages.length > 0 ? (
                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item._id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="email-outline" size={80} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No messages found</Text>
                    </View>
                )}
            </View>

            {/* Reply Modal */}
            <Modal
                visible={!!selectedMsg}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setSelectedMsg(null);
                    setReplyText('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Inquiry Details</Text>
                                <Text style={styles.modalSubtitle}>
                                    From: {selectedMsg?.firstName || selectedMsg?.customerName}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedMsg(null);
                                    setReplyText('');
                                }}
                            >
                                <Ionicons name="close" size={28} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.label}>Subject</Text>
                            <Text style={styles.subjectText}>{selectedMsg?.subject}</Text>

                            <Text style={styles.label}>Message</Text>
                            <View style={styles.messageBox}>
                                <Text style={styles.messageText}>{selectedMsg?.message}</Text>
                                <Text style={styles.dateReceived}>
                                    Received: {selectedMsg?.createdAt ? new Date(selectedMsg.createdAt).toLocaleString() : ''}
                                </Text>
                            </View>

                            <Text style={styles.label}>Your Response</Text>
                            {selectedMsg?.adminReply ? (
                                <View style={styles.repliedBox}>
                                    <Text style={styles.repliedContent}>{selectedMsg.adminReply}</Text>
                                </View>
                            ) : (
                                <>
                                    <TextInput
                                        style={styles.replyInput}
                                        multiline
                                        placeholder="Write your reply here..."
                                        value={replyText}
                                        onChangeText={setReplyText}
                                    />
                                    <TouchableOpacity
                                        style={styles.sendButton}
                                        onPress={handleReply}
                                        disabled={isSending}
                                    >
                                        {isSending ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="send" size={20} color="white" />
                                                <Text style={styles.sendButtonText}>Send Reply</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconContainer: { backgroundColor: '#6366F1', padding: 12, borderRadius: 16 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
    subtitle: { color: '#64748B', fontSize: 14 },
    totalContainer: { alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
    dot: { width: 8, height: 8, backgroundColor: '#22C55E', borderRadius: 999, alignSelf: 'center', marginBottom: 4 },
    totalLabel: { fontSize: 12, color: '#64748B' },
    totalCount: { fontSize: 24, fontWeight: 'bold', color: '#6366F1' },

    tableContainer: { flex: 1, paddingHorizontal: 16 },
    listContent: { paddingTop: 10, paddingBottom: 100 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    evenRow: { backgroundColor: '#FFFFFF' },
    oddRow: { backgroundColor: '#F8FAFC' },

    dateCell: { width: 90 },
    dateText: { fontSize: 13, color: '#64748B' },

    customerCell: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    customerName: { fontWeight: '600', color: '#1F2937' },
    email: { fontSize: 12, color: '#6366F1' },

    subject: { flex: 1.3, fontSize: 14, color: '#374151', paddingRight: 8 },
    statusCell: { width: 100, alignItems: 'center' },
    repliedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
    repliedText: { color: '#16A34A', fontSize: 12, fontWeight: 'bold' },
    pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
    pendingText: { color: '#D97706', fontSize: 12, fontWeight: 'bold' },

    actionCell: { flexDirection: 'row', gap: 8 },
    actionButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#64748B' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 18, color: '#94A3B8', marginTop: 16 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: width * 0.92, backgroundColor: 'white', borderRadius: 28, overflow: 'hidden', maxHeight: '85%' },
    modalHeader: { backgroundColor: '#6366F1', padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    modalSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },

    modalBody: { padding: 24 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
    subjectText: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 20 },
    messageBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, marginBottom: 24 },
    messageText: { fontSize: 16, lineHeight: 24, color: '#334155' },
    dateReceived: { marginTop: 12, fontSize: 12, color: '#94A3B8' },

    repliedBox: { backgroundColor: '#F0FDF4', padding: 20, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: '#4ADE80' },
    repliedContent: { color: '#166534', fontStyle: 'italic' },

    replyInput: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, minHeight: 160, fontSize: 16, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
    sendButton: { backgroundColor: '#6366F1', padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 10 },
    sendButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default AdminMessages;