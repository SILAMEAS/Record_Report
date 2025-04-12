// Helper function to encode file to base64
export function encodeFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Extract the public ID from a Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url) return null

  try {
    // Extract the public ID from a Cloudinary URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
    // Public ID would be: folder/image
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")

    // Find the index of 'upload' in the path
    const uploadIndex = pathParts.findIndex((part) => part === "upload")
    if (uploadIndex === -1) return null

    // Skip the version part (v1234567890) and join the rest
    const publicIdParts = pathParts.slice(uploadIndex + 2)

    // Remove file extension
    const lastPart = publicIdParts[publicIdParts.length - 1]
    const lastPartWithoutExt = lastPart.split(".")[0]
    publicIdParts[publicIdParts.length - 1] = lastPartWithoutExt

    return publicIdParts.join("/")
  } catch (error) {
    console.error("Error extracting public ID:", error)
    return null
  }
}
