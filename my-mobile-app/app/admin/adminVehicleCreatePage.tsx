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
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import {
  Car,
  Settings,
  Upload,
  Fuel,
  Briefcase,
  DollarSign,
  ArrowLeft,
  Trash2,
  Wind,
} from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { uploadFile } from "../../lib/supabase";
import { getAuthHeaders } from "../../lib/auth";

export default function AdminVehicleCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL; // API URL එක මෙහි ලබාදෙන්න

  // 1. Fetch Drivers
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${backendUrl}/driver/customer/get-all`, { headers });
      if (res.data?.data) setDrivers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
    }
  };

  // 2. Handle Image Upload (Expo Image Picker)
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

  // 3. Submit Form
  const handleSubmit = async () => {
    if (images.length === 0) return Alert.alert("Required", "Please upload at least one image");

    // Basic validations
    if (!formData.make.trim()) return Alert.alert("Validation", "Please enter the vehicle make.");
    if (!formData.model.trim()) return Alert.alert("Validation", "Please enter the vehicle model.");
    if (!formData.registrationNumber.trim()) return Alert.alert("Validation", "Please enter registration number.");
    const seats = parseInt(String(formData.seatingCapacity || "0"), 10);
    if (isNaN(seats) || seats < 1) return Alert.alert("Validation", "Seating capacity must be at least 1.");
    const price = parseFloat(String(formData.pricePerKm || formData.pricePerKm));
    if (isNaN(price) || price <= 0) return Alert.alert("Validation", "Price per KM must be a number greater than 0.");

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const payload = { 
        ...formData, 
        seatingCapacity: seats,
        images,
        driverId: formData.driverId === "" ? undefined : formData.driverId 
      };
      await axios.post(`${backendUrl}/vehicles`, payload, { headers });
      Alert.alert("Success", "Vehicle created successfully");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Something went wrong during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title}>Add <Text style={{ color: "#C8813A" }}>New Vehicle</Text></Text>
          </View>

          {/* Form Content */}
          <View style={styles.card}>
            <SectionHeader icon={<Car size={20} color="#C8813A" />} title="Vehicle Details" />
            
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

            <InputField label="Registration Number" placeholder="WP CAS-1234" value={formData.registrationNumber} onChangeText={(t: string) => setFormData({...formData, registrationNumber: t})} />
            
            <View style={styles.row}>
               <View style={{ flex: 1, marginRight: 10 }}>
                 <InputField label="Make" placeholder="Toyota" value={formData.make} onChangeText={(t: string) => setFormData({...formData, make: t})} />
               </View>
               <View style={{ flex: 1 }}>
                 <InputField label="Model" placeholder="Prius" value={formData.model} onChangeText={(t: string) => setFormData({...formData, model: t})} />
               </View>
            </View>

            <SectionHeader icon={<Settings size={20} color="#C8813A" />} title="Specifications" />
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Seats</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seats"
                  value={formData.seatingCapacity}
                  keyboardType="number-pad"
                  maxLength={2}
                  returnKeyType="done"
                  onChangeText={(t: string) =>
                    setFormData({ ...formData, seatingCapacity: t.replace(/[^0-9]/g, "") })
                  }
                />
              </View>
               <View style={{ width: 10 }} />
               <IconInput icon={<Briefcase size={18} color="#9CA3AF" />} placeholder="Bags" value={formData.luggageCapacity} keyboardType="numeric" onChangeText={(t: string) => setFormData({...formData, luggageCapacity: t})} />
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
                    <Picker.Item label="Electric" value="Electric" />
                  </Picker>
               </View>
               <View style={{ width: 10 }} />
               <IconInput icon={<DollarSign size={18} color="#C8813A" />} placeholder="Price/KM" value={formData.pricePerKm} keyboardType="numeric" onChangeText={(t: string) => setFormData({...formData, pricePerKm: t})} isPrice />
            </View>

            {/* AC Toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLeft}>
                <Wind size={20} color="#C8813A" />
                <Text style={styles.toggleText}>Air Conditioning (A/C)</Text>
              </View>
              <Switch
                trackColor={{ false: "#E5E7EB", true: "#C8813A50" }}
                thumbColor={formData.hasAC ? "#C8813A" : "#F4F3F4"}
                onValueChange={(val) => setFormData({...formData, hasAC: val})}
                value={formData.hasAC}
              />
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>Assign Driver (Optional)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.driverId}
                onValueChange={(val: string) => setFormData({...formData, driverId: val})}
              >
                <Picker.Item label="No Driver Assigned" value="" />
                {drivers.map(d => <Picker.Item key={d._id} label={d.name} value={d._id} />)}
              </Picker>
            </View>

            {/* Photos Section */}
            <SectionHeader icon={<Upload size={20} color="#C8813A" />} title="Photos" />
            <View style={styles.imageGrid}>
               <TouchableOpacity style={styles.uploadBtn} onPress={handleImagePick} disabled={uploading}>
                  {uploading ? <ActivityIndicator color="#C8813A" /> : <Upload size={24} color="#D1D5DB" />}
                  <Text style={styles.uploadLabel}>UPLOAD</Text>
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

            <TouchableOpacity style={[styles.submitBtn, loading && { backgroundColor: '#D1D5DB' }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>REGISTER VEHICLE</Text>}
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
  <View style={[styles.iconInput, isPrice && { backgroundColor: '#C8813A0A', borderColor: '#C8813A20' }]}>
    {icon}
    <TextInput style={[styles.inputBase, isPrice && { color: '#C8813A', fontWeight: 'bold' }]} {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  scrollContainer: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  backBtn: { padding: 8, backgroundColor: "#F3F4F6", borderRadius: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  card: { backgroundColor: "white", borderRadius: 30, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1F2937", marginLeft: 8 },
  label: { fontSize: 13, fontWeight: "bold", color: "#374151", marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 18, padding: 15, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  iconInput: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 18, paddingHorizontal: 15, height: 55 },
  inputBase: { flex: 1, marginLeft: 10, fontSize: 14 },
  pickerContainer: { backgroundColor: "#F9FAFB", borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 15, overflow: "hidden" },
  toggleContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#C8813A08", padding: 15, borderRadius: 18, marginTop: 10 },
  toggleLeft: { flexDirection: "row", alignItems: "center" },
  toggleText: { fontSize: 14, fontWeight: "bold", color: "#374151", marginLeft: 10 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  uploadBtn: { width: 85, height: 85, borderRadius: 20, borderStyle: "dashed", borderWidth: 2, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  uploadLabel: { fontSize: 8, fontWeight: "bold", color: "#9CA3AF", marginTop: 4 },
  imageWrap: { width: 85, height: 85, borderRadius: 20, overflow: "hidden", position: "relative" },
  img: { width: "100%", height: "100%" },
  removeImg: { position: "absolute", top: 5, right: 5, backgroundColor: "#EF4444", borderRadius: 10, padding: 5 },
  submitBtn: { backgroundColor: "#C8813A", padding: 20, borderRadius: 50, marginTop: 30, alignItems: "center", shadowColor: "#C8813A", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: "white", fontWeight: "900", letterSpacing: 1.5, fontSize: 13 },
});