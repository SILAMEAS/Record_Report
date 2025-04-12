import type { Metadata } from "next"
import { ContentForm } from "@/components/content-form"

export const metadata: Metadata = {
  title: "Add New Content",
  description: "Create new content with images",
}

export default function NewContentPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Add New Content</h1>
      <ContentForm />
    </div>
  )
}
