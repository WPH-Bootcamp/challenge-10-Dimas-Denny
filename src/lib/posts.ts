import { api } from "@/lib/api";

export async function getRecommendedPosts() {
  const res = await api.get("/posts/recommended");
  return res.data;
}
