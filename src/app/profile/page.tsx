"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/profile";
import MobileHeader from "@/components/header/MobileHeader";
import Link from "next/link";
import { getMyPosts, type MyPost } from "@/lib/writePost";
import { api } from "@/lib/api";

const LS_PROFILE_KEY = "profile_v2";

type LocalProfile = {
  name: string;
  headline: string;
  avatarUrl?: string;
};

type TabKey = "posts" | "password";
type StatsTab = "like" | "comment";

type LikeUser = {
  id: number | string;
  name: string;
  avatarUrl?: string;
};

type CommentItem = {
  id: number | string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  text?: string;
};

function formatDateTime(dateString?: string) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTimeShort(dateString?: string) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readLocalProfile(fallbackName: string): LocalProfile {
  if (typeof window === "undefined") {
    return { name: fallbackName, headline: "Frontend Developer" };
  }
  try {
    const raw = localStorage.getItem(LS_PROFILE_KEY);
    if (!raw) return { name: fallbackName, headline: "Frontend Developer" };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed?.name === "string" ? parsed.name : fallbackName,
      headline:
        typeof parsed?.headline === "string"
          ? parsed.headline
          : "Frontend Developer",
      avatarUrl: typeof parsed?.avatarUrl === "string" ? parsed.avatarUrl : "",
    };
  } catch {
    return { name: fallbackName, headline: "Frontend Developer" };
  }
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Failed to read file"));
    r.onload = () => resolve(String(r.result || ""));
    r.readAsDataURL(file);
  });
}

