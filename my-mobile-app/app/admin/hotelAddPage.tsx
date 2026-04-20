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
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { uploadFile } from "../../lib/supabase";
import { getAuthHeaders } from "../../lib/auth";
import {
  Hotel,
  MapPin,
  Mail,
  Phone,
  Image as ImageIcon,
  Bed,
  Save,
  Plus,
  Trash2,
  Crown,
  ArrowLeft,
} from "lucide-react-native";

// SRI_LANKA_DATA සහ ROOM_ENUM මෙතනට ඇතුළත් කරගන්න (මුල් කේතයේ තිබූ පරිදිම)
const SRI_LANKA_DATA: Record<string, Record<string, string[]>> = { /* ... */ };
const ROOM_ENUM: string[] = ["Single", "Double", "Family", "Suite", "Luxury"];

const AddHotelPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = !!id;

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  const [formData, setFormData] = useState({
    hotelID: "", name: "", address: "", city: "", province: "",
    district: "", phone: "", email: "", description: "", category: "Budget", amenities: ""
  });

  const [roomTypes, setRoomTypes] = useState([
    { type: "Double", maxGuests: 2, originalPrice: "", discountPercentage: 0, images: [] as string[] }
  ]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [hotelPreviews, setHotelPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Location Logic
  const provinces = useMemo(() => Object.keys(SRI_LANKA_DATA), []);
  const districts = useMemo(() => formData.province ? Object.keys(SRI_LANKA_DATA[formData.province]) : [], [formData.province]);
  const cities = useMemo(() => (formData.province && formData.district) ? SRI_LANKA_DATA[formData.province][formData.district] : [], [formData.province, formData.district]);

  useEffect(() => {
    if (isEditing) {
      fetchHotelData();
    }
  }, [id]);

  const fetchHotelData = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${backendUrl}/hotels/get/${id}`, { headers });
      const hotel = response.data.data;
      setFormData({
        ...hotel,
        amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(", ") : hotel.amenities
      });
      setRoomTypes(hotel.roomTypes || []);
      setHotelPreviews(hotel.images || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load hotel data");
    } finally {
      setFetching(false);
    }
  };

  const handlePickHotelImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setUploading(true);
      try {
        const uploadedUrls = await Promise.all(newUris.map(uri => uploadFile(uri, 'hotels')));
        setHotelPreviews(prev => [...prev, ...uploadedUrls]);
      } catch (error) {
        Alert.alert("Upload Failed", "Could not upload hotel images");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAddRoom = () => {
    setRoomTypes([...roomTypes, { type: "Double", maxGuests: 2, originalPrice: "", discountPercentage: 0, images: [] }]);
  };

  const handleSubmit = async () => {
    if (formData.phone.length !== 10) {
      return Alert.alert("Validation", "Phone number must be 10 digits");
    }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const finalData = {
        ...formData,
        images: hotelPreviews,
        roomTypes: roomTypes,
        amenities: formData.amenities.split(",").map(a => a.trim())
      };

      if (isEditing) {
        await axios.put(`${backendUrl}/hotels/update/${id}`, finalData, { headers });
      } else {
        await axios.post(`${backendUrl}/hotels/create`, finalData, { headers });
      }
      
      Alert.alert("Success", isEditing ? "Hotel Updated!" : "Hotel Registered!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#64748b" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.badgeContainer}>
            <Crown size={24} color="#EAB308" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{isEditing ? "REFINE MASTERPIECE" : "NEW LUXURY LISTING"}</Text>
            </View>
          </View>
          <Text style={styles.title}>{isEditing ? "Update Property" : "Create Legacy"}</Text>
        </View>

        {/* Section: Property Essence */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}><Hotel size={20} color="#2563EB" /> Property Essence</Text>
          
          <InputGroup label="Hotel Name" value={formData.name} onChangeText={(t: any) => setFormData({...formData, name: t})} />
          <InputGroup label="Email" value={formData.email} onChangeText={(t: any) => setFormData({...formData, email: t})} keyboardType="email-address" />
          <InputGroup 
            label="Phone" 
            value={formData.phone} 
            onChangeText={(t: string) => setFormData({...formData, phone: t.replace(/[^0-9]/g, '').slice(0, 10)})} 
            keyboardType="phone-pad"
            placeholder="10 digit number"
          />
          <InputGroup label="Amenities" value={formData.amenities} onChangeText={(t: any) => setFormData({...formData, amenities: t})} placeholder="Pool, WiFi, Gym" />
          
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={formData.category} onValueChange={(v: any) => setFormData({...formData, category: v})}>
              {["Budget", "Luxury", "Boutique"].map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
        </View>

        {/* Section: Prime Location */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}><MapPin size={20} color="#10B981" /> Prime Location</Text>
          
          <Text style={styles.label}>Province</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={formData.province} onValueChange={(v: any) => setFormData({...formData, province: v, district: "", city: ""})}>
              <Picker.Item label="Select Province" value="" />
              {provinces.map(p => <Picker.Item key={p} label={p} value={p} />)}
            </Picker>
          </View>

          <Text style={styles.label}>District</Text>
          <View style={[styles.pickerWrap, !formData.province && { opacity: 0.5 }]}>
            <Picker enabled={!!formData.province} selectedValue={formData.district} onValueChange={(v: any) => setFormData({...formData, district: v, city: ""})}>
              <Picker.Item label="Select District" value="" />
              {districts.map(d => <Picker.Item key={d} label={d} value={d} />)}
            </Picker>
          </View>

          <InputGroup label="Detailed Address" value={formData.address} onChangeText={(t: any) => setFormData({...formData, address: t})} />
        </View>

        {/* Section: Room Collection */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.sectionTitle}><Bed size={20} color="#F59E0B" /> Room Collection</Text>
            <TouchableOpacity onPress={handleAddRoom} style={styles.addUnitBtn}>
              <Plus size={16} color="white" />
              <Text style={styles.addUnitText}>Add Unit</Text>
            </TouchableOpacity>
          </View>

          {roomTypes.map((room, index) => (
            <View key={index} style={styles.roomItem}>
              <Text style={styles.label}>Unit Class</Text>
              <View style={styles.pickerWrap}>
                <Picker 
                  selectedValue={room.type} 
                  onValueChange={(v: string) => {
                    const newRooms = [...roomTypes];
                    newRooms[index].type = v;
                    setRoomTypes(newRooms);
                  }}
                >
                  {ROOM_ENUM.map(r => <Picker.Item key={r} label={r} value={r} />)}
                </Picker>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <InputGroup label="Price" value={room.originalPrice.toString()} onChangeText={(t: string) => {
                    const newRooms = [...roomTypes];
                    newRooms[index].originalPrice = t;
                    setRoomTypes(newRooms);
                  }} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <InputGroup label="Guests" value={room.maxGuests.toString()} onChangeText={(t: string) => {
                    const newRooms = [...roomTypes];
                    newRooms[index].maxGuests = parseInt(t) || 1;
                    setRoomTypes(newRooms);
                  }} keyboardType="numeric" />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Section: Gallery */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}><ImageIcon size={20} color="#EC4899" /> Main Gallery</Text>
          <View style={styles.imageGrid}>
            <TouchableOpacity style={styles.addImgBtn} onPress={handlePickHotelImage}>
              <Plus color="#94a3b8" />
              <Text style={styles.addImgText}>Add Photo</Text>
            </TouchableOpacity>
            {hotelPreviews.map((uri, i) => (
              <View key={i} style={styles.imgWrapper}>
                <Image source={{ uri }} style={styles.previewImg} />
                <TouchableOpacity style={styles.delImgBtn} onPress={() => setHotelPreviews(hotelPreviews.filter((_, idx) => idx !== i))}>
                  <Trash2 size={12} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>{isEditing ? "UPDATE PROPERTY" : "REGISTER HOTEL"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const InputGroup = ({ label, ...props }: any) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  backBtn: { position: 'absolute', left: 0, top: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  backText: { fontWeight: 'bold', color: '#64748b', marginLeft: 5 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 40 },
  badge: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  card: { backgroundColor: 'white', borderRadius: 30, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 15, fontWeight: 'bold', color: '#334155' },
  pickerWrap: { backgroundColor: '#f1f5f9', borderRadius: 15, marginBottom: 15, overflow: 'hidden' },
  addUnitBtn: { backgroundColor: '#F59E0B', flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  addUnitText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  roomItem: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  addImgBtn: { width: 80, height: 80, borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  addImgText: { fontSize: 8, fontWeight: 'bold', color: '#94a3b8', marginTop: 5 },
  imgWrapper: { width: 80, height: 80, borderRadius: 15, overflow: 'hidden', position: 'relative' },
  previewImg: { width: '100%', height: '100%' },
  delImgBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: '#ef4444', padding: 5, borderRadius: 10 },
  submitBtn: { backgroundColor: '#0f172a', padding: 20, borderRadius: 25, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: '900' }
});

export default AddHotelPage;