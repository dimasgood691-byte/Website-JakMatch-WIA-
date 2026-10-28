'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Data Wilayah Jakarta dengan struktur metrik yang lebih bersih & objektif
const JAKARTA_REGIONS = [
  {
    id: "jakut",
    index: "01",
    code: "ID-JK-UTR",
    name: "Jakarta Utara",
    area: "146,66 km²",
    summary:
      "Kawasan pesisir dengan perkembangan infrastruktur mandiri yang pesat. Didominasi hunian vertikal modern, pusat kuliner, dan akses langsung menuju jalur tol lingkar luar.",
    avgRent: "Rp 2,5 Jt – 6,0 Jt",
    metrics: [
      { label: "Aksesibilitas & Tol", score: 88 },
      { label: "Fasilitas Gaya Hidup", score: 90 },
      { label: "Kenyamanan Lingkungan", score: 82 },
    ],
    districts: ["Kelapa Gading", "Penjaringan (PIK)", "Sunter", "Pademangan"],
    points: "135,130 165,118 260,165 370,180 415,155 500,195 620,165 700,145 820,160 940,128 945,300 885,315 845,290 795,318 660,310 575,280 550,235 505,265 475,245 410,240 410,285 350,285 250,260 165,200",
    labelPos: { x: 580, y: 225 },
  },
  {
    id: "jakbar",
    index: "02",
    code: "ID-JK-BRT",
    name: "Jakarta Barat",
    area: "129,54 km²",
    summary:
      "Titik temu kawasan pendidikan tinggi, pusat komersial, dan pemukiman padat yang hidup. Sangat ideal bagi mahasiswa maupun pekerja dengan mobilitas tinggi ke arah bandara.",
    avgRent: "Rp 1,8 Jt – 4,5 Jt",
    metrics: [
      { label: "Aksesibilitas & Tol", score: 86 },
      { label: "Fasilitas Gaya Hidup", score: 85 },
      { label: "Kenyamanan Lingkungan", score: 78 },
    ],
    districts: ["Kebon Jeruk", "Grogol Petamburan", "Kembangan", "Tanjung Duren"],
    points: "60,145 135,130 165,200 250,260 350,285 410,285 410,240 475,245 495,300 400,308 440,360 435,405 380,435 382,480 335,480 335,498 150,490 165,410 138,410 140,355 60,325",
    labelPos: { x: 265, y: 365 },
  },
  {
    id: "jakpus",
    index: "03",
    code: "ID-JK-PST",
    name: "Jakarta Pusat",
    area: "48,13 km²",
    summary:
      "Simpul utama transportasi publik (MRT, KRL, LRT, TransJakarta) dan pusat pemerintahan. Menawarkan efisiensi waktu tempuh terbaik bagi pekerja di kawasan bisnis utama.",
    avgRent: "Rp 2,8 Jt – 7,5 Jt",
    metrics: [
      { label: "Aksesibilitas & Tol", score: 98 },
      { label: "Fasilitas Gaya Hidup", score: 94 },
      { label: "Kenyamanan Lingkungan", score: 85 },
    ],
    districts: ["Menteng", "Tanah Abang", "Kemayoran", "Cempaka Putih"],
    points: "475,245 505,265 550,235 575,280 660,310 640,355 650,405 595,430 570,462 470,435 380,435 435,405 440,360 400,308 495,300",
    labelPos: { x: 525, y: 365 },
  },
  {
    id: "jaksel",
    index: "04",
    code: "ID-JK-SLT",
    name: "Jakarta Selatan",
    area: "141,27 km²",
    summary:
      "Perpaduan distrik bisnis modern (SCBD), ruang terbuka hijau yang teduh, serta pusat tren kreatif. Pilihan utama untuk keseimbangan antara karier dan kualitas tempat tinggal.",
    avgRent: "Rp 2,5 Jt – 6,5 Jt",
    metrics: [
      { label: "Aksesibilitas & Tol", score: 92 },
      { label: "Fasilitas Gaya Hidup", score: 96 },
      { label: "Kenyamanan Lingkungan", score: 90 },
    ],
    districts: ["Kebayoran Baru", "Tebet", "Cilandak", "Setiabudi"],
    points: "225,492 335,498 335,480 382,480 380,435 470,435 570,462 605,490 590,560 608,600 555,650 585,705 528,735 525,775 385,815 425,695 330,695 305,625 265,595 255,520",
    labelPos: { x: 435, y: 590 },
  },
  {
    id: "jaktim",
    index: "05",
    code: "ID-JK-TMR",
    name: "Jakarta Timur",
    area: "188,03 km²",
    summary:
      "Wilayah dengan rasio ruang keluarga terluas dan biaya hidup yang paling rasional. Kini semakin terkoneksi berkat kehadiran jalur LRT Jabodebek dan koridor TransJakarta.",
    avgRent: "Rp 1,2 Jt – 3,5 Jt",
    metrics: [
      { label: "Aksesibilitas & Tol", score: 85 },
      { label: "Fasilitas Gaya Hidup", score: 80 },
      { label: "Kenyamanan Lingkungan", score: 88 },
    ],
    districts: ["Kramat Jati", "Duren Sawit", "Rawamangun", "Cipayung"],
    points: "660,310 795,318 845,290 885,315 945,300 945,400 915,485 860,495 820,550 735,555 765,620 790,725 768,805 680,838 585,765 525,775 528,735 585,705 555,650 608,600 590,560 605,490 570,462 595,430 650,405 640,355",
    labelPos: { x: 740, y: 480 },
  },
];

