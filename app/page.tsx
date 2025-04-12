import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getAllContent } from "@/lib/supabase-server";
import { ContentListWithSearch } from "@/components/ContentListWithSearch";
import type { ContentType } from "@/lib/types";

// Set revalidation interval (similar to ISR in Pages Router)
export const revalidate = 10; // Revalidate every 10 seconds

// App Router uses async Server Components for data fetching
export default async function Home({ searchParams }: { searchParams: { page?: string; search?: string } }) {
  const page = parseInt(searchParams.page || "1");
  const search = searchParams.search || "";
  const limit = 9;

  let contents: ContentType[] = [];
  let total = 0;
  try {
    const result = await getAllContent({ page, limit, search });
    contents = result.contents;
    total = result.total;
  } catch (error) {
    console.error("Error fetching content in Home:", error);
    return (
      <main className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold text-center md:text-left">Record Report</h1>
          <Button asChild className="mx-auto md:mx-0 w-full md:w-auto">
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-center md:text-left">Record Report</h1>
        <Button asChild className="mx-auto md:mx-0 w-full md:w-auto">
          <Link href="/content/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Content
          </Link>
        </Button>
      </div>
      <ContentListWithSearch
        contents={contents}
        page={page}
        total={total}
        limit={limit}
        initialSearch={search}
      />
    </main>
  );
}