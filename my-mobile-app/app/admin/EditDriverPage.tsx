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
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  IdCard,
  Car,
  Save,
  Camera,
  ArrowLeft,
  MapPin,
  FileText,
} from "lucide-react-native";
import { uploadFile } from "../../lib/supabase";
import { getAuthHeaders } from "../../lib/auth";

export default function EditDriverPage() {
  const router = useRouter();
  const { email: driverEmail } = useLocalSearchParams<{ email: string }>();

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "",
    licenseNumber: "", vehicleType: "", profileImage: "", description: ""
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchDriverData();
  }, [driverEmail]);

  const fetchDriverData = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${backendUrl}/driver/get/${driverEmail}`, { headers });
      const driver = response.data.data;
      setFormData(driver);
      setPreview(driver.profileImage);
    } catch (error) {
      Alert.alert("Error", "Failed to load driver details");
      router.back();
    } finally {
      setFetching(false);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setPreview(selectedUri);
      setUploading(true);
      try {
        const uploadedUrl = await uploadFile(selectedUri, 'drivers');
        setPreview(uploadedUrl);
        setFormData(prev => ({ ...prev, profileImage: uploadedUrl }));
      } catch {
        Alert.alert("Upload Failed", "Could not upload driver photo");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${backendUrl}/driver/update/${driverEmail}`, formData, { headers });
      Alert.alert("Success", "Driver updated successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Update Failed", error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Fetching driver details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={18} color="#6B7280" />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Edit <Text style={{ color: "#C8813A" }}>Driver</Text></Text>
            <View style={styles.accentBar} />
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Profile Image Section */}
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                {preview ? (
                  <Image source={{ uri: preview }} style={styles.profileImage} />
                ) : (
                  <User size={50} color="#D1D5DB" />
                )}
                <TouchableOpacity style={styles.cameraBtn} onPress={handleImagePick}>
                  <Camera size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.imageLabel}>DRIVER PROFILE PHOTO</Text>
            </View>

            {/* Inputs Section */}
            <View style={styles.inputGrid}>
              <InputGroup icon={<User size={16} color="#9CA3AF" />} label="Full Name" value={formData.name} onChangeText={(t: string) => setFormData({...formData, name: t})} />
              <InputGroup icon={<Mail size={16} color="#9CA3AF" />} label="Email Address" value={formData.email} editable={false} style={{ opacity: 0.6 }} />
              <InputGroup icon={<Phone size={16} color="#9CA3AF" />} label="Phone Number" value={formData.phone} keyboardType="phone-pad" onChangeText={(t: string) => setFormData({...formData, phone: t})} />
              <InputGroup icon={<IdCard size={16} color="#9CA3AF" />} label="License Number" value={formData.licenseNumber} onChangeText={(t: string) => setFormData({...formData, licenseNumber: t})} />
              <InputGroup icon={<Car size={16} color="#9CA3AF" />} label="Vehicle Type" value={formData.vehicleType} onChangeText={(t: string) => setFormData({...formData, vehicleType: t})} />

              {/* Text Areas */}
              <View style={styles.textAreaGroup}>
                <Text style={styles.label}><MapPin size={12} color="#C8813A" /> Permanent Address</Text>
                <TextInput 
                  multiline numberOfLines={2} 
                  style={[styles.input, styles.textArea]} 
                  value={formData.address} 
                  onChangeText={(t: string) => setFormData({...formData, address: t})} 
                />
              </View>

              <View style={styles.textAreaGroup}>
                <Text style={styles.label}><FileText size={12} color="#C8813A" /> Driver Bio</Text>
                <TextInput 
                  multiline numberOfLines={4} 
                  style={[styles.input, styles.textArea, { height: 100 }]} 
                  value={formData.description} 
                  onChangeText={(t: string) => setFormData({...formData, description: t})} 
                  placeholder="Describe driver experience..."
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitBtn, loading && { backgroundColor: "#9CA3AF" }]} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.btnContent}>
                  <Save size={18} color="white" />
                  <Text style={styles.submitBtnText}>{uploading ? "UPLOADING..." : "UPDATE DRIVER DETAILS"}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InputGroup = ({ icon, label, style, ...props }: any) => (
  <View style={[styles.inputGroup, style]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <View style={styles.iconWrapper}>{icon}</View>
      <TextInput style={styles.input} {...props} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#6B7280", fontWeight: "500" },
  scrollContent: { padding: 20 },
  header: { marginBottom: 30 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backText: { fontSize: 10, fontWeight: "bold", color: "#6B7280", marginLeft: 5, letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: "bold", color: "#111827" },
  accentBar: { width: 50, height: 5, backgroundColor: "#C8813A", borderRadius: 10, marginTop: 8 },
  card: { backgroundColor: "white", borderRadius: 30, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  imageSection: { alignItems: "center", marginBottom: 30 },
  imageContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", position: "relative", borderWidth: 4, borderColor: "#FEE2E2" },
  profileImage: { width: "100%", height: "100%", borderRadius: 60 },
  cameraBtn: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#C8813A", padding: 10, borderRadius: 20, borderWidth: 3, borderColor: "white" },
  imageLabel: { fontSize: 10, fontWeight: "bold", color: "#9CA3AF", marginTop: 10, letterSpacing: 1 },
  inputGrid: { gap: 15 },
  inputGroup: { marginBottom: 5 },
  label: { fontSize: 12, fontWeight: "bold", color: "#374151", marginBottom: 6, marginLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB" },
  iconWrapper: { paddingLeft: 15 },
  input: { flex: 1, padding: 14, fontSize: 14, color: "#1F2937" },
  textAreaGroup: { marginTop: 5 },
  textArea: { backgroundColor: "#F9FAFB", borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", padding: 15, textAlignVertical: "top" },
  submitBtn: { backgroundColor: "#C8813A", padding: 20, borderRadius: 50, marginTop: 30, alignItems: "center" },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitBtnText: { color: "white", fontWeight: "bold", letterSpacing: 1 },
});