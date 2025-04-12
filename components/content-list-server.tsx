import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { ContentType } from "@/lib/types";
import { DeleteButton } from "./delete-button";
import { ContentImage } from "./ContentImage"; // Import the new Client Component

interface ContentListServerProps {
  contents: ContentType[];
  page: number;
  total: number;
  limit: number;
}

export function ContentListServer({ contents, page = 1, total, limit }: ContentListServerProps) {
  const totalPages = Math.ceil(total / limit);

  if (contents.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">No content found</p>
        <Button asChild>
          <Link href="/content/new">Add Your First Content</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contents.map((content) => (
          <Card key={content.id} className="overflow-hidden">
            <Link href={`/content/${content.id}`}>
              {content.main_image ? (
                <ContentImage
                  src={content.main_image}
                  alt={`Main image for ${content.title}`}
                />
              ) : (
                <div className="aspect-video relative">
                  <Image
                    src="/placeholder.svg"
                    alt="No image available"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold truncate" title={content.title}>
                  {content.title}
                </h2>
                <p
                  className="text-muted-foreground line-clamp-2 mt-2"
                  title={content.description}
                >
                  {content.description}
                </p>
              </CardContent>
            </Link>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/content/${content.id}/edit`} aria-label={`Edit ${content.title}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Suspense fallback={<Button variant="destructive" size="sm" disabled>Delete</Button>}>
                <DeleteButton id={content.id} title={content.title} />
              </Suspense>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-8">
        {page > 1 && (
          <Button asChild>
            <Link href={`/?page=${page - 1}`}>Previous</Link>
          </Button>
        )}
        {page < totalPages && (
          <Button asChild>
            <Link href={`/?page=${page + 1}`}>Next</Link>
          </Button>
        )}
        <p className="text-muted-foreground">
          Page {page} of {totalPages} (Total: {total} items)
        </p>
      </div>
    </>
  );
}