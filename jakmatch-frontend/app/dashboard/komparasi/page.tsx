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
        <div className="space-y-5 sm:space-y-6">
            {/* Header & Navigasi Tahap */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-xs leading-tight">
                        Grafik Komparasi & Status Finansial Kecamatan
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                        Membandingkan {topThreeDistricts.length} kecamatan terbaik dari{" "}
                        {totalFilteredCount} kandidat hasil generate grafik terakhir.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                    <Link
                        href="/dashboard"
                        className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] text-[#161616] border border-[#b6e838] hover:border-[#b8e840] shadow-[0_6px_20px_rgba(7,115,188,0.18)] hover:shadow-[0_10px_26px_rgba(7,115,188,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0773BC] transition-all duration-200 ease-out shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        <span className="truncate">Ubah Parameter</span>
                    </Link>

                    <Link
                        href="/dashboard/analisis-ai"
                        className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white hover:bg-[#CDFC56] text-slate-900 border border-white/80 hover:border-[#b6e838] shadow-[0_6px_20px_rgba(7,115,188,0.18)] hover:shadow-[0_10px_26px_rgba(7,115,188,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0773BC] transition-all duration-200 ease-out shrink-0"
                    >
                        <span className="truncate">Lanjut Analisis AI</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Banner Pemberitahuan jika Ada Perubahan Slider yang Belum Di-Generate */}
            {hasUnappliedChanges && (
                <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-[#CDFC56] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 text-xs text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0773BC] mt-1 sm:mt-0 shrink-0 animate-pulse" />
                        <span>
                            Grafik di bawah masih menampilkan hasil generate sebelumnya. Anda
                            memiliki perubahan slider/parameter baru yang belum di-generate.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={generateComparisonGraph}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-extrabold bg-[#CDFC56] text-slate-900 hover:bg-[#b8e840] border border-[#b6e838] transition cursor-pointer shrink-0"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Grafik Sekarang</span>
                    </button>
                </div>
            )}

            {/* Empty State jika Budget Lock Menyaring Habis Kecamatan */}
            {topThreeDistricts.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200 p-6 sm:p-8 text-center shadow-[0_10px_30px_rgba(7,115,188,0.14)] space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div className="max-w-lg mx-auto space-y-1.5">
                        <h3 className="text-base font-extrabold text-slate-900">
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
                            className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#CDFC56] text-slate-900 hover:bg-[#b8e840] border border-[#b6e838] transition cursor-pointer"
                        >
                            Sesuaikan Parameter & Generate Ulang
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* Kartu Grafik Komparasi Ukuran Penuh */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 sm:p-6 shadow-[0_10px_30px_rgba(7,115,188,0.14)]">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    Grafik Komparasi Indikator Kecamatan (Skala 0–100)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
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
                    <div className="space-y-3.5">
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 px-4 py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <h3 className="text-sm font-extrabold text-slate-900">
                                Kartu Keterjangkauan Finansial & Indikator Traffic Light
                            </h3>
                                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-[11px] font-bold text-slate-600">
                                    <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        Ideal (≥85)
                                    </span>
                                    <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                        Sedang (76–84)
                                    </span>
                                    <span className="inline-flex items-center bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                        Kurang (&lt;76)
                                    </span>
                                </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                            {topThreeDistricts.map((district, index) => (
                                <div
                                    key={district.id}
                                    className={`bg-white/95 backdrop-blur-md rounded-2xl border p-4 sm:p-5 shadow-[0_10px_28px_rgba(7,115,188,0.12)] flex flex-col justify-between space-y-4 transition-all duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                                        index === 0
                                            ? "border-slate-200/70 shadow-[0_10px_30px_rgba(7,115,188,0.18)] hover:shadow-[0_10px_30px_rgba(7,115,188,0.28)]"
                                            : "border-slate-200/70"
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`inline-flex items-center justify-center min-w-7 h-7 rounded-lg text-xs font-extrabold ${
                                                            index === 0
                                                                ? "bg-[#CDFC56] text-slate-900"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-extrabold uppercase tracking-wider">
                                                            Terbaik
                                                        </span>
                                                    )}
                                                    {district.tier_zone && (
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                                                            Tier {district.tier_zone}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-base font-extrabold text-slate-900 mt-1.5 truncate">
                                                    {district.district_name}
                                                </h4>
                                                <p className="text-xs text-slate-500">
                                                    {district.city_region}
                                                </p>
                                            </div>
                                            <div className="text-right bg-[#0773BC]/8 px-3 py-1.5 rounded-xl border border-[#0773BC]/15 shrink-0">
                                                <span className="block text-[10px] font-bold uppercase text-[#0773BC]">
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
                                                <span className="font-extrabold text-slate-900">
                                                    {formatRupiah(district.estimatedCost)}/bln
                                                </span>
                                            </div>

                                            {district.isUnderBudget ? (
                                                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                                                    Underbudget: Hemat{" "}
                                                    {formatRupiah(Math.abs(district.budgetDiff))}{" "}
                                                    dari budget Anda
                                                </div>
                                            ) : (
                                                <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                                                    Overbudget: Kurang{" "}
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
                                                    <span className="text-slate-600 font-medium">
                                                        {slider.shortLabel}{" "}
                                                        <span className="text-[10px] text-slate-400">
                                                            ({userWeight}%)
                                                        </span>
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-slate-900">
                                                            {scoreVal.toFixed(1)}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bgClass} ${badge.textClass}`}
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
