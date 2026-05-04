import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import axios from "axios";
import { Ionicons, FontAwesome, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
// NOTE: Replace with your React Native file picker & upload utility
// e.g. import * as ImagePicker from "expo-image-picker";
// import { uploadFile } from "../../utils/mediaUpload";

// ─── ENV ────────────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "adventure",  label: "Adventure" },
  { value: "wildlife",   label: "Wildlife" },
  { value: "historical", label: "Historical" },
  { value: "cultural",   label: "Cultural" },
  { value: "beach",      label: "Beach" },
  { value: "wellness",   label: "Wellness" },
  { value: "eco",        label: "Eco / Nature" },
  { value: "family",     label: "Family" },
] as const;

const WEATHER_OPTIONS = [
  { value: "sunny",    label: "☀️ Sunny & Warm" },
  { value: "tropical", label: "🌴 Tropical" },
  { value: "humid",    label: "💧 Humid" },
  { value: "cool",     label: "🍂 Cool & Crisp" },
  { value: "dry",      label: "🏜️ Hot & Dry" },
  { value: "rainy",    label: "🌧️ Rainy" },
] as const;

const INTEREST_OPTIONS = [
  { value: "hiking",             label: "🥾 Hiking" },
  { value: "surfing",            label: "🏄 Surfing" },
  { value: "nature_photography", label: "📷 Nature Photography" },
  { value: "wildlife_spotting",  label: "🦁 Wildlife Spotting" },
  { value: "camping",            label: "⛺ Camping" },
  { value: "diving",             label: "🤿 Diving" },
  { value: "paddling_boats",     label: "🚣 Paddling Boats" },
  { value: "stargazing",         label: "🔭 Stargazing" },
  { value: "cycling",            label: "🚴 Cycling" },
  { value: "rock_climbing",      label: "🧗 Rock Climbing" },
  { value: "bird_watching",      label: "🦜 Bird Watching" },
  { value: "cultural_tours",     label: "🏛️ Cultural Tours" },
] as const;

const SRI_LANKA_LOCATIONS = [
  "Colombo","Kandy","Galle","Jaffna","Anuradhapura","Polonnaruwa","Sigiriya",
  "Ella","Nuwara Eliya","Trincomalee","Batticaloa","Hambantota","Mirissa",
  "Hikkaduwa","Arugam Bay","Yala","Wilpattu","Udawalawe","Dambulla","Matara",
  "Bentota","Negombo","Ratnapura","Badulla","Ampara","Multi-location",
];

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Activity {
  time: string;
  task: string;
}

interface Itinerary {
  day_no: number;
  title: string;
  activities: Activity[];
}

interface Faq {
  question: string;
  answer: string;
}

interface TravellerTip {
  title: string;
  description: string;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  price: string;
  no_of_days: string;
  min_group_size: string;
  max_group_size: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  location?: string;
  price?: string;
  no_of_days?: string;
}

interface Hotel {
  _id: string;
  name: string;
}

interface Destination {
  _id: string;
  name: string;
}

