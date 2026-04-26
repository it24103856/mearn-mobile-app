import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  Platform,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import Footer from '../components/Footer';
import { 
  CheckCircle, 
  Clock, 
  Info, 
  RotateCcw, 
  XCircle, 
  Eye, 
  X, 
  Hash, 
  Calendar, 
  Receipt,
  Landmark
} from "lucide-react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Helper to get token (consistent with your previous code)
const getToken = async () => {
  if (Platform.OS === "web") return localStorage.getItem("token");
  return await SecureStore.getItemAsync("token");
};

export default function MyPayments() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal States
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${API_URL}/payments/my-payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setPayments(data.data);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to load payments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handleCancelRequest = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${API_URL}/payments/request-cancel`,
        { paymentId: cancelTarget._id, reason: cancelReason || "Customer requested cancellation." },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        Alert.alert("Success", "Refund request submitted!");
        setCancelTarget(null);
        setCancelReason("");
        fetchPayments();
        router.push('/request-cancel');
      }
    } catch (err: any) {
      Alert.alert("Request Failed", err.response?.data?.message || "Something went wrong.");
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusUI = (status: string) => {
    switch (status) {
      case "completed":
        return { color: "#059669", bg: "#ecfdf5", icon: <CheckCircle size={14} color="#059669" />, label: "Completed" };
      case "processing":
        return { color: "#2563eb", bg: "#eff6ff", icon: <Clock size={14} color="#2563eb" />, label: "Processing" };
      case "cancel_requested":
        return { color: "#d97706", bg: "#fffbeb", icon: <Info size={14} color="#d97706" />, label: "Pending Refund" };
      case "refunded":
        return { color: "#7c3aed", bg: "#f5f3ff", icon: <RotateCcw size={14} color="#7c3aed" />, label: "Refunded" };
      case "failed":
        return { color: "#e11d48", bg: "#fff1f2", icon: <XCircle size={14} color="#e11d48" />, label: "Failed" };
      default:
        return { color: "#64748b", bg: "#f1f5f9", icon: <Clock size={14} color="#64748b" />, label: "Pending" };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00AEEF" />
        <Text style={styles.loadingText}>Syncing transactions...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSubtitle}>Keep track of your bookings and payment status</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Receipt size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No financial history available.</Text>
          </View>
        ) : (
          payments.map((payment) => {
            const status = getStatusUI(payment.paymentStatus);
            return (
              <View key={payment._id} style={styles.card}>
                <View style={[styles.statusBar, { backgroundColor: status.color }]} />
                
                <View style={styles.cardContent}>
                  <View style={styles.amountSection}>
                    <Text style={styles.labelSmall}>AMOUNT PAID</Text>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountText}>{payment.amount.toLocaleString()}</Text>
                      <View style={styles.currencyBadge}>
                        <Text style={styles.currencyText}>{payment.currency}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <View style={styles.labelRow}>
                        <Hash size={10} color="#00AEEF" />
                        <Text style={styles.labelSmall}> REF</Text>
                      </View>
                      <Text style={styles.infoValue}>#{String(payment.bookingId).slice(-6)}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <View style={styles.labelRow}>
                        <Calendar size={10} color="#00AEEF" />
                        <Text style={styles.labelSmall}> DATE</Text>
                      </View>
                      <Text style={styles.infoValue}>
                        {new Date(payment.createdAt).toLocaleDateString("en-GB")}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    {status.icon}
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    {payment.paymentStatus === "completed" && (
                      <TouchableOpacity 
                        style={styles.refundBtn}
                        onPress={() => setCancelTarget(payment)}
                      >
                        <RotateCcw size={14} color="#e11d48" />
                        <Text style={styles.refundBtnText}>REFUND</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.viewBtn}
                      onPress={() => setSelectedPayment(payment)}
                    >
                      <Eye size={14} color="white" />
                      <Text style={styles.viewBtnText}>SUMMARY</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ marginHorizontal: -16 }}>
          <Footer />
        </View>
      </ScrollView>

      {/* --- PAYMENT SUMMARY MODAL --- */}
      <Modal visible={!!selectedPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Receipt</Text>
                <Text style={styles.modalId}>ID: {selectedPayment?._id}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPayment(null)} style={styles.closeBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <View style={styles.modalBody}>
                <View style={styles.summaryHighlight}>
                  <Text style={styles.labelSmallCenter}>NET PAYMENT</Text>
                  <Text style={styles.summaryAmount}>
                    {selectedPayment.amount.toLocaleString()} <Text style={styles.summaryCurrency}>{selectedPayment.currency}</Text>
                  </Text>
                </View>

                <View style={styles.detailCard}>
                    <Landmark size={18} color="#00AEEF" />
                    <View style={{marginLeft: 12}}>
                        <Text style={styles.labelSmall}>BANK/BRANCH</Text>
                        <Text style={styles.detailValue}>{selectedPayment.paymentDetails?.bankName || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.detailCard}>
                    <Receipt size={18} color="#2563eb" />
                    <View style={{marginLeft: 12}}>
                        <Text style={styles.labelSmall}>METHOD</Text>
                        <Text style={styles.detailValue}>{selectedPayment.paymentMethod?.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                </View>

                {selectedPayment.paymentMethod === "bank_transfer" && (
                  <View style={styles.receiptSection}>
                    <Text style={styles.labelSmall}>BANK RECEIPT</Text>
                    {selectedPayment.receiptUrl ? (
                      <Image
                        source={{ uri: selectedPayment.receiptUrl }}
                        style={styles.receiptImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.receiptMissingText}>No bank receipt uploaded.</Text>
                    )}
                  </View>
                )}

                {selectedPayment.metadata?.adminNotes && (
                   <View style={styles.notesBox}>
                        <Info size={16} color="#d97706" />
                        <Text style={styles.notesText}>{selectedPayment.metadata.adminNotes}</Text>
                   </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- REFUND REQUEST MODAL --- */}
      <Modal visible={!!cancelTarget} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Request Refund</Text>
            <Text style={styles.warningText}>
              Admin verify කරලා approve කරනවා. Approved වුනාම booking cancel වෙයි.
            </Text>
            
            <TextInput
              style={styles.textArea}
              placeholder="Reason for refund..."
              multiline
              numberOfLines={4}
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setCancelTarget(null)}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.submitBtn]} 
                onPress={handleCancelRequest}
                disabled={cancelLoading}
              >
                {cancelLoading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748b", fontWeight: "500" },
  header: { padding: 24, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#1e293b" },
  headerSubtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  scrollContent: { padding: 16 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#94a3b8", marginTop: 12, fontWeight: "600" },
  card: { backgroundColor: "white", borderRadius: 20, marginBottom: 16, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  statusBar: { width: 6, position: "absolute", left: 0, top: 0, bottom: 0 },
  cardContent: { padding: 20 },
  amountSection: { marginBottom: 4 },
  labelSmall: { fontSize: 10, fontWeight: "800", color: "#94a3b8", letterSpacing: 1 },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 2 },
  amountText: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  currencyBadge: { backgroundColor: "#ecfeff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  currencyText: { fontSize: 10, color: "#0891b2", fontWeight: "bold" },
  infoGrid: { flexDirection: "row", marginTop: 16, gap: 20 },
  infoItem: { flex: 1 },
  labelRow: { flexDirection: "row", alignItems: "center" },
  infoValue: { fontSize: 14, fontWeight: "700", color: "#334155", marginTop: 2 },
  statusBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 16, gap: 6 },
  statusText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  actionRow: { flexDirection: "row", marginTop: 20, gap: 10 },
  viewBtn: { flex: 2, backgroundColor: "#0f172a", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, gap: 8 },
  viewBtnText: { color: "white", fontWeight: "bold", fontSize: 12 },
  refundBtn: { flex: 1, borderWidth: 1, borderColor: "#fecdd3", backgroundColor: "#fff1f2", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, gap: 6 },
  refundBtnText: { color: "#e11d48", fontWeight: "bold", fontSize: 10 },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "white", borderRadius: 30, padding: 25, shadowColor: "#000", shadowOpacity: 0.2 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  modalId: { fontSize: 10, color: "#94a3b8" },
  closeBtn: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 20 },
  modalBody: { gap: 10 },
  summaryHighlight: { backgroundColor: "#f8fafc", padding: 20, borderRadius: 20, alignItems: "center", marginBottom: 20 },
  labelSmallCenter: { fontSize: 10, fontWeight: "800", color: "#94a3b8", textAlign: "center" },
  summaryAmount: { fontSize: 36, fontWeight: "900", color: "#0f172a" },
  summaryCurrency: { fontSize: 16, color: "#94a3b8" },
  detailCard: { flexDirection: "row", alignItems: "center", padding: 15, borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 15, marginBottom: 10 },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#334155" },
  receiptSection: { marginTop: 6, marginBottom: 4 },
  receiptImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  receiptMissingText: { marginTop: 8, color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  notesBox: { backgroundColor: "#fffbeb", padding: 15, borderRadius: 15, flexDirection: "row", gap: 10, marginTop: 10 },
  notesText: { flex: 1, fontSize: 12, color: "#92400e", fontWeight: "500" },
  
  textArea: { backgroundColor: "#f8fafc", borderRadius: 15, padding: 15, height: 100, textAlignVertical: "top", marginTop: 15, borderWidth: 1, borderColor: "#e2e8f0" },
  warningText: { fontSize: 12, color: "#92400e", backgroundColor: "#fffbeb", padding: 10, borderRadius: 10, marginTop: 10 },
  modalActionRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 15, alignItems: "center" },
  cancelBtn: { backgroundColor: "#f1f5f9" },
  submitBtn: { backgroundColor: "#e11d48" },
  cancelBtnText: { fontWeight: "bold", color: "#64748b" },
  submitBtnText: { fontWeight: "bold", color: "white" }
});