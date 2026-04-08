// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
// නිවැරදි Import එක මෙන්න:
import * as FileSystem from 'expo-file-system/legacy'; 

const SUPABASE_URL = 'https://vhxcjzgxczttlsoqbwnw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeGNqemd4Y3p0dGxzb3Fid253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODU1MzQsImV4cCI6MjA4NDY2MTUzNH0.HMl11wqaaprPRiDoO8l5DlFLI8DRJujAaW6wjjARITI'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const uploadFile = async (imageUri: string): Promise<string> => {
    try {
        const fileName = `profile-${Date.now()}.jpg`;
        
        // පැරණි API එක Legacy import එක හරහා දැන් ක්‍රියාත්මක වේ
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64', 
        });

        const { data, error } = await supabase.storage
            .from("images")
            .upload(fileName, decode(base64), {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
};