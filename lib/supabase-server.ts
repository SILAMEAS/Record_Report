import { createClient } from "@supabase/supabase-js"
import type { ContentType } from "./types"

// Get environment variables with fallbacks
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

// Log environment variable status for debugging (will only show in server logs)
console.log("Supabase URL available:", !!supabaseUrl)
console.log("Supabase Key available:", !!supabaseKey)

// Create a supabase client for server components with error handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
})

// Initialize storage bucket if it doesn't exist
export async function initializeStorage() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not available, skipping storage initialization")
    return
  }

  try {
    // Check if the bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error("Error listing buckets:", error)
      return
    }

    const bucketName = "content-images"

    if (!buckets?.find((bucket) => bucket.name === bucketName)) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make the bucket public
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
      } else {
        console.log("Bucket created successfully")
      }
    }
  } catch (error) {
    console.error("Error initializing storage:", error)
  }
}

export async function getAllContent(): Promise<ContentType[]> {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not available, returning empty content array")
    return []
  }

  try {
    const { data, error } = await supabase.from("contents").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching content:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllContent:", error)
    return []
  }
}

export async function getContentById(id: string): Promise<ContentType | null> {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not available, returning null content")
    return null
  }

  try {
    const { data, error } = await supabase.from("contents").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Content not found
      }
      console.error("Error fetching content by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getContentById:", error)
    return null
  }
}

// Initialize storage when this module is imported
if (supabaseUrl && supabaseKey) {
  initializeStorage().catch(console.error)
}
