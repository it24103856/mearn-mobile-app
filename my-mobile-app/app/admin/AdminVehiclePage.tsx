import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { Trash2, Pencil, Plus, Users, Fuel, Car } from "lucide-react-native";
import { getAuthHeaders } from "../../lib/auth";

export default function AdminVehiclePage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${backendUrl}/vehicles`);
      setVehicles(response.data.data || response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Remove Asset?",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Delete", 
          style: "destructive", 
          onPress: () => handleDelete(id) 
        },
      ]
    );
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${backendUrl}/vehicles/${id}`, {
        headers,
      });
      fetchVehicles();
    } catch (error) {
      Alert.alert("Error", "Failed to delete vehicle");
    } finally {
      setDeleting(false);
    }
  };

  const renderVehicleCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {/* Vehicle Image */}
      <Image 
        source={{ uri: item.images?.[0] }} 
        style={styles.vehicleImage} 
        resizeMode="cover"
      />

      <View style={styles.cardContent}>
        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.makeModel}>{item.make} {item.model}</Text>
            <Text style={styles.typeTag}>{item.type?.toUpperCase()}</Text>
          </View>
          <Text style={styles.regNumber}>{item.registrationNumber}</Text>
        </View>

        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <Users size={14} color="#9CA3AF" />
            <Text style={styles.specText}>{item.seatingCapacity}</Text>
          </View>
          <View style={styles.specItem}>
            <Fuel size={14} color="#9CA3AF" />
            <Text style={styles.specText}>{item.fuelType}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => router.push(`/admin/AdminVehicleUpdatePage?id=${item._id}`)}
          >
            <Pencil size={18} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => confirmDelete(item._id, `${item.make} ${item.model}`)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading Fleet Assets...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Fleet Management</Text>
          <Text style={styles.headerSub}>Manage your transport assets</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => router.push('/admin/adminVehicleCreatePage')}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        renderItem={renderVehicleCard}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />

      {deleting && (
        <View style={styles.overlay}>
          <ActivityIndicator color="white" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#6366F1", fontWeight: "500" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 20, 
    marginTop: 10 
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6B7280" },
  addBtn: { 
    backgroundColor: "#6366F1", 
    padding: 12, 
    borderRadius: 15,
    shadowColor: "#6366F1",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  listPadding: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { 
    backgroundColor: "white", 
    borderRadius: 24, 
    marginBottom: 20, 
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2
  },
  vehicleImage: { width: "100%", height: 160 },
  cardContent: { padding: 15 },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  makeModel: { fontSize: 17, fontWeight: "bold", color: "#1F2937" },
  typeTag: { fontSize: 10, fontWeight: "800", color: "#6366F1", marginTop: 4 },
  regNumber: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  specsRow: { flexDirection: "row", gap: 15, marginTop: 12 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  specText: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  actions: { 
    flexDirection: "row", 
    justifyContent: "flex-end", 
    gap: 10, 
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F9FAFB",
    paddingTop: 12
  },
  editBtn: { backgroundColor: "#6366F110", padding: 10, borderRadius: 12 },
  deleteBtn: { backgroundColor: "#FEE2E2", padding: 10, borderRadius: 12 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  }
});