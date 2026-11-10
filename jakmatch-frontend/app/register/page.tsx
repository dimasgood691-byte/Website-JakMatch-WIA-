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
  registerWithEmail,
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
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);

  // Status kelayakan tombol Daftar (aktif hanya ketika password >= 12 karakter & konfirmasi cocok)
  const isPasswordValid = validatePasswordRule(password) === null;
  const isConfirmValid =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmitRegister =
    email.trim().length > 0 && isPasswordValid && isConfirmValid;

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

  // Handler Pendaftaran dengan Email & Password
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
      setErrorMsg("Konfirmasi kata sandi tidak cocok dengan kata sandi kamu.");
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

  const activeTileInfo =
    HEATMAP_TILES.find((t) => t.id === hoveredTile) ||
    HEATMAP_TILES.find((t) => t.level === "top")!;

  return (
    <main
      className={`${inter.className} min-h-dvh w-full flex flex-col lg:flex-row bg-linear-to-b from-[#0773BC] via-[#2B95DC] to-[#81D8FF] lg:bg-none lg:bg-[#F8FAFC] text-[#0B1526] select-none overflow-x-hidden`}
    >
      {/* ===================================================================== */}
      {/* PANEL KIRI: KHUSUS DESKTOP (lg:flex) - TEMA GRADASI BIRU DASHBOARD    */}
      {/* ===================================================================== */}
      <section className="hidden lg:flex lg:w-[52%] xl:w-[55%] lg:min-h-dvh bg-linear-to-b from-[#0773BC] via-[#1B86D0] to-[#2B95DC] text-white lg:px-12 lg:py-10 xl:px-16 xl:py-12 flex-col justify-between relative overflow-hidden shrink-0">
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
              className="rounded-xl object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-extrabold tracking-tight text-white">
              JakMatch
            </span>
          </Link>

          {/* Headline Utama */}
          <h1 className="mt-8 xl:mt-10 text-[38px] xl:text-[44px] font-extrabold tracking-tight leading-[1.14] text-white max-w-[520px]">
            Temukan kecamatan Jakarta yang pas untuk hidupmu.
          </h1>
        </div>

        {/* Matriks Visual 42 Kecamatan (7 Kolom x 6 Baris) */}
        <div className="my-8 max-w-[430px] xl:max-w-[450px] w-full">
          <div className="grid grid-cols-7 gap-2.5">
            {HEATMAP_TILES.map((tile) => {
              const isTop = tile.level === "top";
              const isHovered = hoveredTile === tile.id;
              return (
                <div
                  key={tile.id}
                  onMouseEnter={() => setHoveredTile(tile.id)}
                  onMouseLeave={() => setHoveredTile(null)}
                  title={`${tile.name} • Skor ${tile.score}`}
                  className={`aspect-square rounded-xl p-2 flex flex-col justify-end transition-all duration-200 cursor-default ${getTileColorClass(
                    tile.level
                  )} ${isHovered && !isTop ? "scale-105 ring-2 ring-[#CDFC56]/90" : ""}`}
                >
                  {(isTop || isHovered) && (
                    <span
                      className={`text-xs font-extrabold leading-none tracking-tight ${
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
      {/* PANEL KANAN (DAN TAMPILAN UTAMA NON-DESKTOP): LOGO + CARD FORM DAFTAR */}
      {/* ===================================================================== */}
      <section className="flex-1 min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-16 lg:bg-[#F8FAFC]">
        {/* Logo JakMatch Khusus Device Selain Desktop (Mobile & Tablet) */}
        <div className="lg:hidden mb-6 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group focus:outline-none"
          >
            <Image
              src="/assets/logo-jakmatch.png"
              alt="Logo JakMatch"
              width={52}
              height={52}
              className="rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-extrabold tracking-tight text-white drop-shadow-xs">
              JakMatch
            </span>
          </Link>
        </div>

        {/* Card Form Register */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[420px] sm:max-w-[440px] rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md border border-white/80 lg:border-slate-200/90 shadow-[0_14px_40px_rgba(7,115,188,0.18)] lg:shadow-[0_12px_40px_-12px_rgba(7,115,188,0.12)] p-6 sm:p-8"
        >
          {/* Judul & Subjudul */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#0B1526] tracking-tight">
              Daftar Akun Baru
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Buat akun untuk memulai riset wilayah DKI Jakarta dan menyimpan
              rekomendasi kecamatan pilihanmu.
            </p>
          </div>

          {/* Notifikasi Error Interaktif */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="w-full overflow-hidden"
              >
                <div
                  role="alert"
                  className="w-full px-4 py-3 rounded-xl text-left text-xs font-semibold flex items-start gap-2.5 border bg-rose-50 text-rose-700 border-rose-200"
                >
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM REGISTER */}
          <form onSubmit={handleRegister} className="mt-6 space-y-4 sm:space-y-5">
            {/* Field Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Alamat Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50/80 focus:bg-white border border-slate-200 text-sm font-medium text-[#0B1526] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0773BC]/25 focus:border-[#0773BC] transition-all"
              />
            </div>

            {/* Field Kata Sandi + Show/Hide Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Kata Sandi
              </label>
              <div className="relative flex items-center w-full">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
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
            </div>

            {/* Field Konfirmasi Kata Sandi + Show/Hide Confirm Password + Pendeteksi Jumlah Password */}
            <div className="space-y-2">
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Konfirmasi Kata Sandi
              </label>
              <div className="relative flex items-center w-full">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi kamu"
                  className={`w-full pl-4 pr-11 py-3 rounded-xl bg-slate-50/80 focus:bg-white border text-sm font-medium text-[#0B1526] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                      : confirmPassword.length > 0 &&
                          password === confirmPassword
                        ? "border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                        : "border-slate-200 focus:ring-[#0773BC]/25 focus:border-[#0773BC]"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan konfirmasi kata sandi"
                      : "Tampilkan konfirmasi kata sandi"
                  }
                  className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-[#0B1526] hover:bg-slate-100 transition cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Fitur Pendeteksi Jumlah Karakter Password (12 Karakter) & Status Kecocokan */}
              <div className="pt-0.5">
                <PasswordLengthMeter
                  password={password}
                  minLength={12}
                  confirmPassword={confirmPassword}
                  showConfirmStatus
                />
              </div>
            </div>

            {/* Tombol Utama Daftar (Navy #0B1526 dengan Kotak Panah Hijau Lime Dashboard #CDFC56) */}
            <button
              type="submit"
              disabled={!canSubmitRegister || loading}
              className="w-full pl-4 pr-2.5 py-2.5 rounded-xl bg-[#0B1526] hover:bg-[#13233f] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs group"
            >
              <span>{loading ? "Memproses..." : "Buat Akun Sekarang"}</span>

              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-0.5 shrink-0 ${
                  !canSubmitRegister || loading
                    ? "bg-slate-300/70 text-slate-500"
                    : "bg-[#CDFC56] text-[#0B1526]"
                }`}
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                )}
              </span>
            </button>
          </form>

          {/* Link Menuju Halaman Masuk */}
          <p className="mt-6 text-center sm:text-left text-xs sm:text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-bold text-[#0773BC] hover:text-[#055a96] underline underline-offset-4 transition"
            >
              Masuk di sini
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}
