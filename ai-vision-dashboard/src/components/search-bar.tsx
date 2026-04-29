"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search documents..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      <Button 
        type="submit" 
        variant="ghost" 
        size="icon" 
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      </Button>
    </form>
  );
}
