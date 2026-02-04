import { api } from "@/lib/api";

export async function getRecommendedPosts() {
  const res = await api.get("/posts", {
    params: {
      recommended: true,
    },
  });

  return res.data?.data || [];
}
