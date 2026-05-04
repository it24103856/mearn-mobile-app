import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { getAuthHeaders } from "../../lib/auth";

// ── Dependencies ──────────────────────────────────────────────────────────────
// expo install expo-image-picker
// npm install axios

// ── Sri Lanka Data ────────────────────────────────────────────────────────────
const SRI_LANKA_DATA: Record<string, Record<string, string[]>> = {
  "Western": {
    "Colombo": ["Colombo 01-15","Dehiwala","Mount Lavinia","Moratuwa","Kotte","Battaramulla","Maharagama","Kesbewa","Avissawella","Homagama","Hanwella"],
    "Gampaha": ["Negombo","Gampaha","Veyangoda","Wattala","Ja-Ela","Kadawatha","Kelaniya","Kiribathgoda","Minuwangoda","Nittambuwa"],
    "Kalutara": ["Kalutara","Panadura","Horana","Beruwala","Aluthgama","Matugama","Wadduwa"],
  },
  "Central": {
    "Kandy": ["Kandy","Peradeniya","Gampola","Nawalapitiya","Katugastota","Kundasale","Digana","Gelioya"],
    "Matale": ["Matale","Dambulla","Sigiriya","Ukuwela","Pallepola"],
    "Nuwara Eliya": ["Nuwara Eliya","Hatton","Talawakele","Walapane","Hanguranketha"],
  },
  "Southern": {
    "Galle": ["Galle","Hikkaduwa","Ambalangoda","Baddegama","Bentota","Karapitiya","Elpitiya","Ahangama"],
    "Matara": ["Matara","Weligama","Mirissa","Dikwella","Hakmana","Deniyaya","Kamburupitiya"],
    "Hambantota": ["Hambantota","Tangalle","Tissamaharama","Ambalantota","Beliatta"],
  },
  "North Western": {
    "Kurunegala": ["Kurunegala","Kuliyapitiya","Narammala","Wariyapola","Pannala","Polgahawela"],
    "Puttalam": ["Puttalam","Chilaw","Marawila","Wennappuwa","Kalpitiya","Dankotuwa"],
  },
  "North Central": {
    "Anuradhapura": ["Anuradhapura","Eppawala","Kekirawa","Medawachchiya","Mihintale","Thalawa"],
    "Polonnaruwa": ["Polonnaruwa","Kaduruwela","Medirigiriya","Hingurakgoda"],
  },
  "Uva": {
    "Badulla": ["Badulla","Bandarawela","Hali-Ela","Ella","Mahiyanganaya","Welimada","Passara"],
    "Monaragala": ["Monaragala","Wellawaya","Buttala","Bibile","Kataragama"],
  },
  "Sabaragamuwa": {
    "Rathnapura": ["Rathnapura","Balangoda","Embilipitiya","Pelmadulla","Eheliyagoda","Kuruwita"],
    "Kegalle": ["Kegalle","Mawanella","Warakapola","Rambukkana","Deraniyagala"],
  },
  "Northern": {
    "Jaffna": ["Jaffna","Chavakachcheri","Point Pedro","Karainagar"],
    "Kilinochchi": ["Kilinochchi","Pallai"],
    "Mannar": ["Mannar","Nanattan"],
    "Vavuniya": ["Vavuniya","Cheddikulam"],
    "Mullaitivu": ["Mullaitivu","Oddusuddan"],
  },
  "Eastern": {
    "Trincomalee": ["Trincomalee","Kinniya","Mutur"],
    "Batticaloa": ["Batticaloa","Eravur","Kattankudy","Valaichchenai"],
    "Ampara": ["Ampara","Akkaraipattu","Kalmunai","Sainthamaruthu"],
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface RoomType {
  type: string;
  originalPrice: string;
  finalPrice: string;
  description: string;
}

interface FormDataState {
  name: string;
  description: string;
  province: string;
  district: string;
  city: string;
  category: string;
  rating: string;
  phone: string;
  email: string;
  images: string[];
  roomTypes: RoomType[];
}

interface EditHotelPageProps {
  id?: string;
  navigation?: any;
  backendUrl?: string;
  token?: string;
  uploadFile?: (file: any) => Promise<string | null>;
}

// ── InputField Component (exact match to web) ─────────────────────────────────
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
}) {
  return (
    <View style={inputFieldStyles.wrapper}>
      {label ? <Text style={inputFieldStyles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#D1D5DB"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={editable}
        style={[
          inputFieldStyles.input,
          multiline && { height: numberOfLines * 48, textAlignVertical: "top" },
          !editable && { opacity: 0.5 },
        ]}
      />
    </View>
  );
}

const inputFieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 0 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    fontSize: 14,
    color: "#111827",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
});

