'use client';

import React from "react";
import { motion } from "framer-motion";

interface PasswordLengthMeterProps {
  password: string;
  minLength?: number;
  confirmPassword?: string;
  showConfirmStatus?: boolean;
}

export default function PasswordLengthMeter({
  password,
  minLength = 12,
  confirmPassword,
  showConfirmStatus = false,
}: PasswordLengthMeterProps) {
  const charCount = Array.from(password).length;
  const byteLength = new TextEncoder().encode(password).length;
  const isTooLong = byteLength > 72;
  const isMet = charCount >= minLength && !isTooLong;
  const remaining = Math.max(0, minLength - charCount);
  const progressPercent = Math.min(100, Math.round((charCount / minLength) * 100));

  // Penentuan warna slider & label status secara dinamis
  const getStatusConfig = () => {
    if (charCount === 0) {
      return {
        barColor: "bg-neutral-300",
        thumbBorder: "border-neutral-400",
        badgeClass: "bg-neutral-200/80 text-neutral-600",
        statusText: `Wajib minimal ${minLength} karakter`,
        textColor: "text-neutral-500",
      };
    }
    if (isTooLong) {
      return {
        barColor: "bg-rose-500",
        thumbBorder: "border-rose-600",
        badgeClass: "bg-rose-100 text-rose-700",
        statusText: "Melebihi batas maksimal 72 byte",
        textColor: "text-rose-600",
      };
    }
    if (charCount < Math.ceil(minLength / 2)) {
      return {
        barColor: "bg-gradient-to-r from-rose-500 to-orange-500",
        thumbBorder: "border-rose-500",
        badgeClass: "bg-rose-100/90 text-rose-700",
        statusText: `Kurang ${remaining} karakter lagi`,
        textColor: "text-rose-600",
      };
    }
    if (!isMet) {
      return {
        barColor: "bg-gradient-to-r from-orange-400 to-amber-500",
        thumbBorder: "border-amber-500",
        badgeClass: "bg-amber-100/90 text-amber-800",
        statusText: `Hampir siap! Kurang ${remaining} karakter`,
        textColor: "text-amber-700",
      };
    }
    return {
      barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      thumbBorder: "border-emerald-600",
      badgeClass: "bg-emerald-100 text-emerald-800",
      statusText: "Password memenuhi syarat",
      textColor: "text-emerald-700",
    };
  };

  const config = getStatusConfig();
  const isConfirmTyped = showConfirmStatus && (confirmPassword?.length ?? 0) > 0;
  const isConfirmMatch = isConfirmTyped && password === confirmPassword;

  return (
    <div className="w-full pt-1 pb-0.5 px-0.5 select-none">
      {/* Baris Atas: Teks Status & Penghitung Karakter (Counter Badge) */}
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className={`font-medium transition-colors duration-200 flex items-center gap-1 ${config.textColor}`}>
          {isMet && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold"
            >
              ✓
            </motion.span>
          )}
          <span>{config.statusText}</span>
        </span>

        <span
          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors duration-200 ${config.badgeClass}`}
        >
          {charCount}/{minLength}
        </span>
      </div>

      {/* Track Slider Interaktif dengan Indikator Thumb & 12 Titik Segmen */}
      <div className="relative w-full h-2 bg-neutral-200/90 rounded-full overflow-visible flex items-center">
        {/* Garis Pembagi Segmen Halus (12 Karakter) */}
        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none z-10">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="border-r border-white/50 last:border-r-0 h-full"
            />
          ))}
        </div>

        {/* Bar Progres Animasi */}
        <div className="w-full h-full rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`h-full rounded-full ${config.barColor}`}
          />
        </div>

        {/* Knob / Thumb Slider yang Bergerak Mengikuti Jumlah Karakter */}
        {charCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{
              left: `calc(${progressPercent}% - 6px)`,
              scale: isMet ? 1.15 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`absolute z-20 w-3 h-3 rounded-full bg-white border-2 shadow-xs pointer-events-none ${config.thumbBorder}`}
          />
        )}
      </div>

      {/* Status Kecocokan Confirm Password (Khusus Halaman Register / Reset) */}
      {isConfirmTyped && (
        <motion.div
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between text-[10px] mt-1.5"
        >
          <span
            className={`font-medium ${
              isConfirmMatch ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {isConfirmMatch
              ? "✓ Konfirmasi password sudah cocok"
              : "✕ Konfirmasi password belum cocok"}
          </span>
        </motion.div>
      )}
    </div>
  );
}

