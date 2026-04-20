import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    } catch {
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync('token');
  } catch {
    return null;
  }
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
