import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { file, folder } = await request.json()

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    // Verify credentials are available
    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary credentials:", {
        cloudName: !!cloudName,
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
      })
      return NextResponse.json({ error: "Cloudinary credentials not configured properly" }, { status: 500 })
    }

    // For debugging
    console.log("Cloudinary credentials:", {
      cloudName,
      apiKeyLength: apiKey.length,
      apiSecretLength: apiSecret.length,
    })

    // Create a temporary server-side upload URL
    // This is a workaround for the v0 preview environment
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

    // Create form data for the upload
    const formData = new URLSearchParams()
    formData.append("file", file)
    formData.append("api_key", apiKey)
    formData.append("timestamp", Math.floor(Date.now() / 1000).toString())

    if (folder) {
      formData.append("folder", folder)
    }

    // Make the upload request
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      },
      body: formData.toString(),
    })

    // Handle response
    if (!response.ok) {
      let errorDetails = "Unknown error"
      try {
        const errorData = await response.json()
        console.error("Cloudinary upload error details:", errorData)
        errorDetails = JSON.stringify(errorData)
      } catch (e) {
        errorDetails = await response.text()
        console.error("Cloudinary upload error text:", errorDetails)
      }

      return NextResponse.json(
        {
          error: "Upload failed",
          details: errorDetails,
          status: response.status,
          statusText: response.statusText,
        },
        { status: 500 },
      )
    }

    const result = await response.json()
    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("Error in upload route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
