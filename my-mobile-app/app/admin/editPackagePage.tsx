import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import axios from "axios";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { uploadFile } from "../../lib/supabase";

// ── Matches Package.js enum exactly ──────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "adventure",  label: "Adventure" },
  { value: "wildlife",   label: "Wildlife" },
  { value: "historical", label: "Historical" },
  { value: "cultural",   label: "Cultural" },
  { value: "beach",      label: "Beach" },
  { value: "wellness",   label: "Wellness" },
  { value: "eco",        label: "Eco / Nature" },
  { value: "family",     label: "Family" },
];

const WEATHER_OPTIONS = [
  { value: "sunny",    label: "☀️ Sunny & Warm" },
  { value: "tropical", label: "🌴 Tropical" },
  { value: "humid",    label: "💧 Humid" },
  { value: "cool",     label: "🍂 Cool & Crisp" },
  { value: "dry",      label: "🏜️ Hot & Dry" },
  { value: "rainy",    label: "🌧️ Rainy" },
];

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
];

const LOCATION_OPTIONS = [
  "Colombo","Kandy","Galle","Jaffna","Anuradhapura","Polonnaruwa","Sigiriya",
  "Ella","Nuwara Eliya","Trincomalee","Batticaloa","Hambantota","Mirissa",
  "Hikkaduwa","Arugam Bay","Yala","Wilpattu","Udawalawe","Dambulla","Matara",
  "Bentota","Negombo","Ratnapura","Badulla","Ampara","Multi-location",
];

// ── Types ─────────────────────────────────────────────────────────────────────
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
  min_group_size: number;
  max_group_size: number;
}

interface Hotel {
  _id: string;
  name: string;
}

interface Destination {
  _id: string;
  name: string;
}

type RootParamList = {
  EditPackage: { id: string };
};

// ── Reusable InputGroup ────────────────────────────────────────────────────────
interface InputGroupProps {
  label?: string;
  value: string | number;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  hasError?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "email-address";
  editable?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({
  label, value, onChangeText, placeholder, hasError,
  multiline, numberOfLines, keyboardType = "default", editable = true,
}) => (
  <View style={styles.inputGroup}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <TextInput
      value={String(value)}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={editable}
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        hasError && styles.inputError,
        !editable && styles.inputReadOnly,
      ]}
    />
  </View>
);

