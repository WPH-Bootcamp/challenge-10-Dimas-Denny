import { api } from "@/lib/api";

export type MyPost = {
  id: number;
  title?: string;
  content?: string;
  description?: string;
  tags?: string[];
  categories?: { id: number; name: string }[];
  createdAt?: string;
  updatedAt?: string;
};

function pickArray(payload: any) {
  if (Array.isArray(payload)) return payload;

  const a = payload?.data;
  if (Array.isArray(a)) return a;

  const b = payload?.data?.data;
  if (Array.isArray(b)) return b;

  const c = payload?.items;
  if (Array.isArray(c)) return c;

  return null;
}

async function tryGet(url: string, config?: any) {
  try {
    const res = await api.get(url, config);
    const arr = pickArray(res.data);
    return arr;
  } catch (e: any) {
    // endpoint mungkin tidak ada / beda format → fallback ke endpoint lain
    // biar gampang debug, log hanya status (tidak ganggu UI)
    const status = e?.response?.status;
    if (status && status !== 404) {
      console.warn("tryGet failed:", url, status);
    }
    return null;
  }
}

export async function getMyPosts(userId?: number | string) {
  // ✅ FIX: endpoint resmi dari backend
  const official = await tryGet("/posts/my-posts");
  if (official) return official as MyPost[];

  // fallback lama (biar tetap aman kalau endpoint berubah)
  const a = await tryGet("/posts/me");
  if (a) return a as MyPost[];

  const b = await tryGet("/posts", { params: { mine: true } });
  if (b) return b as MyPost[];

  if (userId != null) {
    const c = await tryGet("/posts", { params: { userId } });
    if (c) return c as MyPost[];

    const d = await tryGet("/posts", { params: { authorId: userId } });
    if (d) return d as MyPost[];
  }

  if (userId != null) {
    const e = await tryGet(`/users/${userId}/posts`);
    if (e) return e as MyPost[];
  }

  return [] as MyPost[];
}

export async function createPost(payload: {
  title: string;
  content: string;
  tags: string[]; // max 3
  imageFile: File; // REQUIRED
}) {
  const fd = new FormData();
  fd.append("title", payload.title);
  fd.append("content", payload.content);

  // tags: aman kirim JSON string
  fd.append("tags", JSON.stringify(payload.tags.slice(0, 3)));

  // REQUIRED
  fd.append("image", payload.imageFile);

  const res = await api.post("/posts", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}
