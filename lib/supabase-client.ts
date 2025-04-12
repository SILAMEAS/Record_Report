"use client"

import { createClient } from "@supabase/supabase-js"
import type { ContentType } from "./types"

// Create a Supabase client for client components
// We need to use environment variables that are available to the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Log environment variable status for debugging (will show in browser console)
console.log("Client: Supabase URL available:", !!supabaseUrl)
console.log("Client: Supabase Key available:", !!supabaseAnonKey)

// Create client with error handling
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for client-side data fetching
export async function getAllContentClient(): Promise<ContentType[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials not available, returning empty content array")
    return []
  }

  try {
    const { data, error } = await supabaseClient.from("contents").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching content:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllContentClient:", error)
    return []
  }
}

export async function getContentByIdClient(id: string): Promise<ContentType | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials not available, returning null content")
    return null
  }

  try {
    const { data, error } = await supabaseClient.from("contents").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching content by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getContentByIdClient:", error)
    return null
  }
}

export async function deleteContentClient(id: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials not available, cannot delete content")
    return false
  }

  try {
    // Delete the content
    const { error } = await supabaseClient.from("contents").delete().eq("id", id)

    if (error) {
      console.error("Error deleting content:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteContentClient:", error)
    return false
  }
}
