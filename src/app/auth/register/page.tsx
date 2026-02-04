"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Errors = {};

    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Those passwords didn't match. Try again.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      router.push("/auth/login");
    } catch (err: any) {
      alert(err.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (error?: string) =>
    `w-full rounded-md px-3 py-2 mt-1 border focus:outline-none
     ${error ? "border-[#EE1D52]" : "border-gray-300"}`;

  const errorText = (msg?: string) =>
    msg && <p className="text-[#EE1D52] text-xs mt-1">{msg}</p>;

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

        <h1 className="text-2xl font-bold mb-6">Register</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: undefined }));
              }}
              className={inputClass(errors.name)}
            />
            {errorText(errors.name)}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              className={inputClass(errors.email)}
            />
            {errorText(errors.email)}
          </div>

          {/* Password */}
          <div className="relative">
            <label className="text-sm font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              className={`${inputClass(errors.password)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            {errorText(errors.password)}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              className={`${inputClass(errors.confirmPassword)} pr-10`}
            />

            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-800"
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>

            {errorText(errors.confirmPassword)}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded-full mt-4 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/auth/login")}
              className="text-blue-600 hover:underline"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
