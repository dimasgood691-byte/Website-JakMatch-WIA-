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
        <div className="min-w-0 space-y-4 sm:space-y-5">
            {/* Header & Navigasi Tahap */}
            <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch">
                <header className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-white/25 bg-white/10 px-3.5 py-3.5 shadow-[0_8px_20px_rgba(7,55,100,0.1)] backdrop-blur-md sm:px-4 sm:py-4">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#CDFC56]/15 blur-2xl" />
                    <div className="relative flex min-w-0 items-start">
                        <div className="min-w-0">
                            <div className="min-w-0 space-y-1">
                                <h2 className="text-base font-extrabold leading-snug text-white sm:text-lg lg:text-xl">
                                    Grafik Komparasi & Status Finansial Kecamatan
                                </h2>
                                <p className="max-w-2xl text-[11px] leading-relaxed text-white/85 sm:text-xs">
                                    Membandingkan {topThreeDistricts.length} kecamatan terbaik dari{" "}
                                    {totalFilteredCount} kandidat hasil generate grafik terakhir.
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid w-full grid-cols-1 gap-2 min-[380px]:grid-cols-2 lg:w-auto lg:shrink-0 lg:content-center">
                    <Link
                        href="/dashboard"
                        className="group inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#b6e838] bg-[#CDFC56] px-3 py-2 text-[11px] font-extrabold text-[#161616] shadow-[0_6px_20px_rgba(7,115,188,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#b8e840] hover:bg-[#b8e840] hover:shadow-[0_10px_26px_rgba(7,115,188,0.28)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0773BC] sm:px-4 sm:text-xs lg:w-auto"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        <span className="truncate">Ubah Parameter</span>
                    </Link>

                    <Link
                        href="/dashboard/analisis-ai"
                        className="group inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/80 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-900 shadow-[0_6px_20px_rgba(7,115,188,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#b6e838] hover:bg-[#CDFC56] hover:shadow-[0_10px_26px_rgba(7,115,188,0.28)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0773BC] sm:px-4 sm:text-xs lg:w-auto"
                    >
                        <span className="truncate">Lanjut Analisis AI</span>
                        <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>

            {/* Banner Pemberitahuan jika Ada Perubahan Slider yang Belum Di-Generate */}
            {hasUnappliedChanges && (
                <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#CDFC56] bg-white/95 p-3.5 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="flex min-w-0 items-start gap-2.5 text-[11px] leading-relaxed text-slate-800 sm:text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0773BC] mt-1 sm:mt-0 shrink-0 animate-pulse" />
                        <span>
                            Grafik di bawah masih menampilkan hasil generate sebelumnya. Anda
                            memiliki perubahan slider/parameter baru yang belum di-generate.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={generateComparisonGraph}
                        className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#b6e838] bg-[#CDFC56] px-4 py-2 text-[11px] font-extrabold text-slate-900 transition hover:bg-[#b8e840] cursor-pointer sm:w-auto sm:text-xs"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Grafik Sekarang</span>
                    </button>
                </div>
            )}

            {/* Empty State jika Budget Lock Menyaring Habis Kecamatan */}
            {topThreeDistricts.length === 0 ? (
                <div className="space-y-4 rounded-xl border border-amber-200 bg-white/95 p-4 text-center shadow-[0_10px_30px_rgba(7,115,188,0.14)] backdrop-blur-md sm:p-6">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-500 sm:h-14 sm:w-14">
                        <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="max-w-lg mx-auto space-y-1.5">
                        <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
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
                    <div className="flex flex-col justify-center gap-2 pt-1 min-[420px]:flex-row sm:gap-3 sm:pt-2">
                        <Link
                            href="/dashboard"
                            onClick={() => {
                                setBudgetLock(false);
                                setSelectedRegion("Semua Wilayah");
                            }}
                            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-[#b6e838] bg-[#CDFC56] px-4 py-2 text-[11px] font-extrabold text-slate-900 transition hover:bg-[#b8e840] cursor-pointer min-[420px]:w-auto sm:text-xs"
                        >
                            Sesuaikan Parameter & Generate Ulang
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* Kartu Grafik Komparasi Ukuran Penuh */}
                    <div className="min-w-0 rounded-xl border border-white/80 bg-white/95 p-3.5 shadow-[0_10px_30px_rgba(7,115,188,0.14)] backdrop-blur-md sm:p-4 lg:p-5">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3 sm:mb-4">
                            <div className="min-w-0">
                                <h3 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                                    Grafik Komparasi Indikator Kecamatan (Skala 0–100)
                                </h3>
                                <p className="mt-1 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                                    Pilih mode Kurva Area, atau Mode Vertikal,
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
                        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/80 bg-white/95 px-3.5 py-3 shadow-xs backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
                            <h3 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                                Kartu Keterjangkauan Finansial & Indikator Traffic Light
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600 sm:gap-2 sm:text-[11px]">
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

                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {topThreeDistricts.map((district, index) => (
                                <div
                                    key={district.id}
                                    className={`min-w-0 rounded-xl border bg-white/95 p-3.5 shadow-[0_10px_28px_rgba(7,115,188,0.12)] backdrop-blur-md flex flex-col justify-between space-y-3 transition-all duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-4 ${index === 0
                                        ? "border-slate-200/70 shadow-[0_10px_30px_rgba(7,115,188,0.18)] hover:shadow-[0_10px_30px_rgba(7,115,188,0.28)]"
                                        : "border-slate-200/70"
                                        }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex min-w-0 items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`inline-flex items-center justify-center min-w-7 h-7 rounded-lg text-xs font-extrabold ${index === 0
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
                                                <h4 className="mt-1.5 truncate text-sm font-extrabold text-slate-900 sm:text-base">
                                                    {district.district_name}
                                                </h4>
                                                <p className="text-xs text-slate-500">
                                                    {district.city_region}
                                                </p>
                                            </div>
                                            <div className="shrink-0 rounded-lg border border-[#0773BC]/15 bg-[#0773BC]/8 px-2.5 py-1.5 text-right sm:px-3">
                                                <span className="block text-[10px] font-bold uppercase text-[#0773BC]">
                                                    Skor Akhir
                                                </span>
                                                <span className="text-lg font-extrabold text-slate-900">
                                                    {district.finalScore.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 rounded-lg border border-slate-200/70 bg-slate-50 p-2.5 sm:p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] sm:text-xs">
                                                <span className="text-slate-500">
                                                    Estimasi Pasar:
                                                </span>
                                                <span className="font-extrabold text-slate-900">
                                                    {formatRupiah(district.estimatedCost)}/bln
                                                </span>
                                            </div>

                                            {district.isUnderBudget ? (
                                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold leading-relaxed text-emerald-800 sm:text-[11px]">
                                                    Underbudget: Hemat{" "}
                                                    {formatRupiah(Math.abs(district.budgetDiff))}{" "}
                                                    dari budget Anda
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold leading-relaxed text-rose-800 sm:text-[11px]">
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
