import axios from "axios";
import { MessageCircle, Send, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";

export default function ContactForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    subject: "",
    message: "",
  });

const backendUrl = process.env.EXPO_PUBLIC_API_URL;

  const handleSend = async () => {
    const { customerName, customerEmail, subject, message } = formData;
    if (!customerName || !customerEmail || !subject || !message) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${backendUrl}/contact/send-message`, formData);
      Alert.alert("Success", "Your message has been sent! ✨");
      setFormData({ customerName: "", customerEmail: "", subject: "", message: "" });
      setIsFormOpen(false);
    } catch (err) {
      Alert.alert("Error", "Could not send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsFormOpen(true)}
        activeOpacity={0.8}
      >
        <MessageCircle size={30} color="white" />
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal visible={isFormOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Send a Message</Text>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={formData.customerName}
                onChangeText={(text) => setFormData({...formData, customerName: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                value={formData.customerEmail}
                onChangeText={(text) => setFormData({...formData, customerEmail: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Subject"
                value={formData.subject}
                onChangeText={(text) => setFormData({...formData, subject: text})}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your message here..."
                multiline
                value={formData.message}
                onChangeText={(text) => setFormData({...formData, message: text})}
              />

              <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <><Text style={styles.sendBtnText}>Send Message</Text><Send size={18} color="white" /></>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    position: 'absolute', 
    bottom: 20, // හරියටම පතුලේ සිට 20ක් ඉහළින්
    right: 20,  // දකුණේ සිට 20ක් ඇතුළතින්
    zIndex: 9999, 
    elevation: 20,
    // මෙය එකතු කරන්න:
    alignItems: 'center',
    justifyContent: 'center',
},
  fab: {
    backgroundColor: '#ea580c',
    width: 65, height: 65, borderRadius: 32.5,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  header: { backgroundColor: '#111827', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20, gap: 15 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 15, padding: 15 },
  textArea: { height: 120, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: '#ea580c', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  sendBtnText: { color: 'white', fontWeight: 'bold' },
});