function pickArray(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const fallbackName = useMemo(() => {
    return (user as any)?.name || (user as any)?.username || "User";
  }, [user]);

  // ===== Profile local cache =====
  const [profile, setProfile] = useState<LocalProfile>({
    name: fallbackName,
    headline: "Frontend Developer",
    avatarUrl: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = readLocalProfile(fallbackName);
    setProfile(p);
  }, [fallbackName]);

  // ===== Protect route =====
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  // ===== Tabs =====
  const [tab, setTab] = useState<TabKey>("posts");

  // ===== My posts =====
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      setPostsError("");
      const data = await getMyPosts(); // GET /posts/my-posts
      setMyPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(
        "GET MY POSTS ERROR:",
        err?.response?.status,
        err?.response?.data,
        err,
      );
      setMyPosts([]);
      setPostsError(
        err?.response?.data?.message || "Failed to load your posts",
      );
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) loadPosts();
  }, [loading, user, loadPosts]);

  const hasPosts = myPosts.length > 0;

  // ===== latest 5 posts for desktop requirement =====
  const latest5 = useMemo(() => myPosts.slice(0, 5), [myPosts]);

  const getPostImage = (p: any): string => {
    return (
      p?.image ||
      p?.imageUrl ||
      p?.thumbnail ||
      p?.cover ||
      p?.media ||
      p?.photo ||
      ""
    );
  };

  // ===== Edit Profile modal =====
  const [openEdit, setOpenEdit] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftHeadline, setDraftHeadline] = useState("");
  const [draftAvatarPreview, setDraftAvatarPreview] = useState<string>("");
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const openModal = () => {
    setDraftName(profile.name || fallbackName);
    setDraftHeadline(profile.headline || "Frontend Developer");
    setDraftAvatarPreview("");
    setDraftAvatarFile(null);
    setOpenEdit(true);
  };

  const closeModal = () => {
    if (savingProfile) return;
    setOpenEdit(false);
  };

  const onPickAvatar = async (file?: File | null) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Max avatar size is 2MB");
      return;
    }

    setDraftAvatarFile(file);
    const dataUrl = await toDataUrl(file);
    setDraftAvatarPreview(dataUrl);
  };

  const saveProfile = async () => {
    const name = draftName.trim() || fallbackName;
    const headline = draftHeadline.trim() || "Frontend Developer";

    try {
      setSavingProfile(true);

      const res = await updateProfile({
        name,
        headline,
        avatarFile: draftAvatarFile,
      });

      const next: LocalProfile = {
        name: res.name ?? name,
        headline: res.headline ?? headline,
        avatarUrl: res.avatarUrl ?? profile.avatarUrl ?? "",
      };

      setProfile(next);
      localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(next));
      setOpenEdit(false);
    } catch (err: any) {
      console.error(
        "UPDATE PROFILE ERROR:",
        err?.response?.status,
        err?.response?.data,
        err,
      );
      alert(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const avatarSrc =
    draftAvatarPreview?.trim() || profile.avatarUrl?.trim() || "/icons.svg";

  // ===== Change password =====
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const submitChangePassword = async () => {
    if (!currentPassword.trim()) return alert("Current password is required");
    if (!newPassword.trim()) return alert("New password is required");
    if (newPassword !== confirmNewPassword)
      return alert("Confirm password doesn't match");

    try {
      setSavingPassword(true);
      await new Promise((r) => setTimeout(r, 600));
      alert("Password updated (coming soon backend)");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } finally {
      setSavingPassword(false);
    }
  };

  // ===== Delete modal =====
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MyPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (post: MyPost) => {
    setDeleteTarget(post);
    setOpenDelete(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setOpenDelete(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      setDeleting(true);
      await api.delete(`/posts/${deleteTarget.id}`);
      setMyPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      closeDeleteModal();
    } catch (err: any) {
      console.error(
        "DELETE POST ERROR:",
        err?.response?.status,
        err?.response?.data,
        err,
      );
      alert("Delete failed (server error). Please try again later.");
    } finally {
      setDeleting(false);
    }
  };

  // ===== Statistic modal =====
  const [openStat, setOpenStat] = useState(false);
  const [statTab, setStatTab] = useState<StatsTab>("like");
  const [statTarget, setStatTarget] = useState<MyPost | null>(null);
  const [statLikes, setStatLikes] = useState<LikeUser[]>([]);
  const [statComments, setStatComments] = useState<CommentItem[]>([]);
  const [statLoading, setStatLoading] = useState(false);
  const [statError, setStatError] = useState("");

  const closeStatModal = () => {
    if (statLoading) return;
    setOpenStat(false);
    setStatTarget(null);
  };

  const openStatModal = async (post: MyPost) => {
    setStatTarget(post);
    setStatTab("like");
    setOpenStat(true);

    setStatError("");
    setStatLikes([]);
    setStatComments([]);

    try {
      setStatLoading(true);

      const [likesRes, commentsRes] = await Promise.all([
        api.get(`/posts/${post.id}/likes`),
        api.get(`/posts/${post.id}/comments`),
      ]);

      const likesRaw = pickArray(likesRes.data);
      const commentsRaw = pickArray(commentsRes.data);

      const mappedLikes: LikeUser[] = likesRaw.map((x: any) => {
        const u = x?.user ?? x;
        return {
          id: u?.id ?? x?.id ?? String(Math.random()),
          name: u?.name ?? u?.username ?? u?.email ?? "User",
          avatarUrl: u?.avatarUrl ?? u?.avatar ?? "",
        };
      });

      const mappedComments: CommentItem[] = commentsRaw.map((x: any) => {
        const u = x?.user ?? x?.author ?? x;
        return {
          id: x?.id ?? u?.id ?? String(Math.random()),
          name: u?.name ?? u?.username ?? u?.email ?? "User",
          avatarUrl: u?.avatarUrl ?? u?.avatar ?? "",
          createdAt: x?.createdAt ?? x?.created_at ?? x?.date ?? "",
          text: x?.content ?? x?.text ?? x?.message ?? "",
        };
      });

      setStatLikes(mappedLikes);
      setStatComments(mappedComments);
    } catch (err: any) {
      console.error(
        "STATISTIC ERROR:",
        err?.response?.status,
        err?.response?.data,
        err,
      );
      setStatError(err?.response?.data?.message || "Failed to load statistic");
    } finally {
      setStatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <MobileHeader />

      {/* ===================== MOBILE (KEEP YOUR OLD UI) ===================== */}
      <div className="md:hidden">
        <div className="min-h-screen bg-gray-50">
          {/* ======= TOP PROFILE HEADER (BORDER WRAPPED) ======= */}
          <div className="bg-white border border-neutral-300 rounded-xl mx-4 mt-4 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border bg-white shrink-0">
                  <Image
                    src={
                      profile.avatarUrl?.trim()
                        ? profile.avatarUrl
                        : "/icons.svg"
                    }
                    alt="Avatar"
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {profile.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {profile.headline}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openModal}
                className="text-[#0093DD] underline cursor-pointer underline-offset-4 text-sm font-medium shrink-0"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* ======= TABS ======= */}
          <div className="px-4 mt-4">
            <div className="flex items-center gap-8 border-b border-neutral-300 justify-center">
              <button
                type="button"
                onClick={() => setTab("posts")}
                className={`w-44.25 py-3 text-md font-medium relative ${
                  tab === "posts" ? "text-[#0093DD]" : "text-black"
                }`}
              >
                Your Post
                {tab === "posts" && (
                  <span className="absolute left-0 -bottom-[1px] h-[2px] w-full bg-[#0093DD]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab("password")}
                className={`py-3 text-md font-medium relative ${
                  tab === "password" ? "text-[#0093DD]" : "text-black"
                }`}
              >
                Change Password
                {tab === "password" && (
                  <span className="absolute left-0 -bottom-[1px] h-[2px] w-full bg-[#0093DD]" />
                )}
              </button>
            </div>
          </div>

          {/* ======= TAB CONTENT ======= */}
          <div className="px-4 py-6">
            {/* ===================== POSTS TAB ===================== */}
            {tab === "posts" && (
              <>
                {hasPosts && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push("/write")}
                      className="
                        bg-[#0093DD] text-white rounded-full w-full
                        px-6 py-3 text-sm font-semibold
                        flex items-center justify-center gap-2
                        hover:opacity-90 transition cursor-pointer
                      "
                    >
                      <Image
                        src="/write.svg"
                        alt="Write"
                        width={18}
                        height={18}
                      />
                      Write Post
                    </button>
                  </div>
                )}

                {postsLoading && (
                  <p className="text-center text-gray-400 mt-8">
                    Loading your posts...
                  </p>
                )}

                {!postsLoading && postsError && (
                  <div className="mt-8 text-center">
                    <p className="text-red-500 text-sm mb-3">{postsError}</p>
                    <button
                      type="button"
                      onClick={loadPosts}
                      className="px-4 py-2 rounded-full border bg-white hover:bg-gray-50 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!postsLoading && !postsError && !hasPosts && (
                  <div className="flex flex-col items-center text-center mt-14">
                    <Image
                      src="/noPost.svg"
                      alt="No posts"
                      width={180}
                      height={180}
                      className="mb-6"
                    />

                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Your writing journey starts here
                    </p>

                    <p className="text-sm text-gray-500 mb-6">
                      No posts yet, but every great writer starts with the first
                      one.
                    </p>

                    <button
                      type="button"
                      onClick={() => router.push("/write")}
                      className="
                        bg-[#0093DD] text-white rounded-full w-60
                        px-6 py-3 text-sm font-semibold
                        flex items-center justify-center gap-2
                        hover:opacity-90 transition
                      "
                    >
                      <Image
                        src="/write.svg"
                        alt="Write"
                        width={18}
                        height={18}
                      />
                      Write Post
                    </button>
                  </div>
                )}

                {!postsLoading && !postsError && hasPosts && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-900 mb-4">
                      Latest 5 posts
                    </p>

                    <div className="flex flex-col gap-4">
                      {myPosts.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-neutral-300 rounded-xl p-4"
                        >
                          {p.title && (
                            <p className="text-sm font-semibold text-gray-900 mb-2">
                              {p.title}
                            </p>
                          )}

                          {/* tags (di bawah judul) */}
                          {Array.isArray((p as any)?.tags) &&
                            (p as any).tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {(p as any).tags
                                  .slice(0, 3)
                                  .map((t: string) => (
                                    <span
                                      key={t}
                                      className="px-3 py-1 text-xs border border-neutral-300 rounded-xl bg-white"
                                    >
                                      {t}
                                    </span>
                                  ))}
                              </div>
                            )}

                          <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">
                            {(p as any)?.content ||
                              (p as any)?.description ||
                              "-"}
                          </p>

                          <p className="text-xs text-gray-500 mt-3">
                            Created at {formatDateTime((p as any)?.createdAt)} |{" "}
                            Last Updated {formatDateTime((p as any)?.updatedAt)}
                          </p>

                          <div className="flex items-center gap-6 mt-3 text-sm">
                            <button
                              type="button"
                              onClick={() => openStatModal(p)}
                              className="text-[#0093DD] font-medium"
                            >
                              Statistic
                            </button>

                            <button
                              type="button"
                              onClick={() => alert("Edit (coming soon)")}
                              className="text-[#0093DD] font-medium"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(p)}
                              className="text-[#EE1D52] underline font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===================== CHANGE PASSWORD TAB ===================== */}
            {tab === "password" && (
              <div className="bg-white rounded-xl p-4 ">
                {/* Current Password */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-900">
                    Current Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                      aria-label="Toggle current password"
                    >
                      {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-900">
                    New Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                      aria-label="Toggle new password"
                    >
                      {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-900">
                    Confirm New Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Enter confirm new password"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                      aria-label="Toggle confirm password"
                    >
                      {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitChangePassword}
                  disabled={savingPassword}
                  className="w-full bg-[#0093DD] text-white py-3 rounded-full font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>

          <div className="h-10" />
        </div>
      </div>

      {/* ===================== DESKTOP (NEW LAYOUT) ===================== */}
      <div className="hidden md:block bg-white min-h-screen">
        <div className="w-[800px] mx-auto h-full pt-10 pb-16">
          {/* Header profile */}
          <div className="bg-white border border-neutral-300 rounded-xl px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border bg-white shrink-0">
                  <Image
                    src={
                      profile.avatarUrl?.trim()
                        ? profile.avatarUrl
                        : "/icons.svg"
                    }
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {profile.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {profile.headline}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openModal}
                className="text-[#0093DD] underline cursor-pointer underline-offset-4 text-sm font-medium shrink-0"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Tabs (50% width left, under photo/header) */}
          <div className="mt-6 w-1/2">
            <div className="flex items-center gap-10 border-b border-neutral-300">
              <button
                type="button"
                onClick={() => setTab("posts")}
                className={`py-3 text-md font-medium relative ${
                  tab === "posts" ? "text-[#0093DD]" : "text-black"
                }`}
              >
                Your Post
                {tab === "posts" && (
                  <span className="absolute left-0 -bottom-[1px] h-[2px] w-full bg-[#0093DD]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab("password")}
                className={`py-3 text-md font-medium relative ${
                  tab === "password" ? "text-[#0093DD]" : "text-black"
                }`}
              >
                Change Password
                {tab === "password" && (
                  <span className="absolute left-0 -bottom-px h-0.5 w-full bg-[#0093DD]" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mt-6">
            {/* POSTS TAB */}
            {tab === "posts" && (
              <>
                {/* loading/error */}
                {postsLoading && (
                  <p className="text-center text-gray-400 mt-10">
                    Loading your posts...
                  </p>
                )}

                {!postsLoading && postsError && (
                  <div className="mt-10 text-center">
                    <p className="text-red-500 text-sm mb-3">{postsError}</p>
                    <button
                      type="button"
                      onClick={loadPosts}
                      className="px-4 py-2 rounded-full border bg-white hover:bg-gray-50 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!postsLoading && !postsError && !hasPosts && (
                  <div className="mt-12 border border-neutral-200 rounded-2xl p-10 text-center">
                    <p className="text-gray-900 font-semibold">
                      Your writing journey starts here
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      No posts yet, but every great writer starts with the first
                      one.
                    </p>

                    <button
                      type="button"
                      onClick={() => router.push("/write")}
                      className="mt-6 w-[182px] h-[44px] rounded-full bg-[#0093DD] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
                    >
                      <Image
                        src="/write.svg"
                        alt="Write"
                        width={18}
                        height={18}
                      />
                      Write Post
                    </button>
                  </div>
                )}

                {!postsLoading && !postsError && hasPosts && (
                  <>
                    {/* Latest 5 + write post button (right) */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        Latest 5 posts
                      </p>

                      <button
                        type="button"
                        onClick={() => router.push("/write")}
                        className="w-[182px] h-[44px] rounded-full bg-[#0093DD] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
                      >
                        <Image
                          src="/write.svg"
                          alt="Write"
                          width={18}
                          height={18}
                        />
                        Write Post
                      </button>
                    </div>

                    {/* Posts list with image (left 340x258) */}
                    <div className="mt-4 flex flex-col gap-4">
                      {latest5.map((p) => {
                        const img = getPostImage(p as any);

                        return (
                          <Link
                            key={p.id}
                            href={`/posts/${p.id}`}
                            className="block bg-white border border-neutral-300 rounded-2xl p-4 hover:bg-gray-50 transition"
                          >
                            <div className="flex gap-6">
                              {/* image */}
                              <div className="w-[340px] h-[258px] shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-gray-100">
                                {img ? (
                                  <Image
                                    src={img}
                                    alt={p.title || "Post image"}
                                    width={340}
                                    height={258}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                                    No image
                                  </div>
                                )}
                              </div>

                              {/* content */}
                              <div className="flex-1 min-w-0">
                                {/* title */}
                                {p.title && (
                                  <p className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                    {p.title}
                                  </p>
                                )}

                                {/* tags (di bawah judul) */}
                                {Array.isArray((p as any)?.tags) &&
                                  (p as any).tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {(p as any).tags
                                        .slice(0, 3)
                                        .map((t: string) => (
                                          <span
                                            key={t}
                                            className="px-3 py-1 text-xs border border-neutral-300 rounded-xl bg-white text-gray-700"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                    </div>
                                  )}

                                {/* text */}
                                <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">
                                  {(p as any)?.content ||
                                    (p as any)?.description ||
                                    "-"}
                                </p>

                                <p className="text-xs text-gray-500 mt-3">
                                  Created at{" "}
                                  {formatDateTime((p as any)?.createdAt)} | Last
                                  Updated{" "}
                                  {formatDateTime((p as any)?.updatedAt)}
                                </p>

                                {/* actions (desktop - keep same) */}
                                <div className="flex items-center gap-6 mt-4 text-sm">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openStatModal(p);
                                    }}
                                    className="text-[#0093DD] font-medium"
                                  >
                                    Statistic
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      alert("Edit (coming soon)");
                                    }}
                                    className="text-[#0093DD] font-medium"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openDeleteModal(p);
                                    }}
                                    className="text-[#EE1D52] underline font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* PASSWORD TAB (50% width, left) */}
            {tab === "password" && (
              <div className="w-134.5 h-86 bg-white rounded-xl p-4">
                {/* Current Password */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-900">
                    Current Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                      aria-label="Toggle current password"
                    >
                      {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-900">
                    New Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                      aria-label="Toggle new password"
                    >
                      {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-900">
                    Confirm New Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Enter confirm new password"
                      className="w-full rounded-xl border border-neutral-300 px-3 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      disabled={savingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                      aria-label="Toggle confirm password"
                    >
                      {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitChangePassword}
                  disabled={savingPassword}
                  className="w-full bg-[#0093DD] text-white py-3 rounded-full font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== MODALS (KEEP SAME) ===================== */}
      {/* EDIT PROFILE MODAL */}
      {openEdit && (
        <div className="fixed inset-0 z-80">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-start justify-center p-4 pt-20">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
                <p className="text-md font-bold text-gray-900">Edit Profile</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
                  aria-label="Close"
                  disabled={savingProfile}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 py-5">
                <div className="flex justify-center mb-6">
                  <div className="relative w-24 h-24">
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-neutral-300 bg-white">
                      <Image
                        src={avatarSrc}
                        alt="Avatar preview"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      aria-label="Change avatar"
                      disabled={savingProfile}
                      className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center disabled:opacity-60"
                    >
                      <Image
                        src="/editAvatar.svg"
                        alt="Edit avatar"
                        width={24}
                        height={24}
                      />
                    </button>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickAvatar(e.target.files?.[0])}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-900">
                    Name
                  </label>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                    placeholder="Your name"
                    disabled={savingProfile}
                  />
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-900">
                    Profile Headline
                  </label>
                  <input
                    value={draftHeadline}
                    onChange={(e) => setDraftHeadline(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                    placeholder="Frontend Developer"
                    disabled={savingProfile}
                  />
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="w-full bg-[#0093DD] text-white
                   py-3 rounded-full font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
                >
                  {savingProfile ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {openDelete && (
        <div className="fixed inset-0 z-[90]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeDeleteModal}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-start justify-center pt-28 px-4">
            <div
              className="bg-white rounded-2xl shadow-xl border border-neutral-200"
              style={{ width: 345, height: 186 }}
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <p className="text-md font-bold text-gray-900">Delete</p>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 pt-4">
                <p className="text-center text-gray-900 font-medium">
                  Are you sure to delete?
                </p>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="h-10 rounded-full bg-white text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                    style={{ width: 156.5 }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="h-10 rounded-full bg-[#EE1D52] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                    style={{ width: 156.5 }}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATISTIC MODAL (unchanged) */}
      {openStat && (
        <div className="fixed inset-0 z-[95]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeStatModal}
            aria-hidden="true"
          />

          <div className="absolute inset-0 flex items-start justify-center pt-28 px-4">
            <div
              className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
              style={{ width: 345 }}
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <p className="text-md font-bold text-gray-900">Statistic</p>
                <button
                  type="button"
                  onClick={closeStatModal}
                  disabled={statLoading}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 mt-3">
                <div className="flex items-center gap-10 border-b border-neutral-300 justify-center">
                  <button
                    type="button"
                    onClick={() => setStatTab("like")}
                    className={`py-3 text-md font-medium relative flex items-center gap-2 ${
                      statTab === "like" ? "text-[#0093DD]" : "text-black"
                    }`}
                  >
                    <Image src="/like.svg" alt="Like" width={16} height={16} />
                    Like
                    {statTab === "like" && (
                      <span className="absolute left-0 -bottom-[1px] h-[2px] w-full bg-[#0093DD]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatTab("comment")}
                    className={`py-3 text-md font-medium relative flex items-center gap-2 ${
                      statTab === "comment" ? "text-[#0093DD]" : "text-black"
                    }`}
                  >
                    <Image
                      src="/comment.svg"
                      alt="Comment"
                      width={16}
                      height={16}
                    />
                    Comment
                    {statTab === "comment" && (
                      <span className="absolute left-0 -bottom-[1px] h-[2px] w-full bg-[#0093DD]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="px-4 py-4 max-h-[320px] overflow-auto">
                {statError && (
                  <p className="text-sm text-red-500 text-center">
                    {statError}
                  </p>
                )}

                {statLoading && (
                  <p className="text-sm text-gray-400 text-center">
                    Loading...
                  </p>
                )}

                {!statLoading && !statError && statTab === "like" && (
                  <div className="flex flex-col gap-3">
                    {statLikes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No likes yet
                      </p>
                    ) : (
                      statLikes.map((u) => (
                        <div
                          key={String(u.id)}
                          className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3"
                        >
                          <div className="w-9 h-9 rounded-full overflow-hidden border bg-white shrink-0">
                            <Image
                              src={
                                u.avatarUrl?.trim() ? u.avatarUrl : "/icons.svg"
                              }
                              alt={u.name}
                              width={36}
                              height={36}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {u.name}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {!statLoading && !statError && statTab === "comment" && (
                  <div className="flex flex-col gap-3">
                    {statComments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No comments yet
                      </p>
                    ) : (
                      statComments.map((c) => (
                        <div
                          key={String(c.id)}
                          className="border border-neutral-200 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden border bg-white shrink-0">
                              <Image
                                src={
                                  c.avatarUrl?.trim()
                                    ? c.avatarUrl
                                    : "/icons.svg"
                                }
                                alt={c.name}
                                width={36}
                                height={36}
                                className="object-cover w-full h-full"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {c.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDateTimeShort(c.createdAt)}
                              </p>
                            </div>
                          </div>

                          {c.text?.trim() && (
                            <p className="text-sm text-gray-700 mt-2">
                              {c.text}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
