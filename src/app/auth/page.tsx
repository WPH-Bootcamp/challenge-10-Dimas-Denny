"use client";

import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold mb-6">Welcome 👋</h1>

      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="px-4 py-2 rounded bg-black text-white"
        >
          Login
        </Link>

        <Link href="/auth/register" className="px-4 py-2 rounded border">
          Register
        </Link>
      </div>
    </div>
  );
}
