import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getAllContent } from "@/lib/supabase-server";
import { ContentListServer } from "@/components/content-list-server";

// Set revalidation interval (similar to ISR in Pages Router)
export const revalidate = 10; // Revalidate every 10 seconds

// App Router uses async Server Components for data fetching
export default async function Home({ searchParams }:any) {
  const page = parseInt(searchParams.page) || 1;
  const limit = 9;

  let contents = [];
  let total = 0;
  try {
    const result = await getAllContent({ page, limit });
    contents = result.contents;
    total = result.total;
  } catch (error) {
    console.error("Error fetching content in Home:", error);
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
        <div className="text-center py-10">
          <p className="text-red-500">Failed to load content. Please try again later.</p>
        </div>
      </main>
    );
  }

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
      <ContentListServer contents={contents} page={page} total={total} limit={limit} />
    </main>
  );
}