"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    History,
    Trash2,
    ArrowLeft,
    Sparkles,
    LineChart,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Bot,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import InteractiveRadarChart from "../RadarChart";
import { PROFILE_CONFIGS, formatRupiah, getTrafficLightBadge } from "../config";

export default function RiwayatTersimpanPage() {
    const {
        savedList,
        loadingHistory,
        fetchSavedHistory,
        handleDeleteHistory,
        restoreSavedComparison,
    } = useDashboard();

    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchSavedHistory();
    }, [fetchSavedHistory]);

    const toggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-xs leading-tight">
                        Riwayat Analisis Lokasi Tersimpan
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                        Klik pada kartu riwayat untuk melihat grafik detail atau buka
                        kembali simulasi ke ruang kerja aktif.
                    </p>
                </div>

                <Link
                    href="/dashboard"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] hover:border-[#9fcf2d] hover:shadow-[0_8px_20px_rgba(7,115,188,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 border border-[#b6e838] transition-all duration-200 ease-out shrink-0 shadow-xs"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    <span>Buat Riset Baru</span>
                </Link>
            </div>

            {loadingHistory ? (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-10 text-center text-xs text-slate-500 shadow-[0_10px_30px_rgba(7,115,188,0.14)]">
                    Memuat riwayat perbandingan dari database...
                </div>
            ) : savedList.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-8 sm:p-10 text-center space-y-3 shadow-[0_10px_30px_rgba(7,115,188,0.14)]">
                    <div className="w-12 h-12 rounded-2xl bg-[#CDFC56] border border-[#b6e838] text-slate-900 flex items-center justify-center mx-auto">
                        <History className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                        Belum Ada Riwayat Riset yang Disimpan
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Lakukan simulasi pencarian lokasi lalu tekan tombol Simpan Riset
                        pada halaman Konsultasi AI & Laporan.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {savedList.map((item) => {
                        const profileMeta =
                            PROFILE_CONFIGS[item.selected_profile] ||
                            PROFILE_CONFIGS.student_worker;
                        const isExpanded = expandedId === item.id;
                        const districts = Array.isArray(item.top_districts_result)
                            ? item.top_districts_result
                            : [];

                        return (
                            <div
                                key={item.id}
                                className={`bg-white/95 backdrop-blur-md rounded-2xl border transition-all p-4 sm:p-6 shadow-[0_10px_30px_rgba(7,115,188,0.14)] space-y-4 ${
                                    isExpanded
                                        ? "border-[#0773BC] ring-2 ring-[#CDFC56]"
                                        : "border-white/80 hover:border-white"
                                }`}
                            >
                                {/* Baris Header Kartu & Aksi Buka Kembali */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-slate-100 pb-4">
                                    <div
                                        onClick={() => toggleExpand(item.id)}
                                        className="cursor-pointer space-y-1.5"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#CDFC56] text-slate-900 border border-[#b6e838]">
                                                {profileMeta.label}
                                            </span>
                                            <span className="text-xs font-extrabold text-slate-900">
                                                • Wilayah: {item.selected_region}
                                            </span>
                                            <span className="text-xs font-bold text-[#0773BC] bg-[#0773BC]/10 px-2.5 py-0.5 rounded-md">
                                                Budget: {formatRupiah(item.user_budget)}/bln
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Disimpan pada:{" "}
                                            {new Date(item.created_at).toLocaleString("id-ID")}{" "}
                                            • Ketuk untuk {isExpanded ? "menutup" : "melihat"}{" "}
                                            detail grafik
                                        </p>
                                    </div>

                                    {/* Tombol Aksi Buka Lagi & Hapus (Responsif di Handphone) */}
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(item.id)}
                                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Tutup Detail</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Detail Grafik</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                restoreSavedComparison(
                                                    item,
                                                    "/dashboard/komparasi"
                                                )
                                            }
                                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 border border-[#b6e838] shadow-2xs transition cursor-pointer"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                            <span>Buka Riset</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteHistory(item.id)}
                                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/70 transition cursor-pointer shrink-0"
                                            title="Hapus riwayat ini"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Hapus</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Daftar Ringkas Top 3 Kecamatan pada Riwayat */}
                                {districts.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {districts.map((d, idx) => (
                                            <div
                                                key={`${item.id}-${d.district_name}`}
                                                onClick={() => toggleExpand(item.id)}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                                                    idx === 0
                                                        ? "bg-[#F4FCE3] border-[#b6e838]"
                                                        : "bg-slate-50 border-slate-200/70 hover:bg-slate-100/70"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                                            idx === 0
                                                                ? "bg-[#CDFC56] text-slate-900"
                                                                : "bg-white text-[#0773BC] border border-slate-200"
                                                        }`}
                                                    >
                                                        #{idx + 1} {d.city_region}
                                                    </span>
                                                    {typeof d.finalScore === "number" && (
                                                        <span className="text-xs font-extrabold text-[#0773BC]">
                                                            Skor {d.finalScore.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-extrabold text-slate-900 mt-1.5">
                                                    {d.district_name}
                                                </p>
                                                {typeof d.estimatedCost === "number" && (
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Estimasi:{" "}
                                                        <strong className="text-slate-800">
                                                            {formatRupiah(d.estimatedCost)}/bln
                                                        </strong>{" "}
                                                        ({d.isUnderBudget ? "🟢 Underbudget" : "🔴 Overbudget"})
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Ringkasan AI */}
                                <div className="p-3.5 sm:p-4 rounded-xl bg-[#F4FCE3] border border-[#b6e838] flex items-start gap-2.5">
                                    <Sparkles className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                        {item.ai_summary_text}
                                    </p>
                                </div>

                                {/* PANEL DETAIL INTERAKTIF SAAT DIBUKA (EXPANDED) */}
                                {isExpanded && districts.length > 0 && (
                                    <div className="pt-4 border-t border-slate-200 space-y-5 animate-in fade-in duration-200">
                                        {/* Grafik Interaktif Lengkap di Dalam Kartu Riwayat */}
                                        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-extrabold text-slate-900">
                                                        Grafik Komparasi Tersimpan (
                                                        {profileMeta.label})
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500">
                                                        Anda dapat berinteraksi langsung dengan
                                                        grafik ini atau membukanya kembali ke
                                                        ruang kerja.
                                                    </p>
                                                </div>
                                            </div>

                                            <InteractiveRadarChart
                                                districts={districts}
                                                axes={profileMeta.sliders}
                                            />
                                        </div>

                                        {/* Detail Skor Per Indikator Tiap Kecamatan */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                                            {districts.map((district, idx) => (
                                                <div
                                                    key={`detail-${item.id}-${district.district_name}`}
                                                    className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5"
                                                >
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                        <span className="text-xs font-extrabold text-slate-900">
                                                            #{idx + 1} {district.district_name}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-[#0773BC] bg-[#0773BC]/10 px-2 py-0.5 rounded">
                                                            Tier {district.tier_zone}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {profileMeta.sliders.map((slider) => {
                                                            const val =
                                                                Number(district[slider.key]) || 0;
                                                            const badge =
                                                                getTrafficLightBadge(val);
                                                            return (
                                                                <div
                                                                    key={slider.key}
                                                                    className="flex items-center justify-between text-[11px]"
                                                                >
                                                                    <span className="text-slate-600">
                                                                        {slider.shortLabel}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-bold text-slate-900">
                                                                            {val.toFixed(1)}
                                                                        </span>
                                                                        <span
                                                                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${badge.bgClass} ${badge.textClass}`}
                                                                        >
                                                                            {badge.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Baris Pintasan Lanjutan ke Tahap Spesifik */}
                                        <div className="p-3.5 sm:p-4 rounded-xl bg-linear-to-r from-[#064E85] to-[#0773BC] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <span className="text-xs font-bold text-white/90">
                                                Lanjutkan simulasi riset ini di halaman:
                                            </span>
                                            <div className="grid grid-cols-1 sm:flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        restoreSavedComparison(
                                                            item,
                                                            "/dashboard"
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                                                >
                                                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#CDFC56]" />
                                                    <span>Edit Parameter & Slider</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        restoreSavedComparison(
                                                            item,
                                                            "/dashboard/komparasi"
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                                                >
                                                    <LineChart className="w-3.5 h-3.5 text-[#CDFC56]" />
                                                    <span>Halaman Komparasi</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        restoreSavedComparison(
                                                            item,
                                                            "/dashboard/analisis-ai"
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 transition cursor-pointer"
                                                >
                                                    <Bot className="w-3.5 h-3.5" />
                                                    <span>Tanya Chatbot AI</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
