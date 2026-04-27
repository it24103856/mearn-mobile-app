import axios from "axios";
import { getAuthToken } from '../lib/auth';
import { Car, Globe, MessageCircle, Send, Star, Trash2, UserCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../components/Footer";
import Header from "../components/Header";
// Interfaces for TypeScript
interface Feedback {
  _id: string;
  feedback: string;
  rating: number;
  category: string;
  createdAt: string;
}

interface FormData {
  feedback: string;
  rating: number;
  category: string;
}

export default function CustomerFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    feedback: "",
    rating: 5,
    category: "Vehicles"
  });

  // Backend URL - Change this to your actual backend IP or URL
const backendUrl = process.env.EXPO_PUBLIC_API_URL;
  // Use centralized token helper

  const fetchMyFeedbacks = async () => {
    setIsFetching(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn("No authentication token found.");
        setIsFetching(false);
        return;
      }
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`${backendUrl}/feedback/get-all`, config);
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchMyFeedbacks();
  }, []);

  const handleSubmit = async () => {
    if (!formData.feedback.trim()) {
      if (Platform.OS === 'web') {
        alert("Please enter your feedback message.");
      } else {
        Alert.alert("Error", "Please enter your feedback message.");
      }
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${backendUrl}/feedback/create`, formData, config);
      
      if (Platform.OS === 'web') {
        alert("Feedback submitted successfully!");
      } else {
        Alert.alert("Success", "Feedback submitted successfully!");
      }
      
      setFormData({ feedback: "", rating: 5, category: "Vehicles" });
      fetchMyFeedbacks();
    } catch (error) {
      console.error("Submit error:", error);
      const msg = "Failed to submit feedback.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
        try {
          const token = await getAuthToken();
          await axios.delete(`${backendUrl}/feedback/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchMyFeedbacks();
        } catch (error) {
          const msg = "Could not delete.";
          Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
        }
    };

    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to delete this?")) {
            performDelete();
        }
    } else {
        Alert.alert("Delete", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete }
        ]);
    }
  };

  const getCategoryIcon = (category: string, color: string) => {
    if (category === "Vehicles") return <Car size={20} color={color} />;
    if (category === "driverse") return <UserCheck size={20} color={color} />;
    return <Globe size={20} color={color} />;
  };

  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <View style={styles.fbCard}>
      <View style={styles.fbHeader}>
        <View style={styles.catIconBox}>
          {getCategoryIcon(item.category, "#00AEEF")}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.starRow}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < item.rating ? "#FBBF24" : "none"} color={i < item.rating ? "#FBBF24" : "#E5E7EB"} />
            ))}
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.fbBody}>"{item.feedback}"</Text>
          <Text style={styles.catBadge}>#{item.category}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Trash2 size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item._id}
        renderItem={renderFeedbackItem}
        onRefresh={fetchMyFeedbacks}
        refreshing={isFetching}
        ListHeaderComponent={
          <View>
            <ImageBackground 
              source={{ uri: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }} 
              style={styles.hero}
            >
              <View style={styles.overlay}>
                <Text style={styles.heroSubText}>EXPLORE SRI LANKA</Text>
                <Text style={styles.heroTitle}>Guest Reviews</Text>
              </View>
            </ImageBackground>

            <View style={styles.curvedContainer}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Share Your Story</Text>
                
                <View style={styles.catGrid}>
                  {["Vehicles", "driverse", "All"].map((cat) => (
                    <TouchableOpacity 
                      key={cat}
                      onPress={() => setFormData({ ...formData, category: cat })}
                      style={[styles.catBtn, formData.category === cat && styles.catBtnActive]}
                    >
                      {getCategoryIcon(cat, formData.category === cat ? "#00AEEF" : "#9CA3AF")}
                      <Text style={[styles.catLabel, formData.category === cat && styles.catLabelActive]}>
                        {cat === "driverse" ? "Driver" : cat === "All" ? "Other" : "Vehicle"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.starInputRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setFormData({ ...formData, rating: s })}>
                      <Star 
                          size={32} 
                          fill={s <= formData.rating ? "#FBBF24" : "none"} 
                          color={s <= formData.rating ? "#FBBF24" : "#E5E7EB"} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.textArea}
                  placeholder="How was your trip?"
                  multiline
                  numberOfLines={4}
                  value={formData.feedback}
                  onChangeText={(t) => setFormData({ ...formData, feedback: t })}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="white" /> : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Send size={16} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.submitBtnText}>POST FEEDBACK</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={styles.listTitle}>What People Say ({feedbacks.length})</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MessageCircle size={48} color="#E5E7EB" />
            <Text style={styles.emptyText}>No reviews yet.</Text>
          </View>
        }
        ListFooterComponent={<Footer />}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  hero: { height: 450, justifyContent: 'center', alignItems: 'center' },
  overlay: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  heroSubText: { color: 'white', textTransform: 'uppercase', letterSpacing: 4, fontSize: 12, fontWeight: '700' },
  heroTitle: { color: 'white', fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  curvedContainer: {
    backgroundColor: '#FDFDFD',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
  },
  formCard: { 
    backgroundColor: 'white', 
    margin: 16, 
    padding: 24, 
    borderRadius: 32, 
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
        android: { elevation: 8 },
        web: { boxShadow: '0px 4px 20px rgba(0,0,0,0.08)' }
    })
  },
  formTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1A1A1A' },
  catGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  catBtn: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
    borderRadius: 16, 
    marginHorizontal: 4, 
    backgroundColor: '#FAFBFC' 
  },
  catBtnActive: { borderColor: '#00AEEF', backgroundColor: 'rgba(0,174,239,0.08)' },
  catLabel: { fontSize: 10, fontWeight: 'bold', color: '#9CA3AF', marginTop: 6, textTransform: 'uppercase' },
  catLabelActive: { color: '#00AEEF' },
  starInputRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  textArea: { 
    backgroundColor: '#FAFBFC', 
    borderRadius: 20, 
    padding: 16, 
    height: 120, 
    textAlignVertical: 'top', 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    fontSize: 16,
    color: '#374151'
  },
  submitBtn: { backgroundColor: '#00AEEF', padding: 18, borderRadius: 50, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14, letterSpacing: 1.2 },
  listTitle: { fontSize: 22, fontWeight: 'bold', marginHorizontal: 20, marginTop: 16, marginBottom: 16, color: '#1A1A1A' },
  fbCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#F3F4F6' 
  },
  fbHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  catIconBox: { 
    width: 48, 
    height: 48, 
    backgroundColor: 'rgba(0,174,239,0.08)', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  dateText: { fontSize: 11, color: '#9CA3AF', marginLeft: 8 },
  fbBody: { fontSize: 16, color: '#4B5563', fontStyle: 'italic', lineHeight: 24 },
  catBadge: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', marginTop: 12, fontSize: 16, textAlign: 'center' }
});