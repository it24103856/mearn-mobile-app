import axios from "axios";
import { useRouter } from "expo-router";
import { ArrowRight, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Configuration
const backendUrl = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 40) / 2; // Calculation for 2-column grid

interface Destination {
  _id: string;
  name: string;
  city?: string;
  image?: string[];
}

const DestinationPage = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      // Using the direct IP URL as requested
      const res = await axios.get(`${backendUrl}/destinations/all`);
      if (res.data && Array.isArray(res.data.data)) {
        setDestinations(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load destinations", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderHeader = () => (
    <View>
      <ImageBackground 
        source={{ uri: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
        style={styles.heroBackground}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroSubTitle}>EXPLORE SRI LANKA</Text>
          <Text style={styles.heroMainTitle}>Destinations</Text>
        </View>
      </ImageBackground>

      <View style={styles.headerContainer}>
        <View style={styles.curveContainer}>
          <Text style={styles.description}>
            Sri Lanka is one of the most exotic getaways in the world. Surrounded by the azure Indian Ocean,
            this island paradise has contrasting landscapes and a wealth of wildlife.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your destination..."
              placeholderTextColor="#9ca3af"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <Search size={20} color="#d1d5db" style={styles.searchIcon} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Destination }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: "/destinationOverview", params: { id: item._id } })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image?.[0] || "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=800" }}
          style={styles.cardImage}
        />
        {item.city && (
          <View style={styles.cityBadge}>
            <Text style={styles.cityText} numberOfLines={1}>{item.city}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.exploreButton}>
          <Text style={styles.exploreText}>Explore</Text>
          <ArrowRight size={14} color="#C8813A" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00AEEF" />
        </View>
      ) : (
        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          numColumns={2}
          contentContainerStyle={styles.listPadding}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No destinations found matching your search.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDFD",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listPadding: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  headerContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "center",
  },
  heroBackground: {
    height: 450,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroSubTitle: {
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: 'center',
  },
  heroMainTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    textAlign: 'center',
  },
  curveContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    color: "#00AEEF",
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "300",
    color: "#111827",
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  searchContainer: {
    marginTop: 25,
    width: "100%",
    position: "relative",
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 14,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    position: "absolute",
    right: 20,
    top: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: COLUMN_WIDTH,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    height: 150,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cityBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  cityText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
  },
  cardContent: {
    padding: 15,
    alignItems: "center",
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 10,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  exploreText: {
    fontSize: 12,
    color: "#C8813A",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});

export default DestinationPage;