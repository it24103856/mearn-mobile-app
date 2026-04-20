import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker"; // Expo භාවිතා කරන්නේ නම්
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { uploadFile } from "../../lib/supabase";
import { getAuthHeaders } from "../../lib/auth";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Type, 
  FileText, 
  Trash2, 
  UploadCloud, 
  MapPin 
} from "lucide-react-native";

// SRI_LANKA_DATA Object එක මෙතනට ඇතුළත් කරන්න (ඔබේ මුල් කේතයේ තිබූ පරිදිම)
const SRI_LANKA_DATA = { /* ... පෙර තිබූ දත්ත ... */ };

const UpdateDestination = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    province: "",
    district: "",
    city: "",
    image: [] as string[]
  });

  useEffect(() => {
    fetchDestination();
  }, [id]);

  const fetchDestination = async () => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axios.get(`${backendUrl}/destinations/${id}`, { headers });
      if (data && data.data) {
        setFormData({
          name: data.data.name || "",
          description: data.data.description || "",
          province: data.data.province || "",
          district: data.data.district || "",
          city: data.data.city || "",
          image: data.data.image || []
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load destination details");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const imageUrl = await uploadFile(result.assets[0].uri, 'destinations');
        setFormData(prev => ({ ...prev, image: [...prev.image, imageUrl] }));
      } catch (error) {
        Alert.alert("Upload Failed");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    setUpdating(true);
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${backendUrl}/destinations/update/${id}`, formData, { headers });
      Alert.alert("Success", "Destination updated successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Update failed!");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#C8813A" />
        <Text style={styles.loaderText}>LOADING RECORD DETAILS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Update <Text style={{ color: "#C8813A" }}>Destination</Text>
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.label}><Type size={16} color="#C8813A" /> Destination Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(val) => setFormData({ ...formData, name: val })}
          />

          <Text style={styles.label}>Province</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.province}
              onValueChange={(val: any) => setFormData({ ...formData, province: val, district: "", city: "" })}
            >
              <Picker.Item label="Select Province" value="" />
              {Object.keys(SRI_LANKA_DATA).map(p => <Picker.Item key={p} label={p} value={p} />)}
            </Picker>
          </View>

          {/* District & City Pickers (මීට සමාන ලෙස සකසන්න) */}

          <Text style={styles.label}><FileText size={16} color="#C8813A" /> Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(val) => setFormData({ ...formData, description: val })}
          />

          <Text style={styles.label}><ImageIcon size={16} color="#C8813A" /> Photos</Text>
          <View style={styles.imageGrid}>
            <TouchableOpacity 
              style={styles.uploadBox} 
              onPress={handleImagePick}
              disabled={uploading}
            >
              {uploading ? <ActivityIndicator color="#C8813A" /> : <UploadCloud size={30} color="#999" />}
            </TouchableOpacity>

            {formData.image.map((url, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: url }} style={styles.previewImage} />
                <TouchableOpacity 
                  onPress={() => setFormData({ ...formData, image: formData.image.filter((_, i) => i !== index) })}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, (updating || uploading) && { backgroundColor: '#CCC' }]} 
            onPress={handleSubmit}
            disabled={updating || uploading}
          >
            <Text style={styles.submitBtnText}>{updating ? "UPDATING..." : "SAVE CHANGES"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  scrollContent: { padding: 20 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 10, fontSize: 10, letterSpacing: 2, color: '#999', fontWeight: 'bold' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  card: { backgroundColor: 'white', borderRadius: 25, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F9F9F9', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#EEE' },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#F9F9F9', borderRadius: 15, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  uploadBox: { width: 80, height: 80, borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  imageWrapper: { width: 80, height: 80, borderRadius: 15, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  deleteBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'red', borderRadius: 10, padding: 4 },
  submitBtn: { backgroundColor: '#C8813A', borderRadius: 30, padding: 18, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: 'white', fontWeight: '900', letterSpacing: 1.5 }
});

export default UpdateDestination;