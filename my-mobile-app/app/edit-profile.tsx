import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { uploadFile } from '../lib/supabase';

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

function Header() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f9fafb' }}>
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
        <Text style={{ fontSize: 24, color: '#1e293b' }}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', marginLeft: 8 }}>Edit Profile</Text>
    </View>
  );
}

export default function EditProfileScreen() {
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await axios.get(`${backendUrl}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData(res.data);
        } catch (err) {
            console.error("Profile Fetch Error:", err);
            Alert.alert("Error", "Failed to load profile data.");
        } finally {
            setInitialLoading(false);
        }
    };
    fetchUser();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const uploadedUrl = await uploadFile(result.assets[0].uri, 'profiles');
        setSelectedImage(uploadedUrl);
      } catch (error) {
        Alert.alert("Upload Failed", "Could not upload profile image.");
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    try {
      let imageUrl = formData.image;
      if (selectedImage) {
        imageUrl = selectedImage; 
      }

      await axios.put(
        `${backendUrl}/users/update-profile/${formData.email}`,
        { ...formData, image: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Profile Updated Successfully! ✨");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={{ marginTop: 10, color: '#6b7280' }}>Loading Profile Data...</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>      <Header />      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center", color: "#1e293b", marginTop: 20 }}>
          Edit Your Details
        </Text>

        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <TouchableOpacity onPress={pickImage} style={{ position: 'relative' }}>
            <Image 
              source={{ uri: selectedImage || (formData && formData.image && typeof formData.image === 'string' && formData.image.startsWith('http') ? formData.image : formData?.image ? `${backendUrl}/${formData.image}` : 'https://via.placeholder.com/120') }} 
              style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#0891b2' }}
            />
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0891b2', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white' }}>
               <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>EDIT</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 20 }}>
          <View>
            <Text style={labelStyle}>First Name</Text>
            <TextInput 
              style={inputStyle} 
              value={formData?.firstName || ''} 
              onChangeText={(text) => setFormData({...formData, firstName: text})} 
            />
          </View>

          <View>
            <Text style={labelStyle}>Last Name</Text>
            <TextInput 
              style={inputStyle} 
              value={formData?.lastName || ''} 
              onChangeText={(text) => setFormData({...formData, lastName: text})} 
            />
          </View>

          <View>
            <Text style={labelStyle}>Phone Number</Text>
            <TextInput 
              style={inputStyle} 
              value={formData?.phone || ''} 
              keyboardType="phone-pad"
              onChangeText={(text) => setFormData({...formData, phone: text})} 
            />
          </View>

          <View>
            <Text style={labelStyle}>Address</Text>
            <TextInput 
              style={inputStyle} 
              value={formData?.address || ''} 
              multiline
              onChangeText={(text) => setFormData({...formData, address: text})} 
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 40, marginBottom: 40 }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ flex: 1, padding: 15, alignItems: "center", backgroundColor: '#e2e8f0', borderRadius: 15 }}
          >
            <Text style={{ color: "#475569", fontWeight: "bold" }}>Cancel</Text>
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
    </SafeAreaView>
  );
}

const labelStyle = { fontSize: 14, fontWeight: "600" as "600", color: "#64748b", marginBottom: 8, marginLeft: 5 };
const inputStyle = { backgroundColor: "white", padding: 15, borderRadius: 15, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 16, color: "#1e293b" };