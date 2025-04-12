import { notFound } from "next/navigation"
import { getContentById } from "@/lib/supabase-server"
import { ContentForm } from "@/components/content-form"

interface EditContentPageProps {
  params: {
    id: string
  }
}

export default async function EditContentPage({ params }: EditContentPageProps) {
  const content = await getContentById(params.id)

  if (!content) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Edit Content</h1>
      <ContentForm content={content} />
    </div>
  )
}
