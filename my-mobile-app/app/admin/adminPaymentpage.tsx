import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, FlatList, Dimensions, Image, Linking } from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { Circle } from 'react-native-svg';
import { getAuthHeaders } from '../../lib/auth';

const { width } = Dimensions.get('window');

const STATUS_COLORS: { [key: string]: string } = {
    COMPLETED: '#10b981',
    PROCESSING: '#f59e0b',
    PENDING: '#6366F1',
    FAILED: '#ef4444',
    CANCEL_REQUESTED: '#8b5cf6',
    REFUNDED: '#06b6d4',
};

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toUpperStatus = (status?: string) => (status || 'pending').toUpperCase();
const toLowerStatus = (status?: string) => (status || 'pending').toLowerCase();
const formatStatusLabel = (status?: string) => toUpperStatus(status).replace(/_/g, ' ');
const getReferenceId = (payment: any) => payment?.transactionId || payment?.bookingId || payment?._id || 'N/A';
const formatShortId = (value: any, size = 8) => {
    const text = String(value || 'N/A');
    return text.length > size ? text.slice(-size) : text;
};

const STATUS_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Cancel Requested', value: 'cancel_requested' },
];

const METHOD_FILTERS = [
    { label: 'All Methods', value: 'all' },
    { label: 'Card', value: 'card' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Crypto', value: 'crypto' },
];

const AdminPaymentPage = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMethod, setFilterMethod] = useState('all');
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusConfirmModal, setStatusConfirmModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string; status: string; bookingId?: string | null } | null>(null);

    const [cancelModal, setCancelModal] = useState(false);
    const [cancelPayment, setCancelPayment] = useState<any>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://your-api.com';

    // Stats
    const stats = useMemo(() => {
        if (!payments.length) return { totalRevenue: 0, pendingCount: 0, cryptoCount: 0, cancelRequestCount: 0, statusData: [], revenueData: [], paymentMethodData: [] };

        const totalRevenue = payments
            .filter(p => p.paymentStatus?.toLowerCase() === 'completed')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const pendingCount = payments.filter(p => ['pending', 'processing'].includes(p.paymentStatus?.toLowerCase())).length;
        const cryptoCount = payments.filter(p => p.paymentMethod === 'crypto').length;
        const cancelRequestCount = payments.filter(p => p.paymentStatus?.toLowerCase() === 'cancel_requested').length;

        const statusCounts = payments.reduce((acc: any, p) => {
            const s = (p.paymentStatus || 'pending').toUpperCase();
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        const statusData = Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] }));

        const monthlyRev = payments
            .filter(p => p.paymentStatus?.toLowerCase() === 'completed')
            .reduce((acc: any, p) => {
                const month = new Date(p.paymentDetails?.paymentDate || p.createdAt).toLocaleString('en-US', { month: 'short' });
                acc[month] = (acc[month] || 0) + (Number(p.amount) || 0);
                return acc;
            }, {});

        // Keep all months so the area chart is always visible, even with sparse data.
        const revenueData = MONTH_ORDER.map(month => ({ month, amount: monthlyRev[month] || 0 }));

        const bankAmount = payments
            .filter(p => p.paymentMethod === 'bank_transfer' && p.paymentStatus?.toLowerCase() === 'completed')
            .reduce((s, p) => s + (Number(p.amount) || 0), 0);

        const cryptoAmount = payments
            .filter(p => p.paymentMethod === 'crypto' && p.paymentStatus?.toLowerCase() === 'completed')
            .reduce((s, p) => s + (Number(p.amount) || 0), 0);

        const paymentMethodData = [
            { name: 'Bank Transfer', amount: bankAmount },
            { name: 'Cryptocurrency', amount: cryptoAmount },
        ];

        return { totalRevenue, pendingCount, cryptoCount, cancelRequestCount, statusData, revenueData, paymentMethodData };
    }, [payments]);

    const pieData = useMemo(
        () => stats.statusData.map((s: any) => ({
            x: String(s.name).replace('_', ' '),
            y: Number(s.value) || 0,
            color: STATUS_COLORS[s.name] || '#cbd5e1',
        })),
        [stats.statusData]
    );

    const maxRevenueAmount = Math.max(...stats.revenueData.map((item: any) => Number(item.amount) || 0), 1);
    const totalStatusCount = pieData.reduce((sum: number, item: any) => sum + (Number(item.y) || 0), 0);
    const donutSize = 220;
    const donutStroke = 26;
    const donutRadius = (donutSize - donutStroke) / 2;
    const donutCircumference = 2 * Math.PI * donutRadius;

    // Fetch Payments
    const fetchPayments = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/payments/admin/all`, { headers });
            if (res.data?.success) setPayments(res.data.data);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to fetch payments.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayments(); }, []);

    // Filters
    useEffect(() => {
        let result = payments;
        if (filterStatus !== 'all') {
            result = result.filter(p => p.paymentStatus?.toLowerCase() === filterStatus.toLowerCase());
        }
        if (filterMethod !== 'all') result = result.filter(p => p.paymentMethod === filterMethod);
        setFilteredPayments(result);
    }, [filterStatus, filterMethod, payments]);

    // Status Update
    const updatePaymentStatusNow = async (id: string, status: string, bookingId?: string | null) => {
        try {
            setStatusLoading(true);
            const headers = await getAuthHeaders();
            await axios.put(`${API_URL}/payments/admin/update-status/${id}`, { status: status.toLowerCase() }, { headers });
            if (status.toLowerCase() === 'completed' && bookingId) {
                await axios.put(
                    `${API_URL}/bookings/update-status/${bookingId}`,
                    { status: 'Confirmed' },
                    { headers }
                );
            }
            setPayments(prev => prev.map(payment => (
                payment._id === id ? { ...payment, paymentStatus: status.toLowerCase() } : payment
            )));
            Toast.show({ type: 'success', text1: 'Updated successfully!' });
            await fetchPayments();
            setIsModalOpen(false);
        } catch (err: any) {
            Toast.show({
                type: 'error',
                text1: err?.response?.data?.message || 'Update failed',
            });
        } finally {
            setStatusLoading(false);
        }
    };

    const handleStatusUpdate = (id: string, status: string, bookingId?: string | null) => {
        setPendingStatusUpdate({ id, status, bookingId });
        setIsModalOpen(false);
        setStatusConfirmModal(true);
    };

    const handleConfirmStatusYes = async (pendingUpdate?: { id: string; status: string; bookingId?: string | null } | null) => {
        const targetUpdate = pendingUpdate || pendingStatusUpdate;
        if (!targetUpdate) return;

        await updatePaymentStatusNow(targetUpdate.id, targetUpdate.status, targetUpdate.bookingId);
        setStatusConfirmModal(false);
        setPendingStatusUpdate(null);
        setSelectedPayment(null);
    };

    const handleConfirmStatusNo = () => {
        setStatusConfirmModal(false);
        setPendingStatusUpdate(null);
    };

    // Cancel Decision
    const handleCancelDecision = async (decision: 'refunded' | 'completed', paymentId?: string) => {
        setCancelLoading(true);
        try {
            const targetPaymentId = paymentId || cancelPayment?._id;
            if (!targetPaymentId) {
                Toast.show({ type: 'error', text1: 'Payment not found for this action' });
                return;
            }
            const headers = await getAuthHeaders();
            await axios.put(`${API_URL}/payments/admin/approve-cancel`, {
                paymentId: targetPaymentId,
                status: decision
            }, { headers });

            Toast.show({
                type: 'success',
                text1: decision === 'refunded' ? 'Refund Approved!' : 'Cancel Request Rejected'
            });
            setCancelModal(false);
            setCancelPayment(null);
            setIsModalOpen(false);
            fetchPayments();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed' });
        } finally {
            setCancelLoading(false);
        }
    };

    // Delete Payment
    const handleDeletePayment = async (paymentId?: string | null) => {
        const targetPaymentId = paymentId || deletePaymentId;

        if (!targetPaymentId) {
            Toast.show({ type: 'error', text1: 'Payment not found for delete action' });
            return;
        }

        setDeleteLoading(true);
        try {
            const headers = await getAuthHeaders();
            await axios.delete(`${API_URL}/payments/admin/delete/${targetPaymentId}`, { headers });
            Toast.show({ type: 'success', text1: 'Payment deleted successfully' });
            setDeleteModal(false);
            setDeleteSuccess(true);
            setDeletePaymentId(null);
            setSelectedPayment(null);
            setIsModalOpen(false);
            fetchPayments();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Delete failed' });
        } finally {
            setDeleteLoading(false);
        }
    };

    // Export PDF
    const exportPDF = async () => {
        try {
            const html = `
                <h1>Financial Hub - Payment Report</h1>
                <p>Total Revenue: Rs. ${stats.totalRevenue}</p>
                <p>Pending: ${stats.pendingCount}</p>
                <p>Payments: ${payments.length}</p>
                <!-- Add more as needed -->
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
            Toast.show({ type: 'success', text1: 'PDF Exported!' });
        } catch {
            Toast.show({ type: 'error', text1: 'Export failed' });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="loading" size={50} color="#6366F1" />
                <Text style={styles.loadingText}>Loading Payments...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>Financial Management</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={styles.exportBtn} onPress={exportPDF}>
                        <MaterialCommunityIcons name="download" size={18} color="white" />
                        <Text style={styles.btnText}>Export PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderColor: '#10b981' }]}>
                    <MaterialCommunityIcons name="trending-up" size={28} color="#10b981" />
                    <Text style={styles.statLabel}>Total Revenue</Text>
                    <Text style={styles.statValue}>Rs. {stats.totalRevenue.toLocaleString()}</Text>
                </View>

                <View style={[styles.statCard, { borderColor: '#f59e0b' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={28} color="#f59e0b" />
                    <Text style={styles.statLabel}>Pending</Text>
                    <Text style={styles.statValue}>{stats.pendingCount}</Text>
                </View>

                <View style={[styles.statCard, { borderColor: '#8b5cf6' }]}>
                    <MaterialCommunityIcons name="cached" size={28} color="#8b5cf6" />
                    <Text style={styles.statLabel}>Cancel Requests</Text>
                    <Text style={styles.statValue}>{stats.cancelRequestCount}</Text>
                </View>

                <View style={[styles.statCard, { borderColor: '#6366F1' }]}>
                    <MaterialCommunityIcons name="wallet" size={28} color="#6366F1" />
                    <Text style={styles.statLabel}>Crypto Txns</Text>
                    <Text style={styles.statValue}>{stats.cryptoCount}</Text>
                </View>
            </View>

            {/* Charts */}
            <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Revenue Growth</Text>
                <View style={styles.revenueList}>
                    {stats.revenueData.map((item: any) => (
                        <View key={item.month} style={styles.revenueRow}>
                            <Text style={styles.revenueMonth}>{item.month}</Text>
                            <View style={styles.revenueTrack}>
                                <View
                                    style={[
                                        styles.revenueFill,
                                        { width: `${((Number(item.amount) || 0) / maxRevenueAmount) * 100}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.revenueAmount}>Rs. {(Number(item.amount) || 0).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Status Ratio</Text>
                {pieData.length > 0 ? (
                    <View style={styles.statusChartWrap}>
                        <View style={styles.donutWrap}>
                            <Svg width={donutSize} height={donutSize}>
                                <Circle
                                    cx={donutSize / 2}
                                    cy={donutSize / 2}
                                    r={donutRadius}
                                    stroke="#E2E8F0"
                                    strokeWidth={donutStroke}
                                    fill="none"
                                />

                                {(() => {
                                    let cumulative = 0;

                                    return pieData.map((item: any) => {
                                        const value = Number(item.y) || 0;
                                        const fraction = totalStatusCount ? value / totalStatusCount : 0;
                                        const dash = fraction * donutCircumference;
                                        const startAngle = -90 + cumulative * 360;
                                        cumulative += fraction;

                                        return (
                                            <Circle
                                                key={item.x}
                                                cx={donutSize / 2}
                                                cy={donutSize / 2}
                                                r={donutRadius}
                                                stroke={item.color}
                                                strokeWidth={donutStroke}
                                                fill="none"
                                                strokeDasharray={`${dash} ${donutCircumference}`}
                                                transform={`rotate(${startAngle} ${donutSize / 2} ${donutSize / 2})`}
                                            />
                                        );
                                    });
                                })()}
                            </Svg>

                            <View style={styles.donutCenterLabel}>
                                <Text style={styles.donutCenterValue}>{totalStatusCount}</Text>
                                <Text style={styles.donutCenterText}>Payments</Text>
                            </View>
                        </View>

                        <View style={styles.statusList}>
                            {pieData.map((item: any) => (
                                <View key={item.x} style={styles.statusRow}>
                                    <View style={styles.statusMeta}>
                                        <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                                        <Text style={styles.statusLabel}>{item.x}</Text>
                                    </View>
                                    <Text style={styles.statusPercent}>
                                        {totalStatusCount ? `${Math.round((item.y / totalStatusCount) * 100)}%` : '0%'}
                                    </Text>
                                    <Text style={styles.statusCount}>{item.y}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.noChartData}>
                        <Text style={styles.noChartText}>No status data available</Text>
                    </View>
                )}
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <View style={styles.filterBlock}>
                    <Text style={styles.filterLabel}>Payment Status</Text>
                    <View style={styles.filterWrap}>
                        {STATUS_FILTERS.map((item) => {
                            const active = filterStatus === item.value;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[styles.filterChip, active && styles.filterChipActive]}
                                    onPress={() => setFilterStatus(item.value)}
                                >
                                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.filterBlock}>
                    <Text style={styles.filterLabel}>Payment Method</Text>
                    <View style={styles.filterWrap}>
                        {METHOD_FILTERS.map((item) => {
                            const active = filterMethod === item.value;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[styles.filterChip, active && styles.filterChipActive]}
                                    onPress={() => setFilterMethod(item.value)}
                                >
                                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.clearFilterBtn}
                    onPress={() => {
                        setFilterStatus('all');
                        setFilterMethod('all');
                    }}
                >
                    <Text style={styles.clearFilterText}>Clear Filters</Text>
                </TouchableOpacity>
            </View>

            {/* Payment List */}
            <FlatList
                data={filteredPayments}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <View style={styles.paymentRow}>
                        <View style={styles.paymentIdWrap}>
                            <Text style={styles.paymentId}>#{formatShortId(item._id)}</Text>
                            <Text style={styles.referenceId}>Ref: #{formatShortId(getReferenceId(item))}</Text>
                        </View>
                        <Text style={styles.amount}>Rs. {item.amount}</Text>
                        <Text
                            style={[
                                styles.status,
                                {
                                    backgroundColor: `${STATUS_COLORS[toUpperStatus(item.paymentStatus)] || '#94A3B8'}20`,
                                    color: STATUS_COLORS[toUpperStatus(item.paymentStatus)] || '#334155'
                                }
                            ]}
                        >
                            {formatStatusLabel(item.paymentStatus)}
                        </Text>
                        <TouchableOpacity onPress={() => { setSelectedPayment(item); setIsModalOpen(true); }}>
                            <MaterialCommunityIcons name="eye" size={24} color="#6366F1" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payment Details</Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {selectedPayment && (
                            <>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Payment ID</Text><Text style={styles.detailValue}>#{formatShortId(selectedPayment._id)}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Reference ID</Text><Text style={styles.detailValue}>#{formatShortId(getReferenceId(selectedPayment), 10)}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Transaction ID</Text><Text style={styles.detailValue}>{selectedPayment.transactionId || 'N/A'}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Booking ID</Text><Text style={styles.detailValue}>#{formatShortId(selectedPayment.bookingId, 10)}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Amount</Text><Text style={styles.detailValue}>Rs. {selectedPayment.amount}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Method</Text><Text style={styles.detailValue}>{selectedPayment.paymentMethod}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Status</Text><Text style={styles.detailValue}>{formatStatusLabel(selectedPayment.paymentStatus)}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailKey}>Date</Text><Text style={styles.detailValue}>{new Date(selectedPayment.createdAt).toLocaleString()}</Text></View>
                                {selectedPayment.receiptUrl ? (
                                    <View style={styles.receiptBox}>
                                        <Text style={styles.reasonTitle}>Receipt</Text>
                                        <Image source={{ uri: selectedPayment.receiptUrl }} style={styles.receiptImage} resizeMode="contain" />
                                        <TouchableOpacity onPress={() => Linking.openURL(selectedPayment.receiptUrl)} style={styles.receiptLinkBtn}>
                                            <Text style={styles.receiptLinkText}>Open Receipt</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.receiptBox}>
                                        <Text style={styles.reasonText}>No receipt uploaded for this payment.</Text>
                                    </View>
                                )}
                                {!!selectedPayment.metadata?.cancelReason && (
                                    <View style={styles.reasonBox}>
                                        <Text style={styles.reasonTitle}>Cancel Reason</Text>
                                        <Text style={styles.reasonText}>{selectedPayment.metadata.cancelReason}</Text>
                                    </View>
                                )}

                                <View style={styles.actionGrid}>
                                    {toLowerStatus(selectedPayment.paymentStatus) !== 'completed' && toLowerStatus(selectedPayment.paymentStatus) !== 'refunded' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.confirmBtn]}
                                            disabled={statusLoading}
                                            onPress={() => handleStatusUpdate(selectedPayment._id, 'completed', selectedPayment.bookingId)}
                                        >
                                            <Text style={styles.actionBtnText}>{statusLoading ? 'Updating...' : 'Confirm Payment'}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {toLowerStatus(selectedPayment.paymentStatus) === 'cancel_requested' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.refundBtn]}
                                            disabled={cancelLoading}
                                            onPress={() => {
                                                setCancelPayment(selectedPayment);
                                                setCancelModal(true);
                                            }}
                                        >
                                            <Text style={styles.actionBtnText}>{cancelLoading ? 'Processing...' : 'Approve Refund'}</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.rejectBtn]}
                                        disabled={cancelLoading || statusLoading}
                                        onPress={() => {
                                            if (toLowerStatus(selectedPayment.paymentStatus) === 'cancel_requested') {
                                                setCancelPayment(selectedPayment);
                                                handleCancelDecision('completed', selectedPayment._id);
                                                return;
                                            }
                                            setDeletePaymentId(selectedPayment?._id || null);
                                            setIsModalOpen(false);
                                            setDeleteModal(true);
                                        }}
                                    >
                                        <Text style={styles.actionBtnText}>
                                            {toLowerStatus(selectedPayment.paymentStatus) === 'cancel_requested' ? 'Reject Refund Request' : 'Delete Payment'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={cancelModal} animationType="fade" transparent onRequestClose={() => setCancelModal(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.confirmCard}>
                        <Text style={styles.confirmTitle}>Approve Refund Request?</Text>
                        <Text style={styles.confirmDesc}>This will mark the payment as refunded and cancel the booking.</Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity style={[styles.miniBtn, styles.miniCancel]} onPress={() => setCancelModal(false)}>
                                <Text style={styles.miniCancelText}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.miniBtn, styles.miniConfirm]} onPress={() => handleCancelDecision('refunded', cancelPayment?._id)}>
                                <Text style={styles.miniConfirmText}>{cancelLoading ? 'Please wait...' : 'Yes, Refund'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={deleteModal} animationType="fade" transparent onRequestClose={() => setDeleteModal(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.confirmCard}>
                        <Text style={styles.confirmTitle}>Delete this payment?</Text>
                        <Text style={styles.confirmDesc}>This action cannot be undone.</Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity style={[styles.miniBtn, styles.miniCancel]} onPress={() => setDeleteModal(false)}>
                                <Text style={styles.miniCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.miniBtn, styles.miniDanger]} onPress={() => handleDeletePayment(deletePaymentId)} disabled={deleteLoading}>
                                <Text style={styles.miniConfirmText}>{deleteLoading ? 'Deleting...' : 'Delete'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={statusConfirmModal} animationType="fade" transparent onRequestClose={handleConfirmStatusNo}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.confirmCard}>
                        <Text style={styles.confirmTitle}>Confirm Payment Status?</Text>
                        <Text style={styles.confirmDesc}>Are you sure you want to mark this payment as completed?</Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity style={[styles.miniBtn, styles.miniCancel]} onPress={handleConfirmStatusNo} disabled={statusLoading}>
                                <Text style={styles.miniCancelText}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.miniBtn, styles.miniConfirm]} onPress={() => handleConfirmStatusYes(pendingStatusUpdate)} disabled={statusLoading}>
                                <Text style={styles.miniConfirmText}>{statusLoading ? 'Saving...' : 'Yes'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Toast />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFDFD', padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
    headerButtons: { flexDirection: 'row', gap: 10 },
    exportBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
    btnText: { color: 'white', fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: 'white', padding: 16, borderRadius: 20, borderWidth: 1 },
    statLabel: { fontSize: 12, color: '#64748b', marginTop: 8 },
    statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
    chartContainer: { backgroundColor: 'white', padding: 16, borderRadius: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#374151' },
    revenueList: { gap: 10 },
    revenueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    revenueMonth: { width: 28, color: '#475569', fontWeight: '700', fontSize: 12 },
    revenueTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
    revenueFill: { height: '100%', borderRadius: 999, backgroundColor: '#6366F1' },
    revenueAmount: { width: 96, textAlign: 'right', color: '#334155', fontWeight: '700', fontSize: 11 },
    statusChartWrap: { alignItems: 'center', gap: 14 },
    donutWrap: { alignItems: 'center', justifyContent: 'center' },
    donutCenterLabel: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center'
    },
    donutCenterValue: { color: '#0F172A', fontSize: 24, fontWeight: '900' },
    donutCenterText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
    statusList: { gap: 10, width: '100%' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 999 },
    statusLabel: { color: '#334155', fontWeight: '700', fontSize: 12 },
    statusPercent: { width: 44, textAlign: 'right', color: '#64748B', fontWeight: '700', fontSize: 11 },
    statusCount: { width: 24, textAlign: 'right', color: '#334155', fontWeight: '700', fontSize: 12 },
    filterContainer: { gap: 14, marginBottom: 12 },
    filterBlock: { gap: 10 },
    filterLabel: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 },
    filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    filterChipText: { color: '#475569', fontWeight: '700', fontSize: 12 },
    filterChipTextActive: { color: 'white' },
    clearFilterBtn: { alignSelf: 'flex-start', backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
    clearFilterText: { color: 'white', fontWeight: '800', fontSize: 12 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10 },
    paymentIdWrap: { flex: 1, marginRight: 10 },
    paymentId: { fontWeight: 'bold' },
    referenceId: { marginTop: 4, fontSize: 11, color: '#64748b', fontWeight: '700' },
    amount: { fontSize: 18, fontWeight: 'bold' },
    status: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6366F1', fontWeight: 'bold' },
    noChartData: { height: 180, alignItems: 'center', justifyContent: 'center' },
    noChartText: { color: '#94A3B8', fontWeight: '600' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: 16 },
    modalCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, gap: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    detailKey: { color: '#64748b', fontWeight: '700' },
    detailValue: { color: '#0f172a', fontWeight: '700', maxWidth: '62%' },
    reasonBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, marginTop: 6 },
    reasonTitle: { color: '#334155', fontWeight: '800', marginBottom: 4 },
    reasonText: { color: '#475569' },
    receiptBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, marginTop: 6, gap: 10 },
    receiptImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#e2e8f0' },
    receiptLinkBtn: { alignSelf: 'flex-start', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    receiptLinkText: { color: 'white', fontWeight: '800', fontSize: 12 },
    actionGrid: { gap: 10, marginTop: 12 },
    actionBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    confirmBtn: { backgroundColor: '#10b981' },
    refundBtn: { backgroundColor: '#06b6d4' },
    rejectBtn: { backgroundColor: '#ef4444' },
    actionBtnText: { color: 'white', fontWeight: '800' },
    confirmCard: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
    confirmTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    confirmDesc: { color: '#475569', marginBottom: 14 },
    confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    miniBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    miniCancel: { backgroundColor: '#e2e8f0' },
    miniConfirm: { backgroundColor: '#06b6d4' },
    miniDanger: { backgroundColor: '#ef4444' },
    miniCancelText: { color: '#334155', fontWeight: '800' },
    miniConfirmText: { color: 'white', fontWeight: '800' },
});

export default AdminPaymentPage;