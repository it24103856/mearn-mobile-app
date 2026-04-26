import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, Clock, Globe, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import Footer from './Footer';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview'; // Map එක පෙන්වීමට මෙය install කරගත යුතුය
const { width } = Dimensions.get('window');

const DestinationOverview = () => {
  const { id } = useLocalSearchParams(); // Expo Router පරාමිතිය
  const [destination, setDestination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

const backendUrl = process.env.EXPO_PUBLIC_API_URL;
  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const res = await axios.get(`${backendUrl}/destinations/${id}`);
        if (res.data) {
          setDestination(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    fetchDestination();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00AEEF" />
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Destination not found.</Text>
      </View>
    );
  }

  // Google Maps Embed URL එක නිවැරදි කිරීම
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(destination.name + ' ' + (destination.city || ''))}`;
  
  // වැදගත්: API Key එකක් නොමැතිව පාවිච්චි කරන්නේ නම් පහත ක්‍රමය උත්සාහ කරන්න
  const simpleMapUrl = `https://www.google.com/maps?q=${encodeURIComponent(destination.name)}&output=embed`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* ── 1. HERO SECTION ── */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: destination.image?.[0] || 'https://images.unsplash.com/photo-1546708973-b339540b5162' }}
            style={styles.heroImage}
          />
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.contentBox}>
            <View style={styles.tag}>
              <MapPin size={12} color="#00AEEF" />
              <Text style={styles.tagText}>{destination.city || 'SRI LANKA'}</Text>
            </View>

            <Text style={styles.title}>{destination.name}</Text>
            <Text style={styles.description}>{destination.description}</Text>

            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>REGION</Text>
                <Text style={styles.statValue}><Globe size={14} color="black" /> {destination.region || 'South'}</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>STAY DURATION</Text>
                <Text style={styles.statValue}><Clock size={14} color="black" /> {destination.duration || '2-3 Days'}</Text>
              </View>
            </View>

            <TouchableOpacity 
                style={styles.mainBtn}
                onPress={() => router.push('/packages')}
            >
              <Text style={styles.mainBtnText}>VIEW PACKAGES</Text>
              <ArrowRight size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. MAP SECTION ── */}
        <View style={styles.mapSection}>
            <Text style={styles.mapTag}>LOCATION GUIDE</Text>
            <Text style={styles.mapTitle}>Explore the Heart of {destination.city}</Text>
            
            <View style={styles.mapFrame}>
                <WebView 
                    originWhitelist={['*']}
                    source={{ uri: simpleMapUrl }} 
                    style={{ height: 400, width: '100%' }}
                />
            </View>
        </View>

        <Footer />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroSection: { width: '100%' },
  heroImage: { width: '100%', height: 400 },
  backBtn: { position: 'absolute', top: 20, left: 20, backgroundColor: 'white', padding: 10, borderRadius: 50 },
  contentBox: { padding: 25, marginTop: -30, backgroundColor: '#FDFDFD', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00AEEF1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 15 },
  tagText: { color: '#00AEEF', fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
  title: { fontSize: 36, fontWeight: '900', color: '#111', textTransform: 'uppercase', marginBottom: 15 },
  description: { fontSize: 16, color: '#666', lineHeight: 24, fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EEE', marginVertical: 20 },
  statLabel: { fontSize: 10, color: '#AAA', fontWeight: 'bold', marginBottom: 5 },
  statValue: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  mainBtn: { backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 50, marginTop: 10 },
  mainBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 2, marginRight: 10 },
  mapSection: { padding: 25, marginBottom: 50 },
  mapTag: { color: '#00AEEF', fontWeight: 'bold', letterSpacing: 2, fontSize: 10 },
  mapTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 10, marginBottom: 20 },
  mapFrame: { height: 400, borderRadius: 30, overflow: 'hidden', backgroundColor: '#EEE' }
});

export default DestinationOverview;