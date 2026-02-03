"use client";

import Image from "next/image";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

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

/* ================= MOBILE ARTICLE CARD ================= */
function MobileArticleCard({ article }: { article: Article }) {
  return (
    <section className="md:hidden px-6 py-6 border-b bg-white">
      <h2 className="text-xl font-bold leading-snug mb-3">{article.title}</h2>

      {article.categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
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

      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {article.description}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <Image
          src="/icons.svg"
          alt="Author"
          width={28}
          height={28}
          className="rounded-full"
        />

        <span className="text-sm font-medium text-gray-800">
          {article.author?.name || article.author?.username || "Anonymous"}
        </span>

        <span className="w-1 h-1 rounded-full bg-gray-400" />

        <span className="text-sm text-gray-500">
          {formatDate(article.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">👍 {article.likes}</span>
        <span className="text-sm text-gray-600">💬 {article.comments}</span>
      </div>
    </section>
  );
}

/* ================= MAIN HEADER ================= */
export default function MobileHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH RECOMMENDED ================= */
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        setLoading(true);

        const res = await api.get("/posts/recommended");

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

    fetchRecommended();
  }, []);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white">
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <Image src="/logo-symbol.svg" alt="Logo" width={22} height={22} />
          <span className="font-semibold">Your Logo</span>
        </div>

        {/* DESKTOP SEARCH */}
        <div className="hidden md:flex flex-1 justify-center px-10">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Search article..."
              className="w-full border rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* DESKTOP AUTH */}
        {!user && (
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => router.push("/auth/login")}
              className="text-blue-600 font-medium hover:underline"
            >
              Login
            </button>

            <button
              onClick={() => router.push("/auth/register")}
              className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              Register
            </button>
          </div>
        )}

        {/* MOBILE MENU */}
        <div className="md:hidden flex items-center gap-2">
          {!user && (
            <>
              <button>
                <Search size={22} />
              </button>
              <button onClick={() => setOpen(!open)}>
                {open ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ================= MOBILE AUTH MENU ================= */}
      {!user && open && (
        <div className="md:hidden bg-white px-6 py-6 flex flex-col gap-4 border-b">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-blue-600 font-semibold"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/auth/register")}
            className="bg-blue-600 text-white py-3 rounded-full"
          >
            Register
          </button>
        </div>
      )}

      {/* ================= RECOMMENDED ================= */}
      <p className="md:hidden px-6 pt-6 text-2xl font-bold">
        Recommend For You
      </p>

      {loading && (
        <p className="md:hidden px-6 py-10 text-center text-gray-400">
          Loading articles...
        </p>
      )}

      {error && (
        <p className="md:hidden px-6 py-10 text-center text-red-500">{error}</p>
      )}

      {!loading &&
        !error &&
        articles.map((article) => (
          <MobileArticleCard key={article.id} article={article} />
        ))}
    </>
  );
}
