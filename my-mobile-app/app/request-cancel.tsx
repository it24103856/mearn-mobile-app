import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager
} from "react-native";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { MessageSquare, Clock, ChevronDown, ChevronUp, CheckCircle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import Footer from '../components/Footer';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getToken = async () => {
  if (Platform.OS === "web") return localStorage.getItem("token");
  return await SecureStore.getItemAsync("token");
};

interface Message {
  _id: string;
  subject: string;
  message: string;
  adminReply?: string;
  isViewedByCustomer?: boolean;
  createdAt: string;
}

// Android වල animation වැඩ කිරීමට මෙය අවශ්‍ය වේ
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MyInquiries() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserMessages();
  }, []);

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/contact/my-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (msg: Message) => {
    // සරල animation එකක් ලබා දීමට
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (expandedId === msg._id) {
      setExpandedId(null);
    } else {
      setExpandedId(msg._id);
      
      if (msg.adminReply && !msg.isViewedByCustomer) {
        try {
          const token = await getToken();
          await axios.put(`${API_URL}/contact/mark-viewed/${msg._id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(prev => 
            prev.map(m => m._id === msg._id ? { ...m, isViewedByCustomer: true } : m)
          );
        } catch (err) {
          console.error("Error marking as viewed:", err);
        }
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "#111827" }}>
            My <Text style={{ color: "#C8813A" }}>Inquiries</Text>
          </Text>
          <Text style={{ color: "#6B7280", marginTop: 8 }}>
            Track your questions and our responses here.
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
            <ActivityIndicator size="large" color="#C8813A" />
          </View>
        ) : messages.length > 0 ? (
          <View style={{ gap: 16 }}>
            {messages.map((msg) => (
              <View 
                key={msg._id} 
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: expandedId === msg._id ? "#C8813A50" : "#F3F4F6",
                  overflow: "hidden",
                  elevation: 2, // Android shadow
                  shadowColor: "#000", // iOS shadow
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                {/* Header Section */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(msg)}
                  style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={{ 
                      padding: 12, 
                      borderRadius: 12, 
                      backgroundColor: msg.adminReply ? "#F0FDF4" : "#EFF6FF",
                      marginRight: 16
                    }}>
                      <MessageSquare size={20} color={msg.adminReply ? "#22C55E" : "#C8813A"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1F2937" }}>{msg.subject}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <Clock size={12} color="#9CA3AF" />
                        <Text style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 4 }}>
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </Text>
                        {msg.adminReply && !msg.isViewedByCustomer && (
                          <View style={{ backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 }}>
                            <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>NEW</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  {expandedId === msg._id ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />}
                </TouchableOpacity>

                {/* Expanded Content */}
                {expandedId === msg._id && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F9FAFB" }}>
                      
                      <Text style={{ fontSize: 10, fontWeight: "bold", color: "#9CA3AF", letterSpacing: 1, marginBottom: 4 }}>YOUR MESSAGE</Text>
                      <View style={{ backgroundColor: "#F9FAFB", padding: 12, borderRadius: 12 }}>
                        <Text style={{ color: "#374151", fontStyle: "italic" }}>"{msg.message}"</Text>
                      </View>

                      {msg.adminReply ? (
                        <View style={{ marginTop: 16 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                            <CheckCircle size={14} color="#22C55E" />
                            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#16A34A", marginLeft: 4 }}>ADMIN RESPONSE</Text>
                          </View>
                          <View style={{ backgroundColor: "#F0FDF4", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#DCFCE7" }}>
                            <Text style={{ color: "#111827", fontWeight: "500" }}>{msg.adminReply}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={{ marginTop: 12, backgroundColor: "#FFFBEB", padding: 8, borderRadius: 8, alignSelf: "flex-start" }}>
                          <Text style={{ color: "#D97706", fontSize: 12, fontWeight: "500" }}>Status: Waiting for response...</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: 40, borderStyle: "dashed", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 20, alignItems: "center" }}>
            <Text style={{ color: "#9CA3AF", fontStyle: "italic" }}>You haven't sent any messages yet.</Text>
          </View>
        )}

        <View style={{ marginHorizontal: -24 }}>
          <Footer />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}