import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import type { ContentType } from "@/lib/types"
import { DeleteButton } from "./delete-button"

interface ContentListServerProps {
  contents: ContentType[]
}

export function ContentListServer({ contents }: ContentListServerProps) {
  if (contents.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">No content found</p>
        <Button asChild>
          <Link href="/content/new">Add Your First Content</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contents.map((content) => (
        <Card key={content.id} className="overflow-hidden">
          <Link href={`/content/${content.id}`}>
            <div className="aspect-video relative">
              {content.main_image ? (
                <Image
                  src={content.main_image || "/placeholder.svg"}
                  alt={content.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">No image</div>
              )}
            </div>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold truncate">{content.title}</h2>
              <p className="text-muted-foreground line-clamp-2 mt-2">{content.description}</p>
            </CardContent>
          </Link>
          <CardFooter className="p-4 pt-0 flex justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/content/${content.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <DeleteButton id={content.id} />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
