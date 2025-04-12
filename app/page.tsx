import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { getAllContent } from "@/lib/supabase-server"
import { ContentListServer } from "@/components/content-list-server"

export default async function Home() {
  // Fetch content on the server
  const contents = await getAllContent()

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <Button asChild>
          <Link href="/content/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Content
          </Link>
        </Button>
      </div>
      <ContentListServer contents={contents} />
    </main>
  )
}
