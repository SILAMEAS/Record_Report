import { notFound } from "next/navigation"
import { getContentById } from "@/lib/supabase-server"
import { ContentDetail } from "@/components/content-detail"

interface ContentPageProps {
  params: {
    id: string
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const content = await getContentById(params.id)

  if (!content) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <ContentDetail content={content} />
    </div>
  )
}
