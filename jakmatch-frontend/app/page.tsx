"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Daftar kartu fitur Dashboard untuk 3D Curved Carousel di Hero Section
const DASHBOARD_CARDS = [
  {
    id: "param",
    title: "Parameter & Bobot Prioritas",
    tag: "Smart Budget Lock",
    src: "/assets/dashboard-1.png",
  },
  {
    id: "grafik",
    title: "Grafik Komparasi Kecamatan",
    tag: "Skala Indikator 0–100",
    src: "/assets/dashboard-2.png",
  },
  {
    id: "finansial",
    title: "Keterjangkauan & Traffic Light",
    tag: "Top 3 Kandidat Wilayah",
    src: "/assets/dashboard-3.png",
  },
  {
    id: "laporan",
    title: "Laporan Keputusan & Ekspor PNG",
    tag: "Ringkasan Eksekutif",
    src: "/assets/dashboard-4.png",
  },
  {
    id: "aichat",
    title: "JakMatch AI Spatial Assistant",
    tag: "Strict JSON-Locked AI",
    src: "/assets/dashboard-5.png",
  },
  {
    id: "riwayat",
    title: "Riwayat Analisis Tersimpan",
    tag: "Arsip Riset Akun",
    src: "/assets/dashboard-6.png",
  },
];

