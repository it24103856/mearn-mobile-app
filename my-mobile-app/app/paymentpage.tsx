import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Coins,
    CreditCard,
    Landmark,
    ShieldCheck,
    Ticket
} from 'lucide-react-native';
import React, { useState } from 'react';
import Header from '../components/Header';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PaymentMainPage = () => {
    const [selectedMethod, setSelectedMethod] = useState('');
    const router = useRouter();
    
    // Web එකේ location.state වැනි දේ Mobile වලදී params ලෙස ලැබේ
    const params = useLocalSearchParams();
    
    // Booking දත්ත (Params හරහා ලැබෙන බව උපකල්පනය කෙරේ)
    const bookingId = params.bookingId as string;
    const total = Number(params.total) || 0;
    const discountPercent = Number(params.discountPercentage) || 0;
    const currency = (params.currency as string) || 'LKR';

    // ගණනය කිරීම්
    const discountAmount = total * (discountPercent / 100);
    const finalTotal = total - discountAmount;
    const hasDiscount = discountPercent > 0;

    if (!bookingId) {
        return (
            <View style={styles.errorContainer}>
                <AlertCircle size={48} color="#EF4444" />
                <Text style={styles.errorTitle}>Invalid Session</Text>
                <TouchableOpacity style={styles.errorBtn} onPress={() => router.replace('/homePage')}>
                    <Text style={styles.errorBtnText}>Return Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const paymentMethods = [
        { id: 'bank', name: 'Bank Transfer', sub: 'Direct bank payment', icon: Landmark, color: '#2563EB' },
        { id: 'card', name: 'Credit Card', sub: 'Visa, Mastercard', icon: CreditCard, color: '#10B981' },
        { id: 'crypto', name: 'Cryptocurrency', sub: 'BTC, ETH, USDT', icon: Coins, color: '#F59E0B' },
    ];

    const navigateToMethodPage = (methodId: string) => {
        if (methodId === 'bank') {
            router.push({
                pathname: '/BankTranferPage',
                params: { bookingId, amount: finalTotal, currency }
            });
            return;
        }

        if (methodId === 'crypto') {
            router.push({
                pathname: '/cryptoPyament',
                params: { bookingId, amount: finalTotal, currency }
            });
            return;
        }

        alert('Card payment page is not ready yet. Please select Bank Transfer or Cryptocurrency.');
    };

    const handlePayNow = () => {
        if (!selectedMethod) {
            alert("Please select a payment method!");
            return;
        }

        navigateToMethodPage(selectedMethod);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Back Button */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={20} color="#f97316" />
                    <Text style={styles.backBtnText}>Back to Booking</Text>
                </TouchableOpacity>
                
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Choose <Text style={{ color: '#F97316' }}>Payment</Text></Text>
                    <Text style={styles.subtitle}>Select your preferred payment option</Text>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.iconBox}>
                            <Ticket size={24} color="#2563EB" />
                        </View>
                        <View>
                            <Text style={styles.refLabel}>REFERENCE ID</Text>
                            <Text style={styles.refValue}>#{bookingId.substring(0, 8).toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <View style={styles.amountBox}>
                            <Text style={styles.amountText}>{finalTotal.toLocaleString()}</Text>
                            <Text style={styles.currencyText}>{currency}</Text>
                        </View>
                    </View>
                    {hasDiscount && (
                        <Text style={styles.discountBadge}>{discountPercent}% Discount Applied</Text>
                    )}
                </View>

                {/* Methods List */}
                <View style={styles.methodsGrid}>
                    {paymentMethods.map((method) => {
                        const isSelected = selectedMethod === method.id;
                        const Icon = method.icon;
                        return (
                            <TouchableOpacity
                                key={method.id}
                                activeOpacity={0.7}
                                onPress={() => {
                                    setSelectedMethod(method.id);
                                    navigateToMethodPage(method.id);
                                }}
                                style={[
                                    styles.methodItem,
                                    isSelected && styles.methodItemSelected
                                ]}
                            >
                                <View style={[styles.methodIconBox, isSelected && { backgroundColor: '#2563EB' }]}>
                                    <Icon size={28} color={isSelected ? 'white' : '#94A3B8'} />
                                </View>
                                <Text style={[styles.methodName, isSelected && { color: '#0F172A' }]}>{method.name}</Text>
                                <Text style={styles.methodSub}>{method.sub}</Text>
                                
                                {isSelected && <View style={styles.radioActive} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Action Button */}
                <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={handlePayNow}
                >
                    <Text style={styles.payBtnText}>PROCEED TO PAY</Text>
                    <ChevronRight size={18} color="white" />
                </TouchableOpacity>

                <View style={styles.secureBox}>
                    <ShieldCheck size={16} color="#10B981" />
                    <Text style={styles.secureText}>100% SECURE & ENCRYPTED</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { padding: 20, paddingTop: 10 },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtnText: { color: '#f97316', fontSize: 16, fontWeight: '600', marginLeft: 5 },
    header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
    title: { fontSize: 32, fontWeight: '900', color: '#1E293B' },
    subtitle: { fontSize: 14, color: '#64748B', marginTop: 5 },
    
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 25,
        marginBottom: 25,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
            android: { elevation: 5 }
        })
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBox: { backgroundColor: '#EFF6FF', borderRadius: 15, padding: 10 },
    refLabel: { fontSize: 10, fontWeight: 'bold', color: '#3B82F6', letterSpacing: 1 },
    refValue: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    amountBox: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
    amountText: { fontSize: 32, fontWeight: '900', color: '#2563EB' },
    currencyText: { fontSize: 14, fontWeight: 'bold', color: '#94A3B8' },
    discountBadge: { color: '#10B981', fontSize: 12, fontWeight: 'bold', marginTop: 5 },

    methodsGrid: { gap: 15, marginBottom: 30 },
    methodItem: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 25,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    methodItemSelected: { borderColor: '#3B82F6', backgroundColor: '#FFFFFF' },
    methodIconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    methodName: { fontSize: 16, fontWeight: 'bold', color: '#475569' },
    methodSub: { fontSize: 12, color: '#94A3B8' },
    radioActive: { position: 'absolute', top: 15, right: 15, width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' },

    payBtn: {
        backgroundColor: '#0F172A',
        padding: 20,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    payBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 2 },
    secureBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 },
    secureText: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 1 },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginVertical: 10 },
    errorBtn: { backgroundColor: '#1E293B', padding: 15, borderRadius: 10, marginTop: 10 },
    errorBtnText: { color: 'white', fontWeight: 'bold' }
});

export default PaymentMainPage;