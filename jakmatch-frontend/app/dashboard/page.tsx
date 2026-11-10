"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    UserCheck,
    MapPin,
    Wallet,
    SlidersHorizontal,
    Info,
    ArrowRight,
    AlertTriangle,
    Sparkles,
    RotateCcw,
    CheckCircle2,
    LineChart,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";
import { ProfileKey, REGIONS, formatRupiah } from "./config";

const BUDGET_PRESETS = [
    { label: "Rp 2 Jt", value: 2000000 },
    { label: "Rp 3,5 Jt", value: 3500000 },
    { label: "Rp 5 Jt", value: 5000000 },
    { label: "Rp 7,5 Jt", value: 7500000 },
    { label: "Rp 10 Jt", value: 10000000 },
];

export default function ParameterPrioritasPage() {
    const router = useRouter();
    const [openGlossaryKey, setOpenGlossaryKey] = useState<string | null>(null);
    const {
        selectedProfile,
        currentProfileConfig,
        selectedRegion,
        userBudget,
        budgetLock,
        weights,
        draftFilteredCount,
        hasUnappliedChanges,
        isGeneratingGraph,
        topThreeDistricts,
        totalFilteredCount,
        handleProfileChange,
        setSelectedRegion,
        setUserBudget,
        setBudgetLock,
        updateWeight,
        resetWeightsToDefault,
        generateComparisonGraph,
    } = useDashboard();

    const handleGenerateAndNavigate = () => {
        generateComparisonGraph();
        router.push("/dashboard/komparasi");
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Header Tahap 01 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-xs leading-tight">
                        Parameter Dasar & Bobot Prioritas
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
                        Atur profil pengguna, cakupan wilayah, batas anggaran, dan geser
                        bobot prioritas lalu klik{" "}
                        <span className="font-extrabold text-[#CDFC56]">
                            Generate Grafik
                        </span>{" "}
                        untuk memperbarui hasil komparasi.
                    </p>
                </div>

                <Link
                    href="/dashboard/komparasi"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white hover:bg-[#CDFC56] text-[#161616] border border-white/80 hover:border-[#b6e838] shadow-[0_6px_20px_rgba(7,115,188,0.18)] hover:shadow-[0_10px_26px_rgba(7,115,188,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0773BC] transition-all duration-200 ease-out shrink-0"
                >
                    <span>Lihat Halaman Komparasi</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                {/* Kolom Kiri: 3 Parameter Dasar (Fase 4) */}
                <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 sm:p-6 shadow-[0_10px_30px_rgba(7,115,188,0.14)] space-y-5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-extrabold text-slate-900">
                            Parameter Finansial & Wilayah
                        </h3>
                    </div>

                    {/* Langkah 4.1: Pemilihan Konteks Profil */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                            <span className="w-6 h-6 rounded-lg bg-[#C4C4C4]/10 flex items-center justify-center text-[#FFFFF] shrink-0">
                                <UserCheck className="w-3.5 h-3.5" />
                            </span>
                            1. Konteks Profil Pengguna
                        </label>
                        <select
                            value={selectedProfile}
                            onChange={(e) =>
                                handleProfileChange(e.target.value as ProfileKey)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0773BC]/25 focus:border-[#0773BC] transition"
                        >
                            <option value="student_worker">
                                Mahasiswa / Pekerja Lajang (Kos 1 Kamar)
                            </option>
                            <option value="family">
                                Keluarga Kecil (Sewa Rumah / Kontrakan)
                            </option>
                            <option value="umkm">
                                Pelaku UMKM / Buka Cabang (Ruko / Kios)
                            </option>
                        </select>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        </div>
                    </div>

                    {/* Langkah 4.2: Penyaringan Wilayah */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                            <span className="w-6 h-6 rounded-lg bg-[#C4C4C4]/10 flex items-center justify-center text-[#FFFFF] shrink-0">
                                <MapPin className="w-3.5 h-3.5" />
                            </span>
                            2. Cakupan Wilayah DKI Jakarta
                        </label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0773BC]/25 focus:border-[#0773BC] transition"
                        >
                            {REGIONS.map((reg) => (
                                <option key={reg} value={reg}>
                                    {reg === "Semua Wilayah"
                                        ? "Seluruh DKI Jakarta (42 Kecamatan)"
                                        : reg}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Langkah 4.3: Input Anggaran, Preset Cepat & Budget Lock */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                <span className="w-6 h-6 rounded-lg bg-[#C4C4C4]/10 flex items-center justify-center text-[#FFFFF] shrink-0">
                                    <Wallet className="w-3.5 h-3.5" />
                                </span>
                                3. Batas Anggaran Bulanan
                            </label>
                            <span className="text-xs font-extrabold text-[#FFFFFF]/90 bg-[#161616]/90 px-2.5 py-0.5 rounded-md">
                                {formatRupiah(userBudget)}
                            </span>
                        </div>

                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                Rp
                            </span>
                            <input
                                type="number"
                                step={250000}
                                min={500000}
                                value={userBudget}
                                onChange={(e) =>
                                    setUserBudget(Math.max(0, Number(e.target.value)))
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/90 focus:bg-white pl-9 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0773BC]/25 focus:border-[#0773BC] transition"
                            />
                        </div>

                        {/* Preset Cepat Anggaran (Grid 3 Kolom di Handphone, Flex di Desktop) */}
                        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5">
                            {BUDGET_PRESETS.map((preset) => {
                                const isActive = userBudget === preset.value;
                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => setUserBudget(preset.value)}
                                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer border text-center ${isActive
                                                ? "bg-[#CDFC56] text-slate-900 border-[#b6e838] shadow-2xs"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>

                        <label
                            className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition ${budgetLock
                                    ? "bg-[#F4FCE3] border-[#b6e838]"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                                }`}
                        >
                            <div className="min-w-0">
                                <span className="block text-xs font-extrabold text-slate-900">
                                    Budget Lock
                                </span>
                                <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    Sembunyikan kecamatan dengan harga pasar di atas anggaran
                                </span>
                            </div>
                            <input
                                type="checkbox"
                                checked={budgetLock}
                                onChange={(e) => setBudgetLock(e.target.checked)}
                                className="w-4 h-4 accent-[#0773BC] rounded cursor-pointer shrink-0"
                            />
                        </label>
                    </div>
                </div>

                {/* Kolom Kanan: Personal Priority Engine (Fase 5) + Tombol Generate Grafik + Pratinjau */}
                <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 sm:p-6 shadow-[0_10px_30px_rgba(7,115,188,0.14)] space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                                        Matriks Slider Prioritas ({currentProfileConfig.label})
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Geser bobot 0% – 100%, lalu tekan tombol Generate Grafik di
                                        bawah
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={resetWeightsToDefault}
                                className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC] focus-visible:ring-offset-2 transition-all duration-200 ease-out cursor-pointer shrink-0"
                                title="Kembalikan bobot slider ke pengaturan awal"
                            >
                                <RotateCcw className="w-3 h-3 transition-transform duration-300 group-hover:-rotate-45 group-active:rotate-0" />
                                <span>Reset Bobot</span>
                            </button>
                        </div>

                        {/* Daftar Slider Bobot Prioritas */}
                        <div className="space-y-4">
                            {currentProfileConfig.sliders.map((slider) => {
                                const currentVal = weights[slider.key] ?? 50;
                                const isGlossaryOpen = openGlossaryKey === slider.key;
                                return (
                                    <div
                                        key={slider.key}
                                        className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            <div className="flex items-center gap-1.5 font-extrabold text-slate-800 min-w-0">
                                                <span className="truncate">{slider.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenGlossaryKey(
                                                            isGlossaryOpen ? null : slider.key
                                                        )
                                                    }
                                                    aria-label={`Info indikator ${slider.label}`}
                                                    className={`p-1 rounded-md transition cursor-pointer shrink-0 ${isGlossaryOpen
                                                            ? "bg-[#0773BC] text-white"
                                                            : "text-slate-400 hover:text-[#0773BC] hover:bg-[#0773BC]/10"
                                                        }`}
                                                >
                                                    <Info className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-lg bg-[#CDFC56] text-slate-900 font-extrabold border border-[#b6e838] shrink-0 text-[11px]">
                                                {currentVal}%
                                            </span>
                                        </div>

                                        {isGlossaryOpen && (
                                            <div className="p-2.5 rounded-lg bg-[#064E85] text-white text-[11px] space-y-0.5">
                                                <p className="font-extrabold text-[#CDFC56]">
                                                    {slider.glossaryTitle}
                                                </p>
                                                <p className="text-white/90 leading-relaxed">
                                                    {slider.glossaryDesc}
                                                </p>
                                            </div>
                                        )}

                                        <div className="relative flex items-center py-1">
                                            <div className="w-full h-2.5 bg-slate-200/90 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-linear-to-r from-[#0773BC] to-[#CDFC56] transition-all duration-75"
                                                    style={{ width: `${currentVal}%` }}
                                                />
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={currentVal}
                                                onChange={(e) =>
                                                    updateWeight(
                                                        slider.key,
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div
                                                className="pointer-events-none absolute w-5 h-5 rounded-full bg-[#0773BC] border-2 border-[#CDFC56] shadow-sm transition-all duration-75"
                                                style={{
                                                    left: `calc(${currentVal}% - 10px)`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Area Tombol Eksklusif Generate Grafik Komparasi */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                            <div
                                role="status"
                                aria-live="polite"
                                className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-xs sm:max-w-md ${hasUnappliedChanges
                                        ? "bg-[#0773BC]/5 border-[#0773BC]/15"
                                        : "bg-emerald-50/80 border-emerald-100"
                                    }`}
                            >
                                {hasUnappliedChanges ? (
                                    <>
                                        <LineChart className="w-4 h-4 text-[#0773BC] shrink-0 mt-0.5" />
                                        <span className="space-y-0.5">
                                            <strong className="block font-extrabold text-slate-800">
                                                Perubahan belum diterapkan
                                            </strong>
                                            <span className="block leading-relaxed text-slate-600">
                                                Generate grafik untuk memperbarui hasil komparasi.
                                            </span>
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span className="space-y-0.5">
                                            <strong className="block font-extrabold text-emerald-800">
                                                Semua sudah diperbarui
                                            </strong>
                                            <span className="block leading-relaxed text-slate-600">
                                                Grafik dan skor sesuai dengan parameter saat ini.
                                            </span>
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={generateComparisonGraph}
                                    disabled={isGeneratingGraph}
                                    aria-busy={isGeneratingGraph}
                                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 border border-[#b6e838] shadow-sm hover:shadow-[0_8px_20px_rgba(7,115,188,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC] focus-visible:ring-offset-2 transition-all duration-200 ease-out cursor-pointer disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-sm"
                                >
                                    <Sparkles
                                        className={`w-4 h-4 ${isGeneratingGraph ? "animate-spin" : ""
                                            }`}
                                    />
                                    <span>
                                        {isGeneratingGraph
                                            ? "Mengalkulasi Grafik..."
                                            : "Generate Grafik"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pratinjau Top 3 Kecamatan Berdasarkan Hasil Generate Grafik */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 sm:p-6 shadow-[0_10px_30px_rgba(7,115,188,0.14)] space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900">
                                    Hasil Generate Top 3 Kecamatan ({totalFilteredCount} Lolos
                                    Penyaringan)
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Daftar di bawah adalah hasil kalkulasi terakhir yang tampil di
                                    halaman Komparasi
                                </p>
                            </div>
                            <Link
                                href="/dashboard/komparasi"
                                className="group w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#CDFC56] text-slate-900 text-xs font-extrabold hover:bg-[#b8e840] hover:border-[#9fcf2d] hover:shadow-[0_8px_20px_rgba(7,115,188,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC] focus-visible:ring-offset-2 border border-[#b6e838] transition-all duration-200 ease-out shrink-0"
                            >
                                <span>Lihat Grafik Lengkap</span>
                                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                        </div>

                        {topThreeDistricts.length === 0 ? (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-800">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    Anggaran pada grafik saat ini berada di bawah rata-rata sewa
                                    wilayah. Silakan naikkan anggaran atau matikan Kunci Anggaran
                                    lalu klik <strong>Generate Grafik</strong>.
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {topThreeDistricts.map((d, index) => (
                                    <div
                                        key={d.id}
                                        className={`p-4 rounded-xl border space-y-1.5 transition ${index === 0
                                                ? "bg-[#F4FCE3] border-[#b6e838] shadow-2xs"
                                                : "bg-slate-50 border-slate-200/80"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${index === 0
                                                        ? "bg-[#CDFC56] text-slate-900"
                                                        : "bg-[#161616]/90 text-[#FFFFFF]/90 border border-slate-200"
                                                    }`}
                                            >
                                                Peringkat #{index + 1}
                                            </span>
                                            <span className="text-xs font-extrabold text-[#161616]">
                                                {d.finalScore.toFixed(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-extrabold text-slate-900 pt-0.5">
                                            {d.district_name}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {d.city_region} • {formatRupiah(d.estimatedCost)}/bln
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
