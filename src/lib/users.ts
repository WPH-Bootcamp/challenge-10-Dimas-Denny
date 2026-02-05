import { api } from "@/lib/api";

export type UserPost = {
  id: number;
  title: string;
  description: string;
  categories?: { id: number; name: string }[];
  author?: { id?: number; name?: string; username?: string };
  createdAt?: string;
  likes?: number;
  comments?: number;
};

export async function getPostsByUser(userId: string | number) {
  const id = String(userId);

  // 1) /users/:id/posts
  try {
    const r1 = await api.get(`/users/${id}/posts`);
    const d1 = r1.data?.data ?? r1.data;
    if (Array.isArray(d1)) return d1 as UserPost[];
  } catch {}

  // 2) /posts?authorId=:id
  try {
    const r2 = await api.get(`/posts`, { params: { authorId: id } });
    const d2 = r2.data?.data ?? r2.data;
    if (Array.isArray(d2)) return d2 as UserPost[];
  } catch {}

  // 3) /posts?userId=:id
  try {
    const r3 = await api.get(`/posts`, { params: { userId: id } });
    const d3 = r3.data?.data ?? r3.data;
    if (Array.isArray(d3)) return d3 as UserPost[];
  } catch {}

  // 4) /posts/by-user/:id
  const r4 = await api.get(`/posts/by-user/${id}`);
  const d4 = r4.data?.data ?? r4.data;
  return Array.isArray(d4) ? (d4 as UserPost[]) : [];
}
