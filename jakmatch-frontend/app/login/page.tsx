'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";

// Memuat font Inter sesuai spesifikasi desain
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logika autentikasi ke backend nantinya ditaruh di sini
    console.log("Login dengan:", { email, password });
  };

  return (
    <main
      className={`${inter.className} relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden select-none`}
    >
      {/* 1. BACKGROUND AWAN & GARIS LINGKARAN */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/assets/bg-login.jpeg"
          alt="Login Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* 2. HEADER LOGO JAKMATCH (Kiri Atas - Klik untuk kembali ke Home) */}
      <header className="fixed top-0 left-0 w-full px-6 sm:px-10 py-6 z-20">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/logo.png"
            alt="Logo Jakmatch"
            width={36}
            height={36}
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-xl font-semibold text-white tracking-wide drop-shadow-md">
            Jakmatch
          </span>
        </Link>
      </header>

      {/* 3. CARD LOGIN UTAMA (Linear Gradient #B5F2FF ke #FFFFFF) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] rounded-[28px] bg-gradient-to-b from-[#B5F2FF] to-[#FFFFFF] px-7 sm:px-9 py-9 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/60 flex flex-col items-center text-center z-10"
      >
        {/* Ikon Pintu dengan Radius Lengkung (Squircle) */}
        <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-center mb-5 overflow-hidden">
          <Image
            src="/assets/icon-door.jpeg"
            alt="Sign In Icon"
            width={30}
            height={30}
            className="object-contain rounded-lg mix-blend-multiply"
          />
        </div>

        {/* Judul & Deskripsi */}
        <h1 className="text-[22px] sm:text-2xl font-bold text-[#111111] tracking-tight">
          Welcome To JakMatch
        </h1>
        <p className="text-xs sm:text-[13px] text-neutral-500 leading-relaxed mt-2 max-w-[300px]">
          We provide this platform for those of<br /> you
           who are struggling to find a
          comfortable place to live.
        </p>

        {/* FORM INPUT */}
        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-3">
          {/* Input Email */}
          <div className="relative flex items-center w-full">
            <div className="absolute left-3.5 pointer-events-none flex items-center">
              <Image
                src="/assets/icon-email.png"
                alt="Email Icon"
                width={16}
                height={16}
                className="object-contain opacity-60"
              />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#EAEAEA]/90 hover:bg-[#E2E2E2]/90 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#2B2B33]/20 transition-all"
            />
          </div>

          {/* Input Password */}
          <div className="relative flex items-center w-full">
            <div className="absolute left-3.5 pointer-events-none flex items-center">
              <Image
                src="/assets/icon-lock.png"
                alt="Password Icon"
                width={16}
                height={16}
                className="object-contain opacity-60"
              />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#EAEAEA]/90 hover:bg-[#E2E2E2]/90 focus:bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#2B2B33]/20 transition-all"
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end pt-0.5">
            <Link
              href="#"
              className="text-[11px] font-bold text-[#111111] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Button Get Started (#2B2B33) */}
          <button
            type="submit"
            className="w-full py-2.5 mt-1 rounded-lg bg-[#2B2B33] hover:bg-[#1f1f26] active:scale-[0.99] text-white text-xs sm:text-sm font-medium tracking-wide shadow-md transition-all cursor-pointer"
          >
            Get Started
          </button>
        </form>

        {/* Divider "Or sign in with" */}
        <div className="w-full flex items-center gap-2 my-5">
          <div className="flex-1 border-t border-dashed border-neutral-300" />
          <span className="text-[11px] text-neutral-400 font-normal">
            Or sign in with
          </span>
          <div className="flex-1 border-t border-dashed border-neutral-300" />
        </div>

        {/* Tombol Social Login (Google, Facebook, Apple) */}
        <div className="w-full grid grid-cols-3 gap-3">
          <button
            type="button"
            aria-label="Sign in with Google"
            className="flex items-center justify-center py-2.5 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] transition cursor-pointer"
          >
            <Image
              src="/assets/icon-google.png"
              alt="Google"
              width={18}
              height={18}
              className="object-contain"
            />
          </button>

          <button
            type="button"
            aria-label="Sign in with Facebook"
            className="flex items-center justify-center py-2.5 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] transition cursor-pointer"
          >
            <Image
              src="/assets/icon-facebook.png"
              alt="Facebook"
              width={18}
              height={18}
              className="object-contain"
            />
          </button>

          <button
            type="button"
            aria-label="Sign in with Apple"
            className="flex items-center justify-center py-2.5 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] transition cursor-pointer"
          >
            <Image
              src="/assets/icon-apple.png"
              alt="Apple"
              width={18}
              height={18}
              className="object-contain"
            />
          </button>
        </div>
      </motion.div>
    </main>
  );
}