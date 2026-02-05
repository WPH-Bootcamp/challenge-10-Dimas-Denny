"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Unlink,
  Image as ImgIcon,
  Undo2,
  Redo2,
  Eraser,
  Expand,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createPost } from "@/lib/writePost";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";

type Errors = {
  title?: string;
  content?: string;
  image?: string;
  tags?: string;
};

const MAX_IMAGE_MB = 5;

function parseTags(raw: string) {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const uniq: string[] = [];
  for (const p of parts) {
    if (!uniq.includes(p)) uniq.push(p);
    if (uniq.length === 3) break;
  }
  return uniq;
}

function isEditorEmpty(html: string) {
  // Tiptap kosong biasanya "<p></p>" atau "<p><br></p>"
  const cleaned = html
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<p><br><\/p>/g, "")
    .replace(/<br\s*\/?>/g, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
  return cleaned.length === 0;
}

function ToolbarBtn({
  active,
  disabled,
  onClick,
  children,
  ariaLabel,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition
        ${disabled ? "opacity-50" : "hover:bg-gray-100"}
        ${active ? "bg-blue-50" : ""}
      `}
    >
      {children}
    </button>
  );
}

export default function WritePostPage() {
  const router = useRouter();
  const { user } = useAuth();

  const avatarUrl =
    (user as any)?.avatarUrl?.trim?.() ||
    (user as any)?.avatar?.trim?.() ||
    "/icons.svg";

  const [title, setTitle] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>("");

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false, // ✅ FIX SSR/hydration
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[220px] px-4 py-3 text-sm outline-none prose max-w-none",
      },
    },
  });

  const setFieldError = (key: keyof Errors, val?: string) => {
    setErrors((prev) => ({ ...prev, [key]: val }));
  };

  const validate = () => {
    const next: Errors = {};

    if (!title.trim()) next.title = "Title is required";

    const html = editor?.getHTML() || "";
    if (!editor || isEditorEmpty(html)) next.content = "Content is required";

    if (!imageFile) {
      next.image = "Cover image is required";
    } else {
      const mb = imageFile.size / (1024 * 1024);
      if (mb > MAX_IMAGE_MB) next.image = `Max image size is ${MAX_IMAGE_MB}MB`;
      const okType =
        imageFile.type === "image/png" ||
        imageFile.type === "image/jpeg" ||
        imageFile.type === "image/jpg";
      if (!okType) next.image = "Only PNG or JPG is allowed";
    }

    const rawParts = tagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawParts.length > 3) next.tags = "Max 3 tags (separated by comma)";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPickImage = (file?: File | null) => {
    if (!file) return;

    setImageFile(file);
    setImageName(file.name);
    setFieldError("image", undefined);

    // preview
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };
  const toggleFullScreen = () => {
    // simple fullscreen: scroll to top + focus (UI only)
    window.scrollTo({ top: 0, behavior: "smooth" });
    editor?.commands.focus();
  };

  const setHeadingLevel = (level: "p" | 1 | 2 | 3) => {
    if (!editor) return;
    if (level === "p") {
      editor.chain().focus().setParagraph().run();
      return;
    }
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const getHeadingValue = () => {
    if (!editor) return "Heading 1";
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    return "Paragraph";
  };

  const onLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev || "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const onUnlink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  const handleFinish = async () => {
    if (submitting) return;
    if (!validate()) return;

    try {
      setSubmitting(true);

      const html = editor?.getHTML() || "";
      // backend kamu kemungkinan terima "content" string
      await createPost({
        title: title.trim(),
        content: html, // ✅ kirim HTML
        tags,
        imageFile: imageFile!,
      });

      router.push("/profile");
    } catch (err: any) {
      console.error(
        "CREATE POST ERROR:",
        err?.response?.status,
        err?.response?.data,
        err,
      );

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.details?.errors?.[0] ||
        "Failed to create post";

      if (String(msg).toLowerCase().includes("image")) {
        setFieldError("image", String(msg));
      } else if (String(msg).toLowerCase().includes("title")) {
        setFieldError("title", String(msg));
      } else if (String(msg).toLowerCase().includes("content")) {
        setFieldError("content", String(msg));
      } else {
        alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-white";
  const errorBorder = "border-[#EE1D52]";
  const normalBorder = "border-neutral-300";
  const helperErr = "text-[#EE1D52] text-xs mt-2";

  const contentBorderClass = errors.content ? errorBorder : normalBorder;

  const [imagePreview, setImagePreview] = useState<string>("");

  const deleteImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
    setImageFile(null);
    setImageName("");
    setFieldError("image", undefined);
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;

    // max 3
    if (tags.length >= 3) {
      setFieldError("tags", "Max 3 tags");
      return;
    }

    // prevent duplicate (case-insensitive)
    const exists = tags.some((x) => x.toLowerCase() === t.toLowerCase());
    if (exists) {
      setTagInput("");
      return;
    }

    setTags((prev) => [...prev, t]);
    setTagInput("");
    setFieldError("tags", undefined);
  };

  const removeTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx));
    setFieldError("tags", undefined);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* TOP BAR */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>

          <p className="text-sm font-semibold">Write Post</p>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200 bg-white"
            aria-label="Profile"
          >
            {String(avatarUrl).startsWith("http") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image
                src={avatarUrl}
                alt="avatar"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            )}
          </button>
        </div>
      </div>

      {/* FORM */}
      <div className="px-4 py-5">
        {/* Title */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-900">Title</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setFieldError("title", undefined);
            }}
            placeholder="Enter your title"
            className={`${inputBase} mt-2 ${errors.title ? errorBorder : normalBorder}`}
          />
          {errors.title && <p className={helperErr}>{errors.title}</p>}
        </div>

        {/* Content */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-900">Content</label>

          <div
            className={`mt-2 rounded-xl border ${contentBorderClass} overflow-hidden`}
          >
            {/* Toolbar (mirip screenshot) */}
            <div className="px-3 py-2 border-b border-neutral-200 bg-white">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Heading dropdown */}
                <div className="relative">
                  <select
                    value={getHeadingValue()}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "Heading 1") setHeadingLevel(1);
                      else if (v === "Heading 2") setHeadingLevel(2);
                      else if (v === "Heading 3") setHeadingLevel(3);
                      else setHeadingLevel("p");
                    }}
                    className="h-9 rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                    <option>Heading 3</option>
                    <option>Paragraph</option>
                  </select>
                </div>

                <div className="w-px h-6 bg-neutral-200 mx-1" />

                <ToolbarBtn
                  ariaLabel="Bold"
                  active={!!editor?.isActive("bold")}
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <Bold size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Strike"
                  active={!!editor?.isActive("strike")}
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                >
                  <Strikethrough size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Italic"
                  active={!!editor?.isActive("italic")}
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <Italic size={16} />
                </ToolbarBtn>

                <div className="w-px h-6 bg-neutral-200 mx-1" />

                <ToolbarBtn
                  ariaLabel="Bullet list"
                  active={!!editor?.isActive("bulletList")}
                  disabled={!editor}
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                >
                  <List size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Ordered list"
                  active={!!editor?.isActive("orderedList")}
                  disabled={!editor}
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                >
                  <ListOrdered size={16} />
                </ToolbarBtn>

                <div className="w-px h-6 bg-neutral-200 mx-1" />

                {/* Align group */}
                <ToolbarBtn
                  ariaLabel="Align left"
                  active={editor?.isActive({ textAlign: "left" })}
                  disabled={!editor}
                  onClick={() =>
                    editor?.chain().focus().setTextAlign("left").run()
                  }
                >
                  <AlignLeft size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Align center"
                  active={editor?.isActive({ textAlign: "center" })}
                  disabled={!editor}
                  onClick={() =>
                    editor?.chain().focus().setTextAlign("center").run()
                  }
                >
                  <AlignCenter size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Align right"
                  active={editor?.isActive({ textAlign: "right" })}
                  disabled={!editor}
                  onClick={() =>
                    editor?.chain().focus().setTextAlign("right").run()
                  }
                >
                  <AlignRight size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Align justify"
                  active={editor?.isActive({ textAlign: "justify" })}
                  disabled={!editor}
                  onClick={() =>
                    editor?.chain().focus().setTextAlign("justify").run()
                  }
                >
                  <AlignJustify size={16} />
                </ToolbarBtn>

                <div className="w-px h-6 bg-neutral-200 mx-1" />

                <ToolbarBtn
                  ariaLabel="Add link"
                  disabled={!editor}
                  onClick={onLink}
                  active={!!editor?.isActive("link")}
                >
                  <Link2 size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Remove link"
                  disabled={!editor || !editor.isActive("link")}
                  onClick={onUnlink}
                >
                  <Unlink size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Insert image"
                  disabled
                  onClick={() => {}}
                >
                  <ImgIcon size={16} />
                </ToolbarBtn>

                <div className="w-px h-6 bg-neutral-200 mx-1" />

                <ToolbarBtn
                  ariaLabel="Undo"
                  disabled={!editor || !editor.can().undo()}
                  onClick={() => editor?.chain().focus().undo().run()}
                >
                  <Undo2 size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Redo"
                  disabled={!editor || !editor.can().redo()}
                  onClick={() => editor?.chain().focus().redo().run()}
                >
                  <Redo2 size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Clear formatting"
                  disabled={!editor}
                  onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                >
                  <Eraser size={16} />
                </ToolbarBtn>

                <ToolbarBtn
                  ariaLabel="Fullscreen"
                  disabled={!editor}
                  onClick={toggleFullScreen}
                >
                  <Expand size={16} />
                </ToolbarBtn>
              </div>
            </div>

            {/* Editor */}
            <EditorContent
              editor={editor}
              onFocus={() => setFieldError("content", undefined)}
            />
          </div>

          {errors.content && <p className={helperErr}>{errors.content}</p>}
        </div>

        {/* Cover Image */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-900">
            Cover Image
          </label>

          {/* Box Upload / Preview */}
          <div
            className={`mt-2 rounded-xl border-2 ${
              imageFile ? "border-neutral-300" : "border-dashed"
            } ${errors.image ? "border-[#EE1D52]" : "border-neutral-300"}
    bg-white overflow-hidden`}
          >
            {!imageFile ? (
              // ===== Empty state (upload)
              <div
                className="px-4 py-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/40 transition"
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fileRef.current?.click();
                }}
                aria-label="Upload cover image"
              >
                <div className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center mb-3">
                  <Image
                    src="/upload.svg"
                    alt="upload"
                    width={18}
                    height={18}
                  />
                </div>

                <p className="text-sm">
                  <span className="text-[#0093DD] font-semibold cursor-pointer">
                    Click to upload
                  </span>{" "}
                  <span className="text-gray-500">or drag and drop</span>
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  PNG or JPG (max. 5mb)
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                />
              </div>
            ) : (
              // ===== After upload (preview + actions)
              <div className="p-4">
                <div className="w-full h-[170px] rounded-xl overflow-hidden border border-neutral-200 bg-gray-50">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                      Preview unavailable
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center gap-3">
                  {/* Change Image */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-35.25 h-10 rounded-xl border border-neutral-300 bg-white
                       flex items-center justify-center gap-2
                       text-sm font-semibold text-gray-900
                       hover:bg-gray-50 hover:border-neutral-400 transition"
                  >
                    <Image
                      src="/upload.svg"
                      alt="upload"
                      width={18}
                      height={18}
                    />
                    Change Image
                  </button>

                  {/* Delete Image */}
                  <button
                    type="button"
                    onClick={deleteImage}
                    className="w-32.25 h-10 rounded-xl border border-neutral-300 bg-white
                       flex items-center justify-center gap-2
                       text-sm font-semibold text-[#EE1D52]
                       hover:bg-red-50 hover:border-red-200 transition"
                  >
                    <Image
                      src="/trash.svg"
                      alt="delete"
                      width={18}
                      height={18}
                    />
                    Delete Image
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  PNG or JPG (max. 5mb)
                </p>
              </div>
            )}
          </div>

          {errors.image && (
            <p className="text-[#EE1D52] text-xs mt-2">{errors.image}</p>
          )}
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-900">Tags</label>

          <div
            className={`mt-2 w-full min-h-[48px] rounded-xl border px-3 py-2 bg-white
      flex flex-wrap items-center gap-2
      ${errors.tags ? "border-[#EE1D52]" : "border-neutral-300"}
      focus-within:ring-2 focus-within:ring-blue-300
    `}
            onClick={() => {
              // fokuskan input kalau klik area kosong
              const el = document.getElementById("tag-input");
              (el as HTMLInputElement | null)?.focus();
            }}
          >
            {/* chips */}
            {tags.map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="flex items-center gap-2 px-3 py-1 text-xs border border-neutral-300 rounded-xl bg-white text-gray-700"
              >
                {t}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(idx);
                  }}
                  className="w-4 h-4 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  aria-label={`Remove tag ${t}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {/* input inline */}
            <input
              id="tag-input"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setFieldError("tags", undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
                if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                  // backspace saat kosong = hapus tag terakhir
                  removeTag(tags.length - 1);
                }
              }}
              placeholder={tags.length === 0 ? "Enter your tags" : ""}
              className="flex-1 min-w-[120px] text-sm outline-none bg-transparent py-1"
              disabled={tags.length >= 3 && !tagInput.trim()}
            />
          </div>

          {/* helper */}
          <div className="mt-2 flex items-center justify-between">
            {errors.tags ? (
              <p className="text-[#EE1D52] text-xs">{errors.tags}</p>
            ) : (
              <span className="text-xs text-gray-500">Max 3 tags</span>
            )}

            <span className="text-xs text-gray-500">{tags.length}/3</span>
          </div>
        </div>

        {/* Finish */}
        <button
          type="button"
          onClick={handleFinish}
          disabled={submitting}
          className="w-full h-12 rounded-full bg-[#0093DD] cursopo text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {submitting ? "Publishing..." : "Finish"}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-neutral-200 py-4 text-center text-xs text-gray-500">
        © 2025 Web Programming Hack Blog All rights reserved.
      </div>
    </div>
  );
}
