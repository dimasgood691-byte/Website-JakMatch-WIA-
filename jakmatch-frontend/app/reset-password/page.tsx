"use client";

import React, { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { clearSession } from "@/app/lib/session";
import {
  AuthError,
  confirmPasswordReset,
  validatePasswordRule,
} from "@/app/lib/auth";
import PasswordLengthMeter from "@/app/components/PasswordLengthMeter";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "password" | "confirmPassword" | null
  >(null);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isPasswordValid = validatePasswordRule(password) === null;
  const isConfirmValid =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmitReset = isPasswordValid && isConfirmValid;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const token =
      new URLSearchParams(window.location.search).get("token") || "";
    if (!token) {
      setMessage("Tautan reset tidak valid atau sudah kedaluwarsa.");
      return;
    }

    const passwordError = validatePasswordRule(password);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await confirmPasswordReset(token, password);
      window.history.replaceState(null, "", window.location.pathname);
      setIsSuccess(true);
      setMessage(data.message || "Password berhasil diperbarui.");
      await clearSession();
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof AuthError && err.status === 400) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      setMessage(
        err instanceof Error
          ? err.message
          : "Tidak dapat terhubung ke server. Silakan coba kembali."
      );
    } finally {
      setIsLoading(false);
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
          alt="Reset Password Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* 2. HEADER LOGO JAKMATCH */}
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

      {/* 3. CARD RESET PASSWORD */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6 z-10">
        <motion.section
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] rounded-[28px] bg-gradient-to-b from-[#B5F2FF] via-[#E8FAFF] to-[#FFFFFF] px-6 sm:px-9 py-8 sm:py-9 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/75 flex flex-col items-center text-center"
        >
          <motion.div
            whileHover={{ scale: 1.06, rotate: -3 }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-[18px] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-center mb-5 overflow-hidden"
          >
            <Image
              src="/assets/icon-door.jpeg"
              alt="Reset Password Icon"
              width={30}
              height={30}
              className="object-contain rounded-lg mix-blend-multiply"
            />
          </motion.div>

          <h1 className="text-[22px] sm:text-2xl font-bold text-[#111111] tracking-tight">
            Atur Ulang Password
          </h1>
          <p className="text-xs sm:text-[13px] text-neutral-500 leading-relaxed mt-2 max-w-[300px]">
            Buat password baru (min. 12 karakter). Tautan reset hanya berlaku
            sekali selama 15 menit.
          </p>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="w-full overflow-hidden"
              >
                <p
                  role="status"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium border ${
                    isSuccess
                      ? "bg-emerald-50/95 text-emerald-800 border-emerald-200"
                      : "bg-rose-50/95 text-rose-700 border-rose-200"
                  }`}
                >
                  {message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isSuccess && (
            <form onSubmit={handleSubmit} className="w-full mt-6 space-y-3">
              {/* Password Baru */}
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
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={72}
                  value={password}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password baru (min. 12 karakter)"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg bg-[#EAEAEA]/90 hover:bg-[#E2E2E2]/90 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#2B2B33]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 p-1 text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Konfirmasi Password Baru */}
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
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={72}
                  value={confirmPassword}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Konfirmasi password baru"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg bg-[#EAEAEA]/90 hover:bg-[#E2E2E2]/90 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#2B2B33]/20 transition-all"
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
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Slider Penghitung 12 Karakter & Konfirmasi */}
              <PasswordLengthMeter
                password={password}
                minLength={12}
                confirmPassword={confirmPassword}
                showConfirmStatus
              />

              <button
                type="submit"
                disabled={!canSubmitReset || isLoading}
                className="w-full py-2.5 sm:py-3 mt-2 rounded-lg bg-[#2B2B33] hover:bg-[#1f1f26] disabled:bg-neutral-400/70 disabled:text-white/85 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.99] text-white text-xs sm:text-sm font-medium tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Simpan Password Baru</span>
                )}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-5 text-xs font-bold text-[#111111] hover:underline"
          >
            ← Kembali ke Login
          </Link>
        </motion.section>
      </div>

      {/* 4. FOOTER & SPACER BAWAH */}
      <footer className="w-full py-3 px-4 text-center text-[11px] text-neutral-500/80 z-10">
        © 2026 JakMatch — Smart Location Intelligence DKI Jakarta
      </footer>

      <div className="h-4 sm:h-8 pointer-events-none" />
    </main>
  );
}
