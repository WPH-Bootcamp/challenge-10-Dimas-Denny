"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import MobileHeader from "@/components/header/MobileHeader";

/* ================= TYPES ================= */
type Category = {
  id: number;
  name: string;
};

type Author = {
  name?: string;
  username?: string;
};

type Article = {
  id: number;
  title: string;
  description: string;
  categories: Category[];
  author: Author;
  createdAt: string;
  likes: number;
  comments: number;
};

/* ================= FORMAT DATE ================= */
function formatDate(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ================= ARTICLE CARD ================= */
function ArticleCard({ article }: { article: Article }) {
  return (
    <section className="border-b bg-white p-6 md:flex md:gap-6 md:items-start">
      {/* Left content */}
      <div className="md:flex-1">
        <h2 className="text-xl font-bold mb-3">{article.title}</h2>

        {article.categories.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {article.categories.map((cat) => (
              <span
                key={cat.id}
                className="px-3 py-1 text-xs font-medium border rounded-md text-gray-700"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {article.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Image
            src="/icons.svg"
            alt="Author"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="font-medium text-gray-800">
            {article.author?.name || article.author?.username || "Anonymous"}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-400" />
          <span>{formatDate(article.createdAt)}</span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-gray-600">
          <span>👍 {article.likes}</span>
          <span>💬 {article.comments}</span>
        </div>
      </div>
    </section>
  );
}

/* ================= MAIN PAGE ================= */
export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const res = await api.get("/posts/recommended"); // dari Swagger UI

        const mapped: Article[] = (res.data.data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.content,
          categories: item.categories || [],
          author: item.author || {},
          createdAt: item.createdAt,
          likes: item._count?.likes ?? 0,
          comments: item._count?.comments ?? 0,
        }));

        setArticles(mapped);
      } catch (err) {
        console.error(err);
        setError("Failed to load articles");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* HEADER */}
      <MobileHeader />

      {/* RECOMMENDED */}
      <div className="pt-6">
        <h1 className="px-6 text-2xl font-bold md:hidden">Recommend For You</h1>
        <h1 className="hidden md:block px-10 text-3xl font-bold mb-4">
          Recommend For You
        </h1>

        {loading && (
          <p className="px-6 py-10 text-center text-gray-400 md:px-10">
            Loading articles...
          </p>
        )}

        {error && (
          <div className="px-6 py-10 text-center md:px-10">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full border"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col md:px-10">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
