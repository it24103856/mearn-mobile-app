import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { Component } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView // Badges සඳහා පමණක් අවශ්‍ය වේ
  ,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Footer from '../components/Footer';
import Header from '../components/Header';

const { width } = Dimensions.get("window");

// TypeScript Interface
interface Hotel {
  _id: string;
  name: string;
  city: string;
  category?: string;
  images?: string[];
}

class HotelScreen extends Component<{}, any> {
  private backendUrl: string;

  constructor(props: any) {
    super(props);
    this.state = {
      hotels: [],
      filteredHotels: [],
      loading: true,
      searchTerm: "",
    };
    
    this.backendUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  }

  async componentDidMount() {
    this.fetchHotels();
  }

  fetchHotels = async () => {
    try {
      const response = await fetch(`${this.backendUrl}/hotels/all`);
      const resData = await response.json();
      if (resData && resData.data) {
        this.setState({ 
          hotels: resData.data, 
          filteredHotels: resData.data,
          loading: false 
        });
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
      this.setState({ loading: false });
    }
  };

  handleSearch = (text: string) => {
    const filtered = this.state.hotels.filter((hotel: Hotel) =>
      hotel.name.toLowerCase().includes(text.toLowerCase()) ||
      hotel.city.toLowerCase().includes(text.toLowerCase())
    );
    this.setState({ searchTerm: text, filteredHotels: filtered });
  };

  // එක් Hotel Card එකක් Render කරන ආකාරය
  renderHotelCard = ({ item }: { item: Hotel }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.images?.[0] || "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg" }} 
            style={styles.hotelImage} 
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || "Luxury"}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Feather name="star" size={10} color="#f59e0b" />
            <Text style={styles.ratingText}> 4.8</Text>
          </View>
        </View>
        
        {/* Content Section */}
        <View style={styles.cardContent}>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={10} color="#2563eb" />
            <Text style={styles.locationText}>{item.city}</Text>
          </View>
          <Text style={styles.hotelName}>{item.name}</Text>
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.detailsBtn}
            onPress={() => router.push({ pathname: "/hotelOverview", params: { id: item._id } })}
          >
            <Text style={styles.detailsBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // පිටුවේ ඉහළ කොටස (Hero + Search + Badges)
  renderHeader = () => (
    <View>
      <ImageBackground 
        source={{ uri: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
        style={styles.heroSection}
      >
        <View style={styles.overlay}>
          <Text style={styles.heroSubText}>EXPLORE SRI LANKA</Text>
          <Text style={styles.heroTitle}>Luxury <Text style={{color: '#3b82f6'}}>Hotels</Text></Text>
          
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#9ca3af" style={{marginRight: 10}} />
            <TextInput 
              placeholder="Search city or hotel..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              value={this.state.searchTerm}
              onChangeText={this.handleSearch}
            />
          </View>
        </View>
      </ImageBackground>

      <View style={styles.curvedContainer}>
        {/* Trust Badges */}
        <View style={styles.badgeSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BadgeItem icon={<MaterialCommunityIcons name="shield-check" size={20} color="#2563eb" />} text="Verified" />
            <BadgeItem icon={<MaterialCommunityIcons name="bell-ring" size={20} color="#2563eb" />} text="Best Service" />
            <BadgeItem icon={<MaterialCommunityIcons name="check-circle" size={20} color="#2563eb" />} text="Instant" />
          </ScrollView>
        </View>

        {/* Section Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={styles.sectionTitle}>Explore <Text style={{color: '#2563eb'}}>Hotels</Text></Text>
          <View style={styles.titleUnderline} />
        </View>
      </View>
    </View>
  );

  render() {
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loaderText}>Finding Luxury Stays...</Text>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <Header />
        
        <FlatList
          data={this.state.filteredHotels}
          renderItem={this.renderHotelCard}
          keyExtractor={item => item._id}
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={<Footer />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          // Android වල smooth scroll වීමට මෙය උපකාරී වේ
          removeClippedSubviews={false}
        />
      </SafeAreaView>
    );
  }
}

const BadgeItem = ({ icon, text }: { icon: any, text: string }) => (
  <View style={styles.badgeItem}>
    {icon}
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, fontWeight: "bold", letterSpacing: 1, fontSize: 10 },
  
  heroSection: { height: 450 },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.4)", 
    justifyContent: "center", 
    padding: 20 
  },
  heroTitle: { color: "#fff", fontSize: 48, fontWeight: "900", textAlign: "center" },
  heroSubText: { color: "#fff", textAlign: "center", fontWeight: "700", letterSpacing: 4, marginBottom: 10, fontSize: 12 },
  
  curvedContainer: {
    backgroundColor: 'white',
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
    height: 55,
  },
  searchInput: { flex: 1, color: "#000", fontWeight: "500" },

  badgeSection: { backgroundColor: "#f9fafb", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  badgeItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 20 },
  badgeText: { marginLeft: 8, fontSize: 10, fontWeight: "800", color: "#1f2937", textTransform: "uppercase" },

  gridContainer: { padding: 20 },
  sectionTitle: { fontSize: 28, fontWeight: "900", color: "#111827" },
  titleUnderline: { width: 40, height: 4, backgroundColor: "#2563eb", marginTop: 5, borderRadius: 2, marginBottom: 10 },

  cardContainer: { paddingHorizontal: 20 }, // FlatList එක ඇතුළේ padding සඳහා
  card: {
    backgroundColor: "#fff",
    borderRadius: 35,
    marginBottom: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  imageContainer: { height: 250 },
  hotelImage: { width: "100%", height: "100%", resizeMode: "cover" },
  categoryBadge: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: { color: "#fff", fontSize: 8, fontWeight: "900", textTransform: "uppercase" },
  ratingBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: { fontSize: 10, fontWeight: "900" },

  cardContent: { padding: 25, alignItems: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  locationText: { marginLeft: 5, fontSize: 10, color: "#2563eb", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  hotelName: { fontSize: 22, fontWeight: "900", color: "#111827", textAlign: "center" },
  divider: { width: 30, height: 4, backgroundColor: "#f3f4f6", borderRadius: 2, marginVertical: 20 },
  detailsBtn: {
    backgroundColor: "#111827",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  detailsBtnText: { color: "#fff", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 2 },
});

export default HotelScreen;