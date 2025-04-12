import { createClient } from "@supabase/supabase-js";
import type { ContentType } from "./types";

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment variables."
  );
}

console.log("Supabase URL available:", !!supabaseUrl);
console.log("Supabase Service Role Key available:", !!supabaseServiceRoleKey);

// Create a Supabase client for server components
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

// Initialize storage bucket if it doesn't exist
export async function initializeStorage() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("Error listing buckets:", error);
      throw error;
    }

    const bucketName = "content-images";

    if (!buckets?.find((bucket) => bucket.name === bucketName)) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false, // Make the bucket private
      });

      if (createError) {
        console.error("Error creating bucket:", createError);
        throw createError;
      }

      console.log("Bucket created successfully:", bucketName);
    } else {
      console.log("Bucket already exists:", bucketName);
    }
  } catch (error) {
    console.error("Error initializing storage:", error);
    throw error;
  }
}

export async function getAllContent({
  page = 1,
  limit = 9,
}: { page?: number; limit?: number } = {}): Promise<{
  contents: ContentType[];
  total: number;
}> {
  try {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
      console.error(`Error fetching content (page ${page}, limit ${limit}):`, error);
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Failed to fetch content: ${error.message}`);
      }
      return { contents: [], total: 0 };
    }

    const { count, error: countError } = await supabase
      .from("contents")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error fetching content count:", countError);
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Failed to fetch content count: ${countError.message}`);
      }
      return { contents: data || [], total: 0 };
    }

    // Log the raw data before processing
    console.log("Raw content data:", data);

    // Generate public URLs for main_image since the bucket is public
    const contentsWithPublicUrls = (data || []).map((content) => {
      if (content.main_image) {
        // If main_image is a full URL, extract the file name
        let fileName = content.main_image;
        if (content.main_image.startsWith("https://")) {
          const match = content.main_image.match(/content-images\/(.+)/);
          if (match) {
            fileName = match[1]; // Extract the file name (e.g., "1744446128104-main.png")
          }
        }

        const { data: publicUrlData } = supabase.storage
          .from("content-images")
          .getPublicUrl(fileName);

        console.log(`Public URL for ${fileName}: ${publicUrlData.publicUrl}`);
        return { ...content, main_image: publicUrlData.publicUrl };
      }
      return content;
    });

    return { contents: contentsWithPublicUrls, total: count || 0 };
  } catch (error) {
    console.error(`Unexpected error in getAllContent (page ${page}, limit ${limit}):`, error);
    if (process.env.NODE_ENV === "development") {
      throw error;
    }
    return { contents: [], total: 0 };
  }
}
// Fetch a single content item by ID
export async function getContentById(id: string): Promise<ContentType | null> {
  try {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching content with ID ${id}:`, error);
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Failed to fetch content: ${error.message}`);
      }
      return null;
    }

    if (!data) {
      return null;
    }

    // Log the raw data before processing
    console.log("Raw content data:", data);

    // Generate public URL for main_image since the bucket is public
    if (data.main_image) {
      let fileName = data.main_image;

      // If main_image is a full URL, extract the file name
      if (data.main_image.startsWith("https://")) {
        try {
          const url = new URL(data.main_image);
          const pathSegments = url.pathname.split("/content-images/");
          if (pathSegments.length > 1) {
            fileName = pathSegments[1]; // Extract the file name (e.g., "1744446128104-main.png")
          }
        } catch (error) {
          console.error(`Failed to parse main_image URL: ${data.main_image}`, error);
          return { ...data, main_image: null }; // Fallback to null if URL parsing fails
        }
      }

      const { data: publicUrlData } = supabase.storage
        .from("content-images")
        .getPublicUrl(fileName);

      console.log(`Public URL for ${fileName}: ${publicUrlData.publicUrl}`);
      return { ...data, main_image: publicUrlData.publicUrl };
    }

    return data;
  } catch (error) {
    console.error(`Unexpected error in getContentById (ID ${id}):`, error);
    if (process.env.NODE_ENV === "development") {
      throw error;
    }
    return null;
  }
}