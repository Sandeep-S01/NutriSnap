import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;



/**
 * Uploads a raw File to the 'food-images' Supabase Storage bucket.
 * Returns the public URL of the uploaded asset, or null if storage is unavailable or fails.
 */
export async function uploadFoodImage(file: File, userId?: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const fileExt = file.name.split('.').pop() || 'webp';
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const fileName = `${userId || 'guest'}/${Date.now()}-${uniqueId}.${fileExt}`;
    const filePath = `scans/${fileName}`;

    const { error } = await supabase.storage
      .from('food-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload food image to Supabase Storage:', error);
    return null;
  }
}

export type FoodEntry = {
  id?: string;
  user_id?: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  vitamins?: Record<string, string>;
  image_url?: string;
  scanned_at: string;
  created_at?: string;

  // Micronutrients
  sugar?: number;
  sodium?: number;
  potassium?: number;
  iron?: number;
  vitamin_a?: number;
  vitamin_b?: number;
  vitamin_c?: number;
  vitamin_d?: number;
};
