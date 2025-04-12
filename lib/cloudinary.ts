"use client"

export async function uploadImage(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)

  const response = await fetch("/api/cloudinary/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to upload image")
  }

  const data = await response.json()
  return data.url
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const publicId = extractPublicIdFromUrl(url)

    const response = await fetch("/api/cloudinary/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to delete image")
    }
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}

function extractPublicIdFromUrl(url: string): string {
  // Extract the public ID from a Cloudinary URL
  // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
  // Public ID would be: folder/image
  const regex = /\/v\d+\/(.+)\.\w+$/
  const match = url.match(regex)

  if (!match || !match[1]) {
    throw new Error("Invalid Cloudinary URL")
  }

  return match[1]
}