// Duplikasi array menjadi 12 item agar perputaran lengkung 3D tidak pernah putus di tepi layar
const CAROUSEL_ITEMS = [...DASHBOARD_CARDS, ...DASHBOARD_CARDS];

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
    points:
      "135,130 165,118 260,165 370,180 415,155 500,195 620,165 700,145 820,160 940,128 945,300 885,315 845,290 795,318 660,310 575,280 550,235 505,265 475,245 410,240 410,285 350,285 250,260 165,200",
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
    districts: [
      "Kebon Jeruk",
      "Grogol Petamburan",
      "Kembangan",
      "Tanjung Duren",
    ],
    points:
      "60,145 135,130 165,200 250,260 350,285 410,285 410,240 475,245 495,300 400,308 440,360 435,405 380,435 382,480 335,480 335,498 150,490 165,410 138,410 140,355 60,325",
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
    points:
      "475,245 505,265 550,235 575,280 660,310 640,355 650,405 595,430 570,462 470,435 380,435 435,405 440,360 400,308 495,300",
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
    points:
      "225,492 335,498 335,480 382,480 380,435 470,435 570,462 605,490 590,560 608,600 555,650 585,705 528,735 525,775 385,815 425,695 330,695 305,625 265,595 255,520",
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
    points:
      "660,310 795,318 845,290 885,315 945,300 945,400 915,485 860,495 820,550 735,555 765,620 790,725 768,805 680,838 585,765 525,775 528,735 585,705 555,650 608,600 590,560 605,490 570,462 595,430 650,405 640,355",
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
  const mainRef = useRef<HTMLDivElement>(null);

  // Refs untuk animasi 3D Curved Carousel di Hero Section
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isCarouselPausedRef = useRef(false);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    };

    const el = mainRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Engine Animasi Pergeseran Lengkung 3D (60 FPS Hardware-Accelerated)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let progress = 0;
    let currentSpeed = 0.42; // Kecepatan geser kartu per detik
    const totalItems = CAROUSEL_ITEMS.length;
    const halfItems = totalItems / 2;

    const animateCarousel = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Melambat halus saat kursor diarahkan ke area kartu
      const targetSpeed = isCarouselPausedRef.current ? 0.05 : 0.42;
      currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 6);
      progress = (progress + currentSpeed * dt) % totalItems;

      const isMobile = window.innerWidth < 640;
      const isTablet = window.innerWidth < 1024;
      const spacingX = isMobile ? 230 : isTablet ? 290 : 330;

      for (let i = 0; i < totalItems; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // Hitung posisi relatif tiap kartu terhadap titik tengah [-6, +6]
        let offset = (i - progress) % totalItems;
        if (offset < -halfItems) offset += totalItems;
        if (offset > halfItems) offset -= totalItems;

        const absOffset = Math.abs(offset);

        // Sembunyikan kartu yang berada di luar jangkauan pandang lengkungan
        if (absOffset > 3.7) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          el.style.transform = "translate3d(0px, 100px, -600px) scale(0.5)";
          continue;
        }

        // Geometri Lengkungan 3D (Panorama Melengkung seperti Referensi)
        const translateX = offset * spacingX;
        const translateY = Math.pow(absOffset, 1.75) * (isMobile ? 6 : 10);
        const translateZ = -Math.pow(absOffset, 1.3) * (isMobile ? 38 : 60);
        const rotateY = offset * -12;
        const rotateZ = offset * 1.2;
        const scale = Math.max(0.78, 1 - absOffset * 0.055);

        const opacity =
          absOffset > 2.85 ? Math.max(0, (3.65 - absOffset) / 0.8) : 1;

        el.style.opacity = opacity.toFixed(3);
        el.style.pointerEvents = absOffset < 2.6 ? "auto" : "none";
        el.style.zIndex = String(Math.round(100 - absOffset * 20));
        el.style.transform = `translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      }

      animationFrameId = requestAnimationFrame(animateCarousel);
    };

    animationFrameId = requestAnimationFrame(animateCarousel);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <main
      ref={mainRef}
      className="relative w-full flex flex-col font-sans overflow-x-hidden h-screen overflow-y-scroll snap-y snap-mandatory snap-container"
    >
      {/* ========================================= */}
      {/* SMART NAVBAR (Tanpa Efek Blur / Background) */}
      {/* ========================================= */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 bg-transparent transition-transform duration-300 ease-in-out ${
          isScrolling ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/assets/logo-jakmatch.png"
            alt="Logo Jakmatch"
            width={36}
            height={36}
            className="object-cover rounded-full drop-shadow-md"
          />
          <div className="flex items-center font-semibold tracking-wide drop-shadow-md">
            <div className="text-xl text-[#297add]">Jak</div>
            <div className="text-xl text-white">Match</div>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-[#E5E5E5] rounded-full p-1.5 shadow-sm">
          <Link
            href="#home"
            className="bg-black text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-wide"
          >
            HOME
          </Link>
          <Link
            href="#features"
            className="text-gray-900 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-black/5 transition tracking-wide"
          >
            SERVICES
          </Link>
          <Link
            href="/about"
            className="text-gray-900 px-5 py-1.5 rounded-full text-xs font-bold hover:bg-black/5 transition tracking-wide"
          >
            ABOUTUS
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/login"
            className="relative text-white text-sm font-medium transition drop-shadow-md after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-white hover:after:w-full after:transition-all after:duration-300"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="bg-black text-white px-4 sm:px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* ========================================= */}
      {/* SECTION 1: HERO & 3D CURVED DASHBOARD     */}
      {/* ========================================= */}
      <section
        className="relative isolate h-screen w-full flex flex-col justify-between shrink-0 snap-start overflow-hidden"
        id="home"
      >
        <div className="absolute inset-0 -z-10 bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-90"
          >
            <source src="/assets/landing-bg.mp4" type="video/mp4" />
          </video>
          {/* Gradasi penyatu dari akhir Section 1 menuju warna langit Section berikutnya */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#09489c]/65 to-[#0773BC]" />
        </div>

        {/* Hero Copywriting & CTA */}
        <div className="flex flex-col items-center justify-center text-center mt-24 sm:mt-28 lg:mt-28 px-4 z-20">
          <motion.h1
            {...createAos("up", 0)}
            className="text-[clamp(2rem,4vw,3.75rem)] leading-[1.05] font-bold text-white mb-4 sm:mb-5 tracking-wide drop-shadow-sm"
          >
            Live where you feel
            <br className="hidden sm:block" /> comfortable.
          </motion.h1>

          <motion.p
            {...createAos("up", 0.1)}
            className="text-white max-w-2xl text-sm sm:text-base lg:text-lg mb-5 sm:mb-6 font-medium drop-shadow-md"
          >
            We provide this platform for those of you who are struggling to find
            a comfortable place to live.
          </motion.p>

          <motion.div
            {...createAos("up", 0.2)}
            className="flex flex-wrap justify-center gap-3 sm:gap-4"
          >
            <Link
              href="/register"
              className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg"
            >
              Sign Up
            </Link>
            <Link
              href="/dashboard"
              className="bg-white text-black px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-100 transition shadow-lg"
            >
              Try Free Now
            </Link>
          </motion.div>
        </div>

        {/* 3D CURVED DASHBOARD SHOWCASE (Menggantikan Kotak Putih Statis) */}
        <motion.div
          {...createAos("zoom", 0.25)}
          onMouseEnter={() => {
            isCarouselPausedRef.current = true;
          }}
          onMouseLeave={() => {
            isCarouselPausedRef.current = false;
          }}
          className="relative z-10 flex-1 w-full flex flex-col items-center justify-center pb-6 sm:pb-8 select-none"
        >
          {/* Panggung Perspektif 3D */}
          <div
            className="relative w-full h-[210px] sm:h-[245px] lg:h-[275px] flex items-center justify-center"
            style={{
              perspective: "1300px",
              transformStyle: "preserve-3d",
            }}
          >
           {CAROUSEL_ITEMS.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                style={{
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                }}
                className="group absolute w-[205px] sm:w-[255px] lg:w-[295px] h-[155px] sm:h-[190px] lg:h-[215px] rounded-[20px] bg-white/80 p-[1.5px] shadow-[0_24px_50px_rgba(4,25,66,0.38)] cursor-pointer transition-shadow duration-300 hover:shadow-[0_28px_65px_rgba(205,252,86,0.45)]"
              >
                <Link
                  href="/dashboard"
                  className="relative block w-full h-full rounded-[18.5px] overflow-hidden bg-slate-900"
                >
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 210px, (max-width: 1024px) 260px, 300px"
                    className="object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradasi Halus & Label Fitur di Bawah Kartu */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08152C]/95 via-[#08152C]/65 to-transparent pt-7 pb-2.5 px-3 flex flex-col justify-end">
                    <span className="inline-block w-fit text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#CDFC56] text-neutral-950 mb-1 shadow-sm">
                      {item.tag}
                    </span>
                    <p className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate drop-shadow">
                      {item.title}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Caption & Rating Bintang ala Referensi Gambar */}
          <div className="mt-2 sm:mt-3 flex flex-col items-center text-center z-20">
            <p className="text-xs sm:text-sm font-semibold text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
              Integrated Spatial Analytics across 42 Districts in DKI Jakarta
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-[#FACC15] drop-shadow-[0_2px_6px_rgba(250,204,21,0.65)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================= */}
      {/* SECTION 3: FITUR UNGGULAN JAKMATCH        */}
      {/* ========================================= */}
      <section
        id="features"
        aria-label="Fitur Unggulan JakMatch"
        className="relative isolate min-h-dvh w-full flex flex-col justify-between pt-24 sm:pt-28 lg:pt-24 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-12 xl:px-16 overflow-x-hidden shrink-0 snap-start bg-gradient-to-b from-[#0773BC] to-[#81D8FF] text-white"
      >
        {/* Dekorasi Ambient Cahaya & Grid Spasial */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[320px] sm:w-[560px] lg:w-[780px] h-[240px] sm:h-[320px] rounded-full bg-[#297add]/20 blur-[100px] sm:blur-[120px]" />
          <div className="absolute bottom-0 right-0 sm:right-10 w-[260px] sm:w-[420px] h-[200px] sm:h-[260px] rounded-full bg-[#CDFC56]/15 blur-[90px] sm:blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="w-full max-w-7xl mx-auto my-auto py-4 lg:py-2 z-10">
          {/* Header Section Fitur Unggulan */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 lg:mb-6">
            <motion.div
              {...createAos("up", 0)}
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#CDFC56] mb-2.5"
            >
              <span className="w-2 h-2 rounded-full bg-[#CDFC56] animate-pulse shrink-0" />
              <span className="truncate">
                Core Location Intelligence • Fitur Unggulan
              </span>
            </motion.div>

            <motion.h2
              {...createAos("up", 0.08)}
              className="text-2xl sm:text-3xl lg:text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold tracking-tight leading-tight text-white"
            >
              Instrumen Keputusan Spasial{" "}
              <span className="text-[#CDFC56]">Berbasis Data & AI</span>
            </motion.h2>

            <motion.p
              {...createAos("up", 0.14)}
              className="text-neutral-300 text-xs sm:text-sm leading-relaxed mt-2 max-w-2xl mx-auto"
            >
              Menjembatani kompleksitas data 42 kecamatan DKI Jakarta menjadi
              rekomendasi lokasi hunian maupun ekspansi bisnis yang objektif,
              transparan, dan terukur.
            </motion.p>
          </div>

          {/* Grid 4 Kartu Fitur Unggulan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            {/* Fitur 01 */}
            <motion.div
              {...createAos("up", 0.1)}
              className="group relative rounded-2xl sm:rounded-3xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-[#CDFC56]/50 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#CDFC56] text-neutral-950 flex items-center justify-center font-mono font-black text-xs sm:text-sm shadow-md shrink-0">
                    01
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 text-right">
                    3 Persona Profil
                  </span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-[17px] font-bold text-[#FFFFFF] group-hover:text-[#161616] transition-colors leading-snug">
                  Personal Priority & Smart Budget Lock
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mt-1.5 sm:mt-2">
                  Kustomisasi bobot prioritas 0%–100% sesuai profil{" "}
                  <strong className="text-white">
                    Mahasiswa/Pekerja, Keluarga, atau UMKM
                  </strong>{" "}
                  dengan fitur pengunci plafon anggaran otomatis.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Kalkulasi Real-Time</span>
                <span className="text-[#CDFC56] font-bold">Custom Bobot</span>
              </div>
            </motion.div>

            {/* Fitur 02 */}
            <motion.div
              {...createAos("up", 0.18)}
              className="group relative rounded-2xl sm:rounded-3xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-[#CDFC56]/50 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#297add] text-white flex items-center justify-center font-mono font-black text-xs sm:text-sm shadow-md shrink-0">
                    02
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 text-right">
                    42 Kecamatan BPS
                  </span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-[17px] font-bold text-white group-hover:text-[#CDFC56] transition-colors leading-snug">
                  Multi-Mode Spatial & Radar Analytics
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mt-1.5 sm:mt-2">
                  Bandingkan Top 3 kecamatan lewat visualisasi{" "}
                  <strong className="text-white">
                    Kurva Area, Radar Poligon, & Mode Vertikal
                  </strong>{" "}
                  lengkap dengan indikator keterjangkauan{" "}
                  <em>Traffic Light</em>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>5 Indikator Vital</span>
                <span className="text-[#297add] font-bold">Skala 0–100</span>
              </div>
            </motion.div>

            {/* Fitur 03 */}
            <motion.div
              {...createAos("up", 0.26)}
              className="group relative rounded-2xl sm:rounded-3xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-[#CDFC56]/50 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#CDFC56] text-neutral-950 flex items-center justify-center font-mono font-black text-xs sm:text-sm shadow-md shrink-0">
                    03
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 text-right">
                    Anti-Halusinasi
                  </span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-[17px] font-bold text-white group-hover:text-[#CDFC56] transition-colors leading-snug">
                  Generative AI Trade-Off Synthesizer
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mt-1.5 sm:mt-2">
                  Konsultan AI berbasis{" "}
                  <strong className="text-white">
                    Strict JSON-Locked Prompt
                  </strong>{" "}
                  yang menganalisis kompromi harga sewa vs kualitas fasilitas
                  secara dinamis dan personal.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Streaming Insight</span>
                <span className="text-[#CDFC56] font-bold">100% Akurat</span>
              </div>
            </motion.div>

            {/* Fitur 04 */}
            <motion.div
              {...createAos("up", 0.34)}
              className="group relative rounded-2xl sm:rounded-3xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-[#CDFC56]/50 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#297add] text-white flex items-center justify-center font-mono font-black text-xs sm:text-sm shadow-md shrink-0">
                    04
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 text-right">
                    Cloud & PNG Export
                  </span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-[17px] font-bold text-white group-hover:text-[#CDFC56] transition-colors leading-snug">
                  Ekspor Laporan Resmi & Riwayat Akun
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mt-1.5 sm:mt-2">
                  Unduh kanvas laporan keputusan beresolusi tinggi dalam format{" "}
                  <strong className="text-white">PNG sekali klik</strong> serta
                  simpan riwayat simulasi ke database akun Anda.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Arsip Permanen</span>
                <span className="text-[#297add] font-bold">
                  Siap Presentasi
                </span>
              </div>
            </motion.div>
          </div>

          {/* CTA Bar Menuju Ruang Kerja Dashboard */}
          <motion.div
            {...createAos("zoom", 0.4)}
            className="mt-5 sm:mt-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#11192E] via-[#15223F] to-[#11192E] border border-white/15 p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-2xl"
          >
            <div className="text-center lg:text-left">
              <h4 className="text-sm sm:text-base font-bold text-white">
                Siap menemukan lokasi paling ideal sesuai budget dan prioritas
                Anda?
              </h4>
              <p className="text-xs text-neutral-300 mt-0.5">
                Mulai simulasi parameter wilayah DKI Jakarta dan dapatkan
                rekomendasi AI sekarang.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-[#CDFC56] hover:bg-[#b8e840] text-neutral-950 text-xs font-extrabold tracking-wide text-center transition shadow-lg"
              >
                Buka Dashboard Analitik
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold tracking-wide text-center transition"
              >
                Buat Akun Gratis
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================= */}
      {/* SECTION 4: INTERACTIVE MAP (COMPACT CARD) */}
      {/* ========================================= */}
      <section
        className="relative isolate h-screen w-full flex items-center justify-center pt-24 sm:pt-28 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-12 xl:px-16 overflow-hidden shrink-0 snap-start"
        id="abouts"
      >
        {/* Background Padang Rumput & Langit + Gradasi Penyatu */}
        <div className="absolute inset-0 -z-20">
          <Image
            src="/assets/landing-bg2.jpeg"
            alt="Background Peta Jakarta"
            fill
            sizes="100vw"
            className="object-cover object-center pointer-events-none"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-[#81D8FF] via-[#257ce0]/50 to-transparent" />
        </div>

        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 items-center z-10">
          {/* KIRI: PETA INTERAKTIF & FILTER CEPAT (7 Kolom) */}
          <motion.div
            {...createAos("left", 0)}
            className="lg:col-span-7 flex flex-col items-center"
          >
            {/* Kanvas Peta */}
            <div className="relative w-full max-w-[450px] lg:max-w-[520px] xl:max-w-[600px] aspect-square select-none">
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
                className="w-full max-w-[400px] lg:max-w-[460px] xl:max-w-[520px] bg-white rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] text-black"
              >
                {/* Meta Bar Atas */}
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pb-2.5 border-b border-neutral-100">
                  <span>
                    REGION {selectedRegion.index} / 05 — {selectedRegion.code}
                  </span>
                  <span className="text-neutral-600 font-medium">
                    {selectedRegion.area}
                  </span>
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
                        <span className="font-medium text-neutral-600">
                          {metric.label}
                        </span>
                        <span className="font-mono font-bold text-black">
                          {metric.score}/100
                        </span>
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
                    <span className="text-[10px] text-neutral-400 block">
                      Rata-rata Sewa / Bln
                    </span>
                    <span className="text-sm font-bold text-black">
                      {selectedRegion.avgRent}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-neutral-800 transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Explore Area</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ========================================= */}
      {/* FOOTER LANDING PAGE JAKMATCH              */}
      {/* ========================================= */}
      <footer
        aria-label="Footer JakMatch"
        className="relative isolate w-full bg-[#0B1526] text-white pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-12 xl:px-16 shrink-0 snap-end border-t border-white/10 select-none overflow-hidden"
      >
        {/* Aksen Cahaya Halus di Latar Footer */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 left-1/4 w-72 sm:w-96 h-48 rounded-full bg-[#0773BC]/25 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-64 sm:w-80 h-40 rounded-full bg-[#CDFC56]/10 blur-[90px]" />
        </div>

        <div className="w-full max-w-7xl mx-auto">
          {/* Grid Utama Footer (Responsif 1 -> 2 -> 12 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-white/10">
            {/* Kolom 1: Brand & Deskripsi (4 Kolom di Desktop) */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-4">
              <Link
                href="#home"
                className="inline-flex items-center gap-2.5 group"
              >
                <Image
                  src="/assets/logo-jakmatch.png"
                  alt="Logo JakMatch"
                  width={38}
                  height={38}
                  className="rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="flex items-center text-xl font-extrabold tracking-tight">
                  <span className="text-[#297add]">Jak</span>
                  <span className="text-white">Match</span>
                </div>
              </Link>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                Platform intelijen lokasi (<em>Smart Location Intelligence</em>)
                berbasis data spasial 42 kecamatan DKI Jakarta &amp; Generative
                AI untuk membantu Anda menemukan hunian maupun lokasi usaha
                paling ideal sesuai anggaran.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#CDFC56]">
                <span className="w-2 h-2 rounded-full bg-[#CDFC56] animate-pulse" />
                <span>42 Kecamatan DKI Jakarta • Real-Time Analytics</span>
              </div>
            </div>

            {/* Kolom 2: Navigasi Halaman (2 Kolom di Desktop) */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#CDFC56]">
                Navigasi
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li>
                  <Link
                    href="#home"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Fitur Unggulan
                  </Link>
                </li>
                <li>
                  <Link
                    href="#abouts"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Peta Interaktif
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Tentang Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Fitur Ruang Kerja (3 Kolom di Desktop) */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#CDFC56]">
                Ruang Kerja Analitik
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Parameter &amp; Bobot Prioritas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/komparasi"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Komparasi Radar &amp; Finansial
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/analisis-ai"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Konsultan AI Multimodal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/riwayat"
                    className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
                  >
                    Riwayat Riset Tersimpan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 4: Cakupan Wilayah & CTA Akun (3 Kolom di Desktop) */}
            <div className="sm:col-span-2 lg:col-span-3 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#CDFC56]">
                Mulai Riset Lokasi
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mencakup seluruh 5 wilayah administrasi: Jakarta Pusat, Jakarta
                Selatan, Jakarta Barat, Jakarta Timur, dan Jakarta Utara.
              </p>

              <div className="flex flex-wrap sm:flex-nowrap lg:flex-col xl:flex-row gap-2.5 pt-1">
                <Link
                  href="/dashboard"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#CDFC56] hover:bg-[#b8e840] text-[#0B1526] text-xs font-extrabold text-center transition shadow-md"
                >
                  Buka Dashboard
                </Link>
                <Link
                  href="/login"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold text-center transition"
                >
                  Masuk Akun
                </Link>
              </div>
            </div>
          </div>

          {/* Baris Hak Cipta & Informasi Dataset Bawah */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-400 text-center sm:text-left">
            <p>
              © 2026 <strong className="text-white">JakMatch</strong> — Smart
              Location Intelligence Platform DKI Jakarta. All rights reserved.
            </p>
            <p className="font-mono text-[11px] text-slate-400">
              Powered by BPS Spatial Dataset &amp; Generative AI
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}