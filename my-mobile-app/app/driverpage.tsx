import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { Component } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Footer from '../components/Footer';
import Header from '../components/Header';

const { width } = Dimensions.get("window");

interface Driver {
  _id: string;
  name: string;
  vehicleType: string;
  profileImage?: string;
}

class DriversScreen extends Component<{}, any> {
  private backendUrl: string;

  constructor(props: any) {
    super(props);
    this.state = {
      drivers: [],
      filteredDrivers: [],
      loading: true,
      searchTerm: "",
    };
    this.backendUrl = process.env.EXPO_PUBLIC_API_URL || "";
  }

  async componentDidMount() {
    this.fetchDrivers();
  }

  fetchDrivers = async () => {
    try {
      const response = await fetch(`${this.backendUrl}/driver/customer/get-all`);
      const resData = await response.json();
      if (resData && resData.data) {
        this.setState({ 
          drivers: resData.data, 
          filteredDrivers: resData.data,
          loading: false 
        });
      } else {
        this.setState({ loading: false });
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      this.setState({ loading: false });
      Alert.alert("Error", "Could not connect to the server.");
    }
  };

  handleSearch = (text: string) => {
    const filtered = this.state.drivers.filter((driver: Driver) =>
      driver.name.toLowerCase().includes(text.toLowerCase()) ||
      driver.vehicleType.toLowerCase().includes(text.toLowerCase())
    );
    this.setState({ searchTerm: text, filteredDrivers: filtered });
  };

  renderDriverCard = ({ item }: { item: Driver }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.profileImage || "https://via.placeholder.com/150" }} 
            style={styles.driverImage} 
          />
          <View style={styles.ratingBadge}>
            <Feather name="star" size={10} color="#f97316" />
            <Text style={styles.ratingText}> 5.0</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.driverName}>{item.name}</Text>
          <Text style={styles.certifiedText}>Certified Driver</Text>
          
          <View style={styles.vehicleBadge}>
            <FontAwesome5 name="car" size={10} color="#ea580c" />
            <Text style={styles.vehicleText}>{item.vehicleType}</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => Alert.alert("Profile", `Navigating to ${item.name}'s profile...`)}
          >
            <Text style={styles.profileBtnText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  renderHeader = () => (
    <View>
      {/* 1. Hero Section */}
      <ImageBackground 
        source={{ uri: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
        style={styles.heroSection}
      >
        <View style={styles.overlay}>
          <Text style={styles.heroSubText}>EXPLORE SRI LANKA</Text>
          <Text style={styles.heroTitle}>Our <Text style={{color: '#f97316'}}>Drivers</Text></Text>
          
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#9ca3af" style={{marginRight: 10}} />
            <TextInput 
              placeholder="Search driver or vehicle..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={this.state.searchTerm}
              onChangeText={this.handleSearch}
            />
          </View>
        </View>
      </ImageBackground>

      <View style={styles.curvedContainer}>
        {/* 2. Trust Badges */}
        <View style={styles.badgeSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 10}}>
            <View style={styles.badgeItem}><MaterialCommunityIcons name="shield-check" size={20} color="#f97316" /><Text style={styles.badgeText}>Verified</Text></View>
            <View style={styles.badgeItem}><MaterialCommunityIcons name="card-account-details" size={20} color="#f97316" /><Text style={styles.badgeText}>Licensed</Text></View>
            <View style={styles.badgeItem}><MaterialCommunityIcons name="check-circle" size={20} color="#f97316" /><Text style={styles.badgeText}>Safe</Text></View>
          </ScrollView>
        </View>

        {/* 3. Section Title */}
        <View style={styles.gridContainer}>
          <Text style={styles.sectionTitle}>Meet the <Text style={{color: '#f97316'}}>Fleet</Text></Text>
          <View style={styles.titleUnderline} />
          {this.state.filteredDrivers.length === 0 && (
            <Text style={{textAlign: 'center', marginTop: 20, color: '#999'}}>No drivers found.</Text>
          )}
        </View>
      </View>
    </View>
  );

  render() {
    if (this.state.loading) {
      return (
        <SafeAreaView style={styles.mainContainer}>
          <Header />
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loaderText}>Loading Fleet...</Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.mainContainer}>
        <Header />
        <FlatList
          data={this.state.filteredDrivers}
          renderItem={this.renderDriverCard}
          keyExtractor={item => item._id}
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={<Footer />}
          showsVerticalScrollIndicator={false}
          // Performance Optimize කිරීම සඳහා
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={{ backgroundColor: '#fff' }}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, fontWeight: "bold", letterSpacing: 1 },
  
  heroSection: { height: 450, justifyContent: "center" },
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
    height: 50,
  },
  input: { flex: 1, color: "#000", height: '100%' },

  badgeSection: { 
    backgroundColor: "#f9fafb", 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f3f4f6",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  badgeItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 15 },
  badgeText: { marginLeft: 8, fontSize: 10, fontWeight: "900", color: "#374151", textTransform: "uppercase" },

  gridContainer: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 28, fontWeight: "900", color: "#111827" },
  titleUnderline: { width: 40, height: 4, backgroundColor: "#f97316", marginTop: 5, borderRadius: 2, marginBottom: 10 },

  cardWrapper: { paddingHorizontal: 20 }, // FlatList එක තුළ පෑඩින් ලබා දීමට
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    marginBottom: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    ...Platform.select({
        ios: {
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
        },
        android: {
            elevation: 5,
        }
    })
  },
  imageContainer: { height: 250 },
  driverImage: { width: "100%", height: "100%", resizeMode: "cover" },
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

  cardContent: { padding: 20, alignItems: "center" },
  driverName: { fontSize: 20, fontWeight: "bold", color: "#111827", textTransform: "capitalize" },
  certifiedText: { fontSize: 10, color: "#9ca3af", fontWeight: "bold", textTransform: "uppercase", marginBottom: 15 },
  
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
  vehicleText: { marginLeft: 8, fontSize: 10, color: "#c2410c", fontWeight: "900", textTransform: "uppercase" },
  
  profileBtn: {
    backgroundColor: "#111827",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  profileBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 },
});

export default DriversScreen;