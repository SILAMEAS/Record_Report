"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ContentListServer } from "./content-list-server";
import type { ContentType } from "@/lib/types";

interface ContentListWithSearchProps {
  contents: ContentType[];
  page: number;
  total: number;
  limit: number;
  initialSearch?: string;
}

export function ContentListWithSearch({
  contents: initialContents,
  page,
  total,
  limit,
  initialSearch = "",
}: ContentListWithSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Sync search term with URL on mount
  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  // Update URL when search term changes
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
      params.set("page", "1"); // Reset to page 1 when searching
    } else {
      params.delete("search");
    }
    router.push(`/?${params.toString()}`);
  };

  // Client-side filtering (if not using server-side search)
  const filteredContents = useMemo(() => {
    if (!searchTerm) return initialContents;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return initialContents.filter(
      (content) =>
        content.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        content.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [initialContents, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex justify-center">
        <Input
          type="text"
          placeholder="Search by title or description..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {/* Render the filtered content list */}
      <ContentListServer
        contents={filteredContents}
        page={page}
        total={filteredContents.length}
        limit={limit}
      />
    </div>
  );
}