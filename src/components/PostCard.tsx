import Image from "next/image";

type Category = {
  id: number;
  name: string;
};

type Author = {
  id?: number;
  name?: string;
  username?: string;
};

type Post = {
  id: number;
  title: string;
  description: string;
  categories: Category[];
  tags?: string[];
  author: Author;
  createdAt: string;
  likes: number;
  comments: number;
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

export default function PostCard({
  post,
  isLiked = false,
  onToggleLike,
  onAuthorClick,
}: {
  post: Post;
  isLiked?: boolean;
  onToggleLike?: (postId: number) => void;
  onAuthorClick?: (authorId?: number) => void;
}) {
  const likeIconFilter = isLiked
    ? { filter: "invert(32%) sepia(94%) saturate(2000%) hue-rotate(200deg)" }
    : undefined;

  return (
    <section className="px-6 py-6 border-b border-neutral-300 bg-white">
      <h2 className="text-xl font-bold leading-snug mb-3">{post.title}</h2>

      {/* tags (kalau ada) */}
      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {post.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="px-3 py-1 text-xs font-medium border border-neutral-300 rounded-xl text-gray-700"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* categories fallback */}
      {!post.tags?.length && post.categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {post.categories.slice(0, 3).map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 text-xs font-medium border border-neutral-300 rounded-xl text-gray-700"
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {post.description}
      </p>

      {/* author row */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAuthorClick?.(post.author?.id);
          }}
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

        <span className="text-sm font-medium truncate">
          {post.author?.name || post.author?.username || "Anonymous"}
        </span>

        <span className="w-1 h-1 rounded-full bg-gray-300" />

        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatDate(post.createdAt)}
        </span>
      </div>

      {/* like/comment row (CLICKABLE WITHOUT NAVIGATE) */}
      <div className="flex gap-6 text-sm text-gray-700">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleLike?.(post.id);
          }}
          className={`flex items-center gap-2 transition ${
            isLiked ? "text-blue-600" : "hover:text-blue-600"
          }`}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <Image
            src="/like.svg"
            alt="Like"
            width={16}
            height={16}
            style={likeIconFilter}
            className={isLiked ? "opacity-100" : "opacity-80"}
          />
          <span>{post.likes}</span>
        </button>

        <span className="flex items-center gap-2 text-gray-700">
          <Image src="/comment.svg" alt="Comments" width={16} height={16} />
          <span>{post.comments}</span>
        </span>
      </div>
    </section>
  );
}
