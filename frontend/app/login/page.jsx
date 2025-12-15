"use client";

import { useState } from "react";
import { backendUrl } from "../utils/api";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.identifier || !form.password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(data.message || "Invalid credentials");
        return;
      }

      // Save token & username
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem("username", data.user.username);

      router.replace("/dashboard");
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
            Welcome to <span className="text-[#25D366]">Realtime Chat</span>
          </h1>
          <p className="mt-4 text-[#8696A0] text-lg">
            Fast, secure and realtime private messaging.
          </p>
        </div>

        {/* LOGIN CARD */}
        <div
          className="bg-[#111B21] border border-[#1F2C33]
        shadow-[0_0_40px_rgba(37,211,102,0.15)]
        p-10 rounded-2xl w-[380px]"
        >
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          <div className="flex flex-col space-y-4">
            <input
              className="w-full p-3 bg-[#0B141A] border border-[#1F2C33]
              rounded-lg focus:outline-none
              focus:border-[#25D366]
              focus:shadow-[0_0_12px_rgba(37,211,102,0.25)]
              placeholder-[#8696A0]"
              placeholder="Username or Email"
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
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

            {/* LOGIN BUTTON */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`bg-[#005C4B] hover:bg-[#0A7C66]
              p-3 rounded-lg font-semibold transition
              shadow-[0_0_20px_rgba(37,211,102,0.25)]
              hover:shadow-[0_0_30px_rgba(37,211,102,0.45)]
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          <p className="text-[#8696A0] text-center mt-4 text-sm">
            Don’t have an account?
            <a href="/signup" className="text-[#25D366] hover:underline ml-1">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
