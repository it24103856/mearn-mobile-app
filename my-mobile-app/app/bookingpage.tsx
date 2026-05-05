import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuthToken } from '../lib/auth';
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, Bed, Calendar, ChevronLeft, MapPin, Users, Truck } from "lucide-react-native";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
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

interface Driver {
  _id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  profileImage?: string;
  vehicleType: string;
}

interface Vehicle {
  _id: string;
  type: string;
  make: string;
  model: string;
  registrationNumber: string;
  seatingCapacity: number;
  hasAC: boolean;
  fuelType: string;
  pricePerKm: number;
}

// Use centralized auth helper

export default function TravelBookingUI() {
  const { id, hotelId, packageId } = useLocalSearchParams<{ id?: string; hotelId?: string; packageId?: string }>();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<"checkIn" | "checkOut">("checkIn");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

const backendUrl = process.env.EXPO_PUBLIC_API_URL;
  const resolvedHotelId = hotelId || id || "";
  const resolvedPackageId = packageId || "";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Sri Lanka",
    checkIn: "",
    checkOut: "",
    selectedDriver: null as Driver | null,
    selectedVehicle: null as Vehicle | null,
    adults: "1",
    children: "0",
    selectedRoom: null as Room | null,
    packageId: resolvedPackageId,
  });

  const fetchDriversAndVehicles = async () => {
    try {
      setDriversLoading(true);
      setVehiclesLoading(true);

      // These endpoints should be public (no auth needed)
      const axiosConfig = {
        headers: {
          "Content-Type": "application/json",
          // Don't send auth token for public endpoints
        },
      };

      const [driversRes, vehiclesRes] = await Promise.all([
        axios.get(`${backendUrl}/driver/customer/get-all`, axiosConfig),
        axios.get(`${backendUrl}/vehicles`, axiosConfig),
      ]);

      console.log("Drivers response:", driversRes.data);
      console.log("Vehicles response:", vehiclesRes.data);

      if (driversRes.data?.data) {
        setDrivers(Array.isArray(driversRes.data.data) ? driversRes.data.data : []);
      }
      if (vehiclesRes.data?.data) {
        setVehicles(Array.isArray(vehiclesRes.data.data) ? vehiclesRes.data.data : []);
      }
    } catch (err: any) {
      console.error("Error fetching drivers/vehicles:", err.response?.status, err.response?.data || err.message);
      if (err.response?.status === 401) {
        console.warn("Unauthorized - these endpoints should be public");
      }
    } finally {
      setDriversLoading(false);
      setVehiclesLoading(false);
    }
  };

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
    fetchDriversAndVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Helpers
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const parseDateStringToDate = (s: string): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const isDateTodayOrFuture = (s: string) => {
    const d = parseDateStringToDate(s);
    if (!d) return false;
    const today = toDateOnly(new Date());
    return toDateOnly(d) >= today;
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
      if (!isValidEmail(formData.email.trim())) { Alert.alert("Invalid Email", "Please enter a valid email address."); return; }
      if (!formData.phone.trim())     { Alert.alert("Missing Info", "Please enter your phone.");      return; }
    }
    if (step === 2) {
      if (!formData.checkIn)  { Alert.alert("Missing Info", "Please select a check-in date.");  return; }
      if (!formData.checkOut) { Alert.alert("Missing Info", "Please select a check-out date."); return; }

      // Parse dates and validate they're today or future
      const checkInDate = parseDateStringToDate(formData.checkIn);
      const checkOutDate = parseDateStringToDate(formData.checkOut);
      if (!checkInDate) { Alert.alert("Invalid Date", "Please select a valid check-in date."); return; }
      if (!checkOutDate) { Alert.alert("Invalid Date", "Please select a valid check-out date."); return; }

      if (!isDateTodayOrFuture(formData.checkIn)) {
        Alert.alert("Invalid Date", "Check-in date must be today or a future date."); return;
      }
      if (!isDateTodayOrFuture(formData.checkOut)) {
        Alert.alert("Invalid Date", "Check-out date must be today or a future date."); return;
      }

      if (toDateOnly(checkOutDate) <= toDateOnly(checkInDate)) {
        Alert.alert("Invalid Dates", "Check-out must be after check-in."); return;
      }
      if (!formData.selectedRoom) { Alert.alert("Missing Info", "Please select a room type."); return; }
    }
    if (step === 3) {
      // If one transport option is selected, both must be selected
      const hasDriver = !!formData.selectedDriver;
      const hasVehicle = !!formData.selectedVehicle;
      
      if (hasDriver && !hasVehicle) { 
        Alert.alert("Missing Info", "Please select a vehicle."); 
        return; 
      }
      if (hasVehicle && !hasDriver) { 
        Alert.alert("Missing Info", "Please select a driver."); 
        return; 
      }
    }
    setStep(step + 1);
  };

  const handleBookingSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Use centralized token helper
      const token = await getAuthToken();

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
        // Only include driver/vehicle if BOTH are selected
        ...(formData.selectedDriver && formData.selectedVehicle && { 
          driverId: formData.selectedDriver._id,
          vehicleId: formData.selectedVehicle._id 
        }),
        ...(resolvedPackageId && { packageId: resolvedPackageId }),
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
      console.error("Booking Error Full:", err.response?.status, err.response?.data || err.message);
      
      // Handle 401 Unauthorized specifically for driver/vehicle creation
      if (err.response?.status === 401) {
        Alert.alert(
          "Authorization Error",
          "Admin must create drivers and vehicles first. Please contact support or try booking without transport options."
        );
      } else {
        const serverMessage = err.response?.data?.message || err.message || "Booking failed.";
        Alert.alert("Booking Error", serverMessage);
      }
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
          {(details?.city || details?.district) && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <MapPin size={14} color="#888" />
              <Text style={styles.hotelLocation}>{` ${details?.city || ""}${details?.city && details?.district ? ", " : ""}${details?.district || ""}`}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepRow}>
        {["Guest Info", "Stay Details", "Transport", "Confirm"].map((label, i) => (
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Transport (Optional)</Text>
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Select a driver and vehicle for your transport, or skip to complete booking without transport.</Text>

            {/* Driver Selection */}
            <Text style={styles.fieldLabel}>Select Driver</Text>
            {driversLoading ? (
              <ActivityIndicator size="small" color="#00AEEF" style={{ marginVertical: 10 }} />
            ) : drivers.length === 0 ? (
              <Text style={styles.noDataText}>No drivers available</Text>
            ) : (
              drivers.map((driver: Driver) => (
                <TouchableOpacity
                  key={driver._id}
                  style={[
                    styles.transportCard,
                    formData.selectedDriver?._id === driver._id && styles.activeTransport,
                  ]}
                  onPress={() => setFormData({ ...formData, selectedDriver: driver })}
                >
                  <Users size={20} color={formData.selectedDriver?._id === driver._id ? "white" : "#00AEEF"} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={[
                        styles.transportName,
                        formData.selectedDriver?._id === driver._id && { color: "white" },
                      ]}
                    >
                      {driver.name}
                    </Text>
                    <Text
                      style={[
                        styles.transportDetail,
                        formData.selectedDriver?._id === driver._id && { color: "rgba(255,255,255,0.8)" },
                      ]}
                    >
                      📞 {driver.phone}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Vehicle Selection */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Select Vehicle</Text>
            {vehiclesLoading ? (
              <ActivityIndicator size="small" color="#00AEEF" style={{ marginVertical: 10 }} />
            ) : vehicles.length === 0 ? (
              <Text style={styles.noDataText}>No vehicles available</Text>
            ) : (
              vehicles.map((vehicle: Vehicle) => (
                <TouchableOpacity
                  key={vehicle._id}
                  style={[
                    styles.transportCard,
                    formData.selectedVehicle?._id === vehicle._id && styles.activeTransport,
                  ]}
                  onPress={() => setFormData({ ...formData, selectedVehicle: vehicle })}
                >
                  <Truck size={20} color={formData.selectedVehicle?._id === vehicle._id ? "white" : "#00AEEF"} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={[
                        styles.transportName,
                        formData.selectedVehicle?._id === vehicle._id && { color: "white" },
                      ]}
                    >
                      {vehicle.make} {vehicle.model}
                    </Text>
                    <Text
                      style={[
                        styles.transportDetail,
                        formData.selectedVehicle?._id === vehicle._id && { color: "rgba(255,255,255,0.8)" },
                      ]}
                    >
                      🚗 {vehicle.type} • 👥 {vehicle.seatingCapacity} seats • {vehicle.hasAC ? "❄️ AC" : "No AC"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
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
              ["Driver",           formData.selectedDriver?.name ?? ""],
              ["Vehicle",          formData.selectedVehicle ? `${formData.selectedVehicle.make} ${formData.selectedVehicle.model}` : ""],
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
          onPress={step === 4 ? handleBookingSubmit : handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="white" />
            : <Text style={styles.btnText}>{step === 4 ? "CONFIRM & PAY" : "NEXT →"}</Text>
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
  transportCard:       { flexDirection: "row", padding: 16, backgroundColor: "white", borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  activeTransport:     { backgroundColor: "#00AEEF", borderColor: "#00AEEF" },
  transportName:       { fontWeight: "bold", fontSize: 14, color: "#333" },
  transportDetail:     { color: "#888", fontSize: 12, marginTop: 4 },
  noDataText:          { fontSize: 14, color: "#999", textAlign: "center", paddingVertical: 16 },
});