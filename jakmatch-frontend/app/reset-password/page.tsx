"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { clearSession } from "@/app/lib/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) {
      setMessage("Tautan reset tidak valid atau sudah kedaluwarsa.");
      return;
    }
    if (password.length < 12 || new TextEncoder().encode(password).length > 72) {
      setMessage("Password harus minimal 12 karakter dan maksimal 72 byte.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.message || "Tautan reset tidak valid atau sudah kedaluwarsa.");
        if (response.status === 400) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setIsSuccess(true);
      setMessage(data.message || "Password berhasil diperbarui.");
      await clearSession();
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("Tidak dapat terhubung ke server. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F8FAFC] px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
        <h1 className="text-2xl font-bold text-slate-900">Atur ulang password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Buat password baru. Tautan reset hanya dapat digunakan sekali dan
          berlaku selama 15 menit.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Password baru
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Konfirmasi password baru
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={72}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          {message && (
            <p
              role="status"
              className={`rounded-lg px-3 py-2.5 text-sm ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </p>
          )}

          {!isSuccess && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#2B2B33] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1f26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Memproses..." : "Simpan password baru"}
            </button>
          )}
        </form>

        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-semibold text-slate-800 hover:underline"
        >
          Kembali ke login
        </Link>
      </section>
    </main>
  );
}
