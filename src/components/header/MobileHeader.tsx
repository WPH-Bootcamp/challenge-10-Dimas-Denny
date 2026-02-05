"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MobileHeader() {
  const { user } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // guest mobile menu
  const [open, setOpen] = useState(false);

  // desktop search query
  const [search, setSearch] = useState("");

  // profile dropdown (desktop + mobile logged-in)
  const [openProfile, setOpenProfile] = useState(false);

  // ✅ FIX: pisahkan ref desktop & mobile (karena md:hidden tetap render di DOM)
  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);

  // Sinkronkan search input dengan URL (?q=...) saat berada di /search
  useEffect(() => {
    if (pathname !== "/search") return;
    const q = searchParams.get("q") || "";
    setSearch(q);
  }, [pathname, searchParams]);

  // Auto close menus ketika pindah halaman
  useEffect(() => {
    setOpen(false);
    setOpenProfile(false);
  }, [pathname]);

  // ✅ Close dropdown saat klik di luar (cek desktopRef & mobileRef)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!openProfile) return;
      const t = e.target as Node;

      const inDesktop =
        desktopDropdownRef.current && desktopDropdownRef.current.contains(t);

      const inMobile =
        mobileDropdownRef.current && mobileDropdownRef.current.contains(t);

      if (!inDesktop && !inMobile) {
        setOpenProfile(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openProfile]);

  const goHome = () => router.push("/");

  const goSearch = () => {
    const q = search.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const doLogout = () => {
    localStorage.removeItem("token");
    setOpenProfile(false);
    router.push("/auth/login");
    router.refresh();
  };

  const displayName = (user as any)?.name || (user as any)?.username || "User";

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* LOGO */}
        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-2"
          aria-label="Go to homepage"
        >
          <Image src="/logo-symbol.svg" alt="Logo" width={22} height={22} />
          <span className="font-semibold">Your Logo</span>
        </button>

        {/* DESKTOP: SEARCH CENTER */}
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
              placeholder="Search"
              className="w-full border border-neutral-300 rounded-full pl-10 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
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

        {/* RIGHT AREA */}
        <div className="flex items-center gap-4">
          {/* DESKTOP (GUEST) */}
          {!user && (
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Login
              </Link>

              <span className="text-neutral-300">|</span>

              <Link
                href="/auth/register"
                className="w-[182px] text-center px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}

          {/* DESKTOP (LOGGED IN) */}
          {user && (
            <div className="hidden md:flex items-center gap-5">
              <button
                type="button"
                onClick={() => router.push("/write")}
                className="flex items-center gap-2 text-[#0093DD] underline underline-offset-4 font-medium hover:opacity-80"
                aria-label="Write Post"
              >
                <Image
                  src="/write-blue.svg"
                  alt="Write"
                  width={18}
                  height={18}
                />
                <span>Write Post</span>
              </button>

              <span className="text-neutral-300">|</span>

              {/* ✅ Desktop dropdown */}
              <div className="relative" ref={desktopDropdownRef}>
                <button
                  type="button"
                  onClick={() => setOpenProfile((v) => !v)}
                  className="flex items-center gap-3"
                  aria-label="Open profile menu"
                >
                  <span className="w-9 h-9 rounded-full overflow-hidden border border-neutral-300 bg-white">
                    <Image
                      src="/icons.svg"
                      alt="Profile"
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  </span>

                  <span className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                    {displayName}
                  </span>
                </button>

                {openProfile && (
                  <div className="absolute right-0 mt-3 w-44 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenProfile(false);
                        router.push("/profile");
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Image
                        src="/user.svg"
                        alt="Profile"
                        width={16}
                        height={16}
                      />
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={doLogout}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Image
                        src="/logout.svg"
                        alt="Logout"
                        width={16}
                        height={16}
                      />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MOBILE RIGHT ACTIONS */}
          <div className="md:hidden flex items-center gap-3">
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
              <>
                <button
                  type="button"
                  aria-label="Open search"
                  onClick={() => router.push("/search")}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <Search size={22} />
                </button>

                {/* ✅ Mobile dropdown */}
                <div className="relative" ref={mobileDropdownRef}>
                  <button
                    type="button"
                    aria-label="Open profile menu"
                    onClick={() => setOpenProfile((v) => !v)}
                    className="w-10 h-10 rounded-full overflow-hidden border border-neutral-300"
                  >
                    <Image
                      src="/icons.svg"
                      alt="Profile"
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </button>

                  {openProfile && (
                    <div className="absolute right-0 mt-3 w-44 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenProfile(false);
                          router.push("/profile");
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Image
                          src="/user.svg"
                          alt="Profile"
                          width={16}
                          height={16}
                        />
                        Profile
                      </button>

                      <button
                        type="button"
                        onClick={doLogout}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Image
                          src="/logout.svg"
                          alt="Logout"
                          width={16}
                          height={16}
                        />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE AUTH MENU (guest) */}
      {!user && open && (
        <div className="md:hidden bg-white border-t border-neutral-200 px-6 py-4 flex flex-col gap-4">
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="text-[#0093DD] underline underline-offset-4 font-medium text-center"
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
      )}
    </header>
  );
}
