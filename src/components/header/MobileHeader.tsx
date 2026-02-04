"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MobileHeader() {
  const { user } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Sinkronkan search input dengan URL (?q=...) saat berada di /search
  useEffect(() => {
    if (pathname !== "/search") return;
    const q = searchParams.get("q") || "";
    setSearch(q);
  }, [pathname, searchParams]);

  // Auto close mobile menu ketika pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const goHome = () => router.push("/");

  const goSearch = () => {
    const q = search.trim();
    // kalau kosong, tetap arahkan ke /search biar user bisa mulai ngetik
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-white">
        {/* LOGO */}
        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-2 cursor-pointer"
          aria-label="Go to homepage"
        >
          <Image src="/logo-symbol.svg" alt="Logo" width={22} height={22} />
          <span className="font-semibold">Your Logo</span>
        </button>

        {/* DESKTOP SEARCH */}
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
              <Search size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* DESKTOP AUTH */}
        {!user && (
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/auth/login"
              className="text-blue-600 font-medium hover:underline"
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

        {/* MOBILE RIGHT ACTION */}
        <div className="md:hidden flex items-center gap-4">
          {!user ? (
            <>
              <button
                type="button"
                aria-label="Open search"
                onClick={() => router.push("/search")}
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
            </>
          ) : (
            <button
              type="button"
              aria-label="Go to profile"
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border"
            >
              <Image
                src="/icons.svg"
                alt="Profile"
                width={40}
                height={40}
                className="object-cover"
              />
            </button>
          )}
        </div>
      </header>

      {/* ================= MOBILE AUTH MENU ================= */}
      {!user && open && (
        <div className="md:hidden bg-white px-6 py-6 flex flex-col gap-4 border-b">
          <Link
            href="/auth/login"
            className="text-blue-600 font-semibold"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>

          <Link
            href="/auth/register"
            className="bg-blue-600 text-white py-3 rounded-full text-center font-medium hover:bg-blue-700"
            onClick={() => setOpen(false)}
          >
            Register
          </Link>
        </div>
      )}
    </>
  );
}
