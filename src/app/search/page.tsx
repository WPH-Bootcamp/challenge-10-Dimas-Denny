"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Article = {
  id: number;
  title: string;
  description?: string;
  content?: string;
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qFromUrl = searchParams.get("q") || "";

  const [query, setQuery] = useState(qFromUrl);
  const [debouncedQuery, setDebouncedQuery] = useState(qFromUrl);

  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Race-condition safe: simpan controller request aktif
  const activeControllerRef = useRef<AbortController | null>(null);

  // Sync input kalau user back/forward atau url berubah
  useEffect(() => {
    setQuery(qFromUrl);
    setDebouncedQuery(qFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qFromUrl]);

  // Debounce typing (400ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  // Update URL saat user mengetik (tanpa nambah history)
  useEffect(() => {
    const trimmed = query.trim();
    const next = trimmed
      ? `/search?q=${encodeURIComponent(trimmed)}`
      : "/search";

    // Hindari replace berulang kalau sudah sama
    const current = qFromUrl.trim();
    if (trimmed === current) return;

    router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fetch results (debounced + abort previous)
  useEffect(() => {
    // Abort request sebelumnya
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }

    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/posts/search", {
          params: { q: debouncedQuery },
          signal: controller.signal,
        });

        const data = res.data?.data ?? res.data ?? [];

        // Normalize
        const mapped: Article[] = Array.isArray(data)
          ? data.map((it: any) => ({
              id: it.id,
              title: it.title,
              description: it.description ?? it.content ?? "",
              content: it.content ?? "",
            }))
          : [];

        setResults(mapped);
      } catch (err: any) {
        // Ignore abort error
        if (err?.name === "CanceledError") return;
        if (err?.code === "ERR_CANCELED") return;

        if (controller.signal.aborted) return;

        setError(err?.response?.data?.message || "Failed to search");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

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
          className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* States */}
      {loading && <p className="text-gray-400">Searching...</p>}
      {!loading && error && <p className="text-red-500">{error}</p>}

      {!loading && !error && debouncedQuery && results.length === 0 && (
        <p className="text-gray-400">No results found</p>
      )}

      {/* Results */}
      <div className="flex flex-col gap-6">
        {results.map((item) => (
          <Link
            key={item.id}
            href={`/posts/${item.id}`}
            className="border-b pb-4 hover:bg-gray-50 transition rounded-md px-2 -mx-2"
          >
            <h2 className="font-semibold text-lg">{item.title}</h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {item.description || item.content || ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
