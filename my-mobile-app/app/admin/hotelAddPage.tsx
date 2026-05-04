import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image, ActivityIndicator,
  Platform, KeyboardAvoidingView, Modal, FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useRouter } from "expo-router";
import { getAuthHeaders } from "../../lib/auth";
import { uploadFile as uploadToStorage } from "../../lib/supabase";

// --- SRI LANKA DATA CONSTANTS ---
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

const ROOM_ENUM = ["Single", "Double", "Family", "Suite", "Luxury"];

// ── Types ────────────────────────────────────────────────────────────────────
interface RoomType {
  type: string;
  maxGuests: number | string;
  originalPrice: string;
  discountPercentage: number | string;
  images: string[];
  imageFiles?: any[];
}

interface FormData {
  hotelID: string;
  name: string;
  address: string;
  city: string;
  province: string;
  district: string;
  phone: string;
  email: string;
  description: string;
  category: string;
  amenities: string;
}

interface AddHotelPageProps {
  id?: string;
  navigation?: any;
  backendUrl?: string;
  token?: string;
  uploadFile?: (file: any) => Promise<string | null>;
}

// ── Dropdown Picker ──────────────────────────────────────────────────────────
interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        style={[styles.input, styles.pickerRow, disabled && styles.inputDisabled]}
      >
        <Text style={value ? styles.pickerValue : styles.pickerPlaceholder}>
          {value || (placeholder ?? `Select ${label}`)}
        </Text>
        <Text style={styles.pickerArrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, value === item && styles.modalItemActive]}
                  onPress={() => { onChange(item); setOpen(false); }}
                >
                  <Text style={[styles.modalItemText, value === item && { color: "#3B82F6", fontWeight: "700" }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── InputGroup ───────────────────────────────────────────────────────────────
const InputGroup: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  hasError?: boolean;
  errorMsg?: string;
  maxLength?: number;
  secureTextEntry?: boolean;
}> = ({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, numberOfLines = 1, hasError, errorMsg, maxLength, secureTextEntry }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#CBD5E0"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      maxLength={maxLength}
      secureTextEntry={secureTextEntry}
      style={[
        styles.input,
        multiline && { height: numberOfLines * 44, textAlignVertical: "top" },
        hasError && styles.inputError,
      ]}
    />
    {hasError && errorMsg ? <Text style={styles.errorText}>⚠ {errorMsg}</Text> : null}
  </View>
);

// ── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ emoji: string; title: string }> = ({ emoji, title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionEmoji}>{emoji}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ── Main Component ───────────────────────────────────────────────────────────
const AddHotelPage: React.FC<AddHotelPageProps> = ({
  id, navigation, backendUrl = "", token = "", uploadFile,
}) => {
  const isEditing = !!id;
  const router = useRouter();
  const apiBaseUrl = backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || "";

  const [formData, setFormData] = useState<FormData>({
    hotelID: "", name: "", address: "", city: "", province: "",
    district: "", phone: "", email: "", description: "", category: "Budget", amenities: "",
  });

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { type: "Double", maxGuests: 2, originalPrice: "", discountPercentage: 0, images: [], imageFiles: [] },
  ]);

  const [loading, setLoading] = useState(false);
  const [hotelImageUris, setHotelImageUris] = useState<string[]>([]);
  const [phoneError, setPhoneError] = useState("");

  const provinces = useMemo(() => Object.keys(SRI_LANKA_DATA), []);
  const districts = useMemo(() => formData.province ? Object.keys(SRI_LANKA_DATA[formData.province]) : [], [formData.province]);
  const cities = useMemo(() => (formData.province && formData.district) ? SRI_LANKA_DATA[formData.province][formData.district] : [], [formData.province, formData.district]);

  useEffect(() => {
    if (isEditing) {
      const fetchHotel = async () => {
        try {
          if (!apiBaseUrl || !id) {
            throw new Error("Missing hotel id or backend URL");
          }
          const headers = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
          const response = await axios.get(`${apiBaseUrl}/hotels/get/${id}`, { headers });
          const hotel = response.data.data;
          setFormData({
            ...hotel,
            amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(", ") : hotel.amenities,
          });
          setRoomTypes(hotel.roomTypes.map((r: RoomType) => ({ ...r, imageFiles: [] })));
          setHotelImageUris(hotel.images || []);
        } catch {
          Alert.alert("Error", "Failed to load hotel data");
        }
      };
      fetchHotel();
    }
  }, [apiBaseUrl, id, isEditing, token]);

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "province") { updated.district = ""; updated.city = ""; }
      if (name === "district") { updated.city = ""; }
      return updated;
    });
  };

  const pickHotelImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow photo access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) setHotelImageUris(prev => [...prev, ...result.assets.map(a => a.uri)]);
  };

  const pickRoomImages = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow photo access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const updated = [...roomTypes];
      updated[index].images = [...updated[index].images, ...result.assets.map(a => a.uri)];
      updated[index].imageFiles = [...(updated[index].imageFiles || []), ...result.assets];
      setRoomTypes(updated);
    }
  };

  const handleRoomChange = (index: number, name: keyof RoomType, value: any) => {
    const list = [...roomTypes];
    (list[index] as any)[name] = value;
    setRoomTypes(list);
  };

  const addRoomType = () =>
    setRoomTypes([...roomTypes, { type: "Double", maxGuests: 2, originalPrice: "", discountPercentage: 0, images: [], imageFiles: [] }]);

  const removeRoomImage = (rIdx: number, iIdx: number) => {
    const updated = [...roomTypes];
    updated[rIdx].images = updated[rIdx].images.filter((_, i) => i !== iIdx);
    setRoomTypes(updated);
  };

  const handleSubmit = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      Alert.alert("Validation", "Phone number must be exactly 10 digits!");
      return;
    }
    if (!formData.province || !formData.district || !formData.city) {
      Alert.alert("Validation", "Please complete the location details!");
      return;
    }

    setLoading(true);
    try {
      const fileUploader = uploadFile ?? uploadToStorage;
      let finalHotelImages = hotelImageUris.filter(u => u.startsWith("http"));
      const blobUris = hotelImageUris.filter(u => !u.startsWith("http"));
      if (blobUris.length > 0) {
        const uploaded = await Promise.all(blobUris.map(uri => fileUploader(uri)));
        finalHotelImages = [...finalHotelImages, ...uploaded.filter(Boolean)] as string[];
      }

      const finalRooms = await Promise.all(roomTypes.map(async (room) => {
        let existingRoomUrls = (room.images || []).filter(url => url.startsWith("http"));
        if (room.imageFiles && room.imageFiles.length > 0) {
          const uploadedRoomImgs = await Promise.all(room.imageFiles.map((f: any) => fileUploader(f.uri)));
          existingRoomUrls = [...existingRoomUrls, ...uploadedRoomImgs.filter(Boolean)] as string[];
        }
        return {
          type: room.type,
          maxGuests: room.maxGuests,
          originalPrice: room.originalPrice,
          discountPercentage: room.discountPercentage,
          images: existingRoomUrls,
        };
      }));

      const finalData = {
        ...formData,
        images: finalHotelImages,
        roomTypes: finalRooms,
        amenities: formData.amenities.split(",").map(a => a.trim()),
      };

      const headers = token ? { Authorization: `Bearer ${token}` } : await getAuthHeaders();
      const config = { headers };
      if (isEditing) {
        await axios.put(`${apiBaseUrl}/hotels/update/${id}`, finalData, config);
        Alert.alert("Success", "Hotel Updated!");
      } else {
        await axios.post(`${apiBaseUrl}/hotels/create`, finalData, config);
        Alert.alert("Success", "Hotel Registered!");
      }
      router.back();
    } catch {
      Alert.alert("Error", "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.crownEmoji}>👑</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{isEditing ? "REFINE MASTERPIECE" : "NEW LUXURY LISTING"}</Text>
              </View>
            </View>
            <Text style={styles.pageTitle}>{isEditing ? "Update Property" : "Create Legacy"}</Text>
          </View>
        </View>

        {/* ── SECTION 1: Property Essence ── */}
        <View style={styles.card}>
          <SectionHeader emoji="🏨" title="Property Essence" />
          <InputGroup label="Hotel ID" value={formData.hotelID} onChangeText={v => handleChange("hotelID", v)} placeholder="e.g. HTL001" />
          <InputGroup label="Hotel Name" value={formData.name} onChangeText={v => handleChange("name", v)} placeholder="e.g. The Grand Ceylon" />
          <InputGroup label="Email" value={formData.email} onChangeText={v => handleChange("email", v)} placeholder="hotel@example.com" keyboardType="email-address" />

          {/* Phone with validation */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              value={formData.phone}
              onChangeText={v => {
                const val = v.replace(/\D/g, "").slice(0, 10);
                handleChange("phone", val);
                if (val && val.length !== 10) setPhoneError("Phone number must be exactly 10 digits");
                else setPhoneError("");
              }}
              placeholder="10 digit number"
              placeholderTextColor="#CBD5E0"
              keyboardType="phone-pad"
              maxLength={10}
              style={[styles.input, phoneError ? styles.inputError : null]}
            />
            {phoneError ? <Text style={styles.errorText}>⚠ {phoneError}</Text> : null}
            {!phoneError && formData.phone.length === 10 ? <Text style={styles.successText}>✓ Valid</Text> : null}
          </View>

          <InputGroup label="Amenities (Comma separated)" value={formData.amenities} onChangeText={v => handleChange("amenities", v)} placeholder="Pool, WiFi, Gym" />

          <Dropdown label="Category" value={formData.category} options={["Budget", "Luxury", "Boutique"]} onChange={v => handleChange("category", v)} />

          <InputGroup label="Description" value={formData.description} onChangeText={v => handleChange("description", v)} multiline numberOfLines={4} />
        </View>

        {/* ── SECTION 2: Prime Location ── */}
        <View style={styles.card}>
          <SectionHeader emoji="📍" title="Prime Location" />
          <Dropdown label="Province" value={formData.province} options={provinces} onChange={v => handleChange("province", v)} />
          <Dropdown label="District" value={formData.district} options={districts} onChange={v => handleChange("district", v)} disabled={!formData.province} />
          <Dropdown label="City" value={formData.city} options={cities} onChange={v => handleChange("city", v)} disabled={!formData.district} />
          <InputGroup label="Detailed Address" value={formData.address} onChangeText={v => handleChange("address", v)} placeholder="No 123, Galle Road, Colombo 03" />
        </View>

        {/* ── SECTION 3: Room Collection ── */}
        <View style={styles.card}>
          <View style={styles.sectionRowHeader}>
            <SectionHeader emoji="🛏️" title="Room Collection" />
            <TouchableOpacity onPress={addRoomType} style={[styles.addBtn, { backgroundColor: "#F59E0B" }]}>
              <Text style={styles.addBtnText}>+ Add Unit</Text>
            </TouchableOpacity>
          </View>

          {roomTypes.map((room, index) => (
            <View key={index} style={styles.innerCard}>
              <Dropdown
                label="Unit Class"
                value={room.type}
                options={ROOM_ENUM}
                onChange={v => handleRoomChange(index, "type", v)}
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Price (LKR)</Text>
                    <TextInput
                      value={String(room.originalPrice)}
                      onChangeText={v => { if (v === "" || parseFloat(v) >= 0) handleRoomChange(index, "originalPrice", v); }}
                      keyboardType="numeric"
                      placeholderTextColor="#CBD5E0"
                      placeholder="0"
                      style={styles.input}
                    />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Max Guests</Text>
                    <TextInput
                      value={String(room.maxGuests)}
                      onChangeText={v => { if (v === "" || parseInt(v) >= 1) handleRoomChange(index, "maxGuests", v); }}
                      keyboardType="numeric"
                      placeholderTextColor="#CBD5E0"
                      placeholder="1"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Discount %</Text>
                <TextInput
                  value={String(room.discountPercentage)}
                  onChangeText={v => { if (v === "" || (parseInt(v) >= 0 && parseInt(v) <= 100)) handleRoomChange(index, "discountPercentage", v); }}
                  keyboardType="numeric"
                  placeholderTextColor="#CBD5E0"
                  placeholder="0"
                  style={styles.input}
                />
              </View>

              {/* Room image gallery */}
              <Text style={styles.innerLabel}>Visual Portfolio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {room.images.map((uri, i) => (
                  <View key={i} style={styles.galleryThumb}>
                    <Image source={{ uri }} style={styles.galleryImg} />
                    <TouchableOpacity onPress={() => removeRoomImage(index, i)} style={styles.galleryRemove}>
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => pickRoomImages(index)} style={styles.galleryAdd}>
                  <Text style={styles.galleryAddIcon}>＋</Text>
                  <Text style={styles.galleryAddText}>Add Photo</Text>
                </TouchableOpacity>
              </ScrollView>

              {roomTypes.length > 1 && (
                <TouchableOpacity onPress={() => setRoomTypes(roomTypes.filter((_, i) => i !== index))} style={styles.removeCardBtn}>
                  <Text style={styles.removeCardBtnText}>🗑 Remove Unit</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* ── SECTION 4: Main Gallery ── */}
        <View style={styles.card}>
          <SectionHeader emoji="🖼️" title="Main Gallery" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {hotelImageUris.map((uri, i) => (
              <View key={i} style={styles.galleryThumb}>
                <Image source={{ uri }} style={styles.galleryImg} />
                <TouchableOpacity onPress={() => setHotelImageUris(prev => prev.filter((_, idx) => idx !== i))} style={styles.galleryRemove}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={pickHotelImages} style={styles.galleryAdd}>
              <Text style={styles.galleryAddIcon}>＋</Text>
              <Text style={styles.galleryAddText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Submit */}
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.submitBtn, loading && styles.submitBtnDisabled]}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitBtnText}>{isEditing ? "UPDATE PROPERTY" : "REGISTER HOTEL"}</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16, paddingTop: 20 },

  pageHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24, gap: 12 },
  backBtn: { width: 44, height: 44, backgroundColor: "#fff", borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0", elevation: 2 },
  backBtnText: { fontSize: 20, color: "#475569" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  crownEmoji: { fontSize: 20 },
  badge: { backgroundColor: "#2563EB", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  pageTitle: { fontSize: 28, fontWeight: "900", color: "#0F172A" },

  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  innerCard: { backgroundColor: "#F8FAFC", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },

  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  sectionRowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: "900", color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontWeight: "600", color: "#334155" },
  inputError: { borderColor: "#F87171" },
  inputDisabled: { opacity: 0.5 },
  errorText: { fontSize: 11, color: "#EF4444", fontWeight: "700", marginTop: 4, marginLeft: 4 },
  successText: { fontSize: 11, color: "#22C55E", fontWeight: "700", marginTop: 4, marginLeft: 4 },

  pickerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerValue: { fontSize: 14, fontWeight: "700", color: "#334155" },
  pickerPlaceholder: { fontSize: 14, color: "#CBD5E0" },
  pickerArrow: { fontSize: 16, color: "#94A3B8" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", maxHeight: 400 },
  modalTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", textTransform: "uppercase", letterSpacing: 1 },
  modalItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalItemActive: { backgroundColor: "#EFF6FF" },
  modalItemText: { fontSize: 14, color: "#475569", fontWeight: "500" },
  modalClose: { padding: 14, alignItems: "center", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  modalCloseText: { color: "#3B82F6", fontWeight: "800", fontSize: 13 },

  row: { flexDirection: "row", alignItems: "flex-start" },
  innerLabel: { fontSize: 10, fontWeight: "900", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },

  addBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  galleryThumb: { width: 80, height: 80, borderRadius: 14, overflow: "hidden", marginRight: 10, position: "relative" },
  galleryImg: { width: "100%", height: "100%" },
  galleryRemove: { position: "absolute", top: 4, right: 4, width: 20, height: 20, backgroundColor: "rgba(239,68,68,0.85)", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  galleryAdd: { width: 80, height: 80, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center", marginRight: 10 },
  galleryAddIcon: { fontSize: 24, color: "#94A3B8" },
  galleryAddText: { fontSize: 9, fontWeight: "900", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 },

  removeCardBtn: { marginTop: 10, alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#FEF2F2", borderRadius: 10 },
  removeCardBtnText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },

  submitBtn: { backgroundColor: "#0F172A", borderRadius: 24, paddingVertical: 22, alignItems: "center", marginTop: 8, elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  submitBtnDisabled: { backgroundColor: "#94A3B8" },
  submitBtnText: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 1 },
});

export default AddHotelPage;