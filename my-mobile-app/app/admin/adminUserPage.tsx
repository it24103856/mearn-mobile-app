import React, { useEffect, useState } from "react";
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
import axios from "axios";
import { useRouter } from "expo-router";
import { Trash2, Pencil, ShieldBan, ShieldCheck } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { getAuthHeaders } from "../../lib/auth";

export default function AdminUserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000/api";

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${backendUrl}/users/all-users`, { headers });
      setUsers(response.data?.data || response.data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (user: any) => {
    const newStatus = user.isblocked;
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${backendUrl}/users/update-status/${user.email}`, { isblocked: !newStatus }, { headers });
      Alert.alert("Success", `User ${newStatus ? "unblocked" : "blocked"} successfully`);
      setUsers((prev) => prev.map((u) => (u.email === user.email ? { ...u, isblocked: !newStatus } : u)));
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const confirmDelete = (user: any) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive", 
          onPress: () => deleteUser(user) 
        }
      ]
    );
  };

  const deleteUser = async (user: any) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${backendUrl}/users/delete-user/${user.email}`, { headers });
      setUsers(users.filter((u) => u._id !== user._id));
      Alert.alert("Success", "User deleted!");
    } catch (error) {
      Alert.alert("Error", "Failed to delete user");
    }
  };

  const renderUserCard = ({ item }: { item: any }) => (
    <View style={[styles.card, item.isblocked && styles.blockedCard]}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.image || "https://via.placeholder.com/40" }} 
          style={styles.avatar} 
        />
        <View style={styles.info}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, item.isblocked ? styles.bgRed : styles.bgGreen]}>
          <Text style={[styles.statusText, item.isblocked ? styles.textRed : styles.textGreen]}>
            {item.isblocked ? "BLOCKED" : "ACTIVE"}
          </Text>
        </View>
      </View>

      <View style={styles.roleRow}>
        <Text style={styles.label}>Role:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={item.role}
            style={styles.picker}
            onValueChange={(val: string) => console.log("Update role to:", val)}
          >
            <Picker.Item label="Customer" value="customer" />
            <Picker.Item label="Admin" value="admin" />
            <Picker.Item label="Driver" value="agent" />
          </Picker>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          onPress={() => handleToggleBlock(item)}
          style={[styles.actionBtn, item.isblocked ? styles.btnGreen : styles.btnIndigo]}
        >
          {item.isblocked ? <ShieldCheck size={20} color="white" /> : <ShieldBan size={20} color="white" />}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {}}
          style={styles.actionBtnEdit}
        >
          <Pencil size={20} color="#6366F1" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => confirmDelete(item)}
          style={styles.actionBtnDelete}
        >
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSub}>Admin control panel</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.email}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  header: { padding: 25, backgroundColor: "white" },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#111827" },
  headerSub: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  listContainer: { padding: 20 },
  card: { 
    backgroundColor: "white", 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  blockedCard: { backgroundColor: "#FEF2F2" },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: "#6366F120" },
  info: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
  userEmail: { fontSize: 13, color: "#6B7280" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "bold" },
  bgRed: { backgroundColor: "#FEE2E2" },
  bgGreen: { backgroundColor: "#DCFCE7" },
  textRed: { color: "#B91C1C" },
  textGreen: { color: "#15803D" },
  roleRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 15, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: "#F3F4F6" 
  },
  label: { fontSize: 14, fontWeight: "bold", color: "#4B5563" },
  pickerWrapper: { flex: 1, marginLeft: 10, backgroundColor: "#F9FAFB", borderRadius: 12, height: 40, justifyContent: 'center' },
  picker: { width: '100%' },
  actionRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 15 },
  actionBtn: { width: 45, height: 45, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  btnIndigo: { backgroundColor: "#6366F1" },
  btnGreen: { backgroundColor: "#22C55E" },
  actionBtnEdit: { width: 45, height: 45, borderRadius: 12, backgroundColor: "#6366F110", justifyContent: "center", alignItems: "center" },
  actionBtnDelete: { width: 45, height: 45, borderRadius: 12, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
});