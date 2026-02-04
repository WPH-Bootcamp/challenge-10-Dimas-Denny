"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { AxiosError } from "axios";
import { ILoginResponse } from "../types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email wajib diisi";
    }

    if (!password.trim()) {
      newErrors.password = "Password wajib diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    setError("");

    try {
      const res = await api.post<ILoginResponse>("/auth/login", {
        email,
        password,
      });

      await login({
        user: res.data.data.user,
        token: res.data.data.token,
      });

      router.push("/");
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setError(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-neutral-300 rounded-lg p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 mb-4"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold mb-8">Sign In</h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`w-full rounded-md px-3 py-2 mt-1 border
      ${
        errors.email
          ? "border-[#EE1D52] focus:ring-[#EE1D52]"
          : "border-gray-300 focus:border-blue-500"
      }
    `}
            />

            {errors.email && (
              <p className="text-[#EE1D52] text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <label className="text-sm font-medium">Password</label>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`w-full rounded-md px-3 py-2 mt-1 pr-10 border
      ${
        errors.password
          ? "border-[#EE1D52] focus:ring-[#EE1D52]"
          : "border-gray-300 focus:border-blue-500"
      }
    `}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-800"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>

            {errors.password && (
              <p className="text-[#EE1D52] text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded-full mt-4"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="text-blue-600 font-medium hover:underline"
            >
              Register
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
