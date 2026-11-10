'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { clearSession, getValidSession } from "@/app/lib/session";
import {
  loginWithEmail,
  loginWithGooglePopup,
  requestPasswordReset,
  validateEmailRule,
  validatePasswordRule,
  verifyServerSession,
} from "@/app/lib/auth";
import PasswordLengthMeter from "@/app/components/PasswordLengthMeter";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// 42 Kotak Visualisasi Kecamatan DKI Jakarta (7 kolom x 6 baris = 42 kecamatan)
// Selaras dengan warna aksen Dashboard (#CDFC56 & #0773BC)
const HEATMAP_TILES: {
  id: number;
  name: string;
  score: string;
  level: 1 | 2 | 3 | 4 | "top";
}[] = [
  { id: 1, name: "Jagakarsa", score: "81.4", level: 2 },
  { id: 2, name: "Pasar Minggu", score: "84.0", level: 2 },
  { id: 3, name: "Cilandak", score: "87.2", level: 3 },
  { id: 4, name: "Tebet", score: "86.5", level: 2 },
  { id: 5, name: "Setiabudi", score: "90.1", level: 4 },
  { id: 6, name: "Kebayoran Lama", score: "83.8", level: 2 },
  { id: 7, name: "Pesanggrahan", score: "80.2", level: 1 },

  { id: 8, name: "Pancoran", score: "84.6", level: 2 },
  { id: 9, name: "Kebayoran Baru", score: "90.8", level: 4 },
  { id: 10, name: "Mampang Prapatan", score: "82.5", level: 2 },
  { id: 11, name: "Gambir", score: "89.4", level: 3 },
  { id: 12, name: "Tanah Abang", score: "85.2", level: 3 },
  { id: 13, name: "Senen", score: "85.9", level: 2 },
  { id: 14, name: "Kemayoran", score: "82.7", level: 2 },

  { id: 15, name: "Cempaka Putih", score: "86.8", level: 3 },
  { id: 16, name: "Sawah Besar", score: "83.1", level: 2 },
  { id: 17, name: "Johar Baru", score: "79.5", level: 1 },
  { id: 18, name: "Menteng", score: "92.2", level: "top" },
  { id: 19, name: "Matraman", score: "84.1", level: 2 },
  { id: 20, name: "Pulo Gadung", score: "84.3", level: 2 },
  { id: 21, name: "Jatinegara", score: "83.0", level: 3 },

  { id: 22, name: "Duren Sawit", score: "81.2", level: 2 },
  { id: 23, name: "Kramat Jati", score: "82.4", level: 3 },
  { id: 24, name: "Makasar", score: "80.9", level: 2 },
  { id: 25, name: "Ciracas", score: "82.1", level: 2 },
  { id: 26, name: "Pasar Rebo", score: "81.8", level: 3 },
  { id: 27, name: "Cipayung", score: "83.4", level: 1 },
  { id: 28, name: "Cakung", score: "78.6", level: 2 },

  { id: 29, name: "Grogol Petamburan", score: "84.8", level: 2 },
  { id: 30, name: "Kembangan", score: "86.0", level: 3 },
  { id: 31, name: "Kebon Jeruk", score: "83.5", level: 3 },
  { id: 32, name: "Palmerah", score: "81.7", level: 2 },
  { id: 33, name: "Taman Sari", score: "80.4", level: 2 },
  { id: 34, name: "Tambora", score: "77.2", level: 2 },
  { id: 35, name: "Cengkareng", score: "77.9", level: 1 },

  { id: 36, name: "Kalideres", score: "76.8", level: 1 },
  { id: 37, name: "Kelapa Gading", score: "86.4", level: 3 },
  { id: 38, name: "Penjaringan", score: "82.3", level: 3 },
  { id: 39, name: "Pademangan", score: "81.1", level: 2 },
  { id: 40, name: "Tanjung Priok", score: "79.8", level: 2 },
  { id: 41, name: "Koja", score: "77.5", level: 1 },
  { id: 42, name: "Cilincing", score: "75.6", level: 3 },
];

