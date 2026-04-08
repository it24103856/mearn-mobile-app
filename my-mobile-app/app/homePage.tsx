import { useRouter } from "expo-router";
import { ArrowUpRight, Star } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  Image, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";

const { width } = Dimensions.get("window");

export default function HomePage() {
  const router = useRouter();

  const destinations = [
    {
      id: "ella-01",
      name: "Ella",
      listings: "25",
      img: require("../assets/ella.jpg"), // Using local asset
    },
    {
      id: "mirissa-02",
      name: "Mirissa",
      listings: "30",
      img: require("../assets/mirissa.jpg"),
    },
    {
      id: "sigiriya-03",
      name: "Sigiriya",
      listings: "35",
      img: require("../assets/SIGIRIYA.jpg"),
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Emily Johnson",
      img: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "The most incredible experience of my life. Every detail was perfectly planned."
    },
    {
      id: 2,
      name: "Michael Chen",
      img: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "Luxury travel redefined. I felt like royalty from start to finish."
    }
  ];

  return (
    
    <SafeAreaView style={styles.container}>
      
      <Header />

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        
        <Hero />

        {/* 1. Popular Destinations Section */}
        <View style={styles.section}>
          
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.subTag}>FEATURED PLACES</Text>
              <Text style={styles.sectionTitle}>Top Destinations</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/destination')}>
              <Text style={styles.viewAllText}>View All <ArrowUpRight size={14} color="black" /></Text>
            </TouchableOpacity>
          </View>

          {/* Destinations Vertical List */}
          <View style={styles.destList}>
            {destinations.map((loc) => (
              <TouchableOpacity 
                key={loc.id} 
                style={styles.destCard}
                
              >
                <Image source={loc.img} style={styles.destImage} />
                <View style={styles.destOverlay}>
                  <Text style={styles.destName}>{loc.name}</Text>
                  <Text style={styles.destListings}>{loc.listings} Listings</Text>
                  <View style={styles.destIconBox}>
                    <ArrowUpRight size={20} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Testimonials Section */}
        <View style={[styles.section, { backgroundColor: '#F9F9F9', paddingVertical: 40 }]}>
          <Text style={styles.subTag}>TESTIMONIALS</Text>
          <Text style={styles.sectionTitle}>What Our Travelers Say</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testiScroll}>
            {testimonials.map((item) => (
              <View key={item.id} style={styles.testiCard}>
                <Image source={{ uri: item.img }} style={styles.userImg} />
                <View style={styles.starRow}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#00AEEF" color="#00AEEF" />)}
                </View>
                <Text style={styles.testiText}>"{item.text}"</Text>
                <Text style={styles.userName}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 },
  subTag: { color: '#00AEEF', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginTop: 5 },
  viewAllText: { fontSize: 12, fontWeight: 'bold', borderBottomWidth: 1, paddingBottom: 2 },
  destList: { gap: 20 },
  destCard: { width: '100%', height: 250, borderRadius: 30, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  destImage: { width: '100%', height: '100%' },
  destOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  destListings: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  destIconBox: { backgroundColor: '#00AEEF', padding: 10, borderRadius: 50 },
  testiScroll: { marginTop: 20 },
  testiCard: { backgroundColor: 'white', width: width * 0.7, padding: 25, borderRadius: 30, marginRight: 20, alignItems: 'center', elevation: 3 },
  userImg: { width: 60, height: 60, borderRadius: 30, marginBottom: 15, borderWidth: 2, borderColor: '#00AEEF' },
  starRow: { flexDirection: 'row', gap: 2, marginBottom: 10 },
  testiText: { textAlign: 'center', fontStyle: 'italic', color: '#666', lineHeight: 20, fontSize: 14 },
  userName: { fontWeight: 'bold', marginTop: 15, fontSize: 16 }
});