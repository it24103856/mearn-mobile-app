import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import {
  Car,
  Settings,
  Upload,
  Fuel,
  Users,
  Briefcase,
  DollarSign,
  ChevronLeft,
  Trash2,
  Save,
} from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { uploadFile } from "../../lib/supabase";
import { getAuthHeaders } from "../../lib/auth";

export default function AdminVehicleUpdatePage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    type: "Car",
    make: "",
    model: "",
    registrationNumber: "",
    seatingCapacity: "",
    luggageCapacity: "",
    hasAC: true,
    fuelType: "Petrol",
    pricePerKm: "",
    driverId: "",
  });

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      // Fetch Vehicle
      const vehicleRes = await axios.get(`${backendUrl}/vehicles/${id}`, { headers });
      if (vehicleRes.data.success) {
        const v = vehicleRes.data.data;
        setFormData({
          type: v.type || "Car",
          make: v.make || "",
          model: v.model || "",
          registrationNumber: v.registrationNumber || "",
          seatingCapacity: v.seatingCapacity?.toString() || "",
          luggageCapacity: v.luggageCapacity?.toString() || "",
          hasAC: v.hasAC ?? true,
          fuelType: v.fuelType || "Petrol",
          pricePerKm: v.pricePerKm?.toString() || "",
          driverId: v.driverId || "",
        });
        setImages(v.images || []);
      }

      // Fetch Drivers
      const driverRes = await axios.get(`${backendUrl}/driver/customer/get-all`, { headers });
      if (driverRes.data?.data) setDrivers(driverRes.data.data);

    } catch (err) {
      Alert.alert("Error", "Failed to load vehicle data");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const newUrls = await Promise.all(result.assets.map((asset) => uploadFile(asset.uri, 'vehicles')));
        setImages(prev => [...prev, ...newUrls]);
      } catch (e) {
        Alert.alert("Upload Failed");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (images.length === 0) return Alert.alert("Required", "At least one image is required");

    // Basic validations
    if (!formData.make.trim()) return Alert.alert("Validation", "Please enter the vehicle make.");
    if (!formData.model.trim()) return Alert.alert("Validation", "Please enter the vehicle model.");
    if (!formData.registrationNumber.trim()) return Alert.alert("Validation", "Please enter registration number.");
    const seats = parseInt(String(formData.seatingCapacity || "0"), 10);
    if (isNaN(seats) || seats < 1) return Alert.alert("Validation", "Seating capacity must be at least 1.");
    const price = parseFloat(String(formData.pricePerKm || formData.pricePerKm));
    if (isNaN(price) || price <= 0) return Alert.alert("Validation", "Price per KM must be a number greater than 0.");

    setUpdating(true);
    try {
      const headers = await getAuthHeaders();
      const payload = { ...formData, images };
      await axios.put(`${backendUrl}/vehicles/${id}`, payload, { headers });
      Alert.alert("Success", "Vehicle updated successfully");
      router.back();
    } catch (err: any) {
      Alert.alert("Update Failed", err?.response?.data?.message || "Failed to update vehicle");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Fetching Asset Data...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#6B7280" />
              <Text style={styles.backText}>INVENTORY</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Edit <Text style={{ color: "#6366F1" }}>Vehicle</Text></Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <SectionHeader icon={<Car size={18} color="#6366F1" />} title="Essential Information" />
            
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.type}
                onValueChange={(val: string) => setFormData({...formData, type: val})}
              >
                <Picker.Item label="Car" value="Car" />
                <Picker.Item label="Van" value="Van" />
                <Picker.Item label="SUV" value="SUV" />
                <Picker.Item label="Bus" value="Bus" />
              </Picker>
            </View>

            <InputField label="Reg. Number" value={formData.registrationNumber} onChangeText={(t: string) => setFormData({...formData, registrationNumber: t})} />
            <View style={styles.row}>
               <View style={{ flex: 1, marginRight: 10 }}>
                 <InputField label="Make" value={formData.make} onChangeText={(t: string) => setFormData({...formData, make: t})} />
               </View>
               <View style={{ flex: 1 }}>
                 <InputField label="Model" value={formData.model} onChangeText={(t: string) => setFormData({...formData, model: t})} />
               </View>
            </View>

            <SectionHeader icon={<Settings size={18} color="#6366F1" />} title="Performance & Capacity" />
            
            <View style={styles.row}>
               <IconInput icon={<Users size={18} color="#9CA3AF" />} placeholder="Seats" value={formData.seatingCapacity} keyboardType="numeric" onChangeText={(t: string) => setFormData({...formData, seatingCapacity: t})} />
               <View style={{ width: 10 }} />
               <IconInput icon={<Briefcase size={18} color="#9CA3AF" />} placeholder="Luggage" value={formData.luggageCapacity} keyboardType="numeric" onChangeText={(t: string) => setFormData({...formData, luggageCapacity: t})} />
            </View>

            <View style={[styles.row, { marginTop: 15 }]}>
               <View style={[styles.iconInput, { flex: 1 }]}>
                  <Fuel size={18} color="#9CA3AF" />
                  <Picker
                    style={{ flex: 1 }}
                    selectedValue={formData.fuelType}
                    onValueChange={(val: string) => setFormData({...formData, fuelType: val})}
                  >
                    <Picker.Item label="Petrol" value="Petrol" />
                    <Picker.Item label="Diesel" value="Diesel" />
                    <Picker.Item label="Hybrid" value="Hybrid" />
                  </Picker>
               </View>
               <View style={{ width: 10 }} />
               <IconInput icon={<DollarSign size={18} color="#6366F1" />} placeholder="Price/KM" value={formData.pricePerKm} keyboardType="numeric" onChangeText={(t: string) => setFormData({...formData, pricePerKm: t})} isPrice />
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>Assign Driver</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.driverId}
                onValueChange={(val: string) => setFormData({...formData, driverId: val})}
              >
                <Picker.Item label="No Driver Assigned" value="" />
                {drivers.map(d => <Picker.Item key={d._id} label={d.name} value={d._id} />)}
              </Picker>
            </View>

            {/* Asset Gallery */}
            <Text style={[styles.label, { marginTop: 20 }]}>Asset Gallery</Text>
            <View style={styles.imageGrid}>
               <TouchableOpacity style={styles.uploadBtn} onPress={handleImagePick} disabled={uploading}>
                  {uploading ? <ActivityIndicator color="#6366F1" /> : <Upload size={24} color="#D1D5DB" />}
               </TouchableOpacity>
               {images.map((url, idx) => (
                 <View key={idx} style={styles.imageWrap}>
                    <Image source={{ uri: url }} style={styles.img} />
                    <TouchableOpacity style={styles.removeImg} onPress={() => setImages(images.filter((_, i) => i !== idx))}>
                       <Trash2 size={14} color="white" />
                    </TouchableOpacity>
                 </View>
               ))}
            </View>

            <TouchableOpacity style={[styles.submitBtn, updating && { backgroundColor: '#D1D5DB' }]} onPress={handleUpdate} disabled={updating}>
              {updating ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>UPDATE ASSET DETAILS</Text>}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Sub-components
