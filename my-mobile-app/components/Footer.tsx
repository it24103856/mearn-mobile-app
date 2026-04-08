import React from "react";
import { View, Text, TouchableOpacity, TextInput, Linking, StyleSheet } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";

export default function Footer() {
  return (
    <View style={{ backgroundColor: "#111827", paddingVertical: 48, paddingHorizontal: 24 }}>
      
      {/* 1. About section */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 16 }}>
          Travel<Text style={{ color: "#f97316" }}>Mate</Text>
        </Text>
        <Text style={{ fontSize: 14, color: "#d1d5db", lineHeight: 24 }}>
          Your ultimate travel companion, providing the best destinations and experiences.
        </Text>
        
        {/* Social Icons - ලින්ක්ස් සහිතයි */}
        <View style={{ flexDirection: "row", marginTop: 24, gap: 16 }}>
          <SocialIcon 
            name="facebook" 
            url="https://www.facebook.com" 
          />
          <SocialIcon 
            name="instagram" 
            url="https://www.instagram.com" 
          />
          <SocialIcon 
            name="twitter" 
            url="https://www.twitter.com" 
          />
          <SocialIcon 
            name="youtube" 
            url="https://www.youtube.com" 
          />
        </View>
      </View>

      {/* 2. Quick Links */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "white", marginBottom: 16 }}>Quick Links</Text>
        <View style={{ gap: 12 }}>
          {["Home", "Destinations", "About Us", "Contact"].map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.6}>
              <Text style={{ color: "#9ca3af", fontSize: 14 }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Contact Info */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "white", marginBottom: 16 }}>Contact Us</Text>
        <View style={{ gap: 16 }}>
          <ContactItem icon="location-sharp" text="No. 123, Galle Road, Colombo, Sri Lanka" />
          <ContactItem icon="call" text="+94 77 123 4567" />
          <ContactItem icon="mail" text="travelmate@gmail.com" />
        </View>
      </View>

      {/* 4. Newsletter */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "white", marginBottom: 8 }}>Newsletter</Text>
        <Text style={{ fontSize: 14, color: "#d1d5db", marginBottom: 16 }}>Join us to discover our latest travel packages.</Text>
        <View style={{ flexDirection: "row", borderRadius: 8, overflow: "hidden" }}>
          <TextInput
            placeholder="Your Email"
            placeholderTextColor="#9ca3af"
            style={{ 
              flex: 1, 
              backgroundColor: "white", 
              paddingHorizontal: 16, 
              paddingVertical: 10, 
              color: "#111827",
              fontSize: 14
            }}
          />
          <TouchableOpacity 
            activeOpacity={0.8}
            style={{ backgroundColor: "#f97316", paddingHorizontal: 20, justifyContent: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Copyright Bottom Bar */}
      <View style={{ borderTopWidth: 1, borderTopColor: "#1f2937", paddingTop: 32, alignItems: "center" }}>
        <Text style={{ color: "#9ca3af", fontSize: 12 }}>© 2026 TravelMate Project. All Rights Reserved.</Text>
      </View>
    </View>
  );
}

// --- Helper Components ---

interface SocialIconProps {
  name: string;
  url: string;
}

const SocialIcon = ({ name, url }: SocialIconProps) => (
  <TouchableOpacity 
    onPress={() => Linking.openURL(url)}
    activeOpacity={0.7}
    style={{ 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: "#1f2937", 
      alignItems: "center", 
      justifyContent: "center" 
    }}
  >
    <FontAwesome5 name={name} size={18} color="white" />
  </TouchableOpacity>
);

interface ContactItemProps {
  icon: any;
  text: string;
}

const ContactItem = ({ icon, text }: ContactItemProps) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
    <Ionicons name={icon} size={18} color="#f97316" />
    <Text style={{ color: "#d1d5db", fontSize: 14, flex: 1 }}>{text}</Text>
  </View>
);