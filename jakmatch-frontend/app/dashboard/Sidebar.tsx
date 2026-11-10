"use client";

import React, { useEffect, useState } from "react";
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
    LogOut,
    Trophy,
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

interface SidebarPanelProps {
    pathname: string;
    personaBadge: string;
    districtsCount: number;
    region: string;
    budget: number;
    topDistrictName: string;
    hasUnappliedChanges: boolean;
    userEmail: string;
    onCloseMobile: () => void;
    onLogout: () => void;
}

function SidebarPanel({
    pathname,
    personaBadge,
    districtsCount,
    region,
    budget,
    topDistrictName,
    hasUnappliedChanges,
    userEmail,
    onCloseMobile,
    onLogout,
}: SidebarPanelProps) {
    return (
        <div className="flex flex-col h-full w-full bg-white border-r border-slate-200/90 select-none overflow-hidden">
            {/* 1. Header Brand (Tetap di Atas / Tidak Ikut Ter-scroll) */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3.5 border-b border-slate-100">
                <Link
                    href="/"
                    className="flex items-center gap-3 group min-w-0"
                >
                    <Image
                        src="/assets/logo-jakmatch.png"
                        alt="Logo JakMatch"
                        width={40}
                        height={40}
                        className="rounded-full object-cover shrink-0 shadow-xs ring-2 ring-[#0773BC]/15 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                        <h1 className="text-base xl:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                            JakMatch
                        </h1>
                        <span className="mt-0.5 inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#CDFC56] text-slate-900 truncate max-w-[160px]">
                            {personaBadge}
                        </span>
                    </div>
                </Link>

                <button
                    type="button"
                    aria-label="Tutup Menu"
                    onClick={onCloseMobile}
                    className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* 2. Area Navigasi & Status Dataset (Fleksibel & Responsif terhadap Tinggi Layar Laptop/HP) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3.5 space-y-4">
                <nav aria-label="Menu Riset Lokasi" className="space-y-1.5">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onCloseMobile}
                                className={`group relative flex items-center gap-3 p-2.5 xl:p-3 rounded-2xl border transition-all duration-200 ${
                                    isActive
                                        ? "bg-[#CDFC56] text-slate-900 border-[#b6e838] shadow-[0_6px_16px_rgba(205,252,86,0.35)]"
                                        : "bg-white text-slate-700 border-transparent hover:bg-slate-50 hover:border-slate-200/80"
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                        isActive
                                            ? "bg-white text-[#0773BC] shadow-2xs"
                                            : "bg-slate-100 text-slate-600 group-hover:bg-[#0773BC]/10 group-hover:text-[#0773BC]"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs xl:text-[13px] font-extrabold text-slate-900 truncate leading-snug">
                                        {item.label}
                                    </p>
                                    <p
                                        className={`text-[10px] truncate mt-0.5 ${
                                            isActive
                                                ? "text-slate-700 font-semibold"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {item.desc}
                                    </p>
                                </div>
                                {item.href === "/dashboard/komparasi" &&
                                    hasUnappliedChanges && (
                                        <span
                                            title="Ada perubahan parameter yang belum di-generate"
                                            className="w-2.5 h-2.5 rounded-full bg-[#0773BC] ring-2 ring-white shrink-0 animate-pulse"
                                        />
                                    )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Ringkasan Status Dataset */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200">
                        <span className="font-bold text-slate-700">
                            Status Dataset
                        </span>
                        <span className="text-[#FFFFF] font-extrabold bg-[#0773BC]/10 px-2 py-0.5 rounded-full text-[10px]">
                            {districtsCount} kecamatan
                        </span>
                    </div>
                    <div className="text-[11px] space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">Wilayah:</span>
                            <span className="font-bold text-slate-800 truncate max-w-[125px]">
                                {region}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">Budget:</span>
                            <span className="font-bold text-slate-800">
                                {formatRupiah(budget)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">Kandidat #1:</span>
                            <span className="font-extrabold text-slate-900 px-2 py-0.5 rounded-md bg-[#CDFC56] border border-[#b6e838] truncate max-w-[125px]">
                                {topDistrictName}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Footer Info Pengguna & Sign Out (Tetap di Bawah Sidebar) */}
            <div className="shrink-0 px-4 py-3.5 border-t border-slate-100 bg-white space-y-2">
                <div className="px-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                        Akun Terautentikasi
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate mt-1">
                        {userEmail}
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#0773BC]/10 border border-[#0773BC]/20 flex items-center justify-center text-[#0773BC] shrink-0">
                        <UserCircle2 className="w-5 h-5 stroke-[2]" />
                    </div>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 transition cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

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

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const topDistrictName =
        topThreeDistricts[0]?.district_name || "Belum Ada";

    return (
        <>
            {/* Header Bar Responsif untuk Layar Mobile & Tablet (< 1024px) */}
            <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 py-2.5 shadow-2xs">
                <Link href="/" className="flex items-center gap-2.5 min-w-0">
                    <Image
                        src="/assets/logo-jakmatch.png"
                        alt="Logo JakMatch"
                        width={32}
                        height={32}
                        className="rounded-full object-cover shrink-0 ring-2 ring-[#0773BC]/15"
                    />
                    <div className="min-w-0">
                        <span className="text-sm font-extrabold text-slate-900 block leading-none">
                            JakMatch
                        </span>
                        <span className="inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#CDFC56] text-slate-900 truncate max-w-[135px] sm:max-w-none">
                            {currentProfileConfig.personaBadge}
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl bg-[#0773BC]/10 text-[#0773BC] max-w-[130px] sm:max-w-none">
                        <Trophy className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                            {topThreeDistricts[0]?.district_name || "-"}
                        </span>
                    </div>
                    <button
                        type="button"
                        aria-label="Toggle Menu"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-xl bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 font-bold shadow-2xs transition cursor-pointer"
                    >
                        {mobileOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </header>

            {/* Sidebar Desktop Tetap Terkunci di Kiri */}
            <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 lg:h-dvh z-30">
                <SidebarPanel
                    pathname={pathname}
                    personaBadge={currentProfileConfig.personaBadge}
                    districtsCount={allDistricts.length}
                    region={appliedConfig.region}
                    budget={appliedConfig.budget}
                    topDistrictName={topDistrictName}
                    hasUnappliedChanges={hasUnappliedChanges}
                    userEmail={activeUser.email}
                    onCloseMobile={() => setMobileOpen(false)}
                    onLogout={handleLogout}
                />
            </aside>

            {/* Drawer Sidebar Overlay untuk Mobile & Tablet */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="w-72 max-w-[84vw] h-dvh shadow-2xl animate-in slide-in-from-left duration-200">
                        <SidebarPanel
                            pathname={pathname}
                            personaBadge={currentProfileConfig.personaBadge}
                            districtsCount={allDistricts.length}
                            region={appliedConfig.region}
                            budget={appliedConfig.budget}
                            topDistrictName={topDistrictName}
                            hasUnappliedChanges={hasUnappliedChanges}
                            userEmail={activeUser.email}
                            onCloseMobile={() => setMobileOpen(false)}
                            onLogout={handleLogout}
                        />
                    </div>
                    <div
                        className="flex-1 bg-slate-950/50 backdrop-blur-xs"
                        onClick={() => setMobileOpen(false)}
                    />
                </div>
            )}

            {/* Bottom Navigation Bar untuk Pengalaman Mobile */}
            <nav
                aria-label="Navigasi Cepat Mobile"
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] grid grid-cols-4 gap-1.5 shadow-[0_-8px_24px_rgba(7,115,188,0.10)]"
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
                                    : "text-slate-500 hover:text-[#0773BC] font-semibold"
                            }`}
                        >
                            <Icon
                                className={`w-4 h-4 mb-0.5 ${
                                    isActive ? "text-slate-900" : "text-slate-500"
                                }`}
                            />
                            <span className="text-[10px] leading-tight truncate max-w-full">
                                {item.shortTitle}
                            </span>
                            {item.href === "/dashboard/komparasi" &&
                                hasUnappliedChanges && (
                                    <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-[#0773BC] ring-2 ring-white animate-pulse" />
                                )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
