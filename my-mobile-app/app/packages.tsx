import axios from "axios";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  Leaf,
  Search, ShieldCheck
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image, ImageBackground, ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";

const { width } = Dimensions.get("window");

const PackagePage = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const backendUrl = process.env.EXPO_PUBLIC_API_URL ;

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axios.get(`${backendUrl}/packages/all`);
        if (response.data?.success) {
          setPackages(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const filteredPackages = packages.filter((pkg) =>
    pkg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#c87941" />
        <Text style={styles.loaderText}>DISCOVERING JOURNEYS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* ── HERO SECTION ── */}
        <ImageBackground 
          source={{ uri: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
          style={styles.hero}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroSubText}>EXPLORE SRI LANKA</Text>
            <Text style={styles.heroTitle}>Our <Text style={{color: '#fbbf24'}}>Packages</Text></Text>
            
            <View style={styles.searchBar}>
              <Search size={20} color="#999" />
              <TextInput
                placeholder="Search destination..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>
        </ImageBackground>

        <View style={styles.curvedContainer}>
          {/* ── TRUST BADGES ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
            <Badge icon={<ShieldCheck size={18} color="#f59e0b" />} text="Verified" />
            <Badge icon={<Leaf size={18} color="#f59e0b" />} text="Eco Friendly" />
            <Badge icon={<CheckCircle2 size={18} color="#f59e0b" />} text="Instant" />
          </ScrollView>

          {/* ── AI BANNER ── */}
          <TouchableOpacity 
            style={styles.aiBanner}
          >
            <Text style={styles.aiText}>Get AI powered recommendations</Text>
            <View style={styles.aiBtn}><Text style={styles.aiBtnText}>GO</Text></View>
          </TouchableOpacity>

          {/* ── PACKAGE LIST ── */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>All <Text style={{color: '#f59e0b'}}>Packages</Text></Text>
            <View style={styles.grid}>
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  pkg={pkg}
                  onPress={() =>
                    router.push({
                      pathname: '/PackageOverviewPage',
                      params: { id: pkg._id },
                    })
                  }
                />
              ))}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── COMPONENTS ────────────────────────

const Badge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <View style={styles.badge}>
    {icon}
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const PackageCard = ({ pkg, onPress }: { pkg: any; onPress: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Image source={{ uri: pkg.gallery?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" }} style={styles.cardImage} />
    <View style={styles.priceBadge}>
      <Text style={styles.priceLKR}>LKR</Text>
      <Text style={styles.priceValue}>{pkg.price?.toLocaleString()}</Text>
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={1}>{pkg.title}</Text>
      <Text style={styles.cardLoc}>{pkg.location} · {pkg.no_of_days} days</Text>
      <Text style={styles.cardLink}>View Details →</Text>
    </View>
  </TouchableOpacity>
);

// ─── STYLES ────────────────────────────

  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 10, fontSize: 10, fontWeight: 'bold', color: '#888', letterSpacing: 2 },
  hero: { height: 450, width: '100%', justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  heroTitle: { fontSize: 48, fontWeight: '900', color: 'white', textAlign: 'center' },
  heroSubText: { color: 'white', fontWeight: '700', letterSpacing: 4, marginBottom: 10, fontSize: 12, textAlign: 'center' },
  curvedContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    minHeight: 500,
  },
  searchBar: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 50, paddingHorizontal: 15, alignItems: 'center', height: 50, marginTop: 20, width: '90%' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#333' },
  badgeScroll: { paddingVertical: 20, paddingLeft: 20, backgroundColor: 'transparent' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#eee' },
  badgeText: { fontSize: 10, fontWeight: 'bold', marginLeft: 8, color: '#333' },
  aiBanner: { margin: 20, backgroundColor: '#f3f4f6', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiText: { fontSize: 16, fontWeight: 'bold', width: '70%' },
  aiBtn: { backgroundColor: '#111', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
  aiBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  listSection: { padding: 20 },
  sectionTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: 'white', borderRadius: 20, marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden' },
  cardImage: { width: '100%', height: 120 },
  priceBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: 5, borderRadius: 10, alignItems: 'center' },
  priceLKR: { fontSize: 8, color: '#666' },
  priceValue: { fontSize: 10, fontWeight: 'bold' },
  cardContent: { padding: 12, alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  cardLoc: { fontSize: 10, color: '#999', marginVertical: 4 },
  cardLink: { fontSize: 11, color: '#C8813A', fontWeight: 'bold' }
});

export default PackagePage;