"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Upload, X } from "lucide-react"
import Link from "next/link"
import type { ContentType } from "@/lib/types"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  main_image: z.any().optional(),
  thumbnail: z.any().optional(),
})

interface ContentFormProps {
  content?: ContentType
}

export function ContentForm({ content }: ContentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(content?.main_image || null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(content?.thumbnail || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: content?.title || "",
      description: content?.description || "",
      main_image: content?.main_image || undefined,
      thumbnail: content?.thumbnail || undefined,
    },
  })

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMainImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setMainImagePreview(previewUrl)
      form.setValue("main_image", file)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const previewUrl = URL.createObjectURL(file)
      setThumbnailPreview(previewUrl)
      form.setValue("thumbnail", file)
    }
  }

  const clearMainImage = () => {
    setMainImageFile(null)
    setMainImagePreview(null)
    form.setValue("main_image", undefined)
  }

  const clearThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    form.setValue("thumbnail", undefined)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Create FormData for the API request
      const formData = new FormData()
      formData.append("title", values.title)
      formData.append("description", values.description)

      if (mainImageFile) {
        formData.append("main_image", mainImageFile)
      } else if (content?.main_image) {
        formData.append("existing_main_image", content.main_image)
      }

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile)
      } else if (content?.thumbnail) {
        formData.append("existing_thumbnail", content.thumbnail)
      }

      // Submit the form data
      const response = await fetch(content ? `/api/content/${content.id}` : "/api/content", {
        method: content ? "PUT" : "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to save content")
      }

      // Check if we have a warning message about images not being uploaded
      if (data.message && data.message.includes("without images")) {
        toast({
          title: "Content Saved",
          description: "Content was saved, but images could not be uploaded. You can try again later.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Success",
          description: content ? "Content updated successfully" : "Content created successfully",
        })
      }
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save content"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter description" className="min-h-32" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="main_image"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Main Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="hidden"
                        id="main-image-upload"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("main-image-upload")?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {mainImagePreview ? "Change Image" : "Upload Image"}
                      </Button>
                      {mainImagePreview && (
                        <Button type="button" variant="destructive" size="icon" onClick={clearMainImage}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {mainImagePreview && (
                      <Card>
                        <CardContent className="p-2">
                          <div className="relative aspect-video w-full">
                            <Image
                              src={mainImagePreview || "/placeholder.svg"}
                              alt="Main image preview"
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </FormControl>
                <FormDescription>Upload the main image for your content</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnail"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Thumbnail</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                        id="thumbnail-upload"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("thumbnail-upload")?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                      </Button>
                      {thumbnailPreview && (
                        <Button type="button" variant="destructive" size="icon" onClick={clearThumbnail}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {thumbnailPreview && (
                      <Card>
                        <CardContent className="p-2">
                          <div className="relative aspect-square w-40 mx-auto">
                            <Image
                              src={thumbnailPreview || "/placeholder.svg"}
                              alt="Thumbnail preview"
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </FormControl>
                <FormDescription>Upload a thumbnail image (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {content ? "Update Content" : "Create Content"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
