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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import Toast from "react-native-toast-message";
import { uploadFile } from "../../lib/supabase";
import { getAuthHeaders } from "../../lib/auth";
import {
  ArrowLeft,
  Image as ImageIcon,
  Type,
  FileText,
  Trash2,
  UploadCloud,
  MapPin,
} from "lucide-react-native";

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || "";

const SRI_LANKA_DATA: Record<string, Record<string, string[]>> = {
  Western: {
    Colombo: ["Colombo 01-15", "Dehiwala", "Mount Lavinia", "Moratuwa", "Kotte", "Battaramulla", "Maharagama", "Kesbewa", "Avissawella", "Homagama", "Hanwella"],
    Gampaha: ["Negombo", "Gampaha", "Veyangoda", "Wattala", "Ja-Ela", "Kadawatha", "Kelaniya", "Kiribathgoda", "Minuwangoda", "Nittambuwa"],
    Kalutara: ["Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Wadduwa"],
  },
  Central: {
    Kandy: ["Kandy", "Peradeniya", "Gampola", "Nawalapitiya", "Katugastota", "Kundasale", "Digana", "Gelioya"],
    Matale: ["Matale", "Dambulla", "Sigiriya", "Ukuwela", "Pallepola"],
    "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Walapane", "Hanguranketha"],
  },
  Southern: {
    Galle: ["Galle", "Hikkaduwa", "Ambalangoda", "Baddegama", "Bentota", "Karapitiya", "Elpitiya", "Ahangama"],
    Matara: ["Matara", "Weligama", "Mirissa", "Dikwella", "Hakmana", "Deniyaya", "Kamburupitiya"],
    Hambantota: ["Hambantota", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta"],
  },
  "North Western": {
    Kurunegala: ["Kurunegala", "Kuliyapitiya", "Narammala", "Wariyapola", "Pannala", "Polgahawela"],
    Puttalam: ["Puttalam", "Chilaw", "Marawila", "Wennappuwa", "Kalpitiya", "Dankotuwa"],
  },
  "North Central": {
    Anuradhapura: ["Anuradhapura", "Eppawala", "Kekirawa", "Medawachchiya", "Mihintale", "Thalawa"],
    Polonnaruwa: ["Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda"],
  },
  Uva: {
    Badulla: ["Badulla", "Bandarawela", "Hali-Ela", "Ella", "Mahiyanganaya", "Welimada", "Passara"],
    Monaragala: ["Monaragala", "Wellawaya", "Buttala", "Bibile", "Kataragama"],
  },
  Sabaragamuwa: {
    Rathnapura: ["Rathnapura", "Balangoda", "Embilipitiya", "Pelmadulla", "Eheliyagoda", "Kuruwita"],
    Kegalle: ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Deraniyagala"],
  },
  Northern: {
    Jaffna: ["Jaffna", "Chavakachcheri", "Point Pedro", "Karainagar"],
    Kilinochchi: ["Kilinochchi", "Pallai"],
    Mannar: ["Mannar", "Nanattan"],
    Vavuniya: ["Vavuniya", "Cheddikulam"],
    Mullaitivu: ["Mullaitivu", "Oddusuddan"],
  },
  Eastern: {
    Trincomalee: ["Trincomalee", "Kinniya", "Mutur"],
    Batticaloa: ["Batticaloa", "Eravur", "Kattankudy", "Valaichchenai"],
    Ampara: ["Ampara", "Akkaraipattu", "Kalmunai", "Sainthamaruthu"],
  },
};

interface FormData {
  name: string;
  description: string;
  province: string;
  district: string;
  city: string;
  image: string[];
}

