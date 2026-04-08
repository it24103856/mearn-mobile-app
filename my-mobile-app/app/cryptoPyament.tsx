import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  AlertCircle, Bitcoin, Check, ChevronLeft, Copy,
  Send, Shield, TrendingUp, Zap
} from 'lucide-react-native';
import React, { useState } from 'react';
import Header from '../components/Header';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
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
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  }
  return await SecureStore.getItemAsync('token');
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── FIX: real backend URL ────────────────────────────────────────────────────
const backendUrl = process.env.EXPO_PUBLIC_API_URL;// ─────────────────────────────────────────────────────────────────────────────

const CryptoPayment = () => {
  const router = useRouter();
  const { bookingId, amount } = useLocalSearchParams<{ bookingId?: string; amount?: string }>();
  const parsedAmount = Number(amount) || 0;

  const [copied,        setCopied]        = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [activeTab,     setActiveTab]     = useState('bitcoin');

  // Guard
  if (!bookingId || !amount) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Session Expired or Invalid Access</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cryptoWallets = {
    bitcoin: {
      address: '1A1z7agoat2YLZW51Uc8w6LFCHF7PhmQqe',
      name:    'Bitcoin',
      color:   '#f97316',
      icon:    Bitcoin,
    },
    ethereum: {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f42e1',
      name:    'Ethereum',
      color:   '#a855f7',
      icon:    Zap,
    },
  } as const;

  const currentWallet = cryptoWallets[activeTab as keyof typeof cryptoWallets];

  const handleCopy = () => {
    Clipboard.setString(currentWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Error', 'Please enter Transaction Hash.');
      return;
    }

    setIsSubmitting(true);
    try {
      // ─── FIX: read real token ────────────────────────────────────────────
      const token = await getToken();
      if (!token) {
        Alert.alert('Login Required', 'Please log in to continue.', [
          { text: 'OK', onPress: () => router.push('/login') },
        ]);
        return;
      }

      const paymentData = {
        bookingId,
        amount:        parsedAmount,
        paymentMethod: 'crypto',
        transactionId: transactionId.trim(),
        paymentDetails: {
          bankName:    currentWallet.name,
          paymentDate: new Date().toISOString(),
          paidAmount:  parsedAmount,
        },
      };

      const response = await axios.post(
        `${backendUrl}/payments/create`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Payment details sent to Admin!');
        setTransactionId('');
        setTimeout(() => router.replace('/homePage'), 1500);
      } else {
        Alert.alert('Failed', response.data.message || 'Something went wrong.');
      }
    } catch (error: any) {
      console.error('Crypto payment error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Something went wrong.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <ScrollView style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={20} color="#64748b" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.card}>
        {/* Tab Selector */}
        <View style={styles.tabBar}>
          {Object.entries(cryptoWallets).map(([key, wallet]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={[styles.tab, activeTab === key && styles.activeTab]}
            >
              <wallet.icon size={18} color={activeTab === key ? wallet.color : '#64748b'} />
              <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>
                {wallet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.labelSmall}>Amount to Pay</Text>
            <Text style={styles.amountText}>LKR {parsedAmount.toLocaleString()}</Text>
          </View>

          {/* QR / Address */}
          <View style={[styles.qrWrapper, { borderColor: currentWallet.color }]}>
            <View style={styles.qrInner}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>Scan wallet address QR</Text>
              </View>
              <View style={styles.addressBox}>
                <Text numberOfLines={1} style={styles.addressText}>
                  {currentWallet.address}
                </Text>
                <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                  {copied
                    ? <Check size={16} color="#16a34a" />
                    : <Copy  size={16} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Input Form */}
          <View style={styles.form}>
            <View style={styles.labelRow}>
              <AlertCircle size={14} color="#3b82f6" />
              <Text style={styles.formLabel}>Transaction Hash (TxID)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Paste your transaction hash here"
              value={transactionId}
              onChangeText={setTransactionId}
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
              onPress={handlePaymentSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnRow}>
                  <Send size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>CONFIRM PAYMENT</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer badges */}
          <View style={styles.footer}>
            <View style={styles.badge}>
              <Shield size={12} color="#94a3b8" />
              <Text style={styles.badgeText}>SECURE</Text>
            </View>
            <View style={styles.badge}>
              <TrendingUp size={12} color="#94a3b8" />
              <Text style={styles.badgeText}>VERIFIED</Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  centerContainer:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn:            { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginLeft: 16 },
  backText:           { color: '#64748b', fontSize: 14, fontWeight: '600', marginLeft: 5 },
  card:               { backgroundColor: '#fff', borderRadius: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginTop: 40, overflow: 'hidden' },
  tabBar:             { flexDirection: 'row', backgroundColor: '#f1f5f9', margin: 16, borderRadius: 20, padding: 4 },
  tab:                { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 8 },
  activeTab:          { backgroundColor: '#fff' },
  tabText:            { fontWeight: 'bold', color: '#64748b' },
  activeTabText:      { color: '#0f172a' },
  content:            { padding: 24, paddingTop: 8 },
  header:             { alignItems: 'center', marginBottom: 24 },
  labelSmall:         { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' },
  amountText:         { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  qrWrapper:          { borderStyle: 'solid', borderWidth: 2, borderRadius: 24, padding: 8, marginBottom: 24 },
  qrInner:            { backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center' },
  addressBox:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  addressText:        { flex: 1, fontSize: 10, color: '#64748b', fontStyle: 'italic' },
  copyBtn:            { marginLeft: 8, backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  qrPlaceholder:      { width: 180, height: 180, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  qrPlaceholderText:  { color: '#64748b', fontSize: 12, fontWeight: '600' },
  form:               { gap: 16 },
  labelRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formLabel:          { fontWeight: 'bold', color: '#334155', fontSize: 14 },
  input:              { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 12, color: '#0f172a' },
  submitBtn:          { backgroundColor: '#0f172a', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  btnDisabled:        { backgroundColor: '#cbd5e1' },
  btnRow:             { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submitBtnText:      { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  footer:             { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 24, opacity: 0.5 },
  badge:              { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText:          { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  errorText:          { color: '#ef4444', fontWeight: 'bold', fontSize: 18 },
  backBtn:            { marginTop: 16, backgroundColor: '#0f172a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText:        { color: '#fff', fontWeight: 'bold' },
});

export default CryptoPayment;