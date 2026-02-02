"use client";

import Image from "next/image";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MobileHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        {/* LOGO */}
        <div className="flex items-center">
          <Image
            src="/logo-symbol.svg"
            alt="Blog App Logo"
            width={20}
            height={22}
            priority
          />
          <span className="text-base font-semibold px-2">Your Logo</span>
        </div>

        {/* ===== MOBILE ===== */}
        <div className="flex items-center gap-3 md:hidden">
          {!user && (
            <>
              {!open && (
                <button className="p-2">
                  <Search size={22} strokeWidth={2.8} />
                </button>
              )}

              <button className="p-2" onClick={() => setOpen(!open)}>
                {open ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          )}

          {user && (
            <Image
              src={user.avatar || "/default-avatar.png"}
              alt={user.username}
              width={36}
              height={36}
              className="rounded-full border"
            />
          )}
        </div>

        {/* ===== DESKTOP ===== */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          {!user && (
            <div className="relative w-96">
              {/* MAGNIFIER */}
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              {/* INPUT */}
              <input
                type="text"
                placeholder="Search"
                className="
          w-full
          pl-11
          pr-4
          py-2
          border
          rounded-full
          outline-none
          text-sm
          placeholder:text-gray-400
          focus:ring-1
          focus:ring-[#0093DD]
        "
              />
            </div>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-4">
          {!user && (
            <>
              <button
                onClick={() => router.push("/auth/login")}
                className="text-[#0093DD] font-semibold text-base cursor-pointer hover:underline"
              >
                Login
              </button>
              <span className="text-gray-400 select-none">|</span>
              <button
                onClick={() => router.push("/auth/register")}
                className="w-45.5 max-w-xs py-3 text-white font-semibold rounded-full cursor-pointer"
                style={{ backgroundColor: "#0093DD" }}
              >
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ===== MOBILE AUTH SECTION ===== */}
      {!user && open && (
        <div className="md:hidden bg-white px-6 py-10 flex flex-col items-center gap-4">
          {/* LOGIN */}
          <button
            onClick={() => router.push("/auth/login")}
            className="text-[#0093DD] font-semibold text-base cursor-pointer hover:underline"
          >
            Login
          </button>

          {/* REGISTER */}
          <button
            onClick={() => router.push("/auth/register")}
            className="w-full max-w-xs py-3 text-white font-semibold rounded-full cursor-pointer"
            style={{ backgroundColor: "#0093DD" }}
          >
            Register
          </button>
        </div>
      )}
    </>
  );
}
