import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";
import Header from "../components/Header";

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

export default function ContactScreen() {
  const [adminDetails, setAdminDetails] = useState<any>({});

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(`${backendUrl}/contact/get`);
        if (res.data?.data) setAdminDetails(res.data.data);
      } catch (err) {
        console.error("Fetch Admin Error:", err);
      }
    };
    fetchAdmin();
  }, []);

  return (
    // මුළු Screen එකම flex: 1 විය යුතුයි
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <ImageBackground 
          source={{ uri: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
          style={styles.heroBackground}
        >
          <View style={styles.overlay}>
            <Text style={styles.heroSubLabel}>EXPLORE SRI LANKA</Text>
            <Text style={styles.heroText}>Contact Us</Text>
          </View>
        </ImageBackground>

        <View style={styles.curvedContainer}>
          <View style={{ padding: 25 }}>
            <Text style={styles.heading}>Let's Start a {"\n"}<Text style={{ color: '#f97316' }}>Conversation</Text></Text>
            
            <View style={styles.infoCard}>
               <Text style={styles.infoText}>📞 {adminDetails.phone || "078 831 6997"}</Text>
               <Text style={styles.infoText}>📍 {adminDetails.address || "Monaragala, Sri Lanka"}</Text>
               <Text style={styles.infoText}>✉️ {adminDetails.email || "travelmate@gmail.com"}</Text>
            </View>

            <View style={styles.imageContainer}>
               <Image source={require("../assets/contact.jpg")} style={styles.circularImage} />
            </View>
          </View>
          <Footer />
        </View>
      </ScrollView>

      {/* 2. CONTACT FORM */}
      <ContactForm />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: 'white',
    position: 'relative', // absolute දේවල් පාලනය කිරීමට
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBackground: {
    height: 450,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSubLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 10,
  },
  curvedContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
  },
  heroText: { color: 'white', fontSize: 48, fontWeight: '900' },
  heading: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  infoCard: { backgroundColor: '#fff7ed', padding: 25, borderRadius: 30, marginTop: 20 },
  infoText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  imageContainer: { alignItems: 'center', marginTop: 30 },
  circularImage: { width: 250, height: 250, borderRadius: 125, borderWidth: 5, borderColor: '#eee' },
});