"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MobileHeader from "@/components/header/MobileHeader";
import { createPost } from "@/lib/writePost";

function normalizeTag(t: string) {
  return t.trim().replace(/\s+/g, " ");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Failed to read file"));
    r.onload = () => resolve(String(r.result || ""));
    r.readAsDataURL(file);
  });
}

export default function WritePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 0 &&
      content.trim().length > 0 &&
      !!imageFile &&
      !loading
    );
  }, [title, content, imageFile, loading]);

  const addTag = (raw: string) => {
    const t = normalizeTag(raw);
    if (!t) return;
    if (tags.length >= 3) return;

    const exists = tags.some((x) => x.toLowerCase() === t.toLowerCase());
    if (exists) return;

    setTags((prev) => [...prev, t]);
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const onPickImage = async (file?: File | null) => {
    if (!file) return;

    // validasi sederhana
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Max image size is 5MB");
      return;
    }

    setImageFile(file);
    const preview = await fileToDataUrl(file);
    setImagePreview(preview);
  };

  const submit = async () => {
    if (!imageFile) {
      alert("Image is required");
      return;
    }
    if (!title.trim() || !content.trim()) return;

    try {
      setLoading(true);

      await createPost({
        title: title.trim(),
        content: content.trim(),
        tags,
        imageFile,
      });

      router.push("/profile");
    } catch (err: any) {
      console.error(
        "CREATE POST ERROR:",
        err?.response?.status,
        err?.response?.data,
        err,
      );
      alert(err?.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileHeader />

      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="bg-white border border-neutral-300 rounded-xl p-4">
          <h1 className="text-lg font-bold text-gray-900 mb-4">Write Post</h1>

          {/* IMAGE (REQUIRED) */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-900">
              Image <span className="text-[#EE1D52]">*</span>
            </label>

            <div className="mt-2">
              {imagePreview ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-neutral-300 bg-gray-50">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-44 rounded-xl border border-dashed border-neutral-300 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                  No image selected
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                disabled={loading}
                className="mt-3 block w-full text-sm"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* TITLE */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-900">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
            />
          </div>

          {/* TAGS (MAX 3) */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900">
                Tags
              </label>
              <span className="text-xs text-gray-500">{tags.length}/3</span>
            </div>

            <div className="mt-2 rounded-xl border border-neutral-300 p-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTag(t)}
                    className="px-3 py-1 text-xs border border-neutral-300 rounded-xl bg-white hover:bg-gray-50"
                    title="Click to remove"
                    disabled={loading}
                  >
                    {t} ✕
                  </button>
                ))}
              </div>

              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                placeholder={
                  tags.length >= 3
                    ? "Maximum 3 tags"
                    : "Type tag and press Enter"
                }
                disabled={loading || tags.length >= 3}
                className="w-full text-sm outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* CONTENT */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-900">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post..."
              rows={9}
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-[#0093DD] text-white py-3 rounded-full font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Image src="/write.svg" alt="Write" width={18} height={18} />
            {loading ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>
    </>
  );
}
