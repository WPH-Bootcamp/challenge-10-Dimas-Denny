"use client";

import Image from "next/image";
import Link from "next/link";

type Category = { id: number; name: string };
type Author = { name?: string; username?: string };

type Post = {
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
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PostCard({ post }: { post: Post }) {
  const categories = post.categories ?? [];
  const likes = post.likes ?? 0;
  const comments = post.comments ?? 0;

  return (
    <Link
      href={`/posts/${post.id}`}
      className="block border-b bg-white px-6 py-6 hover:bg-gray-50 transition"
      aria-label={`Open article: ${post.title}`}
    >
      <h2 className="text-xl font-bold leading-snug mb-3 line-clamp-2">
        {post.title}
      </h2>

      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
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

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {post.description}
      </p>

      <div className="flex items-center gap-2 mb-4 min-w-0">
        <Image
          src="/icons.svg"
          alt="Author avatar"
          width={28}
          height={28}
          className="rounded-full"
        />

        <span className="text-sm font-medium truncate">
          {post.author?.name || post.author?.username || "Anonymous"}
        </span>

        <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />

        <span className="text-sm text-gray-500 shrink-0">
          {formatDate(post.createdAt)}
        </span>
      </div>

      <div className="flex gap-4 text-sm text-gray-700">
        {/* Optional: pakai SVG dari public untuk lebih sesuai Figma */}
        <span className="inline-flex items-center gap-2">
          <Image src="/like.svg" alt="" width={16} height={16} />
          {likes}
        </span>

        <span className="inline-flex items-center gap-2">
          <Image src="/comment.svg" alt="" width={16} height={16} />
          {comments}
        </span>
      </div>
    </Link>
  );
}
