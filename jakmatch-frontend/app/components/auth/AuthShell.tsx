'use client';

import React, { useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

// Data ilustrasi 42 kecamatan DKI Jakarta (7 kolom x 6 baris).
// Tingkat warna tile diturunkan langsung dari skor agar visual konsisten dengan angka.
type Tile = { name: string; region: string; score: number };

const TILES: Tile[] = [
  { name: "Jagakarsa", region: "Jakarta Selatan", score: 81.4 },
  { name: "Pasar Minggu", region: "Jakarta Selatan", score: 84.0 },
  { name: "Cilandak", region: "Jakarta Selatan", score: 87.2 },
  { name: "Tebet", region: "Jakarta Selatan", score: 86.5 },
  { name: "Setiabudi", region: "Jakarta Selatan", score: 90.1 },
  { name: "Kebayoran Lama", region: "Jakarta Selatan", score: 83.8 },
  { name: "Pesanggrahan", region: "Jakarta Selatan", score: 80.2 },

  { name: "Pancoran", region: "Jakarta Selatan", score: 84.6 },
  { name: "Kebayoran Baru", region: "Jakarta Selatan", score: 90.8 },
  { name: "Mampang Prapatan", region: "Jakarta Selatan", score: 82.5 },
  { name: "Gambir", region: "Jakarta Pusat", score: 89.4 },
  { name: "Tanah Abang", region: "Jakarta Pusat", score: 85.2 },
  { name: "Senen", region: "Jakarta Pusat", score: 85.9 },
  { name: "Kemayoran", region: "Jakarta Pusat", score: 82.7 },

  { name: "Cempaka Putih", region: "Jakarta Pusat", score: 86.8 },
  { name: "Sawah Besar", region: "Jakarta Pusat", score: 83.1 },
  { name: "Johar Baru", region: "Jakarta Pusat", score: 79.5 },
  { name: "Menteng", region: "Jakarta Pusat", score: 92.2 },
  { name: "Matraman", region: "Jakarta Timur", score: 84.1 },
  { name: "Pulo Gadung", region: "Jakarta Timur", score: 84.3 },
  { name: "Jatinegara", region: "Jakarta Timur", score: 83.0 },

  { name: "Duren Sawit", region: "Jakarta Timur", score: 81.2 },
  { name: "Kramat Jati", region: "Jakarta Timur", score: 82.4 },
  { name: "Makasar", region: "Jakarta Timur", score: 80.9 },
  { name: "Ciracas", region: "Jakarta Timur", score: 82.1 },
  { name: "Pasar Rebo", region: "Jakarta Timur", score: 81.8 },
  { name: "Cipayung", region: "Jakarta Timur", score: 83.4 },
  { name: "Cakung", region: "Jakarta Timur", score: 78.6 },

  { name: "Grogol Petamburan", region: "Jakarta Barat", score: 84.8 },
  { name: "Kembangan", region: "Jakarta Barat", score: 86.0 },
  { name: "Kebon Jeruk", region: "Jakarta Barat", score: 83.5 },
  { name: "Palmerah", region: "Jakarta Barat", score: 81.7 },
  { name: "Taman Sari", region: "Jakarta Barat", score: 80.4 },
  { name: "Tambora", region: "Jakarta Barat", score: 77.2 },
  { name: "Cengkareng", region: "Jakarta Barat", score: 77.9 },

  { name: "Kalideres", region: "Jakarta Barat", score: 76.8 },
  { name: "Kelapa Gading", region: "Jakarta Utara", score: 86.4 },
  { name: "Penjaringan", region: "Jakarta Utara", score: 82.3 },
  { name: "Pademangan", region: "Jakarta Utara", score: 81.1 },
  { name: "Tanjung Priok", region: "Jakarta Utara", score: 79.8 },
  { name: "Koja", region: "Jakarta Utara", score: 77.5 },
  { name: "Cilincing", region: "Jakarta Utara", score: 75.6 },
];

const TOP_SCORE = Math.max(...TILES.map((t) => t.score));
const TOP_TILE = TILES.find((t) => t.score === TOP_SCORE)!;

// Skala warna: 4 tingkat putih transparan + lime untuk skor tertinggi
const SCALE = ["bg-white/10", "bg-white/20", "bg-white/30", "bg-white/45"];

function tileClass(score: number): string {
  if (score === TOP_SCORE) return "bg-[#CDFC56]";
  if (score >= 88) return SCALE[3];
  if (score >= 85) return SCALE[2];
  if (score >= 81) return SCALE[1];
  return SCALE[0];
}

function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1526]">
        <BarChart3 className="h-4 w-4 text-[#CDFC56]" aria-hidden="true" />
      </span>
      <span
        className={`text-[17px] font-semibold tracking-tight ${
          tone === "light" ? "text-white" : "text-slate-900"
        }`}
      >
        JakMatch
      </span>
    </Link>
  );
}

