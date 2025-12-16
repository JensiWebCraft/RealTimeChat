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

  // ✅ Verify OTP
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
        setSuccess(data.message || "Email verified successfully");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP
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
      setError("Network error. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b141a] to-[#111b21] flex items-center justify-center px-4 text-white ">
      <div className="bg-[#111B21] border border-[#1F2C33] rounded-2xl p-10  max-w-md w-full  shadow-[0_0_40px_rgba(37,211,102,0.15)]">
        <h2 className="text-3xl font-bold text-center mb-6 text-[#25D366]">
          Verify Your Email
        </h2>

        <p className="text-gray-300 text-center mb-8">
          We sent a 6-digit OTP to{" "}
          <span className="font-semibold text-[#25D366]">{email}</span>
        </p>

        <input
          className="w-full p-4 text-center text-2xl tracking-widest bg-[#0B141A] border border-[#1F2C33] rounded-lg focus:outline-none focus:border-[#25D366]"
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
          <p className="text-[#25D366] text-center mt-4">{success}</p>
        )}

        <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-full mt-6 bg-[#25D366] hover:bg-[#1EBE5D] disabled:opacity-70 p-4 rounded-lg font-semibold transition text-black"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="text-center mt-6">
          <p className="text-gray-400">
            Didn't receive the code?{" "}
            <button
              onClick={resendOtp}
              disabled={resendLoading}
              className="text-[#25D366] hover:underline font-medium"
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
