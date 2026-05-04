import React, { useState, useEffect, useMemo } from "react";
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
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { uploadFile } from "../../lib/supabase";
import { getAuthHeaders } from "../../lib/auth";
import {
  Hotel,
  MapPin,
  BedDouble,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react-native";

// --- SRI LANKA DATA CONSTANTS (මුල් කේතයේ තිබූ පරිදිම) ---
const SRI_LANKA_DATA = { /* ... මෙහි ඔබගේ දත්ත ඇතුළත් කරන්න ... */ };

export default function EditHotelPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "", description: "", province: "", district: "", city: "",
    category: "", rating: "", phone: "", email: "", images: [] as string[],
    roomTypes: [{ type: "", originalPrice: "", finalPrice: "", description: "" }]
  });

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchHotel();
  }, [id]);

  const fetchHotel = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${backendUrl}/hotels/get/${id}`, { headers });
      if (response.data.data) setFormData(response.data.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load hotel data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = (val: string) => {
    setFormData({ ...formData, province: val, district: "", city: "" });
  };

  const handleDistrictChange = (val: string) => {
    setFormData({ ...formData, district: val, city: "" });
  };

  const handleRoomChange = (index: number, field: string, value: string) => {
    const u = [...formData.roomTypes];
    (u[index] as any)[field] = value;
    setFormData({ ...formData, roomTypes: u });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploading(true);
      // මෙහිදී ඔබගේ uploadFile utility එක භාවිතා කරන්න (Image URL එක ලබා ගැනීමට)
      try {
        const imageUrl = await uploadFile(result.assets[0].uri, 'hotels');
        setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
      } catch (e) {
        Alert.alert("Error", "Upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${backendUrl}/hotels/update/${id}`, formData, { headers });
      Alert.alert("Success", "Hotel updated successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to update hotel");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#C8813A" />
      <Text style={styles.loaderText}>Loading Hotel Details...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#6B7280" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit <Text style={{ color: '#6366F1' }}>Hotel</Text></Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          
          {/* Hotel Info Section */}
          <SectionTitle icon={<Hotel size={18} color="#6366F1" />} title="Hotel Information" />
          <InputField label="Hotel Name" value={formData.name} onChangeText={(t: string) => setFormData({...formData, name: t})} />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputField label="Rating" value={formData.rating.toString()} keyboardType="numeric" onChangeText={(t: string) => setFormData({...formData, rating: t})} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Phone" value={formData.phone} keyboardType="phone-pad" onChangeText={(t: string) => setFormData({...formData, phone: t})} />
            </View>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput 
            multiline numberOfLines={3} 
            style={[styles.input, styles.textArea]} 
            value={formData.description} 
            onChangeText={(t: string) => setFormData({...formData, description: t})} 
          />

          {/* Location Section */}
          <SectionTitle icon={<MapPin size={18} color="#6366F1" />} title="Location" />
          <Text style={styles.label}>Province</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={formData.province} onValueChange={handleProvinceChange}>
              <Picker.Item label="Select Province" value="" />
              {Object.keys(SRI_LANKA_DATA).map(p => <Picker.Item key={p} label={p} value={p} />)}
            </Picker>
          </View>

          {/* Room Types Section */}
          <View style={styles.rowBetween}>
            <SectionTitle icon={<BedDouble size={18} color="#6366F1" />} title="Room Types" />
            <TouchableOpacity onPress={() => setFormData({...formData, roomTypes: [...formData.roomTypes, { type: "", originalPrice: "", finalPrice: "", description: "" }]})}>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {formData.roomTypes.map((room, idx) => (
            <View key={idx} style={styles.roomCard}>
              <InputField label="Type" value={room.type} onChangeText={(t: string) => handleRoomChange(idx, "type", t)} />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <InputField label="Final Price" value={room.finalPrice.toString()} keyboardType="numeric" onChangeText={(t: string) => handleRoomChange(idx, "finalPrice", t)} />
                </View>
                <TouchableOpacity onPress={() => setFormData({...formData, roomTypes: formData.roomTypes.filter((_, i) => i !== idx)})} style={styles.deleteBtn}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Photos Section */}
          <SectionTitle icon={<ImageIcon size={18} color="#C8813A" />} title="Photos" />
          <View style={styles.imageGrid}>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#C8813A" /> : <Upload size={24} color="#9CA3AF" />}
            </TouchableOpacity>
            {formData.images.map((url, idx) => (
              <View key={idx} style={styles.imgWrap}>
                <Image source={{ uri: url }} style={styles.previewImg} />
                <TouchableOpacity style={styles.imgDelete} onPress={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})}>
                  <Trash2 size={12} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitBtn, (submitting || uploading) && { backgroundColor: '#D1D5DB' }]} 
            onPress={handleSubmit} 
            disabled={submitting || uploading}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>SAVE CHANGES</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable Components
const SectionTitle = ({ icon, title }: any) => (
  <View style={styles.sectionHeader}>
    {icon}
    <Text style={styles.sectionText}>{title}</Text>
  </View>
);

const InputField = ({ label, ...props }: any) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 10, fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { marginLeft: 5, color: '#6B7280', fontWeight: '500' },
  title: { fontSize: 20, fontWeight: 'bold' },
  formCard: { backgroundColor: 'white', borderRadius: 25, padding: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  sectionText: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 15, padding: 12, fontSize: 14, color: '#1F2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerWrap: { backgroundColor: '#F9FAFB', borderRadius: 15, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15, overflow: 'hidden' },
  roomCard: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  deleteBtn: { padding: 10, marginBottom: 5 },
  addBtn: { color: '#6366F1', fontWeight: 'bold', fontSize: 12 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  uploadBox: { width: 70, height: 70, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  imgWrap: { width: 70, height: 70, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  previewImg: { width: '100%', height: '100%' },
  imgDelete: { position: 'absolute', top: 5, right: 5, backgroundColor: '#EF4444', borderRadius: 10, padding: 4 },
  submitBtn: { backgroundColor: '#C8813A', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: 'white', fontWeight: '900', letterSpacing: 1.5 },
});