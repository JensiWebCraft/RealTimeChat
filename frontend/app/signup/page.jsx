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

      router.push(`/verify-otp?email=${form.email}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B141A] flex items-center justify-center px-4 text-white">
      <div className="flex flex-col lg:flex-row items-center gap-16 max-w-5xl w-full">
        {/* LEFT TEXT */}
        <div className="max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            Create Your <span className="text-[#25D366]">Account</span>
          </h1>
          <p className="mt-4 text-[#8696A0] text-lg">
            Join the future of fast, secure realtime messaging.
          </p>
        </div>

        {/* SIGNUP CARD */}
        <div
          className="bg-[#111B21] border border-[#1F2C33]
          shadow-[0_0_40px_rgba(37,211,102,0.15)]
          p-10 rounded-2xl w-[380px]"
        >
          <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

          <div className="flex flex-col space-y-4">
            <input
              className="w-full p-3 bg-[#0B141A] border border-[#1F2C33]
              rounded-lg focus:outline-none
              focus:border-[#25D366]
              focus:shadow-[0_0_12px_rgba(37,211,102,0.25)]
              placeholder-[#8696A0]"
              placeholder="Username"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <input
              className="w-full p-3 bg-[#0B141A] border border-[#1F2C33]
              rounded-lg focus:outline-none
              focus:border-[#25D366]
              focus:shadow-[0_0_12px_rgba(37,211,102,0.25)]
              placeholder-[#8696A0]"
              placeholder="Email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              className="w-full p-3 bg-[#0B141A] border border-[#1F2C33]
              rounded-lg focus:outline-none
              focus:border-[#25D366]
              focus:shadow-[0_0_12px_rgba(37,211,102,0.25)]
              placeholder-[#8696A0]"
              placeholder="Password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`bg-[#005C4B] hover:bg-[#0A7C66]
              p-3 rounded-lg font-semibold transition
              shadow-[0_0_20px_rgba(37,211,102,0.25)]
              hover:shadow-[0_0_30px_rgba(37,211,102,0.45)]
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Sending OTP..." : "Create Account"}
            </button>
          </div>

          <p className="text-[#8696A0] text-center mt-4 text-sm">
            Already have an account?
            <a href="/login" className="text-[#25D366] hover:underline ml-1">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
