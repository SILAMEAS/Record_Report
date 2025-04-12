"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ContentType } from "@/lib/types"
import { getAllContentClient, deleteContentClient } from "@/lib/supabase-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ContentList() {
  const [contents, setContents] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const data = await getAllContentClient()
        setContents(data)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load content",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchContents()
  }, [toast])

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const success = await deleteContentClient(id)

      if (success) {
        setContents(contents.filter((content) => content.id !== id))
        toast({
          title: "Success",
          description: "Content deleted successfully",
        })
      } else {
        throw new Error("Failed to delete content")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete content",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this content and remove all associated images.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(content.id)} disabled={deletingId === content.id}>
                    {deletingId === content.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
