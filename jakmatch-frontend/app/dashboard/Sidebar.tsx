"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    SlidersHorizontal,
    LineChart,
    Sparkles,
    History,
    Menu,
    X,
    UserCircle2,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";
import { formatRupiah } from "./config";

const NAV_ITEMS = [
    {
        step: "01",
        shortTitle: "Parameter",
        label: "Parameter & prioritas",
        desc: "Profil, wilayah, budget & bobot slider",
        href: "/dashboard",
        icon: SlidersHorizontal,
    },
    {
        step: "02",
        shortTitle: "Komparasi",
        label: "Komparasi & Finansial",
        desc: "Grafik kurva & kartu keterjangkauan",
        href: "/dashboard/komparasi",
        icon: LineChart,
    },
    {
        step: "03",
        shortTitle: "Konsultan AI",
        label: "Konsultasi AI & laporan",
        desc: "Analisis kompromi AI & ekspor PNG",
        href: "/dashboard/analisis-ai",
        icon: Sparkles,
    },
    {
        step: "04",
        shortTitle: "Riwayat",
        label: "Riwayat tersimpan",
        desc: "Arsip hasil riset wilayah akun",
        href: "/dashboard/riwayat",
        icon: History,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const {
        activeUser,
        allDistricts,
        currentProfileConfig,
        appliedConfig,
        hasUnappliedChanges,
        topThreeDistricts,
        handleLogout,
    } = useDashboard();

    const renderSidebarContent = () => (
        <div className="flex flex-col justify-between h-full p-5 bg-white border-r border-slate-200 select-none overflow-y-auto">
            <div className="space-y-6">
                {/* Identitas Brand JakMatch sesuai referensi desain */}
                <Link
                    href="/"
                    className="flex items-start gap-3 pb-4 border-b border-slate-100 group"
                >
                    <Image
                        src="/assets/logo-jakmatch.png"
                        alt="Logo JakMatch"
                        width={42}
                        height={42}
                        className="rounded-full object-cover shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                            JakMatch
                        </h1>
                        <span className="mt-1 inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-[#CDFC56] text-slate-900">
                            {currentProfileConfig.personaBadge}
                        </span>
                    </div>
                </Link>

                {/* Menu Alur Kerja (Tahap 01 - 04) */}
                <nav aria-label="Menu Riset Lokasi" className="space-y-2.5">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`group relative flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 ${
                                    isActive
                                        ? "bg-[#CDFC56] text-slate-900 border-[#b8e93e] shadow-xs"
                                        : "bg-white text-slate-800 border-transparent hover:bg-slate-50 hover:border-slate-200"
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                        isActive
                                            ? "bg-white text-slate-900 shadow-2xs"
                                            : "bg-slate-200/75 text-slate-700 group-hover:bg-[#CDFC56]/55 group-hover:text-slate-900"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-extrabold text-slate-900 truncate leading-snug">
                                        {item.label}
                                    </p>
                                    <p
                                        className={`text-[10px] truncate mt-0.5 ${
                                            isActive
                                                ? "text-slate-700 font-medium"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {item.desc}
                                    </p>
                                </div>
                                {item.href === "/dashboard/komparasi" &&
                                    hasUnappliedChanges && (
                                        <span
                                            title="Ada perubahan parameter yang belum di-generate"
                                            className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white shrink-0 animate-pulse"
                                        />
                                    )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Ringkasan Status Dataset (Mengacu Konfigurasi Grafik Saat Ini) */}
                <div className="p-4 rounded-2xl bg-[#EFEFEF]/80 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-300/70">
                        <span className="font-bold text-slate-700">
                            Status Dataset
                        </span>
                        <span className="text-teal-600 font-bold">
                            {allDistricts.length} kecamatan
                        </span>
                    </div>
                    <div className="text-[11px] space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">Wilayah:</span>
                            <span className="font-bold text-slate-900 truncate max-w-[130px]">
                                {appliedConfig.region}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">Budget:</span>
                            <span className="font-bold text-slate-900">
                                {formatRupiah(appliedConfig.budget)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">Kandidat #1:</span>
                            <span className="font-extrabold text-slate-900 px-2 py-0.5 rounded-md bg-[#CDFC56]/70">
                                {topThreeDistricts[0]?.district_name || "Belum Ada"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Pengguna & Tombol Sign Out sesuai referensi gambar */}
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2.5">
                <div className="px-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Akun Terautentikasi
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                        {activeUser.email}
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
                        <UserCircle2 className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex-1 py-2 px-4 rounded-xl text-xs font-extrabold bg-rose-100/90 hover:bg-rose-200/90 text-rose-600 transition cursor-pointer text-center"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Header Bar Responsif untuk Layar Mobile */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5">
                <Link href="/" className="flex items-center gap-2.5">
                    <Image
                        src="/assets/logo-jakmatch.png"
                        alt="Logo JakMatch"
                        width={30}
                        height={30}
                        className="rounded-full object-cover"
                    />
                    <div>
                        <span className="text-sm font-extrabold text-slate-900 block leading-none">
                            JakMatch
                        </span>
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#CDFC56] text-slate-900">
                            {currentProfileConfig.personaBadge}
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        #1: {topThreeDistricts[0]?.district_name || "-"}
                    </span>
                    <button
                        type="button"
                        aria-label="Toggle Menu"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-xl bg-[#CDFC56] text-slate-900 font-bold shadow-2xs"
                    >
                        {mobileOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Sidebar Desktop Tetap di Sisi Kiri */}
            <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0">
                {renderSidebarContent()}
            </aside>

            {/* Drawer Sidebar Overlay untuk Mobile */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="w-72 max-w-[82vw] h-full shadow-2xl">
                        {renderSidebarContent()}
                    </div>
                    <div
                        className="flex-1 bg-slate-900/45 backdrop-blur-xs"
                        onClick={() => setMobileOpen(false)}
                    />
                </div>
            )}

            {/* Bottom Navigation Bar untuk Pengalaman Mobile (Stack UX Cepat) */}
            <nav
                aria-label="Navigasi Cepat Mobile"
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 grid grid-cols-4 gap-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
            >
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={`mob-${item.href}`}
                            href={item.href}
                            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                                isActive
                                    ? "bg-[#CDFC56] text-slate-900 font-extrabold shadow-2xs"
                                    : "text-slate-500 hover:text-slate-900 font-semibold"
                            }`}
                        >
                            <Icon className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px] leading-tight truncate max-w-full">
                                {item.shortTitle}
                            </span>
                            {item.href === "/dashboard/komparasi" &&
                                hasUnappliedChanges && (
                                    <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500" />
                                )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
