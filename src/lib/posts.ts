import { api } from "@/lib/api";

export async function getRecommendedPosts() {
  // Coba 1: /posts/recommended
  try {
    const res = await api.get("/posts/recommended");
    return res.data?.data ?? res.data ?? [];
  } catch {
    // lanjut
  }

  // Coba 2: /posts?recommended=true
  const res2 = await api.get("/posts", { params: { recommended: true } });
  return res2.data?.data ?? res2.data ?? [];
}
