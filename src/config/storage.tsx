import { supabase } from "./supabase";

export async function uploadFile(file: File) {
  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(`public/${file.name}`, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;
  return data;
}

export async function getFileUrl(path: string) {
  return supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
}
