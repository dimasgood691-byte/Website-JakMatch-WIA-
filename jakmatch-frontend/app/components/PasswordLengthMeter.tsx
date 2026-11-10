'use client';

import React from "react";
import { Check, X } from "lucide-react";

interface PasswordLengthMeterProps {
  password: string;
  minLength?: number;
  confirmPassword?: string;
  showConfirmStatus?: boolean;
}

const MAX_BYTES = 72;

/**
 * Indikator panjang kata sandi (minimal 12 karakter, maksimal 72 byte)
 * beserta status kecocokan konfirmasi kata sandi (opsional).
 */
export default function PasswordLengthMeter({
  password,
  minLength = 12,
  confirmPassword,
  showConfirmStatus = false,
}: PasswordLengthMeterProps) {
  const charCount = Array.from(password).length;
  const isTooLong = new TextEncoder().encode(password).length > MAX_BYTES;
  const isMet = charCount >= minLength && !isTooLong;
  const remaining = Math.max(0, minLength - charCount);
  const progress = Math.min(100, (charCount / minLength) * 100);

  let barColor = "bg-[#0773BC]";
  let textColor = "text-slate-500";
  let status = `Minimal ${minLength} karakter`;

  if (isTooLong) {
    barColor = "bg-rose-500";
    textColor = "text-rose-600";
    status = `Melebihi batas ${MAX_BYTES} byte`;
  } else if (isMet) {
    barColor = "bg-emerald-500";
    textColor = "text-emerald-700";
    status = "Panjang kata sandi sudah cukup";
  } else if (charCount > 0) {
    status = `Kurang ${remaining} karakter lagi`;
  }

  const showConfirm = showConfirmStatus && (confirmPassword?.length ?? 0) > 0;
  const isMatch = showConfirm && password === confirmPassword;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-300 ease-out ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
        <span className={`flex min-w-0 items-center gap-1 truncate ${textColor}`}>
          {isMet && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
          {status}
        </span>
        <span className="shrink-0 tabular-nums text-slate-400">
          {charCount}/{minLength}
        </span>
      </div>

      {showConfirm && (
        <p
          className={`mt-1 flex items-center gap-1 text-xs ${
            isMatch ? "text-emerald-700" : "text-rose-600"
          }`}
        >
          {isMatch ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
          {isMatch ? "Konfirmasi kata sandi cocok" : "Konfirmasi kata sandi belum cocok"}
        </p>
      )}
    </div>
  );
}
