import { useRouter } from 'expo-router';
import { ChevronLeft, Home, Info, PhoneCall, User } from "lucide-react-native";
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from "../components/Header";

// Extend router types to include custom routes
declare module 'expo-router' {
  export function useRouter(): import('expo-router').Router;
}

export default function LinkPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. Header එක මෙතන තැබීමෙන් එය Scroll වෙන්නේ නැත */}
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.replace('/')}
        >
          <ChevronLeft size={20} color="#f97316" />
          <Text style={styles.backBtnText}>Back to Welcome</Text>
        </TouchableOpacity>

        <Text style={styles.title}>User Dashboard</Text>
        <Text style={styles.subtitle}>Manage your travel profile and settings</Text>

        {/* 1. Home Page Card */}
        <TouchableOpacity onPress={() => router.push('/homePage')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
            <Home size={24} color="#f97316" />
          </View>
          <Text style={styles.cardText}>Home Page</Text>
        </TouchableOpacity>

        {/* 2. About Page Card */}
        <TouchableOpacity onPress={() => router.push('/about')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
            <Info size={24} color="#3b82f6" />
          </View>
          <Text style={styles.cardText}>About Us</Text>
        </TouchableOpacity>

        {/* 3. Contact Page Card */}
        <TouchableOpacity onPress={() => router.push('/contact')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
            <PhoneCall size={24} color="#10b981" />
          </View>
          <Text style={styles.cardText}>Contact Support</Text>
        </TouchableOpacity>

        {/* 4. Profile Page Card */}
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#f5f3ff' }]}>
            <User size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.cardText}>My Profile Settings</Text>
        </TouchableOpacity>

        {/*driver page - commented out until drivers route is created*/}
         <TouchableOpacity onPress={() => router.push('/driverpage')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#f5f3ff' }]}>
            <User size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.cardText}>Driver</Text>
        </TouchableOpacity> 
        {/* 5. hotel Page */}
          <TouchableOpacity onPress={() => router.push('/hotel')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#f5f3ff' }]}>
            <User size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.cardText}>Hotel</Text>
        </TouchableOpacity>
          {/* 6. Destination Page */}
          <TouchableOpacity onPress={() => router.push('/destination')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#f5f3ff' }]}>
            <User size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.cardText}>Destination</Text>
        </TouchableOpacity>

          {/* 7. Package Page */}
          <TouchableOpacity onPress={() => router.push('/packages')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText}>Tour Packages</Text>
        </TouchableOpacity>

        {/* 8. Booking Page */}
          <TouchableOpacity onPress={() => router.push('/bookingpage')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText}>My Bookings</Text>
        </TouchableOpacity>

        {/* 9. Feedback Page */}
          <TouchableOpacity onPress={() => router.push('/feedback')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText}>Feedback</Text>
        </TouchableOpacity>

        {/* 10. Payment Page */}
          <TouchableOpacity onPress={() => router.push('/paymentpage')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText}>Payment Methods</Text>
        </TouchableOpacity>

        {/*destinationOverview page*/}
          <TouchableOpacity onPress={() => router.push('/destinationOverview')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText
          }>Destination Overview</Text>
        </TouchableOpacity>

        {/*hotelOverview page*/}
          <TouchableOpacity onPress={() => router.push('/hotelOverview')} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText
          }>Hotel Overview</Text>
        </TouchableOpacity>

        {/*myBooking page*/}
        <TouchableOpacity onPress={()=> router.push('/my-bookings')} style={styles.card}> 
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText
          }>My Bookings</Text>
          
        </TouchableOpacity>

        {/*request cancel page*/}
        <TouchableOpacity onPress={()=> router.push('/request-cancel')} style={styles.card}> 
          <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>       
            <User size={24} color="#d946ef" />
          </View>
          <Text style={styles.cardText
          }>Request Cancel</Text>
          
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtnText: { color: '#f97316', fontSize: 16, fontWeight: '600', marginLeft: 5 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 25 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#f97316'
  },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardText: { fontSize: 17, fontWeight: '700', color: '#374151' }
});