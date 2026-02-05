"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/profile";
import MobileHeader from "@/components/header/MobileHeader";
import Link from "next/link";
import { getMyPosts, type MyPost } from "@/lib/writePost";

const LS_PROFILE_KEY = "profile_v2";

type LocalProfile = {
  name: string;
  headline: string;
  avatarUrl?: string;
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

function readLocalProfile(fallbackName: string): LocalProfile {
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

type TabKey = "posts" | "password";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");

  const fallbackName = useMemo(() => {
    return (user as any)?.name || (user as any)?.username || "User";
  }, [user]);

  const userId = useMemo(() => {
    const raw = (user as any)?.id ?? (user as any)?.userId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [user]);

  const [profile, setProfile] = useState<LocalProfile>({
    name: fallbackName,
    headline: "Frontend Developer",
    avatarUrl: "",
  });

  const [openEdit, setOpenEdit] = useState(false);

  // modal draft states
  const [draftName, setDraftName] = useState("");
  const [draftHeadline, setDraftHeadline] = useState("");
  const [draftAvatarPreview, setDraftAvatarPreview] = useState<string>("");
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Tabs
  const [tab, setTab] = useState<TabKey>("posts");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);

  // Protect route
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  // Load local cached profile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = readLocalProfile(fallbackName);
    setProfile(p);
  }, [fallbackName]);

  const loadPosts = async () => {
    if (userId == null) return;

    try {
      setPostsLoading(true);
      setPostsError("");

      const data = await getMyPosts(userId);

      const mapped: MyPost[] = (Array.isArray(data) ? data : []).map(
        (it: any) => ({
          id: it.id,
          title: it.title,
          content: it.content ?? it.description ?? "",
          description: it.description ?? it.content ?? "",
          tags:
            it.tags ??
            (it.categories ? it.categories.map((c: any) => c?.name) : []),
          categories: it.categories ?? [],
          createdAt: it.createdAt,
          updatedAt: it.updatedAt ?? it.createdAt,
        }),
      );

      mapped.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      setMyPosts(mapped);
    } catch (err: any) {
      console.warn(
        "GET MY POSTS fallback to empty:",
        err?.response?.status,
        err?.response?.data,
      );

      // anggap user belum punya post
      setMyPosts([]);
      setPostsError("");
    } finally {
      setPostsLoading(false);
    }
  };

  // fetch once when user ready
  useEffect(() => {
    if (!user) return;
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  const submitChangePassword = async () => {
    if (!currentPassword.trim()) {
      alert("Current password is required");
      return;
    }
    if (!newPassword.trim()) {
      alert("New password is required");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Confirm password doesn't match");
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  const hasPosts = !postsLoading && !postsError && myPosts.length > 0;

  return (
    <>
      <MobileHeader />

      <div className="min-h-screen bg-gray-50">
        {/* ======= TOP PROFILE HEADER ======= */}
        <div className="bg-white border border-neutral-300 rounded-xl mx-4 mt-4 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border bg-white shrink-0">
                <Image
                  src={
                    profile.avatarUrl?.trim() ? profile.avatarUrl : "/icons.svg"
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
              className="text-[#0093DD] underline underline-offset-4 text-sm font-medium shrink-0"
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

          {/* ✅ Tombol di atas hanya kalau SUDAH ADA POST */}
          {tab === "posts" && hasPosts && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => router.push("/write")}
                className="bg-[#0093DD] text-white rounded-full w-60 justify-center px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
              >
                <Image src="/write.svg" alt="Write" width={18} height={18} />
                Write Post
              </button>
            </div>
          )}
        </div>

        {/* ======= TAB CONTENT ======= */}
        <div className="px-4 py-8">
          {/* === YOUR POST TAB === */}
          {tab === "posts" && (
            <div className="mt-6">
              {/* Loading */}
              {postsLoading && (
                <p className="text-gray-400 text-center">
                  Loading your posts...
                </p>
              )}

              {/* Error */}
              {!postsLoading && postsError && (
                <div className="text-center">
                  <p className="text-red-500">{postsError}</p>
                  <button
                    type="button"
                    onClick={loadPosts}
                    className="mt-4 text-sm underline text-[#0093DD]"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* ✅ EMPTY STATE = hanya noPost + teks + tombol di bawah */}
              {!postsLoading && !postsError && myPosts.length === 0 && (
                <div className="flex flex-col items-center text-center mt-60">
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

                  <p className="text-sm text-gray-500 max-w-xs mb-6">
                    No posts yet, but every great writer starts with the first
                    one.
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/write")}
                    className="bg-[#0093DD] text-white rounded-full w-60 justify-center px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
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

              {/* ✅ LIST jika ada posts */}
              {!postsLoading && !postsError && myPosts.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-300 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-900">
                      Latest 5 posts
                    </p>
                    <button
                      type="button"
                      onClick={loadPosts}
                      className="text-xs text-[#0093DD] underline"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {myPosts.slice(0, 5).map((p) => {
                      const tags = (p.tags ?? []).filter(Boolean).slice(0, 3);
                      const content = p.content ?? p.description ?? "-";

                      return (
                        <div
                          key={p.id}
                          className="border-b border-neutral-200 pb-4 last:border-b-0 last:pb-0"
                        >
                          {/* Tags */}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className="px-3 py-1 text-xs border border-neutral-300 rounded-xl bg-white text-gray-700"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Content */}
                          <Link href={`/posts/${p.id}`} className="block">
                            <p className="text-sm text-gray-800 whitespace-pre-line">
                              {content}
                            </p>
                          </Link>

                          {/* Dates */}
                          <p className="text-xs text-gray-500 mt-3">
                            Created at {formatDateTime(p.createdAt)} | Last
                            Updated {formatDateTime(p.updatedAt)}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-5 mt-3 text-sm">
                            <button
                              type="button"
                              onClick={() => alert("Statistic (coming soon)")}
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
                              onClick={() => alert("Delete (coming soon)")}
                              className="text-[#EE1D52] underline font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === CHANGE PASSWORD TAB === */}
          {tab === "password" && (
            <div className="bg-white rounded-xl p-4">
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

        {/* ======= EDIT PROFILE MODAL ======= */}
        {openEdit && (
          <div className="fixed inset-0 z-[80]">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={closeModal}
              aria-hidden="true"
            />

            <div className="absolute inset-0 flex items-start justify-center p-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
                  <p className="text-md font-bold text-gray-900">
                    Edit Profile
                  </p>
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
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border bg-white">
                      <Image
                        src={avatarSrc}
                        alt="Avatar preview"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />

                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white border border-neutral-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-60"
                        aria-label="Change avatar"
                        disabled={savingProfile}
                      >
                        <Image
                          src="/editAvatar.svg"
                          alt="Edit avatar"
                          width={18}
                          height={18}
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
                    className="w-full bg-blue-300 text-gray-900 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
                  >
                    {savingProfile ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
