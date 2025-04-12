import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-server"

// Ensure bucket exists before uploading
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return false
    }

    // If bucket exists, return true
    if (buckets?.find((bucket) => bucket.name === bucketName)) {
      return true
    }

    // Create the bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
    })

    if (createError) {
      console.error("Error creating bucket:", createError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error ensuring bucket exists:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const mainImageFile = formData.get("main_image") as File | null
    const thumbnailFile = formData.get("thumbnail") as File | null

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 })
    }

    // Ensure the bucket exists
    const bucketName = "content-images"
    const bucketExists = await ensureBucketExists(bucketName)

    if (!bucketExists) {
      return NextResponse.json(
        {
          message: "Failed to create or access storage bucket. Saving content without images.",
        },
        { status: 200 },
      )
    }

    // Upload images to Supabase Storage if provided
    let mainImageUrl = null
    let thumbnailUrl = null

    if (mainImageFile && mainImageFile.size > 0) {
      try {
        const fileExt = mainImageFile.name.split(".").pop()
        const fileName = `${Date.now()}-main.${fileExt}`
        const filePath = `${fileName}`

        // Convert file to buffer
        const arrayBuffer = await mainImageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: mainImageFile.type,
            upsert: true,
          })

        if (uploadError) {
          console.error("Upload error details:", uploadError)
          throw new Error(`Failed to upload main image: ${uploadError.message}`)
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

        mainImageUrl = publicUrlData.publicUrl
      } catch (error) {
        console.error("Main image upload error:", error)
        // Continue without the image rather than failing the whole request
      }
    }

    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        const fileExt = thumbnailFile.name.split(".").pop()
        const fileName = `${Date.now()}-thumbnail.${fileExt}`
        const filePath = `${fileName}`

        // Convert file to buffer
        const arrayBuffer = await thumbnailFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: thumbnailFile.type,
            upsert: true,
          })

        if (uploadError) {
          console.error("Upload error details:", uploadError)
          throw new Error(`Failed to upload thumbnail: ${uploadError.message}`)
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

        thumbnailUrl = publicUrlData.publicUrl
      } catch (error) {
        console.error("Thumbnail upload error:", error)
        // Continue without the image rather than failing the whole request
      }
    }

    // Insert into Supabase
    try {
      const { data, error } = await supabase
        .from("contents")
        .insert({
          title,
          description,
          main_image: mainImageUrl,
          thumbnail: thumbnailUrl,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating content:", error)
        return NextResponse.json({ message: `Failed to create content: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json(data)
    } catch (error) {
      console.error("Error inserting into Supabase:", error)
      return NextResponse.json(
        { message: `Database error: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in POST /api/content:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
