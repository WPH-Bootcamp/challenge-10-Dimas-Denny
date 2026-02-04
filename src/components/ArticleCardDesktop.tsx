"use client";

import Image from "next/image";
import Link from "next/link";

type Category = { id: number; name: string };
type Author = { name?: string; username?: string };
type Article = {
  id: number;
  title: string;
  description: string;
  categories?: Category[];
  author?: Author;
  createdAt?: string;
  likes?: number;
  comments?: number;
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

export default function ArticleCardDesktop({ article }: { article: Article }) {
  const categories = article.categories ?? [];
  const likes = article.likes ?? 0;
  const comments = article.comments ?? 0;

  return (
    <Link
      href={`/posts/${article.id}`}
      className="block mb-6 rounded-xl overflow-hidden bg-white border hover:bg-gray-50 transition"
      aria-label={`Open article: ${article.title}`}
    >
      <div className="flex gap-6">
        {/* Image */}
        <div className="w-[340px] h-[258px] shrink-0 relative bg-gray-100">
          <Image
            src="/imagetyping.svg"
            alt="Article"
            fill
            className="object-cover"
            priority={false}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
          <div>
            <h2 className="text-2xl font-bold mb-2 line-clamp-2">
              {article.title}
            </h2>

            {categories.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-3 py-1 text-xs font-medium border rounded-md text-gray-700 bg-white"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-gray-600 line-clamp-3">{article.description}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500 mt-6 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/icons.svg"
                alt="Author"
                width={28}
                height={28}
                className="rounded-full"
              />
              <span className="truncate">
                {article.author?.name ||
                  article.author?.username ||
                  "Anonymous"}
              </span>
            </div>

            <span className="whitespace-nowrap">
              {formatDate(article.createdAt)}
            </span>

            <span className="whitespace-nowrap">
              👍 {likes} &nbsp; 💬 {comments}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