const UpdateDestination = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    province: "",
    district: "",
    city: "",
    image: [],
  });

  useEffect(() => {
    fetchDestination();
  }, [id]);

  const fetchDestination = async () => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axios.get(`${backendUrl}/destinations/${id}`, { headers });
      if (data?.data) {
        setFormData({
          name: data.data.name || "",
          description: data.data.description || "",
          province: data.data.province || "",
          district: data.data.district || "",
          city: data.data.city || "",
          image: data.data.image || [],
        });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load destination details" });
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProvinceChange = (province: string) => {
    setFormData((prev) => ({ ...prev, province, district: "", city: "" }));
  };

  const handleDistrictChange = (district: string) => {
    setFormData((prev) => ({ ...prev, district, city: "" }));
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(result.assets.map((asset) => uploadFile(asset.uri, "destinations")));
      setFormData((prev) => ({ ...prev, image: [...prev.image, ...uploadedUrls] }));
      Toast.show({ type: "success", text1: "Image uploaded" });
    } catch {
      Toast.show({ type: "error", text1: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, image: prev.image.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.province || !formData.district || !formData.city) {
      Toast.show({ type: "error", text1: "Please complete all destination fields" });
      return;
    }

    if (formData.image.length === 0) {
      Toast.show({ type: "error", text1: "Upload at least one image" });
      return;
    }

    if (!backendUrl) {
      Toast.show({ type: "error", text1: "Backend URL is missing" });
      return;
    }

    setUpdating(true);
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${backendUrl}/destinations/update/${id}`, formData, { headers });
      Toast.show({ type: "success", text1: "Destination updated" });
      router.replace("/admin/adminDestination");
    } catch (error: any) {
      Toast.show({ type: "error", text1: error.response?.data?.message || "Update failed" });
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
      <Toast />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.title}>
            Update <Text style={styles.titleAccent}>Destination</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}><Type size={16} color="#C8813A" /> Name</Text>
            <TextInput
              value={formData.name}
              onChangeText={(value) => setField("name", value)}
              placeholder="Destination name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
              <Text style={styles.label}><MapPin size={16} color="#C8813A" /> Province</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={formData.province} onValueChange={handleProvinceChange}>
                  <Picker.Item label="Select Province" value="" />
                  {Object.keys(SRI_LANKA_DATA).map((province) => (
                    <Picker.Item key={province} label={province} value={province} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={[styles.field, styles.flex1]}>
              <Text style={styles.label}><MapPin size={16} color="#C8813A" /> District</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={formData.district} onValueChange={handleDistrictChange} enabled={!!formData.province}>
                  <Picker.Item label="Select District" value="" />
                  {formData.province ? Object.keys(SRI_LANKA_DATA[formData.province]).map((district) => (
                    <Picker.Item key={district} label={district} value={district} />
                  )) : null}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}><MapPin size={16} color="#C8813A" /> City</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.city} onValueChange={(city) => setField("city", city)} enabled={!!formData.district}>
                <Picker.Item label="Select City" value="" />
                {formData.province && formData.district
                  ? SRI_LANKA_DATA[formData.province][formData.district].map((city) => (
                      <Picker.Item key={city} label={city} value={city} />
                    ))
                  : null}
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}><FileText size={16} color="#C8813A" /> Description</Text>
            <TextInput
              value={formData.description}
              onChangeText={(value) => setField("description", value)}
              placeholder="Description"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}><ImageIcon size={16} color="#C8813A" /> Images</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={handleImageUpload} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#C8813A" /> : <UploadCloud size={24} color="#C8813A" />}
              <Text style={styles.uploadText}>{uploading ? "Uploading..." : "Add Photos"}</Text>
            </TouchableOpacity>

            <View style={styles.imageGrid}>
              {formData.image.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageCard}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                    <Trash2 size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.submitButton, (updating || uploading) && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={updating || uploading}>
            <Text style={styles.submitText}>{updating ? "Updating..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDFD",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDFDFD",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 10,
    letterSpacing: 2,
    color: "#999",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    flex: 1,
    textAlign: "right",
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  titleAccent: {
    color: "#C8813A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#111827",
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#F0D2AE",
    backgroundColor: "#FFF9F1",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  uploadText: {
    color: "#9A6430",
    fontWeight: "700",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageCard: {
    width: "48%",
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: "#C8813A",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});

export default UpdateDestination;