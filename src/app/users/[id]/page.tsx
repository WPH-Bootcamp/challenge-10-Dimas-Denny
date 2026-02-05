"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import MobileHeader from "@/components/header/MobileHeader";
import { getPostsByUser, UserPost } from "@/lib/users";

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

export default function UserPostsPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;

  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userInfo = useMemo(() => {
    const first = posts[0];
    const author = first?.author ?? {};
    return {
      name: author.name || author.username || "User",
      subtitle: "Frontend Developer",
    };
  }, [posts]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPostsByUser(userId);

        if (!active) return;

        const mapped: UserPost[] = (Array.isArray(data) ? data : []).map(
          (it: any) => ({
            id: it.id,
            title: it.title,
            description: it.description ?? it.content ?? "",
            categories: it.categories ?? [],
            author: it.author ?? {},
            createdAt: it.createdAt,
            likes: it._count?.likes ?? it.likes ?? 0,
            comments: it._count?.comments ?? it.comments ?? 0,
          }),
        );

        setPosts(mapped);
      } catch (err: any) {
        if (!active) return;
        setError(err?.response?.data?.message || "Failed to load posts");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <main className="bg-gray-50 min-h-screen">
      <MobileHeader />

      {/* USER HEADER */}
      <div className="bg-white border-b border-neutral-300 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border bg-white">
            <Image
              src="/icons.svg"
              alt="User"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900">{userInfo.name}</p>
            <p className="text-xs text-gray-500">{userInfo.subtitle}</p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 py-6">
        {loading && <p className="text-gray-400">Loading posts...</p>}

        {!loading && error && (
          <p className="text-red-500 text-center">{error}</p>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!loading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Image
              src="/noPost.svg"
              alt="No posts"
              width={180}
              height={180}
              className="mb-6"
            />

            <p className="text-sm font-semibold text-gray-900 mb-1">
              No posts from this user yet
            </p>

            <p className="text-sm text-gray-500">Stay tuned for future posts</p>
          </div>
        )}

        {/* ===== POSTS LIST ===== */}
        {!loading && !error && posts.length > 0 && (
          <>
            <h2 className="font-semibold text-gray-900 mb-3">
              {posts.length} Post
            </h2>

            <div className="bg-white rounded-xl overflow-hidden border border-neutral-300">
              {posts.map((post, idx) => (
                <div key={post.id}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="block p-4 hover:bg-gray-50 transition"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {post.title}
                    </h3>

                    {post.categories?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {post.categories.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-1 text-[10px] font-medium border rounded-md text-gray-700 bg-white"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/icons.svg"
                          alt="Author"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span>{userInfo.name}</span>
                      </div>

                      <span>{formatDate(post.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-sm text-gray-700">
                      <span className="flex items-center gap-2">
                        <Image
                          src="/like.svg"
                          alt="Like"
                          width={16}
                          height={16}
                        />
                        {post.likes}
                      </span>

                      <span className="flex items-center gap-2">
                        <Image
                          src="/comment.svg"
                          alt="Comments"
                          width={16}
                          height={16}
                        />
                        {post.comments}
                      </span>
                    </div>
                  </Link>

                  {idx !== posts.length - 1 && (
                    <div className="border-b border-neutral-300" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
