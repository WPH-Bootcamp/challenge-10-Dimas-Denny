"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MobileHeader() {
  const { user, logout } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false); // guest fullscreen menu
  const [search, setSearch] = useState("");

  // avatar dropdown
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarWrapRef = useRef<HTMLDivElement | null>(null);

  // Sync search input with URL on /search (desktop search)
  useEffect(() => {
    if (pathname !== "/search") return;
    const q = searchParams.get("q") || "";
    setSearch(q);
  }, [pathname, searchParams]);

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  // Lock body scroll when guest menu open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!avatarWrapRef.current) return;
      if (!avatarWrapRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [avatarOpen]);

  const goHome = () => router.push("/");

  const goSearch = () => {
    const q = search.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const handleLogout = () => {
    setAvatarOpen(false);
    logout(); // remove token + reset user
    router.push("/");
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-white">
        {/* LOGO */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setAvatarOpen(false);
            goHome();
          }}
          className="flex items-center gap-2"
          aria-label="Go to homepage"
        >
          <Image src="/logo-symbol.svg" alt="Logo" width={22} height={22} />
          <span className="font-semibold">Your Logo</span>
        </button>

        {/* DESKTOP SEARCH (guest only) */}
        {!user && (
          <div className="hidden md:flex flex-1 justify-center px-10">
            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goSearch();
                }}
                placeholder="Search article..."
                className="w-full border rounded-full pl-10 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={goSearch}
                aria-label="Search"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP AUTH (guest only) */}
        {!user && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/auth/login"
              className="px-5 py-2 text-blue-600 font-medium rounded-full hover:bg-blue-50"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        )}

        {/* RIGHT SIDE */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Search icon (tetap ada saat login, di kiri avatar) */}
            <button
              type="button"
              aria-label="Open search"
              onClick={() => {
                setOpen(false);
                setAvatarOpen(false);
                router.push("/search");
              }}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <Search size={22} />
            </button>

            {/* Avatar + dropdown */}
            <div className="relative" ref={avatarWrapRef}>
              <button
                type="button"
                aria-label="Open profile menu"
                onClick={() => setAvatarOpen((v) => !v)}
                className="w-10 h-10 rounded-full overflow-hidden border"
              >
                <Image
                  src="/icons.svg"
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 mt-3 w-48 rounded-xl border bg-white shadow-lg overflow-hidden">
                  <Link
                    href="/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    <Image src="/user.svg" alt="" width={18} height={18} />
                    <span>Profile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    <Image src="/logout.svg" alt="" width={18} height={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MOBILE RIGHT ACTION (guest only) */
          <div className="md:hidden flex items-center gap-4">
            <button
              type="button"
              aria-label="Open search"
              onClick={() => {
                setOpen(false);
                router.push("/search");
              }}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <Search size={22} />
            </button>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        )}
      </header>

      {/* ================= MOBILE FULLSCREEN AUTH MENU (guest only) ================= */}
      {!user && open && (
        <div className="md:hidden fixed inset-0 z-[60] bg-white">
          {/* Overlay header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <Image src="/logo-symbol.svg" alt="Logo" width={22} height={22} />
              <span className="font-semibold">Your Logo</span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Auth buttons under header */}
          <div className="px-6 py-6 flex flex-col gap-4">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-blue-600 font-semibold underline underline-offset-4"
            >
              Login
            </Link>

            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              className="bg-blue-600 text-white py-3 rounded-full text-center font-medium hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
