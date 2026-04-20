import { createClient } from "@supabase/supabase-js";

const expoSupabaseUrl = (process.env.EXPO_PUBLIC_SUPERBASE_URL || "").trim();
const viteSupabaseUrl = (process.env.VITE_SUPERBASE_URL || "").trim();
const supabaseUrl = (expoSupabaseUrl || viteSupabaseUrl || "").trim();

const expoSupabaseKey = (process.env.EXPO_PUBLIC_SUPERBASE_KEY || "").trim();
const viteSupabaseKey = (process.env.VITE_SUPERBASE_KEY || "").trim();
const supabaseKey = (expoSupabaseKey || viteSupabaseKey || "").trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars. Set EXPO_PUBLIC_SUPERBASE_URL and EXPO_PUBLIC_SUPERBASE_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const getCandidateKeys = () => {
  const keys = [expoSupabaseKey, viteSupabaseKey].filter(Boolean);
  return Array.from(new Set(keys));
};

const getFileExtension = (uri: string) => {
  const cleanUri = uri.split("?")[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1] || "jpg";
};

export const uploadFile = async (uri: string, folder = "images"): Promise<string> => {
  if (!uri) {
    throw new Error("No file uri provided for upload.");
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Failed to read local file for upload.");
  }

  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const extension = getFileExtension(uri) || mimeType.split("/")[1] || "jpg";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  const uploadUrl = `${supabaseUrl}/storage/v1/object/images/${fileName}`;
  const keysToTry = getCandidateKeys();
  if (!keysToTry.length) {
    throw new Error("Supabase key is missing.");
  }

  let lastError = "Upload failed";

  for (const key of keysToTry) {
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body: blob,
    });

    if (uploadRes.ok) {
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      return data.publicUrl;
    }

    let details = "Upload failed";
    try {
      const body = await uploadRes.json();
      details = body?.message || body?.error || details;
    } catch {
      try {
        details = await uploadRes.text();
      } catch {
        // Keep default message
      }
    }

    lastError = `Supabase upload failed (${uploadRes.status}): ${details}`;
    const signatureError = `${details}`.toLowerCase().includes("signature verification failed");
    if (!signatureError) {
      break;
    }
  }

  throw new Error(lastError);
};