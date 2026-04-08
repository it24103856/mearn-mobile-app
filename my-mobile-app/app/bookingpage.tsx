import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, Bed, Calendar, ChevronLeft, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import Header from "../components/Header";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Room {
  _id: string;
  type: string;
  finalPrice: number;
}

// ─── FIX: Platform-aware token helper ───────────────────────────────────────
// expo-secure-store works only on iOS/Android.
// On web, fall back to localStorage.
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") {
    return localStorage.getItem("token");
  }
  return await SecureStore.getItemAsync("token");
};
// ────────────────────────────────────────────────────────────────────────────

export default function TravelBookingUI() {
  const { id, hotelId } = useLocalSearchParams<{ id?: string; hotelId?: string }>();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<"checkIn" | "checkOut">("checkIn");

const backendUrl = process.env.EXPO_PUBLIC_API_URL;
  const resolvedHotelId = hotelId || id || "";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Sri Lanka",
    checkIn: "",
    checkOut: "",
    adults: "1",
    children: "0",
    selectedRoom: null as Room | null,
  });

  useEffect(() => {
    const fetchHotelData = async () => {
      if (!resolvedHotelId) { setLoading(false); return; }
      try {
        const response = await axios.get(`${backendUrl}/hotels/get/${resolvedHotelId}`);
        if (response.data?.success) {
          const hotelData = Array.isArray(response.data.data)
            ? response.data.data[0]
            : response.data.data;
          setDetails(hotelData);
          if (hotelData?.roomTypes?.length > 0) {
            setFormData(prev => ({ ...prev, selectedRoom: hotelData.roomTypes[0] }));
          }
        }
      } catch (err: any) {
        console.error("Fetch Error:", err.response?.data || err.message);
        Alert.alert("Error", "Could not load hotel details.");
      } finally {
        setLoading(false);
      }
    };
    fetchHotelData();
  }, [resolvedHotelId]);

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (!selectedDate) return;
    
    // Validate the date is a proper Date object
    if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
      Alert.alert("Invalid Date", "Please select a valid date.");
      return;
    }
    
    // Store as ISO string for backend consistency
    const isoString = selectedDate.toISOString();
    setFormData(prev => ({ ...prev, [dateField]: isoString }));
    console.log(`${dateField} set to:`, isoString);
  };

  // Format date string for display purposes
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return "Invalid Date";
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.firstName.trim()) { Alert.alert("Missing Info", "Please enter your first name."); return; }
      if (!formData.lastName.trim())  { Alert.alert("Missing Info", "Please enter your last name.");  return; }
      if (!formData.email.trim())     { Alert.alert("Missing Info", "Please enter your email.");      return; }
      if (!formData.phone.trim())     { Alert.alert("Missing Info", "Please enter your phone.");      return; }
    }
    if (step === 2) {
      if (!formData.checkIn)  { Alert.alert("Missing Info", "Please select a check-in date.");  return; }
      if (!formData.checkOut) { Alert.alert("Missing Info", "Please select a check-out date."); return; }
      if (formData.checkIn >= formData.checkOut) {
        Alert.alert("Invalid Dates", "Check-out must be after check-in."); return;
      }
      if (!formData.selectedRoom) { Alert.alert("Missing Info", "Please select a room type."); return; }
    }
    setStep(step + 1);
  };

  const handleBookingSubmit = async () => {
    setIsSubmitting(true);
    try {
      // ─── FIX: use platform-aware helper instead of SecureStore directly ───
      const token = await getToken();

      if (!token) {
        Alert.alert(
          "Login Required",
          "You need to be logged in to make a booking.",
          [{ text: "OK", onPress: () => router.push("/login") }]
        );
        return;
      }

      let decoded: any;
      try {
        decoded = jwtDecode(token);
      } catch {
        Alert.alert("Session Expired", "Please log in again.");
        router.push("/login");
        return;
      }

      if (!decoded?.id) {
        Alert.alert("Session Error", "Invalid session. Please log in again.");
        router.push("/login");
        return;
      }

      const payload = {
        hotelId: details?._id,
        userId: decoded.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        country: formData.country,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        roomType: formData.selectedRoom!.type,
        adults: parseInt(formData.adults) || 1,
        children: parseInt(formData.children) || 0,
        totalPrice: Number(formData.selectedRoom!.finalPrice),
      };

      console.log("Sending booking payload:", JSON.stringify(payload, null, 2));

      const res = await axios.post(`${backendUrl}/bookings/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Booking response:", res.data);

      if (res.data?.success) {
        router.push({
          pathname: "/paymentpage",
          params: {
            bookingId: res.data.data._id,
            total: String(payload.totalPrice),
          },
        });
      } else {
        Alert.alert("Booking Failed", res.data?.message || "Something went wrong.");
      }
    } catch (err: any) {
      console.error("Booking Error Full:", err.response?.data || err.message);
      const serverMessage = err.response?.data?.message || err.message || "Booking failed.";
      Alert.alert("Booking Error", serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00AEEF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={{flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 10, marginBottom: 10}}>
        <ChevronLeft size={20} color="#f97316" />
        <Text style={{color: '#f97316', fontSize: 16, fontWeight: '600', marginLeft: 5}}>Back</Text>
      </TouchableOpacity>

      {/* Hotel Header */}
      <View style={styles.headerInfo}>
        {details?.images?.[0] && (
          <Image source={{ uri: details.images[0] }} style={styles.hotelImage} />
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.hotelName}>{details?.name || "Hotel Name"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <MapPin size={14} color="#888" />
            <Text style={styles.hotelLocation}> {details?.city}, {details?.district}</Text>
          </View>
        </View>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepRow}>
        {["Guest Info", "Stay Details", "Confirm"].map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepCircle, step === i + 1 && styles.stepCircleActive]}>
              <Text style={[styles.stepNum, step === i + 1 && styles.stepNumActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, step === i + 1 && { color: "#00AEEF" }]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Information</Text>

            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput style={styles.input} placeholder="Enter first name" value={formData.firstName}
              onChangeText={(t) => setFormData({ ...formData, firstName: t })} />

            <Text style={styles.fieldLabel}>Last Name *</Text>
            <TextInput style={styles.input} placeholder="Enter last name" value={formData.lastName}
              onChangeText={(t) => setFormData({ ...formData, lastName: t })} />

            <Text style={styles.fieldLabel}>Email Address *</Text>
            <TextInput style={styles.input} placeholder="email@example.com" value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput style={styles.input} placeholder="+94 77 123 4567" value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              keyboardType="phone-pad" />

            <Text style={styles.fieldLabel}>Country</Text>
            <TextInput style={styles.input} placeholder="Country" value={formData.country}
              onChangeText={(t) => setFormData({ ...formData, country: t })} />
          </View>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay Details</Text>

            <Text style={styles.fieldLabel}>Check-In Date *</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => {
              if (Platform.OS !== "web") { setDateField("checkIn"); setShowDatePicker(true); }
            }}>
              <Calendar size={18} color="#00AEEF" />
              {Platform.OS === "web" ? (
                <TextInput placeholder="YYYY-MM-DD" style={{ flex: 1, marginLeft: 10 }}
                  value={formData.checkIn}
                  onChangeText={(t) => setFormData({ ...formData, checkIn: t })} />
              ) : (
                <Text style={{ marginLeft: 10, color: formData.checkIn ? "#000" : "#aaa", fontSize: 16 }}>
                  {formatDateForDisplay(formData.checkIn) || "Select Check-In Date"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Check-Out Date *</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => {
              if (Platform.OS !== "web") { setDateField("checkOut"); setShowDatePicker(true); }
            }}>
              <Calendar size={18} color="#00AEEF" />
              {Platform.OS === "web" ? (
                <TextInput placeholder="YYYY-MM-DD" style={{ flex: 1, marginLeft: 10 }}
                  value={formData.checkOut}
                  onChangeText={(t) => setFormData({ ...formData, checkOut: t })} />
              ) : (
                <Text style={{ marginLeft: 10, color: formData.checkOut ? "#000" : "#aaa", fontSize: 16 }}>
                  {formatDateForDisplay(formData.checkOut) || "Select Check-Out Date"}
                </Text>
              )}
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker 
                value={formData[dateField] ? new Date(formData[dateField]) : new Date()}
                mode="date" 
                onChange={onDateChange} 
                minimumDate={new Date()} 
              />
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Adults</Text>
                <TextInput style={styles.input} placeholder="1" value={formData.adults}
                  onChangeText={(t) => setFormData({ ...formData, adults: t })} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Children</Text>
                <TextInput style={styles.input} placeholder="0" value={formData.children}
                  onChangeText={(t) => setFormData({ ...formData, children: t })} keyboardType="number-pad" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Select Room Type *</Text>
            {details?.roomTypes?.map((room: Room) => (
              <TouchableOpacity key={room._id}
                style={[styles.roomCard, formData.selectedRoom?._id === room._id && styles.activeRoom]}
                onPress={() => setFormData({ ...formData, selectedRoom: room })}>
                <Bed size={20} color={formData.selectedRoom?._id === room._id ? "white" : "#00AEEF"} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.roomType, formData.selectedRoom?._id === room._id && { color: "white" }]}>
                    {room.type}
                  </Text>
                  <Text style={[styles.roomPrice, formData.selectedRoom?._id === room._id && { color: "white" }]}>
                    LKR {room.finalPrice.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            {[
              ["Guest Name",       `${formData.firstName} ${formData.lastName}`],
              ["Email",            formData.email],
              ["Phone",            formData.phone],
              ["Check-In",         formatDateForDisplay(formData.checkIn)],
              ["Check-Out",        formatDateForDisplay(formData.checkOut)],
              ["Room Type",        formData.selectedRoom?.type ?? ""],
              ["Adults / Children",`${formData.adults} / ${formData.children}`],
              ["Hotel",            details?.name ?? ""],
            ].map(([key, val]) => (
              <View style={styles.summaryRow} key={key}>
                <Text style={styles.summaryKey}>{key}</Text>
                <Text style={styles.boldText}>{val}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalValue}>
              LKR {formData.selectedRoom?.finalPrice.toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <ArrowLeft size={20} color="#333" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={step === 3 ? handleBookingSubmit : handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="white" />
            : <Text style={styles.btnText}>{step === 3 ? "CONFIRM & PAY" : "NEXT →"}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#f8f9fa" },
  center:              { flex: 1, justifyContent: "center", alignItems: "center" },
  headerInfo:          { backgroundColor: "white", padding: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee" },
  hotelImage:          { width: 60, height: 60, borderRadius: 10 },
  headerTextContainer: { marginLeft: 15, flex: 1 },
  hotelName:           { fontSize: 18, fontWeight: "bold" },
  hotelLocation:       { fontSize: 12, color: "#888" },
  stepRow:             { flexDirection: "row", justifyContent: "space-around", paddingVertical: 14, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eee" },
  stepItem:            { alignItems: "center", gap: 4 },
  stepCircle:          { width: 28, height: 28, borderRadius: 14, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  stepCircleActive:    { backgroundColor: "#00AEEF" },
  stepNum:             { fontSize: 13, fontWeight: "bold", color: "#888" },
  stepNumActive:       { color: "white" },
  stepLabel:           { fontSize: 11, color: "#aaa" },
  scrollContent:       { padding: 20, paddingBottom: 40 },
  section:             { marginBottom: 20 },
  sectionTitle:        { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  fieldLabel:          { fontSize: 12, fontWeight: "600", color: "#555", marginBottom: 5, marginTop: 4 },
  input:               { backgroundColor: "white", padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#ddd", fontSize: 14 },
  dateBtn:             { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#ddd" },
  roomCard:            { flexDirection: "row", padding: 15, backgroundColor: "white", borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  activeRoom:          { backgroundColor: "#00AEEF", borderColor: "#00AEEF" },
  roomType:            { fontWeight: "bold", fontSize: 14 },
  roomPrice:           { color: "#00AEEF", fontWeight: "bold", marginTop: 2 },
  summaryCard:         { backgroundColor: "white", padding: 20, borderRadius: 15, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  summaryTitle:        { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  summaryRow:          { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, alignItems: "center" },
  summaryKey:          { color: "#888", fontSize: 13 },
  boldText:            { fontWeight: "bold", fontSize: 13, maxWidth: "60%", textAlign: "right" },
  divider:             { height: 1, backgroundColor: "#eee", marginVertical: 15 },
  totalLabel:          { fontSize: 14, color: "#888" },
  totalValue:          { fontSize: 26, fontWeight: "bold", color: "#00AEEF", marginTop: 4 },
  footer:              { flexDirection: "row", padding: 16, backgroundColor: "white", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#eee" },
  confirmBtn:          { backgroundColor: "#00AEEF", paddingVertical: 15, borderRadius: 10, flex: 1, marginLeft: 10, alignItems: "center" },
  backBtn:             { backgroundColor: "#eee", padding: 15, borderRadius: 10 },
  backBtnText:         { color: "#f97316", fontSize: 16, fontWeight: '600', marginLeft: 5 },
  btnText:             { color: "white", fontWeight: "bold", fontSize: 16 },
});