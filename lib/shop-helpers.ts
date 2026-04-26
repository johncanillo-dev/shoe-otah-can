import { createSupabaseBrowserClient } from "./supabase/client";

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * Also updates the shop_branding table with the new URL.
 */
export async function uploadShopImage(
  file: File,
  type: "logo" | "banner"
): Promise<string> {
  const supabase = createSupabaseBrowserClient();

  // 1. Upload to Supabase Storage
  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${type}-${Date.now()}.${fileExt}`;
  const filePath = `${type}s/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("shop-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error(`Failed to upload ${type}: ${uploadError.message}`);
  }

  // 2. Get public URL
  const { data: urlData } = supabase.storage
    .from("shop-images")
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // 3. Update shop_branding table (broadcasts real-time)
  const { error: dbError } = await supabase
    .from("shop_branding")
    .update({
      [`${type}_url`]: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .not("id", "is", null); // match any row

  if (dbError) {
    console.error("Database update error:", dbError);
    throw new Error(`Failed to update ${type} URL: ${dbError.message}`);
  }

  return publicUrl;
}

/**
 * Get the shop branding data from the database.
 */
export async function fetchShopBranding() {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("shop_branding")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching shop branding:", error);
    return null;
  }

  return data;
}

/**
 * Cache-busting URL — appends a timestamp so the browser always fetches the latest image.
 */
export function getCacheBustedUrl(url: string | null): string {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
}

