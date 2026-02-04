"use client";

import Image from "next/image";
import Link from "next/link";

type Author = { name?: string; username?: string };
type Article = {
  id: number;
  title: string;
  author?: Author;
  createdAt?: string;
  likes?: number;
  comments?: number;
};

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MostLikedSidebar({
  title = "Most Liked",
  items,
}: {
  title?: string;
  items: Article[];
}) {
  return (
    <aside className="bg-white border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-xs text-gray-500">{items.length} posts</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No data</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((a) => {
            const likes = a.likes ?? 0;
            const comments = a.comments ?? 0;
            const author = a.author?.name || a.author?.username || "Anonymous";
            const date = formatDate(a.createdAt);

            return (
              <Link
                key={a.id}
                href={`/posts/${a.id}`}
                className="flex gap-3 group"
                aria-label={`Open article: ${a.title}`}
              >
                {/* thumb */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  <Image
                    src="/imagetyping.svg"
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>

                {/* text */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug line-clamp-2 group-hover:underline">
                    {a.title}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">{author}</span>
                    {date && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="whitespace-nowrap">{date}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-gray-600">
                    👍 {likes} <span className="mx-1">·</span> 💬 {comments}
                  </div>
                </div>

                {/* avatar (optional visual) */}
                <div className="w-7 h-7 rounded-full overflow-hidden border shrink-0 relative mt-1">
                  <Image
                    src="/icons.svg"
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
