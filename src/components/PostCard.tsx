import Image from "next/image";

type Category = {
  id: number;
  name: string;
};

type Author = {
  name?: string;
  username?: string;
};

type Post = {
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
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <section className="px-6 py-6 border-b bg-white">
      <h2 className="text-xl font-bold leading-snug mb-3">{post.title}</h2>

      {post.categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {post.categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 text-xs font-medium border rounded-md text-gray-700"
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">{post.description}</p>

      <div className="flex items-center gap-2 mb-4">
        <Image
          src="/icons.svg"
          alt="Author"
          width={28}
          height={28}
          className="rounded-full"
        />

        <span className="text-sm font-medium">
          {post.author?.name || post.author?.username || "Anonymous"}
        </span>

        <span className="w-1 h-1 rounded-full bg-gray-400" />

        <span className="text-sm text-gray-500">
          {formatDate(post.createdAt)}
        </span>
      </div>

      <div className="flex gap-4 text-sm text-gray-600">
        <span>👍 {post.likes}</span>
        <span>💬 {post.comments}</span>
      </div>
    </section>
  );
}