// ─── NAV TYPES ───────────────────────────────────────────────────────────────
type RootStackParamList = {
  AddPackage: { id?: string };
  AdminPackages: undefined;
};
type AddPackageRouteProp = RouteProp<RootStackParamList, "AddPackage">;

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  blue500: "#3b82f6",
  blue600: "#2563eb",
  blue700: "#1d4ed8",
  green500: "#22c55e",
  green600: "#16a34a",
  amber500: "#f59e0b",
  amber600: "#d97706",
  red400: "#f87171",
  red500: "#ef4444",
  red600: "#dc2626",
  purple500: "#a855f7",
  purple600: "#9333ea",
  pink500: "#ec4899",
  orange500: "#f97316",
  orange600: "#ea580c",
  yellow500: "#eab308",
  yellow600: "#ca8a04",
  sky500: "#0ea5e9",
  teal500: "#14b8a6",
  emerald500: "#10b981",
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const AddPackagePage: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<AddPackageRouteProp>();
  const { id } = route.params ?? {};
  const isEditing = !!id;

  // ── State ────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    title: "", description: "", location: "", price: "",
    no_of_days: "", min_group_size: "1", max_group_size: "20",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWeather, setSelectedWeather] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState<string[]>([]);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);
  const [hotelSearch, setHotelSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [galleryUris, setGalleryUris] = useState<string[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([
    { day_no: 1, title: "", activities: [{ time: "", task: "" }] },
  ]);
  const [transport, setTransport] = useState<string[]>([""]);
  const [faqs, setFaqs] = useState<Faq[]>([{ question: "", answer: "" }]);
  const [travellerTips, setTravellerTips] = useState<TravellerTip[]>([{ title: "", description: "" }]);
  const [loading, setLoading] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  // ── Fetch hotels & destinations ─────────────────────────────────────────
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [hotelsRes, destsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/hotels/all`),
          axios.get(`${BACKEND_URL}/destinations/all`),
        ]);
        setAllHotels(hotelsRes.data?.data ?? []);
        setAllDestinations(destsRes.data?.data ?? []);
      } catch {
        Alert.alert("Error", "Failed to load hotels/destinations");
      }
    };
    fetchOptions();
  }, []);

  // ── Fetch existing package (edit mode) ──────────────────────────────────
  useEffect(() => {
    if (!isEditing || !id) return;
    const fetchPackage = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/packages/get/${id}`);
        const pkg = res.data.data;
        setFormData({
          title: pkg.title ?? "",
          description: pkg.description ?? "",
          location: pkg.location ?? "",
          price: String(pkg.price ?? ""),
          no_of_days: String(pkg.no_of_days ?? ""),
          min_group_size: String(pkg.min_group_size ?? 1),
          max_group_size: String(pkg.max_group_size ?? 20),
        });
        setSelectedCategories(pkg.categories ?? []);
        setSelectedWeather(pkg.weather ?? []);
        setSelectedInterests(pkg.interests ?? []);
        setGalleryUris(pkg.gallery ?? []);
        setItineraries(
          pkg.itineraries?.length
            ? pkg.itineraries.map((i: any) => ({
                ...i,
                activities: i.activities?.length ? i.activities : [{ time: "", task: "" }],
              }))
            : [{ day_no: 1, title: "", activities: [{ time: "", task: "" }] }]
        );
        setTransport(pkg.transport?.length ? pkg.transport : [""]);
        setFaqs(pkg.faqs?.length ? pkg.faqs : [{ question: "", answer: "" }]);
        setTravellerTips(pkg.traveller_tips?.length ? pkg.traveller_tips : [{ title: "", description: "" }]);
        setSelectedHotelIds((pkg.included_hotels ?? []).map((h: any) => h._id ?? h));
        setSelectedDestinationIds((pkg.destinations ?? []).map((d: any) => d._id ?? d));
      } catch {
        Alert.alert("Error", "Failed to load package data");
      }
    };
    fetchPackage();
  }, [id, isEditing]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const toggle = <T extends string>(
    list: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    value: T
  ) => setList((prev) => prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]);

  // Gallery – using placeholder; swap with expo-image-picker
  const pickGalleryImage = async () => {
    // TODO: replace with expo-image-picker or react-native-image-picker
    // const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true });
    // if (!result.canceled) setGalleryUris(prev => [...prev, ...result.assets.map(a => a.uri)]);
    Alert.alert("Gallery", "Wire up expo-image-picker here");
  };

  // Itinerary
  const addItinerary = () =>
    setItineraries((prev) => [...prev, { day_no: prev.length + 1, title: "", activities: [{ time: "", task: "" }] }]);
  const removeItinerary = (i: number) =>
    setItineraries((prev) => prev.filter((_, idx) => idx !== i).map((it, idx) => ({ ...it, day_no: idx + 1 })));
  const updateItinerary = (i: number, field: keyof Itinerary, value: any) =>
    setItineraries((prev) => { const u = [...prev]; (u[i] as any)[field] = value; return u; });
  const addActivity = (iIdx: number) =>
    setItineraries((prev) => {
      const u = [...prev];
      u[iIdx] = { ...u[iIdx], activities: [...u[iIdx].activities, { time: "", task: "" }] };
      return u;
    });
  const removeActivity = (iIdx: number, aIdx: number) =>
    setItineraries((prev) => {
      const u = [...prev];
      u[iIdx] = { ...u[iIdx], activities: u[iIdx].activities.filter((_, i) => i !== aIdx) };
      return u;
    });
  const updateActivity = (iIdx: number, aIdx: number, field: keyof Activity, value: string) =>
    setItineraries((prev) => {
      const u = [...prev];
      u[iIdx].activities[aIdx] = { ...u[iIdx].activities[aIdx], [field]: value };
      return u;
    });

  // Transport
  const addTransport = () => setTransport((prev) => [...prev, ""]);
  const removeTransport = (i: number) => setTransport((prev) => prev.filter((_, idx) => idx !== i));
  const updateTransport = (i: number, value: string) =>
    setTransport((prev) => { const u = [...prev]; u[i] = value; return u; });

  // FAQs
  const addFaq = () => setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  const removeFaq = (i: number) => setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: keyof Faq, value: string) =>
    setFaqs((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });

  // Tips
  const addTip = () => setTravellerTips((prev) => [...prev, { title: "", description: "" }]);
  const removeTip = (i: number) => setTravellerTips((prev) => prev.filter((_, idx) => idx !== i));
  const updateTip = (i: number, field: keyof TravellerTip, value: string) =>
    setTravellerTips((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim())       newErrors.title       = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.location)           newErrors.location    = "Location is required";
    if (!formData.price)              newErrors.price       = "Price is required";
    else if (Number(formData.price) <= 0) newErrors.price   = "Price must be greater than 0";
    if (!formData.no_of_days)         newErrors.no_of_days  = "Number of days is required";
    else if (Number(formData.no_of_days) <= 0) newErrors.no_of_days = "Must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert("Validation Error", "Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      // TODO: upload new (blob) URIs and collect remote URLs
      // const galleryUrls: string[] = [];
      // for (const uri of galleryUris) {
      //   if (uri.startsWith("http")) { galleryUrls.push(uri); continue; }
      //   const url = await uploadFile(uri);
      //   if (url) galleryUrls.push(url);
      // }
      const galleryUrls = galleryUris; // placeholder

      const token = ""; // TODO: retrieve from AsyncStorage / SecureStore
      const payload = {
        ...formData,
        categories:      selectedCategories,
        weather:         selectedWeather,
        interests:       selectedInterests,
        gallery:         galleryUrls,
        itineraries,
        transport:       transport.filter((t) => t.trim()),
        faqs:            faqs.filter((f) => f.question.trim()),
        traveller_tips:  travellerTips.filter((t) => t.title.trim()),
        included_hotels: selectedHotelIds,
        destinations:    selectedDestinationIds,
      };
      const headers = { Authorization: `Bearer ${token}` };

      if (isEditing) {
        await axios.put(`${BACKEND_URL}/packages/update/${id}`, payload, { headers });
        Alert.alert("Success", "Package updated!");
      } else {
        await axios.post(`${BACKEND_URL}/packages/create`, payload, { headers });
        Alert.alert("Success", "Package created!");
      }
      navigation.navigate("AdminPackages");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered lists ───────────────────────────────────────────────────────
  const filteredHotels = allHotels.filter((h) =>
    h.name?.toLowerCase().includes(hotelSearch.toLowerCase())
  );
  const filteredDests = allDestinations.filter((d) =>
    d.name?.toLowerCase().includes(destSearch.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.root} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.slate600} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{isEditing ? "Edit Package" : "Add New Package"}</Text>
            <Text style={styles.headerSubtitle}>Fill in the details below</Text>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── SECTION 1: Basic Info ── */}
          <SectionCard>
            <SectionHeader icon={<FontAwesome5 name="suitcase" size={18} color={C.blue500} />} title="Basic Info" />

            <InputGroup
              label="Package Title *"
              value={formData.title}
              onChangeText={(v) => handleChange("title", v)}
              placeholder="e.g. Magical Hill Country Experience"
              error={errors.title}
            />
            <InputGroup
              label="Description *"
              value={formData.description}
              onChangeText={(v) => handleChange("description", v)}
              placeholder="Describe the package experience..."
              multiline
              numberOfLines={4}
              error={errors.description}
            />

            {/* Location picker */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Location *</Text>
              <TouchableOpacity
                style={[styles.input, errors.location ? styles.inputError : null]}
                onPress={() => setLocationPickerVisible(!locationPickerVisible)}
              >
                <Text style={formData.location ? styles.inputText : styles.inputPlaceholder}>
                  {formData.location || "Select location..."}
                </Text>
                <Ionicons name={locationPickerVisible ? "chevron-up" : "chevron-down"} size={16} color={C.slate400} />
              </TouchableOpacity>
              {errors.location && <Text style={styles.errorText}>⚠ {errors.location}</Text>}
              {locationPickerVisible && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {SRI_LANKA_LOCATIONS.map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.dropdownItem, formData.location === loc && styles.dropdownItemActive]}
                        onPress={() => { handleChange("location", loc); setLocationPickerVisible(false); }}
                      >
                        <Text style={[styles.dropdownItemText, formData.location === loc && { color: C.blue500, fontWeight: "700" }]}>
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputGroup
                  label="Price (LKR) *"
                  value={formData.price}
                  onChangeText={(v) => handleChange("price", v)}
                  placeholder="e.g. 25000"
                  keyboardType="numeric"
                  error={errors.price}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <InputGroup
                  label="No. of Days *"
                  value={formData.no_of_days}
                  onChangeText={(v) => handleChange("no_of_days", v)}
                  placeholder="e.g. 5"
                  keyboardType="numeric"
                  error={errors.no_of_days}
                />
              </View>
            </View>
          </SectionCard>

          {/* ── SECTION 2: Categories ── */}
          <SectionCard>
            <SectionHeader icon={<FontAwesome5 name="tag" size={18} color={C.purple500} />} title="Categories" subtitle="Select all that apply" />
            <View style={styles.chipWrap}>
              {CATEGORY_OPTIONS.map(({ value, label }) => {
                const active = selectedCategories.includes(value);
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                    onPress={() => toggle(selectedCategories, setSelectedCategories, value)}
                  >
                    {active && <Ionicons name="checkmark" size={11} color={C.white} />}
                    <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedCategories.length > 0 && (
              <Text style={styles.selectionCount}>
                ✓ {selectedCategories.length} categor{selectedCategories.length > 1 ? "ies" : "y"} selected
              </Text>
            )}
          </SectionCard>

          {/* ── SECTION 3: Group Size ── */}
          <SectionCard>
            <SectionHeader icon={<FontAwesome5 name="users" size={18} color={C.teal500} />} title="Group Size" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputGroup
                  label="Min Group Size"
                  value={formData.min_group_size}
                  onChangeText={(v) => handleChange("min_group_size", v)}
                  placeholder="e.g. 1"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <InputGroup
                  label="Max Group Size"
                  value={formData.max_group_size}
                  onChangeText={(v) => handleChange("max_group_size", v)}
                  placeholder="e.g. 20"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </SectionCard>

          {/* ── SECTION 4: Weather ── */}
          <SectionCard>
            <SectionHeader icon={<Ionicons name="partly-sunny" size={20} color={C.sky500} />} title="Suitable Weather" subtitle="Best weather conditions for this package" />
            <View style={styles.chipWrap}>
              {WEATHER_OPTIONS.map(({ value, label }) => {
                const active = selectedWeather.includes(value);
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.chip, active ? { ...styles.chipActive, backgroundColor: C.sky500, borderColor: C.sky500 } : styles.chipInactive]}
                    onPress={() => toggle(selectedWeather, setSelectedWeather, value)}
                  >
                    <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── SECTION 5: Interests ── */}
          <SectionCard>
            <SectionHeader icon={<Ionicons name="heart" size={20} color={C.emerald500} />} title="Related Interests" subtitle="Traveller interests this package caters to" />
            <View style={styles.chipWrap}>
              {INTEREST_OPTIONS.map(({ value, label }) => {
                const active = selectedInterests.includes(value);
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.chip, active ? { ...styles.chipActive, backgroundColor: C.emerald500, borderColor: C.emerald500 } : styles.chipInactive]}
                    onPress={() => toggle(selectedInterests, setSelectedInterests, value)}
                  >
                    <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── SECTION 6: Destinations ── */}
          <SectionCard>
            <SectionHeader
              icon={<FontAwesome name="map-marker" size={20} color={C.red500} />}
              title="Destinations"
              subtitle={`${selectedDestinationIds.length} selected`}
            />
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={C.slate400} />
              <TextInput
                value={destSearch}
                onChangeText={setDestSearch}
                placeholder="Search destinations..."
                style={styles.searchInput}
                placeholderTextColor={C.slate400}
              />
            </View>
            <View style={styles.chipWrap}>
              {filteredDests.map((dest) => {
                const active = selectedDestinationIds.includes(dest._id);
                return (
                  <TouchableOpacity
                    key={dest._id}
                    style={[styles.chip, active ? { ...styles.chipActive, backgroundColor: "#fef2f2", borderColor: C.red500 } : styles.chipInactive]}
                    onPress={() => toggle(selectedDestinationIds, setSelectedDestinationIds, dest._id)}
                  >
                    {active && <Ionicons name="checkmark" size={11} color={C.red500} />}
                    <Text style={[styles.chipText, active ? { color: C.red500 } : styles.chipTextInactive]}>
                      {dest.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── SECTION 7: Hotels ── */}
          <SectionCard>
            <SectionHeader
              icon={<FontAwesome name="hotel" size={18} color={C.amber500} />}
              title="Included Hotels"
              subtitle={`${selectedHotelIds.length} selected`}
            />
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={C.slate400} />
              <TextInput
                value={hotelSearch}
                onChangeText={setHotelSearch}
                placeholder="Search hotels..."
                style={styles.searchInput}
                placeholderTextColor={C.slate400}
              />
            </View>
            <View style={styles.chipWrap}>
              {filteredHotels.map((hotel) => {
                const active = selectedHotelIds.includes(hotel._id);
                return (
                  <TouchableOpacity
                    key={hotel._id}
                    style={[styles.chip, active ? { ...styles.chipActive, backgroundColor: "#fffbeb", borderColor: C.amber500 } : styles.chipInactive]}
                    onPress={() => toggle(selectedHotelIds, setSelectedHotelIds, hotel._id)}
                  >
                    {active && <Ionicons name="checkmark" size={11} color={C.amber500} />}
                    <Text style={[styles.chipText, active ? { color: C.amber600 } : styles.chipTextInactive]}>
                      {hotel.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── SECTION 8: Itinerary ── */}
          <SectionCard>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader icon={<FontAwesome name="calendar" size={18} color={C.blue500} />} title="Itinerary" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.blue500 }]} onPress={addItinerary}>
                <Ionicons name="add" size={16} color={C.white} />
                <Text style={styles.addBtnText}>Add Day</Text>
              </TouchableOpacity>
            </View>

            {itineraries.map((itin, iIdx) => (
              <View key={iIdx} style={styles.innerCard}>
                {/* Day badge + title */}
                <View style={styles.row}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>Day {String(itin.day_no).padStart(2, "0")}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={itin.title}
                      onChangeText={(v) => updateItinerary(iIdx, "title", v)}
                      placeholder="e.g. Arrival & Exploration"
                      style={styles.innerInput}
                      placeholderTextColor={C.slate400}
                    />
                  </View>
                </View>

                {/* Activities */}
                <Text style={styles.subLabel}>Activities</Text>
                {itin.activities.map((act, aIdx) => (
                  <View key={aIdx} style={styles.activityRow}>
                    <Ionicons name="time-outline" size={14} color={C.slate400} />
                    <TextInput
                      value={act.time}
                      onChangeText={(v) => updateActivity(iIdx, aIdx, "time", v)}
                      placeholder="08:30"
                      style={styles.timeInput}
                      placeholderTextColor={C.slate400}
                    />
                    <TextInput
                      value={act.task}
                      onChangeText={(v) => updateActivity(iIdx, aIdx, "task", v)}
                      placeholder="Describe the activity..."
                      style={[styles.innerInput, { flex: 1 }]}
                      placeholderTextColor={C.slate400}
                    />
                    {itin.activities.length > 1 && (
                      <TouchableOpacity onPress={() => removeActivity(iIdx, aIdx)}>
                        <Ionicons name="close" size={16} color={C.red400} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.textLink} onPress={() => addActivity(iIdx)}>
                  <Ionicons name="add-circle-outline" size={14} color={C.blue500} />
                  <Text style={[styles.textLinkText, { color: C.blue500 }]}>Add Activity</Text>
                </TouchableOpacity>

                {itineraries.length > 1 && (
                  <TouchableOpacity style={styles.deleteCardBtn} onPress={() => removeItinerary(iIdx)}>
                    <Ionicons name="trash" size={14} color={C.white} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </SectionCard>

          {/* ── SECTION 9: Transport ── */}
          <SectionCard>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader icon={<FontAwesome5 name="bus" size={16} color={C.green500} />} title="Transport" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.green500 }]} onPress={addTransport}>
                <Ionicons name="add" size={16} color={C.white} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            {transport.map((t, idx) => (
              <View key={idx} style={styles.row}>
                <TextInput
                  value={t}
                  onChangeText={(v) => updateTransport(idx, v)}
                  placeholder="e.g. Scenic train ride, Private A/C vehicle..."
                  style={[styles.input, { flex: 1 }]}
                  placeholderTextColor={C.slate400}
                />
                {transport.length > 1 && (
                  <TouchableOpacity style={styles.deleteRowBtn} onPress={() => removeTransport(idx)}>
                    <Ionicons name="trash" size={16} color={C.red500} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </SectionCard>

          {/* ── SECTION 10: Gallery ── */}
          <SectionCard>
            <SectionHeader icon={<Ionicons name="images" size={20} color={C.pink500} />} title="Package Gallery" />
            <View style={styles.galleryGrid}>
              {galleryUris.map((uri, i) => (
                <View key={i} style={styles.galleryItem}>
                  <Image source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.galleryDelete}
                    onPress={() => setGalleryUris((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Ionicons name="trash" size={14} color={C.white} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.galleryAddBtn} onPress={pickGalleryImage}>
                <Ionicons name="add" size={24} color={C.pink500} />
                <Text style={styles.galleryAddText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* ── SECTION 11: FAQs ── */}
          <SectionCard>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader icon={<Ionicons name="help-circle" size={20} color={C.orange500} />} title="FAQs" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.orange500 }]} onPress={addFaq}>
                <Ionicons name="add" size={16} color={C.white} />
                <Text style={styles.addBtnText}>Add FAQ</Text>
              </TouchableOpacity>
            </View>
            {faqs.map((faq, idx) => (
              <View key={idx} style={styles.innerCard}>
                <InputGroup
                  label="Question"
                  value={faq.question}
                  onChangeText={(v) => updateFaq(idx, "question", v)}
                  placeholder="e.g. Is the train seat guaranteed?"
                />
                <InputGroup
                  label="Answer"
                  value={faq.answer}
                  onChangeText={(v) => updateFaq(idx, "answer", v)}
                  placeholder="Provide a clear answer..."
                  multiline
                  numberOfLines={2}
                />
                {faqs.length > 1 && (
                  <TouchableOpacity style={styles.deleteCardBtn} onPress={() => removeFaq(idx)}>
                    <Ionicons name="trash" size={14} color={C.white} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </SectionCard>

          {/* ── SECTION 12: Traveller Tips ── */}
          <SectionCard>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader icon={<Ionicons name="bulb" size={20} color={C.yellow500} />} title="Traveller Tips" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.yellow500 }]} onPress={addTip}>
                <Ionicons name="add" size={16} color={C.white} />
                <Text style={styles.addBtnText}>Add Tip</Text>
              </TouchableOpacity>
            </View>
            {travellerTips.map((tip, idx) => (
              <View key={idx} style={styles.innerCard}>
                <InputGroup
                  label="Tip Title"
                  value={tip.title}
                  onChangeText={(v) => updateTip(idx, "title", v)}
                  placeholder="e.g. Pack Layers"
                />
                <InputGroup
                  label="Description"
                  value={tip.description}
                  onChangeText={(v) => updateTip(idx, "description", v)}
                  placeholder="Give helpful context..."
                  multiline
                  numberOfLines={2}
                />
                {travellerTips.length > 1 && (
                  <TouchableOpacity style={styles.deleteCardBtn} onPress={() => removeTip(idx)}>
                    <Ionicons name="trash" size={14} color={C.white} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </SectionCard>

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.submitBtnText}>
                  {isEditing ? "UPDATE PACKAGE" : "CREATE PACKAGE"}
                </Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.sectionCard}>{children}</View>
);

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle }) => (
  <View style={{ marginBottom: subtitle ? 4 : 16 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

interface InputGroupProps {
  label?: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  readOnly?: boolean;
}
const InputGroup: React.FC<InputGroupProps> = ({
  label, value, onChangeText, placeholder, error,
  multiline, numberOfLines, keyboardType = "default", readOnly,
}) => (
  <View style={styles.fieldWrap}>
    {label && <Text style={styles.fieldLabel}>{label}</Text>}
    <TextInput
      value={value}
      onChangeText={readOnly ? undefined : onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.slate400}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      editable={!readOnly}
      style={[
        styles.input,
        multiline && { height: (numberOfLines ?? 2) * 40, textAlignVertical: "top" },
        error ? styles.inputError : null,
        readOnly ? { color: C.blue500, fontWeight: "900", textAlign: "center" } : null,
      ]}
    />
    {error && <Text style={styles.errorText}>⚠ {error}</Text>}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GALLERY_CELL = (SCREEN_WIDTH - 32 - 48 - 8 * 3) / 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: C.bg,
  },
  backBtn: {
    padding: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: C.slate900 },
  headerSubtitle: { fontSize: 13, color: C.slate400, fontWeight: "500" },
  content: { padding: 16, gap: 16, paddingBottom: 48 },

  // Section Card
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: C.slate200,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: C.slate800 },
  sectionSubtitle: { fontSize: 12, color: C.slate400, fontWeight: "500", marginTop: 2, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  // Fields
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: "900", color: C.slate500, textTransform: "uppercase", letterSpacing: 1.5, marginLeft: 4 },
  input: {
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: "600",
    color: C.slate700,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: { fontSize: 14, fontWeight: "600", color: C.slate700 },
  inputPlaceholder: { fontSize: 14, color: C.slate400 },
  inputError: { borderColor: C.red400 },
  errorText: { fontSize: 11, fontWeight: "700", color: C.red500, marginLeft: 4 },

  // Dropdown
  dropdownList: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 16,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: "#eff6ff" },
  dropdownItemText: { fontSize: 14, color: C.slate700 },

  // Row
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  // Chips
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 2,
  },
  chipActive: { backgroundColor: C.slate900, borderColor: C.slate900 },
  chipInactive: { backgroundColor: C.slate50, borderColor: C.slate200 },
  chipText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  chipTextActive: { color: C.white },
  chipTextInactive: { color: C.slate500 },
  selectionCount: { fontSize: 11, fontWeight: "900", color: C.purple500, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.slate700 },

  // Add button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addBtnText: { color: C.white, fontWeight: "900", fontSize: 12 },

  // Inner card (itinerary / faq / tip)
  innerCard: {
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    position: "relative",
  },
  innerInput: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.slate700,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: C.slate400,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  dayBadge: {
    backgroundColor: C.blue500,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: C.white,
  },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeInput: {
    width: 64,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: "900",
    color: C.slate700,
    textAlign: "center",
  },
  textLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  textLinkText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  deleteCardBtn: {
    position: "absolute",
    top: -12,
    right: -12,
    backgroundColor: C.red500,
    borderRadius: 100,
    padding: 8,
  },
  deleteRowBtn: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 14,
  },

  // Gallery
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  galleryItem: { width: GALLERY_CELL, height: GALLERY_CELL, borderRadius: 16, overflow: "hidden" },
  galleryImage: { width: "100%", height: "100%" },
  galleryDelete: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(239,68,68,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryAddBtn: {
    width: GALLERY_CELL,
    height: GALLERY_CELL,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: C.slate300,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  galleryAddText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase", color: C.slate400 },

  // Submit
  submitBtn: {
    backgroundColor: C.slate900,
    paddingVertical: 22,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: C.slate400 },
  submitBtnText: { color: C.white, fontWeight: "900", fontSize: 20, letterSpacing: 1.5 },
});

export default AddPackagePage;