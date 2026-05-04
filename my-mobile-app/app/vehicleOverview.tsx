import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Vehicle {
  make: string;
  model: string;
  type: string;
  pricePerKm: number;
  driverId?: string | null;
  seatingCapacity: number;
  luggageCapacity: number;
  fuelType: string;
  hasAC: boolean;
  images?: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BRAND = "#C8813A";
const BRAND_DARK = "#A66A28";
const BRAND_LIGHT = "rgba(200,129,58,0.10)";
const BG = "#FDFDFD";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const VehicleOverview: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const resolvedId = Array.isArray(id) ? id[0] : id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  const backendUrl = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      if (!resolvedId) {
        setLoading(false);
        return;
      }

      try {
        const cleanId = resolvedId.includes(":") ? resolvedId.split(":")[1] : resolvedId;
        const response = await axios.get(`${backendUrl}/vehicles/${cleanId}`);
        const data = response.data?.data ?? response.data;
        setVehicle(data);
      } catch (error) {
        console.error("Error fetching vehicle:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicleDetails();
  }, [resolvedId, backendUrl]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={styles.loadingText}>Loading Vehicle...</Text>
      </SafeAreaView>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!vehicle) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFoundText}>Vehicle not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.goBackBtn}
        >
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];
  const mainImage = images.length > 0 ? images[activeImage] : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Vehicle Details</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Image Gallery ─────────────────────────────────────────────── */}
        <View style={styles.galleryCard}>
          {/* Main Image */}
          <View style={styles.mainImageWrapper}>
            {mainImage ? (
              <Image
                source={{ uri: mainImage }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.mainImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderIcon}>🚗</Text>
              </View>
            )}
            {/* Type Badge */}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>🚗 {vehicle.type}</Text>
            </View>
          </View>

          {/* Thumbnails */}
          {images.length > 1 && (
            <FlatList
              data={images}
              keyExtractor={(_, idx) => String(idx)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbList}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => setActiveImage(index)}
                  style={[
                    styles.thumb,
                    activeImage === index && styles.thumbActive,
                  ]}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* ── Header Section ────────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <Text style={styles.vehicleSubtitle}>Premium {vehicle.type}</Text>
          <Text style={styles.vehicleTitle}>
            {vehicle.make}{" "}
            <Text style={styles.vehicleTitleItalic}>{vehicle.model}</Text>
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>
                💵 LKR {vehicle.pricePerKm}{" "}
                <Text style={styles.priceBadgeUnit}>/ km</Text>
              </Text>
            </View>
            {vehicle.driverId && (
              <View style={styles.driverBadge}>
                <Text style={styles.driverBadgeText}>✅ Driver Available</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Specifications ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>⚙️  Specifications</Text>

        <View style={styles.specsGrid}>
          <InfoCard icon="👥" label="Seating" value={`${vehicle.seatingCapacity} Passengers`} />
          <InfoCard icon="🧳" label="Luggage" value={`${vehicle.luggageCapacity} Bags`} />
          <InfoCard icon="⛽" label="Fuel Type" value={vehicle.fuelType} />
          <InfoCard
            icon="❄️"
            label="Air Conditioning"
            value={vehicle.hasAC ? "AC Available" : "Non-AC"}
            highlight={vehicle.hasAC}
          />
        </View>

        {/* ── Trust Badges ──────────────────────────────────────────────── */}
        <View style={styles.trustCard}>
          <Text style={styles.trustTitle}>Guaranteed with every ride</Text>
          <View style={styles.tagRow}>
            <Tag icon="🛡️" text="Fully Insured" />
            <Tag icon="✅" text="Regular Maintenance" />
            <Tag icon="🧼" text="Sanitized Interiors" />
          </View>
        </View>

        {/* ── Booking CTA ───────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/hotel")}
          style={styles.bookBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>Book this Vehicle</Text>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, highlight }) => (
  <View style={styles.infoCard}>
    <View style={[styles.infoIconBox, highlight && styles.infoIconBoxHighlight]}>
      <Text style={styles.infoIcon}>{icon}</Text>
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

interface TagProps {
  icon: string;
  text: string;
}

const Tag: React.FC<TagProps> = ({ icon, text }) => (
  <View style={styles.tag}>
    <Text style={styles.tagIcon}>{icon}</Text>
    <Text style={styles.tagText}>{text}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Loading / Error states ───────────────────────────────────────────────
  centered: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#9CA3AF",
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 16,
  },
  goBackBtn: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  goBackBtnText: {
    color: BRAND,
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Top Navigation ───────────────────────────────────────────────────────
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnIcon: {
    fontSize: 18,
    color: "#1F2937",
    lineHeight: 22,
  },
  topNavTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: BRAND,
  },
  navSpacer: { width: 36 },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // ── Gallery ──────────────────────────────────────────────────────────────
  galleryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mainImageWrapper: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    position: "relative",
    marginBottom: 10,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 48,
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: BRAND,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  thumbList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  thumb: {
    width: 72,
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    opacity: 0.5,
  },
  thumbActive: {
    borderColor: BRAND,
    opacity: 1,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },

  // ── Header Card ──────────────────────────────────────────────────────────
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: BRAND,
    marginBottom: 8,
  },
  vehicleTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111827",
    lineHeight: 38,
    marginBottom: 16,
  },
  vehicleTitleItalic: {
    fontStyle: "italic",
    color: "#374151",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  priceBadge: {
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  priceBadgeText: {
    color: BRAND,
    fontWeight: "700",
    fontSize: 13,
  },
  priceBadgeUnit: {
    fontSize: 9,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  driverBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  driverBadgeText: {
    color: "#16A34A",
    fontWeight: "700",
    fontSize: 11,
  },

  // ── Specs ────────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
    marginLeft: 4,
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoCard: {
    width: (SCREEN_WIDTH - 32 - 12) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    alignItems: "flex-start",
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BRAND_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  infoIconBoxHighlight: {
    backgroundColor: BRAND,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
    textTransform: "capitalize",
  },

  // ── Trust Card ───────────────────────────────────────────────────────────
  trustCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  trustTitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "#9CA3AF",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  tagIcon: {
    fontSize: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── Book CTA ─────────────────────────────────────────────────────────────
  bookBtn: {
    backgroundColor: BRAND,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
});

export default VehicleOverview;