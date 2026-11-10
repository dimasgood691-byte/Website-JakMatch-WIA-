'use client';

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

const inputBase =
  "h-11 w-full rounded-lg border bg-white px-3.5 text-base text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition placeholder:text-slate-400 focus:ring-4 sm:text-sm";

const inputTone = {
  default: "border-slate-300 focus:border-[#0773BC] focus:ring-[#0773BC]/15",
  error: "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15",
};

/* ------------------------------------------------------------------ */
/* Label                                                               */
/* ------------------------------------------------------------------ */
export function FieldLabel({
  htmlFor,
  children,
  action,
}: {
  htmlFor: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">
        {children}
      </label>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Input teks biasa                                                    */
/* ------------------------------------------------------------------ */
export function TextInput({
  invalid,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputBase} ${invalid ? inputTone.error : inputTone.default} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Input kata sandi dengan tombol tampil/sembunyikan                   */
/* ------------------------------------------------------------------ */
export function PasswordInput({
  invalid,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={`${inputBase} pr-11 ${invalid ? inputTone.error : inputTone.default}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-slate-400 transition hover:text-slate-700 focus-visible:text-slate-700 focus-visible:outline-none"
      >
        {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tombol utama: navy dengan kotak panah lime (sesuai desain referensi) */
/* ------------------------------------------------------------------ */
export function SubmitButton({
  children,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg bg-[#0B1526] pl-4 pr-1.5 text-sm font-medium text-white transition hover:bg-[#16243d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0773BC]/25 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
    >
      <span>{children}</span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
          isDisabled
            ? "bg-slate-300/60 text-slate-400"
            : "bg-[#CDFC56] text-[#0B1526] group-hover:translate-x-0.5"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        )}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Tombol Google                                                       */
/* ------------------------------------------------------------------ */
export function GoogleButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0773BC]/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
          <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
        </svg>
      )}
      <span>{loading ? "Menghubungkan…" : "Lanjutkan dengan Google"}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Pemisah "atau"                                                      */
/* ------------------------------------------------------------------ */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400" role="separator">
      <span className="h-px flex-1 bg-slate-200" />
      atau
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notifikasi error / sukses di atas form                              */
/* ------------------------------------------------------------------ */
export function FormAlert({
  type,
  message,
}: {
  type: "error" | "success" | "info";
  message: string;
}) {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-snug ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Link teks bergaya aksen                                             */
/* ------------------------------------------------------------------ */
export const textLinkClass =
  "font-medium text-[#0773BC] underline-offset-4 transition hover:text-[#055a96] hover:underline focus-visible:underline focus-visible:outline-none";
