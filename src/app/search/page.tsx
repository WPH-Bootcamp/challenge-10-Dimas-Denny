"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type Article = {
  id: number;
  title: string;
  description?: string; // kalau API pakai "content", nanti dimapping
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = useMemo(() => searchParams.get("q") || "", [searchParams]);

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // request id untuk race-condition safe
  const requestIdRef = useRef(0);

  // Sync state saat URL berubah (mis. dari header -> /search?q=...)
  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();

    // Kalau kosong, reset state
    if (!q) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        // Endpoint kamu: /posts/search?q=
        const res = await api.get(`/posts/search?q=${encodeURIComponent(q)}`);

        // Pastikan hanya request terbaru yang boleh set state
        if (requestIdRef.current !== currentRequestId) return;

        const raw = res.data?.data ?? [];

        // Mapping aman (kalau API return "content" bukan "description")
        const mapped: Article[] = (Array.isArray(raw) ? raw : []).map(
          (item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description ?? item.content ?? "",
          }),
        );

        setResults(mapped);
      } catch (e) {
        if (requestIdRef.current !== currentRequestId) return;
        setError("Failed to search. Please try again.");
        setResults([]);
      } finally {
        if (requestIdRef.current === currentRequestId) setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [query]);

  // Update URL saat user mengetik (tanpa bikin navigation berat)
  // Biar query bisa dishare dan konsisten dengan header
  useEffect(() => {
    const q = query.trim();
    const url = q ? `/search?q=${encodeURIComponent(q)}` : "/search";
    router.replace(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      {/* Search Input */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full border rounded-full pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Error */}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Loading */}
      {loading && <p className="text-gray-400">Searching...</p>}

      {/* Empty */}
      {!loading && !error && query.trim() && results.length === 0 && (
        <p className="text-gray-400">No results found</p>
      )}

      {/* Results */}
      <div className="flex flex-col gap-6">
        {results.map((item) => (
          <Link
            key={item.id}
            href={`/posts/${item.id}`}
            className="block border-b pb-4 hover:opacity-80"
          >
            <h2 className="font-semibold text-lg">{item.title}</h2>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