function getTileColorClass(level: 1 | 2 | 3 | 4 | "top"): string {
  if (level === "top") {
    return "bg-[#CDFC56] text-[#0B1526] shadow-[0_8px_24px_rgba(205,252,86,0.38)]";
  }
  if (level === 4) return "bg-white/45 hover:bg-white/55 text-white";
  if (level === 3) return "bg-white/30 hover:bg-white/40 text-white";
  if (level === 2) return "bg-white/20 hover:bg-white/30 text-white";
  return "bg-white/12 hover:bg-white/22 text-white";
}

export default function LoginPage() {
  const router = useRouter();

  // State Form Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);

  // State Loading & Feedback Interaktif
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  // Status kelayakan tombol Submit berdasarkan panjang password (minimal 12 karakter)
  const isPasswordValid = validatePasswordRule(password) === null;
  const canSubmitLogin = isForgotOpen
    ? email.trim().length > 0
    : email.trim().length > 0 && isPasswordValid;

  // Cek sesi aktif 48 jam: verifikasi ke server, jika masih berlaku langsung arahkan ke /dashboard
  useEffect(() => {
    const session = getValidSession();
    if (!session) return;

    let cancelled = false;
    verifyServerSession(session).then((status) => {
      if (cancelled) return;
      if (status === "unauthorized") {
        void clearSession();
      } else {
        router.replace("/dashboard");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Handler Login dengan Email & Password (serta Mode Forgot Password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const emailError = validateEmailRule(email);
    if (emailError) {
      setFeedback({ type: "error", message: emailError });
      return;
    }

    if (isForgotOpen) {
      setIsLoading(true);
      try {
        const res = await requestPasswordReset(email);
        setFeedback({
          type: "success",
          message:
            res.message ||
            "Jika alamat email terdaftar, tautan reset kata sandi akan dikirim.",
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Gagal mengirim tautan pemulihan kata sandi.",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const passwordError = validatePasswordRule(password);
    if (passwordError) {
      setFeedback({ type: "error", message: passwordError });
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginWithEmail(email, password);
      setFeedback({
        type: "success",
        message: data.message || "Berhasil masuk ke Dashboard JakMatch!",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Email atau kata sandi yang Anda masukkan salah.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Login dengan Google (Firebase Popup -> Backend Verification)
  const handleGoogleSignIn = async () => {
    setFeedback(null);
    setIsGoogleLoading(true);

    try {
      const data = await loginWithGooglePopup();
      if (data) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Gagal masuk menggunakan Google. Silakan coba lagi.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const activeTileInfo =
    HEATMAP_TILES.find((t) => t.id === hoveredTile) ||
    HEATMAP_TILES.find((t) => t.level === "top")!;

  return (
    <main
      className={`${inter.className} min-h-dvh w-full flex flex-col lg:flex-row bg-gradient-to-b from-[#0773BC] via-[#2B95DC] to-[#81D8FF] lg:bg-none lg:bg-[#F8FAFC] text-[#0B1526] select-none overflow-x-hidden`}
    >
      {/* ===================================================================== */}
      {/* PANEL KIRI: KHUSUS DESKTOP (lg:flex) - TEMA GRADASI BIRU DASHBOARD    */}
      {/* ===================================================================== */}
      <section className="hidden lg:flex lg:w-[50%] xl:w-[55%] min-h-dvh bg-gradient-to-b from-[#0773BC] via-[#1B86D0] to-[#2B95DC] text-white px-8 lg:px-12 xl:px-16 py-10 xl:py-12 flex-col justify-between relative overflow-hidden shrink-0">
        {/* Baris Logo JakMatch Kiri Atas */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group focus:outline-none"
          >
            <Image
              src="/assets/logo-jakmatch.png"
              alt="Logo JakMatch"
              width={44}
              height={44}
              className="rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-extrabold tracking-tight text-white">
              JakMatch
            </span>
          </Link>

          {/* Headline Utama disesuaikan responsivitasnya */}
          <h1 className="mt-8 xl:mt-10 text-3xl lg:text-[38px] xl:text-[44px] font-extrabold tracking-tight leading-[1.14] text-white max-w-[520px]">
            Temukan kecamatan Jakarta yang pas untuk hidupmu.
          </h1>
        </div>

        {/* Matriks Visual 42 Kecamatan (7 Kolom x 6 Baris) */}
        <div className="my-8 max-w-full lg:max-w-[430px] xl:max-w-[450px] w-full">
          <div className="grid grid-cols-7 gap-1.5 xl:gap-2.5">
            {HEATMAP_TILES.map((tile) => {
              const isTop = tile.level === "top";
              const isHovered = hoveredTile === tile.id;
              return (
                <div
                  key={tile.id}
                  onMouseEnter={() => setHoveredTile(tile.id)}
                  onMouseLeave={() => setHoveredTile(null)}
                  title={`${tile.name} Skor ${tile.score}`}
                  className={`aspect-square rounded-xl p-1 xl:p-2 flex flex-col justify-end transition-all duration-200 cursor-default ${getTileColorClass(
                    tile.level
                  )} ${isHovered && !isTop ? "scale-105 ring-2 ring-[#CDFC56]/90 z-10" : ""}`}
                >
                  {(isTop || isHovered) && (
                    <span
                      className={`text-[10px] xl:text-xs font-extrabold leading-none tracking-tight ${
                        isTop ? "text-[#0B1526]" : "text-white"
                      }`}
                    >
                      {tile.score}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend Skor Kecocokan */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs text-white/90">
            <span className="font-medium text-white/85">Skor kecocokan</span>
            <div className="inline-flex items-center gap-1">
              <span className="w-4 h-2 rounded-xs bg-white/15" />
              <span className="w-4 h-2 rounded-xs bg-white/30" />
              <span className="w-4 h-2 rounded-xs bg-white/50" />
              <span className="w-4 h-2 rounded-xs bg-[#CDFC56]" />
            </div>
            <span className="text-white font-semibold">
              {hoveredTile
                ? `${activeTileInfo.name} (${activeTileInfo.score})`
                : "42 kecamatan, satu rekomendasi teratas"}
            </span>
          </div>
        </div>

        {/* Footer Indikator Bawah */}
        <div className="pt-2 text-xs text-white/80 font-medium tracking-wide">
          © 2026 <strong className="text-white">JakMatch</strong> — Smart Location Intelligence Platform DKI Jakarta. All rights reserved.
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PANEL KANAN (DAN TAMPILAN UTAMA NON-DESKTOP): LOGO + CARD FORM LOGIN  */}
      {/* ===================================================================== */}
      <section className="flex-1 min-h-dvh flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 xl:px-16 py-8 sm:py-10 lg:bg-[#F8FAFC] w-full">
        
        {/* Logo JakMatch Khusus Device Selain Desktop (Mobile & Tablet) */}
        <div className="lg:hidden mb-8 sm:mb-10 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group focus:outline-none"
          >
            <Image
              src="/assets/logo-jakmatch.png"
              alt="Logo JakMatch"
              width={48}
              height={48}
              className="rounded-xl object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-xs">
              JakMatch
            </span>
          </Link>
        </div>

        {/* Card Form Login */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[100%] sm:max-w-[440px] rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md border border-white/80 lg:border-slate-200/90 shadow-[0_14px_40px_rgba(7,115,188,0.18)] lg:shadow-[0_12px_40px_-12px_rgba(7,115,188,0.12)] p-6 sm:p-8"
        >
          {/* Judul & Subjudul */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#0B1526] tracking-tight">
              {isForgotOpen ? "Lupa Kata Sandi" : "Masuk"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isForgotOpen
                ? "Masukkan alamat email akun kamu untuk menerima tautan pemulihan kata sandi."
                : "Lanjutkan riset wilayah dan lihat riwayat tersimpan kamu."}
            </p>
          </div>

          {/* Notifikasi Feedback Interaktif (Error / Success) */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="w-full overflow-hidden"
              >
                <div
                  role="alert"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold flex items-start gap-2 border ${
                    feedback.type === "error"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : feedback.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-sky-50 text-sky-800 border-sky-200"
                  }`}
                >
                  <span className="leading-snug">{feedback.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM LOGIN */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:space-y-5">
            {/* Info Box saat Mode Lupa Kata Sandi Aktif */}
            {isForgotOpen && (
              <div className="p-3.5 rounded-xl bg-[#0773BC]/8 border border-[#0773BC]/20 text-xs text-slate-700 leading-relaxed">
                Masukkan alamat email akun Anda di bawah ini. Kami akan
                mengirimkan tautan khusus untuk mengatur ulang kata sandi.
              </div>
            )}

            {/* Field Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Alamat Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50/80 focus:bg-white border border-slate-200 text-sm font-medium text-[#0B1526] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0773BC]/25 focus:border-[#0773BC] transition-all"
              />
            </div>

            {/* Field Kata Sandi / Navigasi Lupa Kata Sandi */}
            {!isForgotOpen ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback(null);
                      setIsForgotOpen(true);
                    }}
                    className="text-xs font-bold text-[#0773BC] hover:text-[#055a96] hover:underline transition cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                </div>

                <div className="relative flex items-center w-full">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={12}
                    maxLength={72}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 12 karakter"
                    className={`w-full pl-4 pr-11 py-3 rounded-xl bg-slate-50/80 focus:bg-white border text-sm font-medium text-[#0B1526] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      password.length > 0 && isPasswordValid
                        ? "border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                        : "border-slate-200 focus:ring-[#0773BC]/25 focus:border-[#0773BC]"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-[#0B1526] hover:bg-slate-100 transition cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Indikator Panjang Karakter Password */}
                <div className="pt-0.5">
                  <PasswordLengthMeter password={password} minLength={12} />
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setIsForgotOpen(false);
                  }}
                  className="text-xs font-bold text-[#0773BC] hover:text-[#055a96] hover:underline transition cursor-pointer"
                >
                  &larr; Kembali ke halaman masuk
                </button>
              </div>
            )}

            {/* Tombol Utama Masuk (Navy #0B1526 dengan Kotak Panah Hijau Lime Dashboard #CDFC56) */}
            <button
              type="submit"
              disabled={!canSubmitLogin || isLoading || isGoogleLoading}
              className="w-full pl-4 pr-2.5 py-2.5 rounded-xl bg-[#0B1526] hover:bg-[#13233f] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs group"
            >
              <span>
                {isLoading
                  ? "Memproses..."
                  : isForgotOpen
                    ? "Kirim Tautan Pemulihan"
                    : "Masuk ke Ruang Kerja"}
              </span>

              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-0.5 shrink-0 ${
                  !canSubmitLogin || isLoading || isGoogleLoading
                    ? "bg-slate-300/70 text-slate-500"
                    : "bg-[#CDFC56] text-[#0B1526]"
                }`}
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                )}
              </span>
            </button>

            {/* Pemisah & Tombol Google (Hanya tampil saat mode Login normal) */}
            {!isForgotOpen && (
              <>
                <div className="relative flex items-center py-0.5">
                  <div className="grow border-t border-slate-200" />
                  <span className="shrink-0 mx-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    atau lanjutkan dengan
                  </span>
                  <div className="grow border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  aria-label="Lanjutkan dengan Google"
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0773BC]/40 disabled:opacity-60 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
                >
                  {isGoogleLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-[#0773BC] rounded-full animate-spin" />
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        Menghubungkan Google...
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 shrink-0"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                        />
                      </svg>
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        Google
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {/* Link Menuju Halaman Daftar */}
          <p className="mt-6 text-center sm:text-left text-xs sm:text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-bold text-[#0773BC] hover:text-[#055a96] underline underline-offset-4 transition"
            >
              Daftar sekarang
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}