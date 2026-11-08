"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    AlertTriangle,
    Sparkles,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import InteractiveRadarChart from "../RadarChart";
import { formatRupiah, getTrafficLightBadge } from "../config";

export default function KomparasiFinansialPage() {
    const {
        appliedProfileConfig,
        appliedConfig,
        hasUnappliedChanges,
        topThreeDistricts,
        totalFilteredCount,
        setBudgetLock,
        setSelectedRegion,
        generateComparisonGraph,
    } = useDashboard();

    return (
        <div className="space-y-6">
            {/* Header & Navigasi Tahap */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#CDFC56] text-slate-900 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                        Tahap 02 • Visualisasi Spasial & Keterjangkauan
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-xs mt-1.5">
                        Grafik Komparasi & Status Finansial Kecamatan
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                        Membandingkan {topThreeDistricts.length} kecamatan terbaik dari{" "}
                        {totalFilteredCount} kandidat hasil generate grafik terakhir.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Ubah Parameter
                    </Link>
                    <Link
                        href="/dashboard/analisis-ai"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 shadow-xs transition"
                    >
                        Lanjut ke Analisis AI
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Banner Pemberitahuan jika Ada Perubahan Slider yang Belum Di-Generate */}
            {hasUnappliedChanges && (
                <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xs border-2 border-[#CDFC56] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 text-xs text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 mt-1 sm:mt-0 shrink-0 animate-pulse" />
                        <span>
                            Grafik di bawah masih menampilkan hasil generate sebelumnya. Anda
                            memiliki perubahan slider/parameter baru yang belum di-generate.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={generateComparisonGraph}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#CDFC56] text-slate-900 hover:bg-[#b8e840] transition cursor-pointer shrink-0"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Grafik Sekarang
                    </button>
                </div>
            )}

            {/* Empty State jika Budget Lock Menyaring Habis Kecamatan */}
            {topThreeDistricts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 text-center shadow-xs space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div className="max-w-lg mx-auto space-y-1.5">
                        <h3 className="text-base font-bold text-slate-900">
                            Maaf, Anggaran Berada di Bawah Rata-Rata Wilayah Ini
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Anggaran{" "}
                            <span className="font-bold text-slate-900">
                                {formatRupiah(appliedConfig.budget)}
                            </span>{" "}
                            untuk kategori{" "}
                            <span className="font-semibold">
                                {appliedProfileConfig.assetLabel}
                            </span>{" "}
                            belum mencukupi estimasi sewa di{" "}
                            <span className="font-bold text-slate-900">
                                {appliedConfig.region}
                            </span>
                            . Silakan kembali ke halaman Parameter untuk menyesuaikan anggaran
                            atau matikan kunci anggaran lalu klik Generate Grafik.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link
                            href="/dashboard"
                            onClick={() => {
                                setBudgetLock(false);
                                setSelectedRegion("Semua Wilayah");
                            }}
                            className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#CDFC56] text-slate-900 hover:bg-[#b8e840] transition cursor-pointer"
                        >
                            Sesuaikan Parameter & Generate Ulang
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* Kartu Grafik Komparasi Ukuran Penuh */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Grafik Komparasi Indikator Kecamatan (Skala 0–100)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Pilih mode Kurva Area, Radar Poligon, atau Mode Vertikal,
                                    dan arahkan kursor/ketuk untuk membandingkan angka.
                                </p>
                            </div>
                        </div>

                        <InteractiveRadarChart
                            districts={topThreeDistricts}
                            axes={appliedProfileConfig.sliders}
                        />
                    </div>

                    {/* 3 Kartu Keterjangkauan Finansial (Affordability Cards) */}
                    <div className="space-y-3">
                        <div className="bg-white/95 backdrop-blur-xs rounded-xl border border-white/60 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">
                                Kartu Keterjangkauan Finansial & Indikator Traffic Light
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Hijau: Ideal (≥85)
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    Kuning: Sedang (76–84)
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    Merah: Kurang (&lt;76)
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {topThreeDistricts.map((district, index) => (
                                <div
                                    key={district.id}
                                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition ${
                                        index === 0
                                            ? "border-slate-900 ring-2 ring-[#CDFC56]"
                                            : "border-slate-200"
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="inline-block px-2 py-0.5 rounded bg-[#CDFC56] text-slate-900 text-[10px] font-extrabold uppercase tracking-wider">
                                                    Peringkat #{index + 1} • Tier{" "}
                                                    {district.tier_zone}
                                                </span>
                                                <h4 className="text-base font-extrabold text-slate-900 mt-1.5">
                                                    {district.district_name}
                                                </h4>
                                                <p className="text-xs text-slate-500">
                                                    {district.city_region}
                                                </p>
                                            </div>
                                            <div className="text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                <span className="block text-[10px] font-semibold uppercase text-slate-400">
                                                    Skor Akhir
                                                </span>
                                                <span className="text-lg font-extrabold text-slate-900">
                                                    {district.finalScore.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">
                                                    Estimasi Pasar:
                                                </span>
                                                <span className="font-bold text-slate-900">
                                                    {formatRupiah(district.estimatedCost)}/bln
                                                </span>
                                            </div>

                                            {district.isUnderBudget ? (
                                                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                                                    🟢 Underbudget: Hemat{" "}
                                                    {formatRupiah(Math.abs(district.budgetDiff))}{" "}
                                                    dari budget Anda
                                                </div>
                                            ) : (
                                                <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                                                    🔴 Overbudget: Kurang{" "}
                                                    {formatRupiah(Math.abs(district.budgetDiff))}{" "}
                                                    dari budget Anda
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-100">
                                        {appliedProfileConfig.sliders.map((slider) => {
                                            const scoreVal =
                                                Number(district[slider.key]) || 0;
                                            const badge =
                                                getTrafficLightBadge(scoreVal);
                                            const userWeight =
                                                appliedConfig.weights[slider.key] ?? 50;
                                            return (
                                                <div
                                                    key={`${district.id}-${slider.key}`}
                                                    className="flex items-center justify-between text-xs"
                                                >
                                                    <span className="text-slate-600">
                                                        {slider.shortLabel}{" "}
                                                        <span className="text-[10px] text-slate-400">
                                                            ({userWeight}%)
                                                        </span>
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900">
                                                            {scoreVal.toFixed(1)}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bgClass} ${badge.textClass}`}
                                                        >
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}
                                                            />
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
                    </div>
                </>
            )}
        </div>
    );
}
