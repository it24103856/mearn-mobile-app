import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ImageBackground,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { Car, Search, Settings, Shield, CheckCircle } from "lucide-react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  type: string;
  fuelType: string;
  seatingCapacity: number;
  pricePerKm: number;
  images: string[];
}

const VehiclePage: React.FC = () => {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      console.log("Fetching from:", backendUrl);
      const response = await axios.get(`${backendUrl}/vehicles`);
      console.log("Data received:", response.data);
      if (response.data && response.data.success) {
        setVehicles(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      (vehicle.make?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (vehicle.model?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (vehicle.type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
            style={styles.vehicleImage}
            resizeMode="cover"
          />
          <View style={styles.priceBadge}>
            <Text style={styles.priceLabel}>LKR</Text>
            <Text style={styles.priceText}>{item.pricePerKm}/KM</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.vehicleName}>{item.make} {item.model}</Text>
          <Text style={styles.certifiedText}>Available Vehicle</Text>

          <View style={styles.vehicleBadge}>
            <Car size={10} color="#ea580c" />
            <Text style={styles.vehicleText}>{item.type} • {item.fuelType}</Text>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() =>
              router.push({
                pathname: "/vehicleOverview",
                params: { id: item._id },
              })
            }
          >
            <Text style={styles.profileBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <ImageBackground
        source={{ uri: "https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" }}
        style={styles.heroSection}
      >
        <View style={styles.overlay}>
          <Text style={styles.heroSubText}>PREMIUM VEHICLES</Text>
          <Text style={styles.heroTitle}>Our <Text style={{ color: "#f97316" }}>Fleet</Text></Text>

          <View style={styles.searchBar}>
            <Search size={18} color="#9ca3af" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search make, model or type..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>
      </ImageBackground>

      <View style={styles.curvedContainer}>
        <View style={styles.badgeSection}>
          <FlatList
            horizontal
            data={[
              { key: "Well Maintained", icon: <Settings size={20} color="#f97316" /> },
              { key: "Fully Insured", icon: <Shield size={20} color="#f97316" /> },
              { key: "Sanitized Daily", icon: <CheckCircle size={20} color="#f97316" /> },
            ]}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <View style={styles.badgeItem}>
                {item.icon}
                <Text style={styles.badgeText}>{item.key}</Text>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        </View>

        <View style={styles.gridContainer}>
          <Text style={styles.sectionTitle}>Meet the <Text style={{ color: "#f97316" }}>Fleet</Text></Text>
          <View style={styles.titleUnderline} />
          {filteredVehicles.length === 0 && (
            <Text style={styles.emptyHint}>No vehicles found.</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerCtaWrap}>
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>
          Ready to <Text style={{ fontStyle: "italic" }}>explore?</Text>
        </Text>
        <Text style={styles.ctaSubtitle}>
          Book your perfect ride today and experience comfort and safety like never before.
        </Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/bookingpage")}> 
          <Text style={styles.ctaButtonText}>BOOK NOW</Text>
        </TouchableOpacity>
      </View>

      <Footer />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loaderContainer}>
          <Car size={40} color="#C8813A" />
          <Text style={styles.loaderText}>Loading Premium Fleet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicleCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: "#fff" }}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </SafeAreaView>
  );
};

const Badge: React.FC<{ icon: any; text: string }> = ({ icon, text }) => (
  <View style={styles.badgeItem}>
    {icon}
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDFD",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  heroSection: {
    height: 450,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  heroSubText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 4,
    marginBottom: 10,
    fontSize: 12,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#9CA3AF",
    letterSpacing: 3,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  curvedContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
  },
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.9)",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: 20,
    marginTop: 30,
    height: 50,
  },
  input: { flex: 1, color: "#000", height: "100%" },
  badgeSection: {
    backgroundColor: "#f9fafb",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginLeft: 8,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },
  titleUnderline: {
    width: 40,
    height: 4,
    backgroundColor: "#C8813A",
    borderRadius: 2,
    marginTop: 5,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    letterSpacing: 1,
    marginTop: 15,
    textAlign: "center",
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    minHeight: 200,
  },
  emptyHint: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 30,
    marginBottom: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  imageContainer: {
    height: 250,
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
  },
  priceBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#111827",
  },
  priceText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#111827",
    marginLeft: 4,
  },
  vehicleInfo: {
    padding: 20,
    alignItems: "center",
  },
  cardContent: {
    padding: 20,
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    textTransform: "capitalize",
  },
  certifiedText: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 15,
  },
  vehicleSpecs: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 15,
  },
  vehicleBadge: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffedd5",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#c2410c",
    textTransform: "uppercase",
    marginLeft: 8,
  },
  profileBtn: {
    backgroundColor: "#111827",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  profileBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footerCtaWrap: {
    paddingTop: 10,
  },
  ctaSection: {
    backgroundColor: "#111827",
    marginHorizontal: 15,
    marginBottom: 30,
    borderRadius: 30,
    padding: 25,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: "#C8813A",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 1.5,
  },
});

export default VehiclePage;