import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, CloudUpload, Hash } from 'lucide-react-native';
import React, { useState } from 'react';
import { uploadFile } from '../lib/supabase';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// ─── Platform-aware token helper ─────────────────────────────────────────────
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  return await SecureStore.getItemAsync('token');
};

// ─── Fallback unique ID (if user leaves field empty) ─────────────────────────
const generateFallbackId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BT-${timestamp}-${random}`;
};
// ─────────────────────────────────────────────────────────────────────────────

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

const BankTransferPage = () => {
  const router = useRouter();
  const { amount, bookingId } = useLocalSearchParams<{ amount?: string; bookingId?: string }>();
  const parsedAmount      = Number(amount) || 0;
  const resolvedBookingId = bookingId || 'N/A';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [receiptFile,  setReceiptFile]  = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [formData, setFormData] = useState({
    customerName:  '',
    country:       '',
    bankName:      '',
    branch:        '',
    paymentDate:   '',
    paidAmount:    parsedAmount.toString(),
    transactionId: '',   // ← user enter කරන field
  });

  const handleInputChange = (name: string, value: string) =>
    setFormData(prev => ({ ...prev, [name]: value }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setReceiptFile(asset);
      setPreview(asset.uri);
    }
  };

  const handleSubmit = async () => {
    if (!preview) {
      Alert.alert('Error', 'Please upload the receipt!');
      return;
    }
    if (!formData.bankName.trim() || !formData.branch.trim()) {
      Alert.alert('Error', 'Please fill in bank name and branch!');
      return;
    }
    if (!receiptFile?.uri) {
      Alert.alert('Error', 'Please select a valid receipt image!');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Login Required', 'Please log in to continue.', [
          { text: 'OK', onPress: () => router.push('/login') },
        ]);
        return;
      }

      // User දීල නැත්නම් fallback ID generate කරනවා
      const finalTransactionId = formData.transactionId.trim() || generateFallbackId();
      const uploadedUrl = await uploadFile(receiptFile.uri, 'payments');

      const submissionData = {
        bookingId:     resolvedBookingId,
        amount:        parsedAmount,
        paymentMethod: 'bank_transfer',
        receiptUrl:    uploadedUrl,
        transactionId: finalTransactionId,
        paymentDetails: {
          customerName: formData.customerName,
          country:      formData.country,
          bankName:     formData.bankName,
          branch:       formData.branch,
          paymentDate:  formData.paymentDate || new Date().toISOString().split('T')[0],
          paidAmount:   Number(formData.paidAmount) || parsedAmount,
        },
      };

      const { data } = await axios.post(
        `${backendUrl}/payments/create`,
        submissionData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (data.success) {
        Alert.alert('Success', data.aiNote || 'Payment submitted successfully!');
        setTimeout(() => router.replace('/homePage'), 1500);
      } else {
        Alert.alert('Failed', data.message || 'Something went wrong.');
      }
    } catch (error: any) {
      console.error('Payment error:', error.response?.data || error.message);
      Alert.alert('Payment Error', error.response?.data?.message || 'Internal Server Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ChevronLeft size={20} color="#64748b" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BANK TRANSFER</Text>
            <Text style={styles.headerSub}>Ref: {resolvedBookingId}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amountText}>{parsedAmount.toLocaleString()} LKR</Text>
            <Text style={styles.amountLabel}>TOTAL PAYABLE</Text>
          </View>
        </View>

        <View style={styles.form}>

          {/* Personal Info */}
          <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
          <TextInput style={styles.input} placeholder="Full Name"
            onChangeText={(v) => handleInputChange('customerName', v)} />
          <TextInput style={styles.input} placeholder="Country"
            onChangeText={(v) => handleInputChange('country', v)} />

          {/* Bank Details */}
          <Text style={styles.sectionLabel}>BANK DETAILS</Text>
          <TextInput style={styles.input} placeholder="Bank Name"
            onChangeText={(v) => handleInputChange('bankName', v)} />
          <TextInput style={styles.input} placeholder="Branch Name"
            onChangeText={(v) => handleInputChange('branch', v)} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Transfer Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD"
                onChangeText={(v) => handleInputChange('paymentDate', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Paid Amount (LKR)</Text>
              <TextInput style={[styles.input, styles.amountInput]}
                keyboardType="numeric"
                defaultValue={parsedAmount.toString()}
                onChangeText={(v) => handleInputChange('paidAmount', v)} />
            </View>
          </View>

          {/* Transaction ID field */}
          <Text style={styles.sectionLabel}>TRANSACTION REFERENCE</Text>
          <View style={styles.txnBox}>
            <Hash size={18} color="#3b82f6" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.txnInput}
              placeholder="Enter bank transaction / reference ID"
              placeholderTextColor="#94a3b8"
              value={formData.transactionId}
              onChangeText={(v) => handleInputChange('transactionId', v)}
              autoCapitalize="characters"
            />
          </View>
          <Text style={styles.txnHint}>
            * Receipt slip එකේ හෝ bank app එකේ ඇති Reference / Transaction ID එක ඇතුළු කරන්න.
            {'\n'}Empty ලෙස ගියොත් auto-generate වේ.
          </Text>

          {/* Upload Receipt */}
          <Text style={styles.sectionLabel}>PAYMENT RECEIPT</Text>
          <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
            {!preview ? (
              <>
                <CloudUpload size={40} color="#3b82f6" />
                <Text style={styles.uploadTitle}>UPLOAD RECEIPT SLIP</Text>
                <Text style={styles.uploadSub}>PNG, JPG up to 2MB</Text>
              </>
            ) : (
              <View style={styles.previewContainer}>
                <Image source={{ uri: preview }} style={styles.previewImg} />
                <TouchableOpacity
                  onPress={() => { setPreview(null); setReceiptFile(null); }}
                  style={styles.removeBtn}>
                  <Text style={styles.removeText}>REMOVE & REPLACE</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}
            style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}>
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>CONFIRM & SUBMIT PAYMENT</Text>}
          </TouchableOpacity>

        </View>
      </View>

      <Text style={styles.footerText}>SECURE AI POWERED VERIFICATION SYSTEM</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  backBtn:          { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  backText:         { color: '#64748b', fontWeight: 'bold', marginLeft: 4 },
  card:             { backgroundColor: '#fff', borderRadius: 32, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  header:           { backgroundColor: '#2563eb', padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:      { color: '#fff', fontWeight: '900', fontSize: 18 },
  headerSub:        { color: '#fff', opacity: 0.8, fontSize: 10, fontStyle: 'italic' },
  amountText:       { color: '#fff', fontWeight: '900', fontSize: 20 },
  amountLabel:      { color: '#fff', opacity: 0.7, fontSize: 8, fontWeight: 'bold' },
  form:             { padding: 24 },
  sectionLabel:     { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2, marginBottom: 10, marginTop: 6 },
  input:            { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  row:              { flexDirection: 'row', marginBottom: 4 },
  label:            { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4, marginLeft: 4, textTransform: 'uppercase' },
  amountInput:      { color: '#2563eb', fontWeight: 'bold' },

  // Transaction ID
  txnBox:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 16, borderWidth: 1.5, borderColor: '#bfdbfe', paddingHorizontal: 16, paddingVertical: 4, marginBottom: 8 },
  txnInput:         { flex: 1, paddingVertical: 14, fontSize: 14, color: '#0f172a', fontWeight: '600' },
  txnHint:          { fontSize: 11, color: '#94a3b8', marginBottom: 20, marginLeft: 4, lineHeight: 18 },

  uploadBox:        { borderStyle: 'dashed', borderWidth: 2, borderColor: '#bfdbfe', borderRadius: 24, padding: 30, alignItems: 'center', backgroundColor: '#eff6ff', marginBottom: 8 },
  uploadTitle:      { fontWeight: '900', fontSize: 12, marginTop: 12, color: '#475569' },
  uploadSub:        { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  previewContainer: { alignItems: 'center' },
  previewImg:       { width: 150, height: 150, borderRadius: 16 },
  removeBtn:        { marginTop: 12 },
  removeText:       { color: '#ef4444', fontSize: 10, fontWeight: '900' },
  submitBtn:        { backgroundColor: '#0f172a', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  disabledBtn:      { backgroundColor: '#cbd5e1' },
  submitBtnText:    { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  footerText:       { textAlign: 'center', fontSize: 9, color: '#94a3b8', marginTop: 24, fontWeight: 'bold', letterSpacing: 1 },
});

export default BankTransferPage;