// ── SelectField Component (replaces <select>) ─────────────────────────────────
function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={selectStyles.wrapper}>
      <Text style={selectStyles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        style={[selectStyles.trigger, disabled && selectStyles.triggerDisabled]}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={value ? selectStyles.triggerValueText : selectStyles.triggerPlaceholderText}>
          {value || `Select ${label}`}
        </Text>
        <Text style={selectStyles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={selectStyles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={selectStyles.modalBox}>
            <Text style={selectStyles.modalTitle}>Select {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[selectStyles.option, value === item && selectStyles.optionActive]}
                  onPress={() => { onChange(item); setOpen(false); }}
                >
                  <Text style={[selectStyles.optionText, value === item && selectStyles.optionTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setOpen(false)} style={selectStyles.closeBtn}>
              <Text style={selectStyles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const selectStyles = StyleSheet.create({
  wrapper: { marginBottom: 0 },
  label: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
  },
  triggerDisabled: { opacity: 0.5 },
  triggerValueText: { fontSize: 14, color: "#111827", fontWeight: "500" },
  triggerPlaceholderText: { fontSize: 14, color: "#D1D5DB" },
  arrow: { fontSize: 14, color: "#9CA3AF" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionActive: { backgroundColor: "#EEF2FF" },
  optionText: { fontSize: 14, color: "#4B5563", fontWeight: "500" },
  optionTextActive: { color: "#6366F1", fontWeight: "700" },
  closeBtn: { padding: 14, alignItems: "center", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  closeBtnText: { color: "#6366F1", fontWeight: "800", fontSize: 13 },
});

// ── Main EditHotelPage Component ──────────────────────────────────────────────
export default function EditHotelPage({
  id,
  navigation,
  backendUrl = "",
  token = "",
  uploadFile,
}: EditHotelPageProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const hotelId = id || (Array.isArray(params.id) ? params.id[0] : params.id) || "";
  const apiBaseUrl = backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || "";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    description: "",
    province: "",
    district: "",
    city: "",
    category: "",
    rating: "",
    phone: "",
    email: "",
    images: [],
    roomTypes: [{ type: "", originalPrice: "", finalPrice: "", description: "" }],
  });

  // Derived location lists
  const provinceOptions = useMemo(() => Object.keys(SRI_LANKA_DATA), []);
  const districtOptions = useMemo(
    () => (formData.province ? Object.keys(SRI_LANKA_DATA[formData.province]) : []),
    [formData.province]
  );
  const cityOptions = useMemo(
    () =>
      formData.province && formData.district
        ? SRI_LANKA_DATA[formData.province][formData.district] ?? []
        : [],
    [formData.province, formData.district]
  );

  // ── Fetch hotel on mount ──
  useEffect(() => {
    const fetchHotel = async () => {
      try {
        if (!apiBaseUrl || !hotelId) {
          throw new Error("Missing hotel id or backend URL");
        }
        const headers = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
        const { data } = await axios.get(`${apiBaseUrl}/hotels/get/${hotelId}`, { headers });
        if (data.data) setFormData(data.data);
      } catch {
        Alert.alert("Error", "Failed to load hotel data");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [apiBaseUrl, hotelId, router, token]);

  // ── Field change handlers ──
  const handleChange = (name: keyof FormDataState, value: string) => {
    if (name === "province") {
      setFormData({ ...formData, province: value, district: "", city: "" });
    } else if (name === "district") {
      setFormData({ ...formData, district: value, city: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ── Room handlers ──
  const handleRoomChange = (index: number, field: keyof RoomType, value: string) => {
    const u = [...formData.roomTypes];
    u[index] = { ...u[index], [field]: value };
    setFormData({ ...formData, roomTypes: u });
  };

  const addRoom = () =>
    setFormData({
      ...formData,
      roomTypes: [...formData.roomTypes, { type: "", originalPrice: "", finalPrice: "", description: "" }],
    });

  const removeRoom = (index: number) =>
    setFormData({ ...formData, roomTypes: formData.roomTypes.filter((_, i) => i !== index) });

  // ── Image upload ──
  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      if (uploadFile) {
        const imageUrl = await uploadFile({ uri });
        if (imageUrl) {
          setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
        }
      } else {
        // fallback: store local uri for preview
        setFormData(prev => ({ ...prev, images: [...prev.images, uri] }));
      }
    } catch {
      Alert.alert("Error", "Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) =>
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
      await axios.put(`${apiBaseUrl}/hotels/update/${hotelId}`, formData, { headers });
      Alert.alert("Success", "Hotel updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to update hotel");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading screen ──
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#C8813A" />
        <Text style={styles.loadingText}>Loading Hotel Details...</Text>
      </View>
    );
  }

  // ── Main render ──
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FDFDFD" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Back to Hotels</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>
            Edit <Text style={styles.pageTitleAccent}>Hotel</Text>
          </Text>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.formCard}>

          {/* ── Section: Hotel Information ── */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>🏨</Text>
              <Text style={styles.sectionTitle}>Hotel Information</Text>
            </View>

            <View style={styles.fieldGrid}>
              <View style={styles.fieldHalf}>
                <InputField
                  label="Hotel Name"
                  value={formData.name}
                  onChangeText={v => handleChange("name", v)}
                  placeholder="e.g. The Grand Ceylon"
                />
              </View>
              <View style={styles.fieldHalf}>
                <InputField
                  label="Category"
                  value={formData.category}
                  onChangeText={v => handleChange("category", v)}
                  placeholder="e.g. Luxury"
                />
              </View>
              <View style={styles.fieldHalf}>
                <InputField
                  label="Rating"
                  value={formData.rating}
                  onChangeText={v => {
                    if (v === "" || (parseInt(v) >= 0 && parseInt(v) <= 5)) handleChange("rating", v);
                  }}
                  keyboardType="numeric"
                  placeholder="0–5"
                />
              </View>
              <View style={styles.fieldHalf}>
                <InputField
                  label="Phone"
                  value={formData.phone}
                  onChangeText={v => handleChange("phone", v.replace(/\D/g, "").slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="10 digit number"
                />
              </View>
              <View style={styles.fieldFull}>
                <InputField
                  label="Email"
                  value={formData.email}
                  onChangeText={v => handleChange("email", v)}
                  keyboardType="email-address"
                  placeholder="hotel@example.com"
                />
              </View>
            </View>

            <View style={[styles.fieldFull, { marginTop: 8 }]}>
              <InputField
                label="Description"
                value={formData.description}
                onChangeText={v => handleChange("description", v)}
                multiline
                numberOfLines={3}
                placeholder="Describe the hotel..."
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Section: Location ── */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionTitle}>Location</Text>
            </View>

            <View style={styles.fieldGrid}>
              <View style={styles.fieldFull}>
                <SelectField
                  label="Province"
                  value={formData.province}
                  options={provinceOptions}
                  onChange={v => handleChange("province", v)}
                />
              </View>
              <View style={styles.fieldFull}>
                <SelectField
                  label="District"
                  value={formData.district}
                  options={districtOptions}
                  onChange={v => handleChange("district", v)}
                  disabled={!formData.province}
                />
              </View>
              <View style={styles.fieldFull}>
                <SelectField
                  label="City"
                  value={formData.city}
                  options={cityOptions}
                  onChange={v => handleChange("city", v)}
                  disabled={!formData.district}
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Section: Room Types ── */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRowSpaced}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionIcon}>🛏️</Text>
                <Text style={styles.sectionTitle}>Room Types</Text>
              </View>
              <TouchableOpacity onPress={addRoom} style={styles.addRoomBtn} activeOpacity={0.75}>
                <Text style={styles.addRoomBtnText}>+ Add Room</Text>
              </TouchableOpacity>
            </View>

            {formData.roomTypes.map((room, index) => (
              <View key={index} style={styles.roomCard}>
                <View style={styles.fieldGrid}>
                  <View style={styles.fieldHalf}>
                    <InputField
                      label="Type"
                      value={room.type}
                      onChangeText={v => handleRoomChange(index, "type", v)}
                      placeholder="e.g. Deluxe"
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <InputField
                      label="Original Price"
                      value={room.originalPrice}
                      onChangeText={v => {
                        if (v === "" || parseFloat(v) >= 0) handleRoomChange(index, "originalPrice", v);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <InputField
                      label="Final Price"
                      value={room.finalPrice}
                      onChangeText={v => {
                        if (v === "" || parseFloat(v) >= 0) handleRoomChange(index, "finalPrice", v);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <InputField
                      label="Description"
                      value={room.description}
                      onChangeText={v => handleRoomChange(index, "description", v)}
                      placeholder="Room details..."
                    />
                  </View>
                </View>

                {formData.roomTypes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeRoom(index)}
                    style={styles.removeRoomBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeRoomBtnText}>🗑 Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* ── Section: Photos ── */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>🖼️</Text>
              <Text style={styles.sectionTitle}>Photos</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              {/* Upload button */}
              <TouchableOpacity
                onPress={handleImageUpload}
                disabled={uploading}
                style={styles.uploadBox}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator color="#C8813A" size="small" />
                ) : (
                  <>
                    <Text style={styles.uploadIcon}>⬆</Text>
                    <Text style={styles.uploadLabel}>Upload</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Uploaded images */}
              {formData.images?.map((url, index) => (
                <View key={index} style={styles.photoThumb}>
                  <Image source={{ uri: url }} style={styles.photoImg} />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={styles.photoRemove}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Submit Button ── */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || uploading}
            style={[styles.submitBtn, (submitting || uploading) && styles.submitBtnDisabled]}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>SAVE CHANGES</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Loading
  loadingScreen: {
    flex: 1,
    backgroundColor: "#FDFDFD",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 12,
  },

  // Layout
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 24 },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backArrow: { fontSize: 20, color: "#6B7280" },
  backLabel: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  pageTitleAccent: { color: "#6366F1" },

  // Form card
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  // Sections
  section: { marginBottom: 8 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  sectionTitleRowSpaced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 24 },

  // Field grid
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  fieldHalf: { width: "47.5%" },
  fieldFull: { width: "100%" },

  // Room card
  roomCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    marginBottom: 12,
  },
  addRoomBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 100,
  },
  addRoomBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  removeRoomBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    marginTop: 8,
  },
  removeRoomBtnText: { fontSize: 12, fontWeight: "700", color: "#EF4444" },

  // Photo upload
  uploadBox: {
    width: 110,
    height: 110,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#FAFAFA",
  },
  uploadIcon: { fontSize: 22, color: "#9CA3AF" },
  uploadLabel: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", marginTop: 4, textTransform: "uppercase" },
  photoThumb: {
    width: 110,
    height: 110,
    borderRadius: 24,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  photoImg: { width: "100%", height: "100%", resizeMode: "cover" },
  photoRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    backgroundColor: "#EF4444",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  // Submit
  submitBtn: {
    marginTop: 24,
    backgroundColor: "#C8813A",
    borderRadius: 100,
    paddingVertical: 20,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#C8813A",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: { backgroundColor: "#D1D5DB", shadowOpacity: 0 },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});