"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Article = {
  id: number;
  title: string;
  likes: number;
};

export default function MostLikedSidebar() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMostLiked = async () => {
      try {
        const res = await api.get("/posts/most-liked");
        setArticles(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMostLiked();
  }, []);

  return (
    <div className="w-87.5 shrink-0 p-4 border rounded-lg bg-white">
      <h3 className="font-bold text-xl mb-4">Most Liked</h3>
      {loading && <p>Loading...</p>}
      {articles.map((a) => (
        <div key={a.id} className="mb-3">
          <span className="font-medium">{a.title}</span>
          <span className="text-gray-500 ml-2">👍 {a.likes}</span>
        </div>
      ))}
    </div>
  );
}