// Konfigurasi terpusat Animate On Scroll (AOS) agar kode bersih & konsisten
type AosDirection = "up" | "down" | "left" | "right" | "zoom";

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const AOS_VIEWPORT = { once: false, amount: 0.25 } as const;

const createAos = (direction: AosDirection, delay = 0, duration = 0.85) => {
  const initialOffsets: Record<AosDirection, Record<string, number>> = {
    up: { opacity: 0, y: 40 },
    down: { opacity: 0, y: -40 },
    left: { opacity: 0, x: -80 },
    right: { opacity: 0, x: 80 },
    zoom: { opacity: 0, y: 48, scale: 0.95 },
  };

  return {
    initial: initialOffsets[direction],
    whileInView: { opacity: 1, x: 0, y: 0, scale: 1 },
    viewport: AOS_VIEWPORT,
    transition: { duration, delay, ease: SMOOTH_EASE },
  };
};

export default function Home() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(JAKARTA_REGIONS[3]);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <main className="relative w-full flex flex-col font-sans overflow-x-hidden">

      {/* ========================================= */}
      {/* SMART NAVBAR (Tanpa Efek Blur / Background) */}
      {/* ========================================= */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 bg-transparent transition-transform duration-300 ease-in-out ${
          isScrolling ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center gap-2">
          <Image src="/assets/logo.png" alt="Logo Jakmatch" width={36} height={36} className="object-contain drop-shadow-md" />
          <span className="text-xl font-semibold text-white tracking-wide drop-shadow-md">Jakmatch</span>
        </div>

        <div className="hidden md:flex items-center bg-[#E5E5E5] rounded-full p-1.5 shadow-sm">
          <Link href="#" className="bg-black text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-wide">HOME</Link>
          <Link href="#" className="text-gray-900 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-black/5 transition tracking-wide">SERVICES</Link>
          <Link href="#" className="text-gray-900 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-black/5 transition tracking-wide">ABOUTUS</Link>
        </div>

        <div className="flex items-center gap-6">
          <Link href="#" className="relative text-white text-sm font-medium transition drop-shadow-md after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-white hover:after:w-full after:transition-all after:duration-300">Log In</Link>
          <Link href="#" className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg">Sign up</Link>
        </div>
      </nav>

      {/* ========================================= */}
      {/* SECTION 1: HERO & DASHBOARD               */}
      {/* ========================================= */}
      <section className="relative isolate min-h-screen w-full flex flex-col">
        <div className="absolute inset-0 -z-10 bg-black">
          <video autoPlay loop muted playsInline className="h-full w-full object-cover opacity-90">
            <source src="/assets/landing-bg.mp4" type="video/mp4" />
          </video>
          {/* Gradasi penyatu dari akhir Section 1 menuju warna langit Section 2 */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#09489c]/65 to-[#0c58b8]" />
        </div>

        <div className="flex flex-col items-center justify-center text-center mt-32 md:mt-40 px-4">
          <motion.h1
            {...createAos("up", 0)}
            className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-wide drop-shadow-sm"
          >
            Live where you feel<br />comfortable.
          </motion.h1>

          <motion.p
            {...createAos("up", 0.1)}
            className="text-white max-w-2xl text-base md:text-lg mb-8 font-medium drop-shadow-md"
          >
            We provide this platform for those of you who are struggling to find a<br />comfortable place to live.
          </motion.p>

          <motion.div {...createAos("up", 0.2)} className="flex gap-4">
            <Link href="#" className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg">Sign Up</Link>
            <Link href="#" className="bg-white text-black px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-100 transition shadow-lg">Try Free Now</Link>
          </motion.div>
        </div>

        <motion.div
          {...createAos("zoom", 0.25)}
          className="relative z-10 flex-1 mt-16 px-6 md:px-12 flex justify-center items-end pb-10"
        >
          <div className="w-full max-w-6xl bg-white h-[40vh] md:h-[45vh] rounded-3xl shadow-2xl flex items-center justify-center">
            <h2 className="text-3xl font-bold text-black">tampilan dashboard</h2>
          </div>
        </motion.div>
      </section>

      {/* ========================================= */}
      {/* SECTION 2: MONAS & ANIMASI JAK-MATCH      */}
      {/* ========================================= */}
      <section
        aria-label="Jakmatch Showcase"
        className="relative isolate h-screen w-full overflow-hidden select-none"
      >
        {/* Layer 0: Background Langit + Gradasi Transisi Atas & Bawah */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/langit.jpeg"
            alt="Langit Cerah Jakarta"
            fill
            sizes="100vw"
            className="object-cover object-center pointer-events-none"
          />
          {/* Gradasi Atas: Menyambung warna akhir Section 1 (#0c58b8) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#0c58b8] via-[#0c58b8]/45 to-transparent" />
          {/* Gradasi Bawah: Menyambung warna langit awal Section 3 (#257ce0) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#5ba4ec]/65 to-[#257ce0]" />
        </div>

        {/* Container Komposisi Utama */}
        <h2
          aria-label="JAKMATCH"
          className="relative mx-auto h-full w-full max-w-7xl px-6 md:px-16"
        >
          {/* Layer 10 (Di Belakang Monas): Teks "JAK" */}
          <motion.span
            {...createAos("left", 0, 0.95)}
            className="
              absolute left-6 sm:left-12 lg:left-24 top-[30%] md:top-[32%] z-10
              font-mono font-black text-black leading-none
              text-[clamp(3.75rem,11vw,9rem)] tracking-[0.12em]
              drop-shadow-[0_12px_24px_rgba(0,0,0,0.2)]
            "
          >
            JAK
          </motion.span>

          {/* Layer 20 (Tengah): Monumen Nasional dengan mask halus di bagian kaki */}
          <motion.div
            {...createAos("zoom", 0.05, 1)}
            className="
              pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-20
              h-[82vh] w-[360px] sm:w-[480px] md:h-[96vh] md:w-[640px]
              [mask-image:linear-gradient(to_bottom,black_80%,transparent_99%)]
            "
          >
            <Image
              src="/assets/monas.png"
              alt="Monumen Nasional"
              fill
              sizes="(max-width: 768px) 480px, 640px"
              className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.28)]"
            />
          </motion.div>

          {/* Layer 30 (Di Depan Monas): Teks "MATCH" */}
          <motion.span
            {...createAos("right", 0.15, 0.95)}
            className="
              absolute right-6 sm:right-12 lg:right-20 bottom-[22%] md:bottom-[24%] z-30
              font-mono font-black text-black leading-none
              text-[clamp(3.75rem,11vw,9rem)] tracking-[0.12em]
              drop-shadow-[0_12px_24px_rgba(0,0,0,0.22)]
            "
          >
            MATCH
          </motion.span>
        </h2>
      </section>

      {/* ========================================= */}
      {/* SECTION 3: INTERACTIVE MAP (COMPACT CARD) */}
      {/* ========================================= */}
      <section className="relative isolate min-h-screen w-full flex items-center justify-center pt-28 pb-12 px-6 md:px-16 overflow-hidden">

        {/* Background Padang Rumput & Langit + Gradasi Penyatu dari Section 2 */}
        <div className="absolute inset-0 -z-20">
          <Image
            src="/assets/landing-bg2.jpeg"
            alt="Background Peta Jakarta"
            fill
            sizes="100vw"
            className="object-cover object-center pointer-events-none"
          />
          {/* Gradasi Atas: Menyambung warna langit bawah Section 2 (#257ce0) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-[#257ce0] via-[#257ce0]/50 to-transparent" />
        </div>

        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">

          {/* KIRI: PETA INTERAKTIF & FILTER CEPAT (7 Kolom) */}
          <motion.div
            {...createAos("left", 0)}
            className="lg:col-span-7 flex flex-col items-center"
          >
            {/* Kanvas Peta */}
            <div className="relative w-full max-w-[450px] aspect-square select-none">
              <Image
                src="/assets/peta-jakarta.png"
                alt="Peta DKI Jakarta"
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)] pointer-events-none"
              />

              <svg
                viewBox="0 0 1000 1000"
                className="absolute inset-0 w-full h-full"
              >
                {JAKARTA_REGIONS.map((region) => {
                  const isSelected = selectedRegion.id === region.id;
                  const isHovered = hoveredRegionId === region.id;

                  return (
                    <g
                      key={region.id}
                      onClick={() => setSelectedRegion(region)}
                      onMouseEnter={() => setHoveredRegionId(region.id)}
                      onMouseLeave={() => setHoveredRegionId(null)}
                      className="cursor-pointer"
                    >
                      <polygon
                        points={region.points}
                        fill={
                          isSelected
                            ? "rgba(249, 115, 22, 0.85)"
                            : isHovered
                              ? "rgba(37, 99, 235, 0.70)"
                              : "rgba(255, 255, 255, 0.01)"
                        }
                        stroke={
                          isSelected || isHovered
                            ? "#FFFFFF"
                            : "rgba(0, 0, 0, 0.12)"
                        }
                        strokeWidth={isSelected || isHovered ? "5" : "1.5"}
                        className="transition-all duration-300 ease-out"
                      />

                      <text
                        x={region.labelPos.x}
                        y={region.labelPos.y}
                        textAnchor="middle"
                        className={`text-[21px] font-bold tracking-tight pointer-events-none transition-colors duration-200 ${
                          isSelected || isHovered
                            ? "fill-white"
                            : "fill-neutral-800/80"
                        }`}
                      >
                        {region.name.replace("Jakarta ", "Jak. ")}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Navigasi Pill Minimalis di Bawah Peta */}
            <div className="flex flex-wrap justify-center gap-1 bg-white/85 backdrop-blur-sm p-1 rounded-full shadow-md mt-1">
              {JAKARTA_REGIONS.map((region) => {
                const active = selectedRegion.id === region.id;
                return (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all ${
                      active
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-700 hover:bg-black/5"
                    }`}
                  >
                    {region.name.replace("Jakarta ", "")}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* KANAN: PANEL DESKRIPSI COMPACT (5 Kolom) */}
          <motion.div
            {...createAos("right", 0.15)}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRegion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-[400px] bg-white rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] text-black"
              >
                {/* Meta Bar Atas */}
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pb-2.5 border-b border-neutral-100">
                  <span>REGION {selectedRegion.index} / 05 — {selectedRegion.code}</span>
                  <span className="text-neutral-600 font-medium">{selectedRegion.area}</span>
                </div>

                {/* Judul Wilayah & Deskripsi */}
                <div className="mt-3">
                  <h3 className="text-2xl font-bold tracking-tight text-black">
                    {selectedRegion.name}
                  </h3>
                  <p className="text-neutral-600 text-xs leading-relaxed mt-1.5">
                    {selectedRegion.summary}
                  </p>
                </div>

                {/* Indikator Wilayah */}
                <div className="mt-4 pt-3.5 border-t border-neutral-100 space-y-2.5">
                  {selectedRegion.metrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-medium text-neutral-600">{metric.label}</span>
                        <span className="font-mono font-bold text-black">{metric.score}/100</span>
                      </div>
                      <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.score}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-black rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Area Populer */}
                <div className="mt-4 pt-3.5 border-t border-neutral-100">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                    Area Pencarian Teratas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRegion.districts.map((district) => (
                      <span
                        key={district}
                        className="px-2.5 py-0.5 rounded-md border border-neutral-200 text-neutral-800 text-[11px] font-medium"
                      >
                        {district}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Kartu: Harga & Tombol CTA */}
                <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Rata-rata Sewa / Bln</span>
                    <span className="text-sm font-bold text-black">{selectedRegion.avgRent}</span>
                  </div>

                  <Link
                    href="#"
                    className="bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-neutral-800 transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Explore Area</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

        </div>
      </section>

    </main>
  );
}