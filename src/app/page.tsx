"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileHeader from "@/components/header/MobileHeader";
import { getRecommendedPosts } from "@/lib/posts";

/* ================= TYPES ================= */
type Category = { id: number; name: string };
type Author = { id?: number; name?: string; username?: string };

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
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ================= LOCALSTORAGE KEY ================= */
const LIKED_KEY = "liked_post_ids_v2";

/* ================= PAGINATION ================= */
const PAGE_SIZE = 5;

function buildPageItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: Array<number | "…"> = [];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  items.push(1);
  if (left > 2) items.push("…");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < total - 1) items.push("…");
  items.push(total);

  return items;
}

export default function HomePage() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // pagination
  const [page, setPage] = useState(1);

  // liked ids (toggle like)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  // Load likedIds
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLikedIds(new Set(parsed.filter((x) => typeof x === "number")));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistLikedIds = (next: Set<number>) => {
    setLikedIds(next);
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(next)));
  };

  // Fetch recommended posts
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRecommendedPosts();

        // normalize: bikin bentuk Article stabil walaupun API berubah-ubah
        const mapped: Article[] = (Array.isArray(data) ? data : []).map(
          (it: any) => ({
            id: it.id,
            title: it.title,
            description: it.description ?? it.content ?? "",
            categories: it.categories ?? [],
            author: {
              id: it.author?.id ?? it.authorId ?? it.userId,
              name: it.author?.name,
              username: it.author?.username,
            },
            createdAt: it.createdAt,
            likes: it._count?.likes ?? it.likes ?? 0,
            comments: it._count?.comments ?? it.comments ?? 0,
          }),
        );

        if (!active) return;

        setArticles(mapped);
        setPage(1);
      } catch (err: any) {
        if (!active) return;
        console.error(
          "HOME fetch error:",
          err?.response?.status,
          err?.response?.data,
          err,
        );
        setError(err?.response?.data?.message || "Failed to load articles");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(articles.length / PAGE_SIZE)),
    [articles.length],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleArticles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return articles.slice(start, end);
  }, [articles, page]);

  const pageItems = useMemo(
    () => buildPageItems(page, totalPages),
    [page, totalPages],
  );

  // Most liked 3 posts
  const mostLiked = useMemo(() => {
    return [...articles]
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, 3);
  }, [articles]);

  // Toggle like
  const toggleLike = async (postId: number) => {
    const isLiked = likedIds.has(postId);

    setArticles((prev) =>
      prev.map((a) => {
        if (a.id !== postId) return a;
        const nextLikes = isLiked ? Math.max(0, a.likes - 1) : a.likes + 1;
        return { ...a, likes: nextLikes };
      }),
    );

    const next = new Set(likedIds);
    if (isLiked) next.delete(postId);
    else next.add(postId);
    persistLikedIds(next);
  };

  const openAuthorPosts = (e: React.MouseEvent, authorId?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authorId) return;
    router.push(`/users/${authorId}`);
  };

  const likeIconFilter = (active: boolean) =>
    active
      ? {
          filter: "invert(32%) sepia(94%) saturate(2000%) hue-rotate(200deg)",
        }
      : undefined;

  return (
    <main className="bg-gray-50 min-h-screen">
      <MobileHeader />

      <div className="pt-6">
        <h1 className="px-6 text-2xl font-bold md:hidden">Recommend For You</h1>
        <h1 className="hidden md:block px-10 text-3xl font-bold mb-4">
          Recommend For You
        </h1>

        {/* Loading */}
        {loading && (
          <p className="px-6 py-10 text-center text-gray-400 md:px-10">
            Loading articles...
          </p>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="px-6 py-10 text-center md:px-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full bg-white hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* List + Pagination + Most Liked */}
        {!loading && !error && (
          <div className="flex flex-col md:px-10">
            {articles.length === 0 ? (
              <p className="px-6 py-10 text-center text-gray-400 md:px-0">
                No articles found.
              </p>
            ) : (
              <>
                {/* ================= RECOMMEND LIST (5 per page) ================= */}
                {visibleArticles.map((article) => {
                  const isLiked = likedIds.has(article.id);

                  return (
                    <Link
                      key={article.id}
                      href={`/posts/${article.id}`}
                      className="block"
                      aria-label={`Open post: ${article.title}`}
                    >
                      <section className="border-b border-neutral-300 bg-white px-4 py-6">
                        <h2 className="text-[18px] font-bold mb-3 text-gray-900">
                          {article.title}
                        </h2>

                        {article.categories?.length > 0 && (
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {article.categories.map((cat) => (
                              <span
                                key={cat.id}
                                className="px-3 py-1 text-[10px] font-medium border rounded-md text-gray-700 bg-white"
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                          {article.description}
                        </p>

                        {/* author row */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) =>
                                openAuthorPosts(e, article.author?.id)
                              }
                              className="w-7 h-7 rounded-full overflow-hidden border bg-white shrink-0"
                              aria-label="Open author posts"
                            >
                              <Image
                                src="/icons.svg"
                                alt="Author"
                                width={28}
                                height={28}
                                className="object-cover"
                              />
                            </button>

                            <span className="font-medium text-gray-800 truncate">
                              {article.author?.name ||
                                article.author?.username ||
                                "Anonymous"}
                            </span>

                            <span className="w-1 h-1 rounded-full bg-gray-300" />

                            <span className="whitespace-nowrap">
                              {formatDate(article.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Like & Comment row */}
                        <div className="flex items-center gap-6 mt-4 text-sm text-gray-700">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleLike(article.id);
                            }}
                            className={`flex items-center gap-2 transition ${
                              isLiked
                                ? "text-blue-600"
                                : "text-gray-700 hover:text-blue-600"
                            }`}
                            aria-label={
                              isLiked ? "Unlike this post" : "Like this post"
                            }
                          >
                            <Image
                              src="/like.svg"
                              alt="Like"
                              width={16}
                              height={16}
                              className={isLiked ? "opacity-100" : "opacity-80"}
                              style={likeIconFilter(isLiked)}
                            />
                            <span>{article.likes}</span>
                          </button>

                          <span className="flex items-center gap-2">
                            <Image
                              src="/comment.svg"
                              alt="Comments"
                              width={16}
                              height={16}
                            />
                            {article.comments}
                          </span>
                        </div>
                      </section>
                    </Link>
                  );
                })}

                {/* ================= PAGINATION ================= */}
                <div className="bg-white px-6 py-6 border-b border-neutral-300 md:px-0">
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`px-3 py-2 rounded-lg transition ${
                        page === 1
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      &lt; Previous
                    </button>

                    <div className="flex items-center gap-4">
                      {pageItems.map((it, idx) =>
                        it === "…" ? (
                          <span
                            key={`dots-${idx}`}
                            className="px-1 text-gray-500 select-none"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={it}
                            type="button"
                            onClick={() => setPage(it)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                              it === page
                                ? "bg-blue-300 text-gray-900"
                                : "hover:bg-gray-100"
                            }`}
                            aria-current={it === page ? "page" : undefined}
                          >
                            {it}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className={`px-3 py-2 rounded-lg transition ${
                        page === totalPages
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>

                {/* ================= GAP ABU-ABU TEBAL ================= */}
                <div className="h-6 bg-gray-100" />

                {/* ================= MOST LIKED (3) ================= */}
                <section className="bg-white px-4 pt-6 pb-0 md:px-10">
                  <h2 className="text-xl font-bold mb-4">Most Liked</h2>

                  {mostLiked.length === 0 ? (
                    <p className="text-gray-400 pb-0">No posts yet.</p>
                  ) : (
                    <div className="flex flex-col">
                      {mostLiked.map((post, idx) => {
                        const isLiked = likedIds.has(post.id);

                        return (
                          <div key={post.id}>
                            <Link
                              href={`/posts/${post.id}`}
                              className="block py-4"
                              aria-label={`Open most liked post: ${post.title}`}
                            >
                              <h3 className="font-semibold text-lg line-clamp-2">
                                {post.title}
                              </h3>

                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {post.description}
                              </p>

                              <div className="flex items-center gap-2 mt-3 text-sm">
                                <Image
                                  src="/like.svg"
                                  alt="Likes"
                                  width={16}
                                  height={16}
                                  className={
                                    isLiked ? "opacity-100" : "opacity-80"
                                  }
                                  style={likeIconFilter(isLiked)}
                                />
                                <span
                                  className={
                                    isLiked ? "text-blue-600" : "text-gray-600"
                                  }
                                >
                                  {post.likes}
                                </span>
                              </div>
                            </Link>

                            {idx !== mostLiked.length - 1 && (
                              <div className="border-b border-neutral-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
