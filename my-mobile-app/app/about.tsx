import React from 'react';
import { View, Text, ScrollView, Image, ImageBackground, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Globe, ShieldCheck, Users, Award } from 'lucide-react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 1. Hero Section (Banner) */}
        <ImageBackground 
          source={{ uri: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
          style={{ height: 450, justifyContent: 'center', alignItems: 'center' }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700', letterSpacing: 4, marginBottom: 10 }}>EXPLORE SRI LANKA</Text>
            <Text style={{ color: 'white', fontSize: 48, fontWeight: '900', textAlign: 'center' }}>Our Story</Text>
          </View>
        </ImageBackground>

        {/* 2. Overlapping Content Card (මෙන්න මෙතන තමයි වෙනස කරලා තියෙන්නේ) */}
        <View style={{ 
          marginTop: -40, // ඉහළට ගොඩ වැදීම (Overlapping)
          backgroundColor: 'white', 
          borderTopLeftRadius: 40, 
          borderTopRightRadius: 40, 
          paddingHorizontal: 25, 
          paddingTop: 50,
          paddingBottom: 20,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10 // Android shadows
        }}>
          
          <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#111827', lineHeight: 38 }}>
            We Are Your Ultimate <Text style={{ color: '#f97316' }}>Travel Mate</Text>
          </Text>
          
          <Text style={{ fontSize: 16, color: '#4b5563', marginTop: 20, lineHeight: 26 }}>
            At TravelMate, we believe that traveling is more than just visiting a destination; it's about creating memories that last a lifetime.
          </Text>

          <TouchableOpacity 
            onPress={() => router.push("/contact")} 
            style={{ 
              backgroundColor: '#f97316', 
              paddingVertical: 15, 
              paddingHorizontal: 30, 
              borderRadius: 30, 
              marginTop: 25, 
              alignSelf: 'flex-start', 
              elevation: 5 
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Contact Our Team</Text>
          </TouchableOpacity>

          <Image 
            source={{ uri: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            style={{ width: '100%', height: 250, borderRadius: 30, marginTop: 40 }}
          />
        </View>

        {/* 3. Features & Stats */}
        <View style={{ backgroundColor: 'white', paddingBottom: 50 }}>
            {/* ඉතිරි කොටස් කලින් තිබූ පරිදිම තබා ගන්න */}
            <View style={{ backgroundColor: '#f9fafb', paddingVertical: 50, paddingHorizontal: 20, borderRadius: 40, marginHorizontal: 10 }}>
                {/* FeatureCard content... */}
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Why Travelers Love Us</Text>
                    <View style={{ width: 60, height: 4, backgroundColor: '#f97316', marginTop: 8, borderRadius: 2 }} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <FeatureCard icon={<Globe size={30} color="#f97316" />} title="Expert Guides" desc="Local experts for every secret trail." />
                    <FeatureCard icon={<ShieldCheck size={30} color="#f97316" />} title="Safe & Secure" desc="Your safety is our top priority." />
                    <FeatureCard icon={<Users size={30} color="#f97316" />} title="Happy Travelers" desc="5,000+ memories created so far." />
                    <FeatureCard icon={<Award size={30} color="#f97316" />} title="Best Prices" desc="Guaranteed value for your money." />
                </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 40 }}>
              <StatItem value="120+" label="Destinations" />
              <StatItem value="500+" label="Tours Done" />
              <StatItem value="15+" label="Awards" />
              <StatItem value="99%" label="Satisfaction" />
            </View>
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

// ... FeatureCard සහ StatItem කලින් තිබූ පරිදිම තබා ගන්න
const FeatureCard = ({ icon, title, desc }: any) => (
  <View style={{ width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 15, alignItems: 'center', elevation: 2 }}>
    <View style={{ marginBottom: 12 }}>{icon}</View>
    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' }}>{title}</Text>
    <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 5 }}>{desc}</Text>
  </View>
);

const StatItem = ({ value, label }: any) => (
  <View style={{ width: '50%', alignItems: 'center', marginBottom: 30 }}>
    <Text style={{ fontSize: 35, fontWeight: '900', color: '#111827' }}>{value}</Text>
    <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
  </View>
);