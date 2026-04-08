import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

export default function EditProfileModal({ user, visible, onClose, onUpdate }: any) {
  const [formData, setFormData] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // පින්තූරයක් තේරීමේ function එක
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    try {
      let imageUrl = formData.image;

      // පින්තූරයක් තෝරා ඇත්නම් එය මුලින්ම upload කළ යුතුයි
      // (මෙහිදී ඔයාගේ uploadFile utility එක පාවිච්චි කරන්න පුළුවන්)
      if (selectedImage) {
        // සරල බව සඳහා දැනට imageUrl එක update කරනවා පමණක් දක්වා ඇත
        imageUrl = selectedImage; 
      }

      const res = await axios.put(
        `${backendUrl}/users/update-profile/${user.email}`,
        { ...formData, image: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onUpdate(res.data);
      Alert.alert("Success", "Profile Updated Successfully! ✨");
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ backgroundColor: "white", width: "100%", borderRadius: 30, padding: 25, maxHeight: "90%" }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#1e293b" }}>
              Edit Your Details
            </Text>

            {/* පින්තූරය තේරීමේ කොටස */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <TouchableOpacity onPress={pickImage} style={{ position: 'relative' }}>
                <Image 
                  source={{ uri: selectedImage || (user.image?.startsWith('http') ? user.image : `${backendUrl}/${user.image || 'default.png'}`) }} 
                  style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f1f5f9' }}
                />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0891b2', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white' }}>
                   <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>EDIT</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Input Fields */}
            <View style={{ gap: 15 }}>
              <View>
                <Text style={labelStyle}>First Name</Text>
                <TextInput 
                  style={inputStyle} 
                  value={formData.firstName} 
                  onChangeText={(text) => setFormData({...formData, firstName: text})} 
                />
              </View>

              <View>
                <Text style={labelStyle}>Last Name</Text>
                <TextInput 
                  style={inputStyle} 
                  value={formData.lastName} 
                  onChangeText={(text) => setFormData({...formData, lastName: text})} 
                />
              </View>

              <View>
                <Text style={labelStyle}>Phone Number</Text>
                <TextInput 
                  style={inputStyle} 
                  value={formData.phone} 
                  keyboardType="phone-pad"
                  onChangeText={(text) => setFormData({...formData, phone: text})} 
                />
              </View>

              <View>
                <Text style={labelStyle}>Address</Text>
                <TextInput 
                  style={inputStyle} 
                  value={formData.address} 
                  multiline
                  onChangeText={(text) => setFormData({...formData, address: text})} 
                />
              </View>
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 30 }}>
              <TouchableOpacity 
                onPress={onClose} 
                style={{ flex: 1, padding: 15, alignItems: "center" }}
              >
                <Text style={{ color: "#64748b", fontWeight: "bold" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleSave} 
                disabled={loading}
                style={{ 
                  flex: 2, backgroundColor: "#0891b2", padding: 15, borderRadius: 15, 
                  alignItems: "center", justifyContent: "center" 
                }}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Save Changes</Text>}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Inline Styles Helper (කෝඩ් එක පිරිසිදුව තබා ගැනීමට)
const labelStyle = { fontSize: 13, fontWeight: "600" as "600", color: "#64748b", marginBottom: 5, marginLeft: 5 };
const inputStyle = { backgroundColor: "#f8fafc", padding: 15, borderRadius: 15, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 16, color: "#1e293b" };