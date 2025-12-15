"use client";

import { useState } from "react";
import { backendUrl } from "../utils/api";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!form.username || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // ✅ OTP sent → redirect to verify page
      router.push(`/verify-otp?email=${form.email}`);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1d] to-[#0f172a] text-white flex items-center justify-center px-4">
      <div className="flex flex-col lg:flex-row items-center gap-16 max-w-5xl">
        <div className="text-left max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            Create Your <span className="text-blue-500">Account</span>
          </h1>
          <p className="mt-4 text-gray-300 text-lg">
            Join the future of real-time messaging and productive collaboration.
          </p>
        </div>

        <div className="bg-[#111827] border border-gray-700 shadow-xl shadow-blue-900/20 p-10 rounded-2xl w-[380px]">
          <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

          <div className="flex flex-col space-y-4">
            <input
              className="w-full p-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Username"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <input
              className="w-full p-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="w-full p-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              type="password"
              placeholder="Password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              className={`bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Create Account"}
            </button>
          </div>

          <p className="text-gray-400 text-center mt-4 text-sm">
            Already have an account?
            <a href="/login" className="text-blue-400 hover:underline ml-1">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