function DistrictPanel() {
  const [active, setActive] = useState<Tile | null>(null);
  const shown = active ?? TOP_TILE;

  return (
    <section className="relative hidden w-[52%] shrink-0 flex-col justify-between bg-[#0773BC] px-12 py-10 text-white lg:flex xl:w-[55%] xl:px-16 xl:py-12">
      <div>
        <Logo />
        <h1 className="mt-10 max-w-[30rem] text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] xl:text-[48px]">
          Temukan kecamatan Jakarta yang pas untuk hidupmu.
        </h1>
      </div>

      <div className="w-full max-w-[440px] py-8">
        <div
          className="grid grid-cols-7 gap-2"
          onMouseLeave={() => setActive(null)}
          aria-hidden="true"
        >
          {TILES.map((tile) => {
            const isTop = tile.score === TOP_SCORE;
            const isActive = active?.name === tile.name;
            return (
              <div
                key={tile.name}
                onMouseEnter={() => setActive(tile)}
                className={`relative flex aspect-square items-end rounded-[10px] p-1.5 transition-[background-color,box-shadow] duration-150 ${tileClass(
                  tile.score
                )} ${isActive && !isTop ? "bg-white/60 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.9)]" : ""}`}
              >
                {isTop && (
                  <span className="text-[11px] font-semibold tabular-nums leading-none text-[#0B1526]">
                    {tile.score.toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Readout: menampilkan kecamatan yang sedang disorot */}
        <div className="mt-5 flex h-10 items-baseline justify-between border-t border-white/15 pt-3 text-sm">
          <p className="truncate">
            <span className="font-medium">{shown.name}</span>
            <span className="text-white/60"> · {shown.region}</span>
          </p>
          <p className="shrink-0 pl-4 font-semibold tabular-nums">
            {shown.score.toFixed(1)}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
          <span>Skor kecocokan</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            {SCALE.map((c) => (
              <span key={c} className={`h-2 w-4 rounded-sm ${c}`} />
            ))}
            <span className="h-2 w-4 rounded-sm bg-[#CDFC56]" />
          </span>
          <span>42 kecamatan, satu rekomendasi teratas</span>
        </div>
      </div>

      <p className="text-xs text-white/70">
        Transportasi · Kualitas udara · Fasilitas kesehatan · Bebas banjir
      </p>
    </section>
  );
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Kerangka halaman autentikasi (Login & Register).
 * - Desktop (lg+): split-screen, panel visual 42 kecamatan di kiri, card form di kanan.
 * - Mobile & tablet: hanya logo JakMatch + card form di atas gradasi biru dashboard.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-dvh w-full flex-col bg-linear-to-b from-[#0773BC] via-[#2B95DC] to-[#81D8FF] font-sans text-slate-900 antialiased lg:flex-row lg:bg-none lg:bg-[#F3F6F9]">
      <DistrictPanel />

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <div className="w-full max-w-[400px] rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgba(7,58,110,0.18)] sm:p-8 lg:border-slate-200 lg:shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <header>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          </header>

          <div className="mt-7">{children}</div>

          {footer && (
            <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
              {footer}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
