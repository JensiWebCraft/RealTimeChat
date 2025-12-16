"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { backendUrl } from "../utils/api";

export default function VerifyOtpClient() {
  const params = useSearchParams();
  const email = params.get("email");
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // 🔹 Verify OTP
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${backendUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok && data.message !== "Email already verified") {
        setError(data.message || "Verification failed");
      } else {
        setSuccess(data.message);
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Resend OTP
  const resendOtp = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${backendUrl}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("New OTP sent! Check your email.");
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1d] to-[#0f172a] flex items-center justify-center px-4">
      <div className="bg-[#111827] border border-gray-700 rounded-2xl p-10 shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-6">
          Verify Your Email
        </h2>

        <p className="text-gray-300 text-center mb-8">
          We sent a 6-digit OTP to{" "}
          <span className="font-semibold">{email}</span>
        </p>

        <input
          className="w-full p-4 text-center text-2xl tracking-widest bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="------"
          maxLength={6}
          disabled={loading}
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />

        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        {success && (
          <p className="text-green-400 text-center mt-4">{success}</p>
        )}

        <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 p-4 rounded-lg font-semibold transition"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="text-center mt-6">
          <p className="text-gray-400">
            Didn't receive the code?{" "}
            <button
              onClick={resendOtp}
              disabled={resendLoading}
              className="text-blue-400 hover:underline font-medium"
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
