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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const formData = await request.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const mainImageFile = formData.get("main_image") as File | null
    const thumbnailFile = formData.get("thumbnail") as File | null
    const existingMainImage = formData.get("existing_main_image") as string | null
    const existingThumbnail = formData.get("existing_thumbnail") as string | null

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 })
    }

    // Get current content to check for image changes
    const { data: currentContent, error: fetchError } = await supabase
      .from("contents")
      .select("main_image, thumbnail")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching content:", fetchError)
      return NextResponse.json({ message: "Content not found" }, { status: 404 })
    }

    // Ensure the bucket exists
    const bucketName = "content-images"
    const bucketExists = await ensureBucketExists(bucketName)

    if (!bucketExists) {
      // If we can't create/access the bucket, just update the content without changing images
      const { data, error } = await supabase
        .from("contents")
        .update({
          title,
          description,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating content:", error)
        return NextResponse.json({ message: "Failed to update content" }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Upload images to Supabase Storage if provided
    let mainImageUrl = existingMainImage
    let thumbnailUrl = existingThumbnail

    if (mainImageFile && mainImageFile.size > 0) {
      try {
        // Delete old image if exists and different from current
        if (currentContent?.main_image && currentContent.main_image !== existingMainImage) {
          try {
            // Extract file path from URL
            const oldUrl = new URL(currentContent.main_image)
            const pathParts = oldUrl.pathname.split("/")
            const oldFilePath = pathParts[pathParts.length - 1]

            // Delete old file
            if (oldFilePath) {
              await supabase.storage.from(bucketName).remove([oldFilePath])
            }
          } catch (error) {
            console.error("Error deleting old main image:", error)
            // Continue even if deletion fails
          }
        }

        // Upload new image
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
        // Keep existing image if upload fails
      }
    }

    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        // Delete old thumbnail if exists and different from current
        if (currentContent?.thumbnail && currentContent.thumbnail !== existingThumbnail) {
          try {
            // Extract file path from URL
            const oldUrl = new URL(currentContent.thumbnail)
            const pathParts = oldUrl.pathname.split("/")
            const oldFilePath = pathParts[pathParts.length - 1]

            // Delete old file
            if (oldFilePath) {
              await supabase.storage.from(bucketName).remove([oldFilePath])
            }
          } catch (error) {
            console.error("Error deleting old thumbnail:", error)
            // Continue even if deletion fails
          }
        }

        // Upload new thumbnail
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
        // Keep existing thumbnail if upload fails
      }
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from("contents")
      .update({
        title,
        description,
        main_image: mainImageUrl,
        thumbnail: thumbnailUrl,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating content:", error)
      return NextResponse.json({ message: "Failed to update content" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/content/[id]:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Get content to delete images
    const { data: content, error: fetchError } = await supabase
      .from("contents")
      .select("main_image, thumbnail")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching content:", fetchError)
      return NextResponse.json({ message: "Content not found" }, { status: 404 })
    }

    // Ensure the bucket exists before trying to delete files
    const bucketName = "content-images"
    const bucketExists = await ensureBucketExists(bucketName)

    if (bucketExists) {
      // Delete images from Supabase Storage
      if (content?.main_image) {
        try {
          // Extract file path from URL
          const mainImageUrl = new URL(content.main_image)
          const pathParts = mainImageUrl.pathname.split("/")
          const filePath = pathParts[pathParts.length - 1]

          // Delete file
          if (filePath) {
            await supabase.storage.from(bucketName).remove([filePath])
          }
        } catch (error) {
          console.error("Error deleting main image:", error)
          // Continue even if deletion fails
        }
      }

      if (content?.thumbnail) {
        try {
          // Extract file path from URL
          const thumbnailUrl = new URL(content.thumbnail)
          const pathParts = thumbnailUrl.pathname.split("/")
          const filePath = pathParts[pathParts.length - 1]

          // Delete file
          if (filePath) {
            await supabase.storage.from(bucketName).remove([filePath])
          }
        } catch (error) {
          console.error("Error deleting thumbnail:", error)
          // Continue even if deletion fails
        }
      }
    }

    // Delete from Supabase
    const { error } = await supabase.from("contents").delete().eq("id", id)

    if (error) {
      console.error("Error deleting content:", error)
      return NextResponse.json({ message: "Failed to delete content" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/content/[id]:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
