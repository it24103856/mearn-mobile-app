import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FontAwesome,
  FontAwesome5,
  MaterialIcons,
} from "@expo/vector-icons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Driver {
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  vehicleType: string;
  profileImage?: string;
  description?: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoCardIcon}>{icon}</View>
    <View style={styles.infoCardText}>
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </View>
  </View>
);

interface TagProps {
  text: string;
}

const Tag: React.FC<TagProps> = ({ text }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{text}</Text>
  </View>
);

// ── Main Component ────────────────────────────────────────────────────────────

const DriverOverview: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const backendUrl = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

  useEffect(() => {
    const fetchDriverDetails = async (): Promise<void> => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${backendUrl}/driver/get/${encodeURIComponent(email)}`);
        if (response.data && response.data.data) {
          setDriver(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching driver:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDriverDetails();
  }, [email, backendUrl]);

  // ── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // ── Not Found State ───────────────────────────────────────────────────────

  if (!driver) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Driver not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* Mobile Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backCircleBtn} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={16} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Driver Profile</Text>
        <View style={styles.topNavSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>

          {/* Profile Image */}
          <View style={styles.profileImageWrapper}>
            <Image
              source={{ uri: driver.profileImage || "https://via.placeholder.com/400x400?text=Driver" }}
              style={styles.profileImage}
              resizeMode="cover"
            />

            {/* Verified Badge */}
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={10} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>

            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
              <FontAwesome name="star" size={10} color="#f97316" />
              <Text style={styles.ratingText}>5.0</Text>
            </View>
          </View>

          {/* Driver Identity */}
          <View style={styles.driverIdentity}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIconBox}>
                <FontAwesome5 name="car" size={10} color="#ea580c" />
              </View>
              <Text style={styles.vehicleType}>{driver.vehicleType}</Text>
            </View>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => Linking.openURL(`tel:${driver.phone}`)}
              activeOpacity={0.85}
            >
              <FontAwesome name="phone" size={14} color="#fff" />
              <Text style={styles.callButtonText}>Call Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => Linking.openURL(`mailto:${driver.email}`)}
              activeOpacity={0.85}
            >
              <FontAwesome name="envelope" size={14} color="#1f2937" />
              <Text style={styles.emailButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Info Cards Grid ── */}
        <View style={styles.infoCardsRow}>
          <View style={styles.infoCardHalf}>
            <InfoCard
              icon={<FontAwesome name="map-marker" size={24} color="#ea580c" />}
              label="Primary Location"
              value={driver.address}
            />
          </View>
          <View style={styles.infoCardHalf}>
            <InfoCard
              icon={<FontAwesome name="id-card" size={22} color="#ea580c" />}
              label="License Number"
              value={driver.licenseNumber}
            />
          </View>
        </View>

        {/* ── Biography Section ── */}
        <View style={styles.biographyCard}>
          {/* Decorative quote icon */}
          <FontAwesome
            name="quote-left"
            size={80}
            color="#f3f4f6"
            style={styles.quoteIcon}
          />

          <View style={styles.biographyHeader}>
            <View style={styles.biographyAccent} />
            <View style={styles.biographyTitleRow}>
              <FontAwesome name="file-text" size={13} color="#f97316" />
              <Text style={styles.biographyTitle}>Biography</Text>
            </View>
          </View>

          <Text style={styles.biographyText}>
            {driver.description ||
              "This professional driver is highly experienced and dedicated to providing a safe, comfortable journey across Sri Lanka."}
          </Text>
        </View>

        {/* ── Service Excellence Tags ── */}
        <View style={styles.tagsCard}>
          <Text style={styles.tagsLabel}>Service Excellence</Text>
          <View style={styles.tagsRow}>
            <Tag text="English Speaking" />
            <Tag text="Tourist Specialist" />
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9fafb" },

  // Loading
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 16, fontSize: 10, fontWeight: "900", letterSpacing: 3, color: "#9ca3af", textTransform: "uppercase" },

  // Not Found
  notFoundContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { color: "#6b7280", fontWeight: "700", fontSize: 16 },
  goBackText: { marginTop: 16, color: "#ea580c", fontWeight: "700", textDecorationLine: "underline" },

  // Top Nav
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backCircleBtn: { padding: 10, backgroundColor: "#f3f4f6", borderRadius: 999 },
  topNavTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 3, textTransform: "uppercase", color: "#111827" },
  topNavSpacer: { width: 36 },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 16 },

  // Profile Card
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "#fff",
  },

  // Profile Image
  profileImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    position: "relative",
  },
  profileImage: { width: "100%", height: "100%" },
  verifiedBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#22c55e",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  verifiedText: { color: "#fff", fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  ratingBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingText: { fontSize: 11, fontWeight: "900", color: "#1f2937" },

  // Driver Identity
  driverIdentity: { alignItems: "center", marginBottom: 24 },
  driverName: { fontSize: 28, fontWeight: "900", color: "#111827", textTransform: "capitalize", marginBottom: 8, lineHeight: 30 },
  vehicleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vehicleIconBox: { backgroundColor: "#fff7ed", padding: 6, borderRadius: 10 },
  vehicleType: { color: "#ea580c", fontWeight: "900", fontSize: 10, textTransform: "uppercase", letterSpacing: 3 },

  // Contact Buttons
  contactButtons: { gap: 12 },
  callButton: {
    backgroundColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 20,
  },
  callButtonText: { color: "#fff", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 3 },
  emailButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 20,
  },
  emailButtonText: { color: "#111827", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 3 },

  // Info Cards
  infoCardsRow: { flexDirection: "row", gap: 12 },
  infoCardHalf: { flex: 1 },
  infoCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoCardIcon: {
    width: 52,
    height: 52,
    backgroundColor: "#fff7ed",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCardText: { flex: 1 },
  infoCardLabel: { fontSize: 9, color: "#9ca3af", fontWeight: "900", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 },
  infoCardValue: { fontSize: 13, color: "#111827", fontWeight: "700", lineHeight: 18 },

  // Biography Card
  biographyCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#fff",
    overflow: "hidden",
    position: "relative",
  },
  quoteIcon: { position: "absolute", top: -10, right: -10 },
  biographyHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  biographyAccent: { width: 36, height: 4, backgroundColor: "#f97316", borderRadius: 999 },
  biographyTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  biographyTitle: { fontSize: 14, fontWeight: "900", color: "#111827", textTransform: "uppercase", letterSpacing: 2 },
  biographyText: { fontSize: 16, color: "#4b5563", lineHeight: 28, fontStyle: "italic", fontWeight: "500" },

  // Tags Card
  tagsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  tagsLabel: { fontSize: 9, fontWeight: "900", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tagText: { fontSize: 9, fontWeight: "900", color: "#374151", textTransform: "uppercase", letterSpacing: 2 },
});

export default DriverOverview;