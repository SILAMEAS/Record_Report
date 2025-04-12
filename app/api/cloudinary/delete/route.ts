import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json({ error: "No public ID provided" }, { status: 400 })
    }

    // Configure Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary credentials not configured" }, { status: 500 })
    }

    // For signed deletes, we need to include the API key and generate a timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // Make the delete request to Cloudinary
    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`

    // For v0 preview, we'll use a direct approach with API key and secret
    const auth = btoa(`${apiKey}:${apiSecret}`)

    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("timestamp", timestamp)
    formData.append("api_key", apiKey)

    const response = await fetch(deleteUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Cloudinary delete error:", errorData)
      return NextResponse.json(
        {
          error: "Delete failed",
          details: errorData.error?.message || "Unknown error",
        },
        { status: 500 },
      )
    }

    const result = await response.json()

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({ success: true })
    } else {
      console.error("Cloudinary delete error:", result)
      return NextResponse.json({ error: "Delete failed", details: result }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in delete route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