// ── Main Component ────────────────────────────────────────────────────────────
const EditPackagePage: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootParamList, "EditPackage">>();
  const { id } = route.params;

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
  const token = ""; // Replace with your auth token logic (e.g. AsyncStorage)

  const [formData, setFormData] = useState<FormData>({
    title: "", description: "", location: "", price: "", no_of_days: "",
    min_group_size: 1, max_group_size: 20,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
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
  const [newGalleryUris, setNewGalleryUris] = useState<string[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([
    { day_no: 1, title: "", activities: [{ time: "", task: "" }] },
  ]);
  const [transport, setTransport] = useState<string[]>([""]);
  const [faqs, setFaqs] = useState<Faq[]>([{ question: "", answer: "" }]);
  const [travellerTips, setTravellerTips] = useState<TravellerTip[]>([{ title: "", description: "" }]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  // ── Fetch hotels & destinations ───────────────────────────────────────────
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [hotelsRes, destsRes] = await Promise.all([
          axios.get(`${backendUrl}/hotels/all`),
          axios.get(`${backendUrl}/destinations/all`),
        ]);
        setAllHotels(hotelsRes.data?.data || []);
        setAllDestinations(destsRes.data?.data || []);
      } catch {
        Alert.alert("Error", "Failed to load hotels/destinations");
      }
    };
    fetchOptions();
  }, [backendUrl]);

  // ── Fetch existing package ────────────────────────────────────────────────
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await axios.get(`${backendUrl}/packages/get/${id}`);
        if (res.data?.data) {
          const pkg = res.data.data;
          setFormData({
            title: pkg.title || "", description: pkg.description || "",
            location: pkg.location || "", price: String(pkg.price || ""),
            no_of_days: String(pkg.no_of_days || ""),
            min_group_size: pkg.min_group_size || 1,
            max_group_size: pkg.max_group_size || 20,
          });
          setSelectedCategories(pkg.categories || []);
          setSelectedWeather(pkg.weather || []);
          setSelectedInterests(pkg.interests || []);
          setGalleryUris(pkg.gallery || []);
          setItineraries(
            pkg.itineraries?.length
              ? pkg.itineraries.map((i: Itinerary) => ({
                  ...i,
                  activities: i.activities?.length ? i.activities : [{ time: "", task: "" }],
                }))
              : [{ day_no: 1, title: "", activities: [{ time: "", task: "" }] }]
          );
          setTransport(pkg.transport?.length ? pkg.transport : [""]);
          setFaqs(pkg.faqs?.length ? pkg.faqs : [{ question: "", answer: "" }]);
          setTravellerTips(pkg.traveller_tips?.length ? pkg.traveller_tips : [{ title: "", description: "" }]);
          setSelectedHotelIds((pkg.included_hotels || []).map((h: Hotel | string) => (typeof h === "string" ? h : h._id)));
          setSelectedDestinationIds((pkg.destinations || []).map((d: Destination | string) => (typeof d === "string" ? d : d._id)));
        }
      } catch {
        Alert.alert("Error", "Failed to load package data!");
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchPackage();
  }, [id, backendUrl]);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const toggle = <T extends string>(setter: React.Dispatch<React.SetStateAction<T[]>>, val: T) =>
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  // ── Gallery ───────────────────────────────────────────────────────────────
  const pickGalleryImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setGalleryUris(prev => [...prev, ...uris]);
      setNewGalleryUris(prev => [...prev, ...uris]);
    }
  };

  const removeGalleryImage = (index: number) => {
    const uri = galleryUris[index];
    setGalleryUris(prev => prev.filter((_, i) => i !== index));
    setNewGalleryUris(prev => prev.filter(u => u !== uri));
  };

  // ── Itinerary helpers ─────────────────────────────────────────────────────
  const addItinerary = () =>
    setItineraries(prev => [...prev, { day_no: prev.length + 1, title: "", activities: [{ time: "", task: "" }] }]);

  const removeItinerary = (i: number) =>
    setItineraries(prev => prev.filter((_, idx) => idx !== i).map((it, idx) => ({ ...it, day_no: idx + 1 })));

  const handleItineraryChange = (i: number, field: keyof Itinerary, value: string) =>
    setItineraries(prev => { const u = [...prev]; (u[i] as any)[field] = value; return u; });

  const addActivity = (iIdx: number) =>
    setItineraries(prev => {
      const u = [...prev];
      u[iIdx] = { ...u[iIdx], activities: [...u[iIdx].activities, { time: "", task: "" }] };
      return u;
    });

  const removeActivity = (iIdx: number, aIdx: number) =>
    setItineraries(prev => {
      const u = [...prev];
      u[iIdx] = { ...u[iIdx], activities: u[iIdx].activities.filter((_, i) => i !== aIdx) };
      return u;
    });

  const handleActivityChange = (iIdx: number, aIdx: number, field: keyof Activity, value: string) =>
    setItineraries(prev => {
      const u = [...prev];
      u[iIdx].activities[aIdx] = { ...u[iIdx].activities[aIdx], [field]: value };
      return u;
    });

  // ── Transport helpers ─────────────────────────────────────────────────────
  const addTransport = () => setTransport(prev => [...prev, ""]);
  const removeTransport = (i: number) => setTransport(prev => prev.filter((_, idx) => idx !== i));
  const handleTransportChange = (i: number, v: string) =>
    setTransport(prev => { const u = [...prev]; u[i] = v; return u; });

  // ── FAQ helpers ───────────────────────────────────────────────────────────
  const addFaq = () => setFaqs(prev => [...prev, { question: "", answer: "" }]);
  const removeFaq = (i: number) => setFaqs(prev => prev.filter((_, idx) => idx !== i));
  const handleFaqChange = (i: number, field: keyof Faq, v: string) =>
    setFaqs(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: v }; return u; });

  // ── Tip helpers ───────────────────────────────────────────────────────────
  const addTip = () => setTravellerTips(prev => [...prev, { title: "", description: "" }]);
  const removeTip = (i: number) => setTravellerTips(prev => prev.filter((_, idx) => idx !== i));
  const handleTipChange = (i: number, field: keyof TravellerTip, v: string) =>
    setTravellerTips(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: v }; return u; });

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.title.trim())       newErrors.title       = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.location)           newErrors.location    = "Location is required";
    if (!formData.price)              newErrors.price       = "Price is required";
    else if (Number(formData.price) <= 0) newErrors.price   = "Price must be greater than 0";
    if (!formData.no_of_days)         newErrors.no_of_days  = "Number of days is required";
    else if (Number(formData.no_of_days) <= 0) newErrors.no_of_days = "Number of days must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const existingUrls = galleryUris.filter(u => !newGalleryUris.includes(u));
      const uploadedUrls: string[] = [];
      for (const uri of newGalleryUris) {
        const url = await uploadFile(uri, 'packages');
        if (url) uploadedUrls.push(url);
      }
      const galleryUrls = [...existingUrls, ...uploadedUrls];

      const payload = {
        ...formData,
        categories:      selectedCategories,
        weather:         selectedWeather,
        interests:       selectedInterests,
        gallery:         galleryUrls,
        itineraries,
        transport:       transport.filter(t => t.trim()),
        faqs:            faqs.filter(f => f.question.trim()),
        traveller_tips:  travellerTips.filter(t => t.title.trim()),
        included_hotels: selectedHotelIds,
        destinations:    selectedDestinationIds,
      };

      await axios.put(`${backendUrl}/packages/update/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Success", "Package updated!");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels       = allHotels.filter(h => h.name?.toLowerCase().includes(hotelSearch.toLowerCase()));
  const filteredDestinations = allDestinations.filter(d => d.name?.toLowerCase().includes(destSearch.toLowerCase()));

  // ── Loading state ─────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>Edit Package</Text>
          <Text style={styles.pageSubtitle}>Update the package details below</Text>
        </View>
      </View>

      {/* ── SECTION 1: Basic Info ── */}
      <View style={[styles.card, styles.cardBlue]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#3b82f6" }]}>
            <Text style={styles.sectionIconText}>🧳</Text>
          </View>
          <Text style={styles.sectionTitle}>Basic Info</Text>
        </View>

        <InputGroup label="Package Title *" value={formData.title} onChangeText={v => handleChange("title", v)}
          placeholder="e.g. Magical Hill Country Experience" hasError={!!errors.title} />
        {errors.title ? <Text style={styles.errorText}>⚠ {errors.title}</Text> : null}

        <InputGroup label="Description *" value={formData.description} onChangeText={v => handleChange("description", v)}
          placeholder="Describe this package..." multiline numberOfLines={4} hasError={!!errors.description} />
        {errors.description ? <Text style={styles.errorText}>⚠ {errors.description}</Text> : null}

        {/* Location Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location *</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectBtn, errors.location ? styles.inputError : null]}
            onPress={() => setLocationPickerVisible(v => !v)}
          >
            <Text style={formData.location ? styles.selectBtnText : styles.selectBtnPlaceholder}>
              {formData.location || "Select location..."}
            </Text>
            <Text style={styles.selectArrow}>{locationPickerVisible ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {errors.location ? <Text style={styles.errorText}>⚠ {errors.location}</Text> : null}
        </View>
        {locationPickerVisible && (
          <View style={styles.pickerDropdown}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {LOCATION_OPTIONS.map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.pickerOption, formData.location === loc && styles.pickerOptionActive]}
                  onPress={() => { handleChange("location", loc); setLocationPickerVisible(false); }}
                >
                  <Text style={[styles.pickerOptionText, formData.location === loc && styles.pickerOptionTextActive]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <InputGroup label="Price (LKR) *" value={formData.price} onChangeText={v => handleChange("price", v)}
          placeholder="e.g. 25000" keyboardType="numeric" hasError={!!errors.price} />
        {errors.price ? <Text style={styles.errorText}>⚠ {errors.price}</Text> : null}

        <InputGroup label="Number of Days *" value={formData.no_of_days} onChangeText={v => handleChange("no_of_days", v)}
          placeholder="e.g. 5" keyboardType="numeric" hasError={!!errors.no_of_days} />
        {errors.no_of_days ? <Text style={styles.errorText}>⚠ {errors.no_of_days}</Text> : null}
      </View>

      {/* ── SECTION 2: Categories ── */}
      <View style={[styles.card, styles.cardPurple]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#a855f7" }]}>
            <Text style={styles.sectionIconText}>🏷️</Text>
          </View>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Select all that apply</Text>
        <View style={styles.chipWrap}>
          {CATEGORY_OPTIONS.map(({ value, label }) => {
            const active = selectedCategories.includes(value);
            return (
              <TouchableOpacity key={value} onPress={() => toggle(setSelectedCategories, value)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {active ? "✓ " : ""}{label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedCategories.length > 0 && (
          <Text style={styles.selectedCount}>
            ✓ {selectedCategories.length} categor{selectedCategories.length > 1 ? "ies" : "y"} selected
          </Text>
        )}
      </View>

      {/* ── SECTION 3: Group Size ── */}
      <View style={[styles.card, styles.cardTeal]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#14b8a6" }]}>
            <Text style={styles.sectionIconText}>👥</Text>
          </View>
          <Text style={styles.sectionTitle}>Group Size</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <InputGroup label="Min Group Size" value={formData.min_group_size}
              onChangeText={v => handleChange("min_group_size" as keyof FormData, v)} placeholder="e.g. 1" keyboardType="numeric" />
          </View>
          <View style={styles.halfWidth}>
            <InputGroup label="Max Group Size" value={formData.max_group_size}
              onChangeText={v => handleChange("max_group_size" as keyof FormData, v)} placeholder="e.g. 20" keyboardType="numeric" />
          </View>
        </View>
      </View>

      {/* ── SECTION 4: Weather ── */}
      <View style={[styles.card, styles.cardSky]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#0ea5e9" }]}>
            <Text style={styles.sectionIconText}>🌤️</Text>
          </View>
          <Text style={styles.sectionTitle}>Suitable Weather</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Select the weather conditions this package is best suited for</Text>
        <View style={styles.chipWrap}>
          {WEATHER_OPTIONS.map(({ value, label }) => {
            const active = selectedWeather.includes(value);
            return (
              <TouchableOpacity key={value} onPress={() => toggle(setSelectedWeather, value)}
                style={[styles.chip, active && styles.chipSky]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── SECTION 5: Related Interests ── */}
      <View style={[styles.card, styles.cardEmerald]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#10b981" }]}>
            <Text style={styles.sectionIconText}>✅</Text>
          </View>
          <Text style={styles.sectionTitle}>Related Interests</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Select the traveller interests this package caters to</Text>
        <View style={styles.chipWrap}>
          {INTEREST_OPTIONS.map(({ value, label }) => {
            const active = selectedInterests.includes(value);
            return (
              <TouchableOpacity key={value} onPress={() => toggle(setSelectedInterests, value)}
                style={[styles.chip, active && styles.chipEmerald]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── SECTION 6: Destinations ── */}
      <View style={[styles.card, styles.cardRed]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.sectionIconText}>📍</Text>
          </View>
          <Text style={styles.sectionTitle}>Destinations</Text>
        </View>
        <Text style={styles.sectionSubtitle}>{selectedDestinationIds.length} selected</Text>
        <TextInput value={destSearch} onChangeText={setDestSearch} placeholder="🔍  Search destinations..."
          placeholderTextColor="#94a3b8" style={styles.searchInput} />
        <View style={styles.gridWrap}>
          {filteredDestinations.map(dest => (
            <TouchableOpacity key={dest._id} onPress={() => toggle(setSelectedDestinationIds, dest._id)}
              style={[styles.gridChip, selectedDestinationIds.includes(dest._id) && styles.gridChipRed]}>
              <Text style={[styles.gridChipText, selectedDestinationIds.includes(dest._id) && styles.gridChipTextRed]}>
                {selectedDestinationIds.includes(dest._id) ? "✓ " : ""}{dest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── SECTION 7: Hotels ── */}
      <View style={[styles.card, styles.cardAmber]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#f59e0b" }]}>
            <Text style={styles.sectionIconText}>🏨</Text>
          </View>
          <Text style={styles.sectionTitle}>Included Hotels</Text>
        </View>
        <Text style={styles.sectionSubtitle}>{selectedHotelIds.length} selected</Text>
        <TextInput value={hotelSearch} onChangeText={setHotelSearch} placeholder="🔍  Search hotels..."
          placeholderTextColor="#94a3b8" style={styles.searchInput} />
        <View style={styles.gridWrap}>
          {filteredHotels.map(hotel => (
            <TouchableOpacity key={hotel._id} onPress={() => toggle(setSelectedHotelIds, hotel._id)}
              style={[styles.gridChip, selectedHotelIds.includes(hotel._id) && styles.gridChipAmber]}>
              <Text style={[styles.gridChipText, selectedHotelIds.includes(hotel._id) && styles.gridChipTextAmber]}>
                {selectedHotelIds.includes(hotel._id) ? "✓ " : ""}{hotel.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── SECTION 8: Itinerary ── */}
      <View style={[styles.card, styles.cardBlue]}>
        <View style={[styles.sectionHeader, { justifyContent: "space-between" }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#3b82f6" }]}>
              <Text style={styles.sectionIconText}>📅</Text>
            </View>
            <Text style={styles.sectionTitle}>Itinerary</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addItinerary}>
            <Text style={styles.addBtnText}>+ Add Day</Text>
          </TouchableOpacity>
        </View>

        {itineraries.map((itin, iIdx) => (
          <View key={iIdx} style={styles.itineraryCard}>
            <View style={styles.row}>
              <View style={{ width: 72, marginRight: 8 }}>
                <InputGroup label={`Day ${itin.day_no}`} value={itin.day_no} editable={false} />
              </View>
              <View style={{ flex: 1 }}>
                <InputGroup label="Day Title" value={itin.title}
                  onChangeText={v => handleItineraryChange(iIdx, "title", v)}
                  placeholder="e.g. Arrival · Tea country immersion" />
              </View>
            </View>

            <Text style={styles.activitiesLabel}>Activities</Text>
            {itin.activities.map((act, aIdx) => (
              <View key={aIdx} style={styles.activityRow}>
                <Text style={{ marginRight: 6, color: "#94a3b8" }}>🕐</Text>
                <TextInput value={act.time} onChangeText={v => handleActivityChange(iIdx, aIdx, "time", v)}
                  placeholder="08:30" placeholderTextColor="#94a3b8"
                  style={[styles.input, styles.timeInput]} />
                <TextInput value={act.task} onChangeText={v => handleActivityChange(iIdx, aIdx, "task", v)}
                  placeholder="Describe the activity..." placeholderTextColor="#94a3b8"
                  style={[styles.input, styles.taskInput]} />
                {itin.activities.length > 1 && (
                  <TouchableOpacity onPress={() => removeActivity(iIdx, aIdx)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity onPress={() => addActivity(iIdx)} style={styles.addActivityBtn}>
              <Text style={styles.addActivityBtnText}>+ Add Activity</Text>
            </TouchableOpacity>

            {itineraries.length > 1 && (
              <TouchableOpacity onPress={() => removeItinerary(iIdx)} style={styles.deleteCardBtn}>
                <Text style={styles.deleteCardBtnText}>🗑 Remove Day</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* ── SECTION 9: Transport ── */}
      <View style={[styles.card, styles.cardGreen]}>
        <View style={[styles.sectionHeader, { justifyContent: "space-between" }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#22c55e" }]}>
              <Text style={styles.sectionIconText}>🚌</Text>
            </View>
            <Text style={styles.sectionTitle}>Transport</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: "#22c55e" }]} onPress={addTransport}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {transport.map((t, idx) => (
          <View key={idx} style={[styles.row, { marginBottom: 10 }]}>
            <TextInput value={t} onChangeText={v => handleTransportChange(idx, v)}
              placeholder="e.g. Scenic train ride, Private A/C vehicle..."
              placeholderTextColor="#94a3b8"
              style={[styles.input, { flex: 1, marginRight: transport.length > 1 ? 8 : 0 }]} />
            {transport.length > 1 && (
              <TouchableOpacity onPress={() => removeTransport(idx)} style={styles.trashBtn}>
                <Text style={styles.trashBtnText}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* ── SECTION 10: Gallery ── */}
      <View style={[styles.card]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#ec4899" }]}>
            <Text style={styles.sectionIconText}>🖼️</Text>
          </View>
          <Text style={styles.sectionTitle}>Gallery Assets</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
          {galleryUris.map((uri, i) => (
            <View key={i} style={styles.galleryThumb}>
              <Image source={{ uri }} style={styles.galleryImg} />
              <TouchableOpacity style={styles.galleryRemoveBtn} onPress={() => removeGalleryImage(i)}>
                <Text style={styles.galleryRemoveBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.galleryAddBtn} onPress={pickGalleryImages}>
            <Text style={styles.galleryAddIcon}>＋</Text>
            <Text style={styles.galleryAddText}>Add Media</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── SECTION 11: FAQs ── */}
      <View style={[styles.card, styles.cardDark]}>
        <View style={styles.darkCardHeader}>
          <Text style={styles.darkCardHeaderTitle}>❓ Frequently Asked Questions</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: "#f97316" }]} onPress={addFaq}>
            <Text style={styles.addBtnText}>+ Add FAQ</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16 }}>
          {faqs.map((faq, idx) => (
            <View key={idx} style={styles.faqCard}>
              <InputGroup label="Question" value={faq.question}
                onChangeText={v => handleFaqChange(idx, "question", v)}
                placeholder="e.g. Is the train seat guaranteed?" />
              <InputGroup label="Answer" value={faq.answer}
                onChangeText={v => handleFaqChange(idx, "answer", v)}
                placeholder="Provide a clear answer..." multiline numberOfLines={2} />
              {faqs.length > 1 && (
                <TouchableOpacity onPress={() => removeFaq(idx)} style={styles.deleteCardBtn}>
                  <Text style={styles.deleteCardBtnText}>🗑 Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ── SECTION 12: Traveller Tips ── */}
      <View style={[styles.card, styles.cardDark]}>
        <View style={styles.darkCardHeader}>
          <Text style={styles.darkCardHeaderTitle}>💡 Traveller Tips</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: "#eab308" }]} onPress={addTip}>
            <Text style={styles.addBtnText}>+ Add Tip</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16 }}>
          {travellerTips.map((tip, idx) => (
            <View key={idx} style={styles.faqCard}>
              <InputGroup label="Tip Title" value={tip.title}
                onChangeText={v => handleTipChange(idx, "title", v)} placeholder="e.g. Pack Layers" />
              <InputGroup label="Description" value={tip.description}
                onChangeText={v => handleTipChange(idx, "description", v)}
                placeholder="Give helpful context..." multiline numberOfLines={2} />
              {travellerTips.length > 1 && (
                <TouchableOpacity onPress={() => removeTip(idx)} style={styles.deleteCardBtn}>
                  <Text style={styles.deleteCardBtnText}>🗑 Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ── Submit Button ── */}
      <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.submitBtnText}>SYNC PACKAGE TO DATABASE</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  contentContainer: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn: { padding: 12, backgroundColor: "#fff", borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 16 },
  backBtnText: { fontSize: 18, color: "#475569" },
  pageTitle: { fontSize: 26, fontWeight: "900", color: "#0f172a" },
  pageSubtitle: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },

  // Card
  card: {
    backgroundColor: "#fff", borderRadius: 28, padding: 20, marginBottom: 16,
    borderWidth: 2, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardBlue:    { borderColor: "#dbeafe" },
  cardPurple:  { borderColor: "#ede9fe" },
  cardTeal:    { borderColor: "#ccfbf1" },
  cardSky:     { borderColor: "#e0f2fe" },
  cardEmerald: { borderColor: "#d1fae5" },
  cardRed:     { borderColor: "#fee2e2" },
  cardAmber:   { borderColor: "#fef3c7" },
  cardGreen:   { borderColor: "#dcfce7" },
  cardDark:    { padding: 0, overflow: "hidden" },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  sectionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sectionIconText: { fontSize: 18 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  sectionSubtitle: { fontSize: 12, color: "#94a3b8", fontWeight: "500", marginBottom: 12, marginLeft: 2 },

  // Input
  inputGroup: { marginBottom: 12 },
  inputLabel: {
    fontSize: 10, fontWeight: "900", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, marginLeft: 2,
  },
  input: {
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff",
    borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 16,
    fontSize: 14, fontWeight: "700", color: "#1e293b",
  },
  inputMultiline: { minHeight: 100, textAlignVertical: "top" },
  inputError: { borderColor: "#f87171" },
  inputReadOnly: { backgroundColor: "#f8fafc", color: "#64748b" },
  errorText: { fontSize: 11, fontWeight: "700", color: "#ef4444", marginTop: 4, marginLeft: 4 },

  // Select / Location Picker
  selectBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectBtnText: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  selectBtnPlaceholder: { fontSize: 14, color: "#94a3b8" },
  selectArrow: { fontSize: 12, color: "#64748b" },
  pickerDropdown: {
    backgroundColor: "#fff", borderWidth: 2, borderColor: "#e2e8f0",
    borderRadius: 16, marginTop: -8, marginBottom: 12, overflow: "hidden", zIndex: 10,
  },
  pickerOption: { paddingVertical: 12, paddingHorizontal: 16 },
  pickerOptionActive: { backgroundColor: "#eff6ff" },
  pickerOptionText: { fontSize: 14, color: "#1e293b" },
  pickerOptionTextActive: { fontWeight: "700", color: "#3b82f6" },

  // Chips
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  chipActive:  { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  chipSky:     { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  chipEmerald: { backgroundColor: "#10b981", borderColor: "#10b981" },
  chipText: { fontSize: 11, fontWeight: "900", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  chipTextActive: { color: "#fff" },
  selectedCount: { marginTop: 12, fontSize: 11, fontWeight: "900", color: "#a855f7", textTransform: "uppercase", letterSpacing: 1 },

  // Grid chips
  searchInput: {
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#f8fafc",
    borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 16,
    fontSize: 13, color: "#1e293b", marginBottom: 12,
  },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  gridChipRed:      { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
  gridChipAmber:    { backgroundColor: "#fffbeb", borderColor: "#fcd34d" },
  gridChipText:     { fontSize: 12, fontWeight: "700", color: "#475569" },
  gridChipTextRed:  { color: "#b91c1c" },
  gridChipTextAmber:{ color: "#92400e" },

  // Layout
  row: { flexDirection: "row", alignItems: "flex-start" },
  halfWidth: { flex: 1, marginHorizontal: 4 },

  // Itinerary
  itineraryCard: {
    backgroundColor: "#f8fafc", borderWidth: 2, borderColor: "#e2e8f0",
    borderRadius: 20, padding: 14, marginBottom: 14,
  },
  activitiesLabel: {
    fontSize: 10, fontWeight: "900", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8,
  },
  activityRow: {
    flexDirection: "row", alignItems: "center", marginBottom: 8,
    backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1,
    borderColor: "#e2e8f0", padding: 10, gap: 6,
  },
  timeInput: { width: 70, textAlign: "center", fontSize: 12, paddingHorizontal: 8, paddingVertical: 8 },
  taskInput: { flex: 1, fontSize: 13, paddingHorizontal: 10, paddingVertical: 8 },
  addActivityBtn: { marginTop: 4 },
  addActivityBtnText: { fontSize: 12, fontWeight: "900", color: "#3b82f6", textTransform: "uppercase", letterSpacing: 0.5 },
  deleteCardBtn: { marginTop: 10, alignSelf: "flex-end" },
  deleteCardBtnText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },

  // Buttons
  addBtn: { backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  removeBtn: { padding: 6 },
  removeBtnText: { color: "#f87171", fontSize: 14, fontWeight: "700" },
  trashBtn: { padding: 12, backgroundColor: "#fef2f2", borderRadius: 14 },
  trashBtnText: { fontSize: 16 },

  // Gallery
  galleryScroll: { marginTop: 4 },
  galleryThumb: {
    width: 100, height: 100, borderRadius: 16, marginRight: 10,
    overflow: "hidden", borderWidth: 2, borderColor: "#e2e8f0",
  },
  galleryImg: { width: "100%", height: "100%" },
  galleryRemoveBtn: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(220,38,38,0.85)", borderRadius: 10,
    width: 20, height: 20, alignItems: "center", justifyContent: "center",
  },
  galleryRemoveBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  galleryAddBtn: {
    width: 100, height: 100, borderRadius: 16, borderWidth: 2,
    borderStyle: "dashed", borderColor: "#cbd5e1",
    alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc",
  },
  galleryAddIcon: { fontSize: 28, color: "#94a3b8" },
  galleryAddText: { fontSize: 10, fontWeight: "900", color: "#94a3b8", textTransform: "uppercase" },

  // Dark card sections
  darkCardHeader: {
    backgroundColor: "#1e293b", padding: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  darkCardHeaderTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  faqCard: {
    backgroundColor: "#fff", borderRadius: 20, borderWidth: 2, borderColor: "#f1f5f9",
    padding: 16, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },

  // Submit
  submitBtn: {
    backgroundColor: "#1e293b", borderRadius: 28, paddingVertical: 22,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15,
    shadowRadius: 16, elevation: 6, marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 1 },
});

export default EditPackagePage;