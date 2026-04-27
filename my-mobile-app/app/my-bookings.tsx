import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { Calendar, CreditCard, MapPin, MessageSquare, Star, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const backendUrl = process.env.EXPO_PUBLIC_API_URL;

export default function MyBookings() {
  const { userId: paramUserId } = useLocalSearchParams();
  const router = useRouter();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Review States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Extract userId from JWT token on mount
  useEffect(() => {
    const extractUserId = async () => {
      try {
        // First check if userId was passed as a route parameter
        if (paramUserId) {
          const cleanId = typeof paramUserId === 'string' && paramUserId.startsWith(":")
            ? paramUserId.substring(1)
            : paramUserId;
          setUserId(cleanId as string);
          return;
        }

        // Otherwise, extract from token
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          if (decoded?.id) {
            setUserId(decoded.id);
          } else {
            Alert.alert("Error", "Unable to get user ID from token.");
            setLoading(false);
          }
        } else {
          Alert.alert("Error", "No token found. Please log in.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Token decode error:", error);
        Alert.alert("Error", "Failed to get user information.");
        setLoading(false);
      }
    };

    extractUserId();
  }, [paramUserId]);

  // 2. Data Fetch Function
  const fetchBookings = async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Clean ID if it starts with ":"
      const cleanId = typeof userId === 'string' && userId.startsWith(":")
        ? userId.substring(1)
        : userId;

      console.log(`Fetching bookings for user: ${cleanId}`);

      const response = await axios.get(`${backendUrl}/bookings/user/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Handle backend response
      const fetchedData = response.data.data || response.data || [];
      setBookings(Array.isArray(fetchedData) ? fetchedData : []);
      console.log(`Loaded ${(Array.isArray(fetchedData) ? fetchedData : []).length} bookings`);
      
    } catch (error: any) {
      console.error("Fetch Error:", error.response?.data || error.message);
      Alert.alert("Error", "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch bookings when userId is available
  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const handleSubmitReview = async () => {
    if (!comment) return Alert.alert("Required", "Please write a comment.");

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${backendUrl}/reviews`, {
        bookingId: selectedBooking._id,
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Success", "ඔබේ අදහස් අපට ලබා දීම ගැන ස්තුතියි! ✨");
      setIsModalOpen(false);
      setComment("");
      setRating(5);
      fetchBookings();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const canReview = (booking: any) => {
    const today = new Date();
    const checkOutDate = new Date(booking.checkOut);
    return booking.status === "Confirmed" && today > checkOutDate;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>SYNCING YOUR TRIPS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.headerLine} />
          <Text style={styles.subHeader}>TRAVELER HISTORY</Text>
          <Text style={styles.mainHeader}>MY JOURNEY</Text>
          <Text style={[styles.mainHeader, styles.italicText]}>PORTFOLIO</Text>
        </View>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bookings found for this user.</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <View key={booking._id} style={styles.card}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: booking.hotelId?.images?.[0] || "https://via.placeholder.com/400" }} 
                  style={styles.cardImage} 
                />
                <View style={[styles.statusBadge, { backgroundColor: booking.status === 'Confirmed' ? '#22c55e' : '#fbbf24' }]}>
                  <Text style={styles.statusText}>{booking.status?.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.roomType}>{booking.roomType} SUITE</Text>
                <View style={styles.locationRow}>
                  <MapPin size={14} color="#2563eb" />
                  <Text style={styles.locationText}>{booking.country}</Text>
                </View>

                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>GRAND TOTAL</Text>
                  <Text style={styles.priceValue}>LKR {booking.totalPrice?.toLocaleString()}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Calendar size={18} color="#1e3a8a" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.dateLabel}>CHECK-IN — CHECK-OUT</Text>
                    <Text style={styles.dateValue}>
                      {new Date(booking.checkIn).toLocaleDateString()} — {new Date(booking.checkOut).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.buttonGroup}>
                  {canReview(booking) && (
                    <TouchableOpacity 
                      style={styles.reviewBtn}
                      onPress={() => { setSelectedBooking(booking); setIsModalOpen(true); }}
                    >
                      <MessageSquare size={16} color="#000" />
                      <Text style={styles.reviewBtnText}>REVIEW TRIP</Text>
                    </TouchableOpacity>
                  )}

                  {booking.status === "Pending" && (
                    <TouchableOpacity 
                      style={styles.payBtn}
                      onPress={() => {
                        router.push({
                          pathname: "/paymentpage",
                          params: {
                            bookingId: booking._id,
                            total: String(booking.totalPrice),
                          },
                        });
                      }}
                    >
                      <CreditCard size={16} color="#fff" />
                      <Text style={styles.payBtnText}>COMPLETE PAYMENT</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ marginHorizontal: -20 }}>
          <Footer />
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsModalOpen(false)}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>RATE YOUR{"\n"}EXPERIENCE</Text>
            
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Star size={32} fill={star <= rating ? "#fbbf24" : "none"} color={star <= rating ? "#fbbf24" : "#e2e8f0"} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Share your thoughts..."
              multiline
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>POST MY REVIEW</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  scrollPadding: { padding: 20, paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 10, fontWeight: '900', color: '#1e3a8a', letterSpacing: 2 },
  header: { marginBottom: 30 },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 16,
  },
  backButtonText: { color: 'white', fontWeight: '800', fontSize: 12 },
  headerLine: { height: 4, width: 40, backgroundColor: '#1e3a8a', marginBottom: 10 },
  subHeader: { fontSize: 10, fontWeight: '900', color: '#1e3a8a', letterSpacing: 2 },
  mainHeader: { fontSize: 40, fontWeight: '900', color: '#1e293b', lineHeight: 40 },
  italicText: { fontStyle: 'italic', color: '#1e3a8a' },
  card: { backgroundColor: '#fff', borderRadius: 30, marginBottom: 30, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  imageContainer: { height: 200, width: '100%' },
  cardImage: { width: '100%', height: '100%' },
  statusBadge: { position: 'absolute', top: 20, left: 20, paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  cardContent: { padding: 25 },
  roomType: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  locationText: { color: '#2563eb', fontSize: 11, fontWeight: '900', marginLeft: 5, letterSpacing: 1 },
  priceBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, marginTop: 20 },
  priceLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8' },
  priceValue: { fontSize: 28, fontWeight: '900', color: '#1e3a8a', fontStyle: 'italic' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  dateLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8' },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  buttonGroup: { marginTop: 25, flexDirection: 'row', gap: 10 },
  reviewBtn: { backgroundColor: '#fbbf24', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 30, gap: 8 },
  reviewBtnText: { fontWeight: '900', fontSize: 10 },
  payBtn: { backgroundColor: '#1e3a8a', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 30, gap: 8 },
  payBtnText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 40, padding: 30 },
  closeBtn: { alignSelf: 'flex-end' },
  modalTitle: { fontSize: 32, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 20 },
  textArea: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#1e3a8a', padding: 20, borderRadius: 40, marginTop: 20, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 }
});