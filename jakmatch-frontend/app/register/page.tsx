'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getValidSession } from "@/app/lib/session";
import {
  registerWithEmail,
  validateEmailRule,
  validatePasswordRule,
} from "@/app/lib/auth";
import PasswordLengthMeter from "@/app/components/PasswordLengthMeter";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RegisterPage() {
  const router = useRouter();

  // State Form Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // State Interaktivitas UI/UX
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "email" | "password" | "confirmPassword" | null
  >(null);

  // Status kelayakan tombol Sign Up (aktif hanya ketika password >= 12 karakter & konfirmasi cocok)
  const isPasswordValid = validatePasswordRule(password) === null;
  const isConfirmValid =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmitRegister =
    email.trim().length > 0 && isPasswordValid && isConfirmValid;

  useEffect(() => {
    if (getValidSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const emailError = validateEmailRule(email);
    if (emailError) {
      setErrorMsg(emailError);
      return;
    }

    const passwordError = validatePasswordRule(password);
    if (passwordError) {
      setErrorMsg(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok dengan password Anda.");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mendaftarkan akun."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`${inter.className} relative min-h-dvh w-full flex flex-col justify-between overflow-x-hidden overflow-y-auto select-none`}
    >
      {/* 1. BACKGROUND AWAN & GARIS LINGKARAN */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/assets/bg-login.jpeg"
          alt="Register Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* 2. HEADER LOGO JAKMATCH (Kiri Atas - Responsif & Selaras dengan Login) */}
      <header className="w-full px-5 sm:px-10 pt-5 pb-2 sm:py-6 z-20 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Image
            src="/assets/logo-jakmatch.png"
            alt="Logo Jakmatch"
            width={34}
            height={34}
            className="object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-lg sm:text-xl tracking-tight font-semibold text-white drop-shadow-md">
            <span className="text-[#297add]">Jak</span>Match
          </span>
        </Link>
      </header>

      {/* 3. WRAPPER TENGAH UNTUK CARD REGISTER UTAMA */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] rounded-[28px] bg-gradient-to-b from-[#B5F2FF] via-[#E8FAFF] to-[#FFFFFF] px-6 sm:px-9 py-8 sm:py-9 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/75 flex flex-col items-center text-center"
        >
          {/* Ikon Pintu dengan Radius Lengkung (Squircle) */}
          <motion.div
            whileHover={{ scale: 1.06, rotate: -3 }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-[18px] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-center mb-5 overflow-hidden"
          >
            <Image
              src="/assets/icon-door.jpeg"
              alt="Sign Up Icon"
              width={30}
              height={30}
              className="object-contain rounded-lg mix-blend-multiply"
            />
          </motion.div>

          {/* Judul & Deskripsi */}
          <h1 className="text-[22px] sm:text-2xl font-bold text-[#111111] tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs sm:text-[13px] text-neutral-500 leading-relaxed mt-2 max-w-[300px]">
            We provide this platform for those of
            <br className="hidden xs:inline" /> you who are struggling to find a
            comfortable place to live.
          </p>

          {/* Notifikasi Error Interaktif */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="w-full overflow-hidden"
              >
                <div
                  role="alert"
                  className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium flex items-start gap-2 border bg-rose-50/95 text-rose-700 border-rose-200"
                >
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM INPUT REGISTER */}
          <form onSubmit={handleRegister} className="w-full mt-6 space-y-3">
            {/* Input Email */}
            <div className="relative flex items-center w-full">
              <div
                className={`absolute left-3.5 pointer-events-none flex items-center transition-opacity duration-200 ${
                  focusedField === "email" ? "opacity-100" : "opacity-60"
                }`}
              >
                <Image
                  src="/assets/icon-email.png"
                  alt="Email Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg bg-[#EAEAEA]/90 hover:bg-[#E2E2E2]/90 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#2B2B33]/20 transition-all"
              />
            </div>

            {/* Input Password + Toggle Show/Hide */}
            <div className="relative flex items-center w-full">
              <div
                className={`absolute left-3.5 pointer-events-none flex items-center transition-opacity duration-200 ${
                  focusedField === "password" ? "opacity-100" : "opacity-60"
                }`}
              >
                <Image
                  src="/assets/icon-lock.png"
                  alt="Password Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 12 karakter)"
                className={`w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg bg-[#EAEAEA]/90 hover:bg-[#E2E2E2]/90 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                  password.length > 0 && isPasswordValid
                    ? "focus:ring-emerald-500/30 ring-1 ring-emerald-500/40"
                    : "focus:ring-[#2B2B33]/20"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 p-1 text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Input Confirm Password + Toggle Show/Hide */}
            <div className="relative flex items-center w-full">
              <div
                className={`absolute left-3.5 pointer-events-none flex items-center transition-opacity duration-200 ${
                  focusedField === "confirmPassword"
                    ? "opacity-100"
                    : "opacity-60"
                }`}
              >
                <Image
                  src="/assets/icon-lock.png"
                  alt="Confirm Password Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                value={confirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className={`w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg bg-[#EAEAEA]/90 hover:bg-[#E2E2E2]/90 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? "focus:ring-rose-400/40 ring-1 ring-rose-400/50"
                    : confirmPassword.length > 0 && password === confirmPassword
                      ? "focus:ring-emerald-500/30 ring-1 ring-emerald-500/40"
                      : "focus:ring-[#2B2B33]/20"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute right-3 p-1 text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
              >
                {showConfirmPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Fitur Pendeteksi (Slider) Jumlah Karakter Password & Kecocokan Konfirmasi */}
            <PasswordLengthMeter
              password={password}
              minLength={12}
              confirmPassword={confirmPassword}
              showConfirmStatus
            />

            {/* Button Sign Up (#2B2B33) - Hanya aktif setelah password >= 12 karakter & konfirmasi cocok */}
            <button
              type="submit"
              disabled={!canSubmitRegister || loading}
              className="w-full py-2.5 sm:py-3 mt-2 rounded-lg bg-[#2B2B33] hover:bg-[#1f1f26] disabled:bg-neutral-400/70 disabled:text-white/85 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.99] text-white text-xs sm:text-sm font-medium tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Sign Up</span>
              )}
            </button>
          </form>

          {/* Tautan ke Halaman Login */}
          <p className="mt-5 text-[11px] sm:text-xs text-neutral-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#111111] hover:underline"
            >
              Log In
            </Link>
          </p>
        </motion.div>
      </div>

      {/* 4. FOOTER & SPACER BAWAH */}
      <footer className="w-full py-3 px-4 text-center text-[11px] text-neutral-500/80 z-10">
        © 2026 JakMatch — Smart Location Intelligence DKI Jakarta
      </footer>

      <div className="h-4 sm:h-8 pointer-events-none" />
    </main>
  );
}