const SectionHeader = ({ icon, title }: any) => (
  <View style={styles.sectionHeader}>
    {icon}
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const InputField = ({ label, ...props }: any) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
  </View>
);

const IconInput = ({ icon, isPrice, ...props }: any) => (
  <View style={[styles.iconInput, isPrice && { backgroundColor: '#6366F10A', borderColor: '#6366F120' }]}>
    {icon}
    <TextInput style={[styles.inputBase, isPrice && { color: '#6366F1', fontWeight: 'bold' }]} {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#9CA3AF" },
  scrollContainer: { padding: 20 },
  header: { marginBottom: 25 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { fontSize: 10, fontWeight: "bold", color: "#6B7280", marginLeft: 5, letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: "bold", color: "#111827" },
  card: { backgroundColor: "white", borderRadius: 30, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: "#6366F1", marginLeft: 8, letterSpacing: 1 },
  label: { fontSize: 11, fontWeight: "bold", color: "#9CA3AF", marginBottom: 8, marginLeft: 5, textTransform: 'uppercase' },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 18, padding: 15, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  iconInput: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 18, paddingHorizontal: 15, height: 55 },
  inputBase: { flex: 1, marginLeft: 10, fontSize: 14 },
  pickerContainer: { backgroundColor: "#F9FAFB", borderRadius: 18, borderWidth: 1, borderColor: "#F3F4F6", marginBottom: 15, overflow: "hidden" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  uploadBtn: { width: 80, height: 80, borderRadius: 20, borderStyle: "dashed", borderWidth: 2, borderColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  imageWrap: { width: 80, height: 80, borderRadius: 20, overflow: "hidden", position: "relative" },
  img: { width: "100%", height: "100%" },
  removeImg: { position: "absolute", top: 5, right: 5, backgroundColor: "#EF4444", borderRadius: 10, padding: 5 },
  submitBtn: { backgroundColor: "#6366F1", padding: 20, borderRadius: 50, marginTop: 30, alignItems: "center", shadowColor: "#6366F1", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: "white", fontWeight: "900", letterSpacing: 1.5, fontSize: 12 },
});