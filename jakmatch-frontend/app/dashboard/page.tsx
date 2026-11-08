"use client";

import React from "react";
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
        <div className="space-y-6">
            {/* Header Tahap 01 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#CDFC56] text-slate-900 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                        Tahap 01 • Konfigurasi Ruang Kerja
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-xs mt-1.5">
                        Parameter Dasar & Bobot Prioritas
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                        Atur profil pengguna, cakupan wilayah, batas anggaran, dan geser
                        bobot prioritas lalu klik{" "}
                        <span className="font-extrabold text-[#CDFC56]">
                            Generate Grafik
                        </span>{" "}
                        untuk memperbarui hasil komparasi.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link
                        href="/dashboard/komparasi"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs transition"
                    >
                        <span>Lihat Halaman Komparasi</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: 3 Parameter Dasar (Fase 4) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-extrabold text-slate-900">
                            A. Parameter Finansial & Wilayah
                        </h3>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {draftFilteredCount} Kandidat Sesuai
                        </span>
                    </div>

                    {/* Langkah 4.1: Pemilihan Konteks Profil */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                            <span className="w-5 h-5 rounded-md bg-[#D9D9D9] flex items-center justify-center text-slate-900">
                                <UserCheck className="w-3.5 h-3.5" />
                            </span>
                            1. Konteks Profil Pengguna
                        </label>
                        <select
                            value={selectedProfile}
                            onChange={(e) =>
                                handleProfileChange(e.target.value as ProfileKey)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#CDFC56] focus:border-slate-900 transition"
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
                            <span>Acuan Aset Properti:</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                {currentProfileConfig.assetLabel}
                            </span>
                        </div>
                    </div>

                    {/* Langkah 4.2: Penyaringan Wilayah */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                            <span className="w-5 h-5 rounded-md bg-[#D9D9D9] flex items-center justify-center text-slate-900">
                                <MapPin className="w-3.5 h-3.5" />
                            </span>
                            2. Cakupan Wilayah DKI Jakarta
                        </label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#CDFC56] focus:border-slate-900 transition"
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
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                <span className="w-5 h-5 rounded-md bg-[#D9D9D9] flex items-center justify-center text-slate-900">
                                    <Wallet className="w-3.5 h-3.5" />
                                </span>
                                3. Batas Anggaran Bulanan
                            </label>
                            <span className="text-xs font-extrabold text-slate-900">
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
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#CDFC56] focus:border-slate-900 transition"
                            />
                        </div>

                        {/* Preset Cepat Anggaran untuk UX Mobile & Desktop */}
                        <div className="flex flex-wrap gap-1.5">
                            {BUDGET_PRESETS.map((preset) => {
                                const isActive = userBudget === preset.value;
                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => setUserBudget(preset.value)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                            isActive
                                                ? "bg-[#CDFC56] text-slate-900 border-[#b2e23b] shadow-2xs"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>

                        <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#CDFC56]/30 border border-[#b8e840] cursor-pointer hover:bg-[#CDFC56]/45 transition">
                            <div>
                                <span className="block text-xs font-extrabold text-slate-900">
                                    Hanya Tampilkan yang Sesuai Budget (Budget Lock)
                                </span>
                                <span className="block text-[11px] text-slate-600">
                                    Sembunyikan kecamatan dengan harga pasar di atas anggaran
                                </span>
                            </div>
                            <input
                                type="checkbox"
                                checked={budgetLock}
                                onChange={(e) => setBudgetLock(e.target.checked)}
                                className="w-4 h-4 accent-slate-900 rounded cursor-pointer shrink-0"
                            />
                        </label>
                    </div>
                </div>

                {/* Kolom Kanan: Personal Priority Engine (Fase 5) + Tombol Generate Grafik + Pratinjau */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-[#CDFC56] flex items-center justify-center text-slate-900">
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">
                                        B. Matriks Slider Prioritas ({currentProfileConfig.label})
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                title="Kembalikan bobot slider ke pengaturan awal"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset Bobot
                            </button>
                        </div>

                        {/* Daftar Slider Bobot Prioritas */}
                        <div className="space-y-5">
                            {currentProfileConfig.sliders.map((slider) => {
                                const currentVal = weights[slider.key] ?? 50;
                                return (
                                    <div key={slider.key} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                <span>{slider.label}</span>
                                                <div className="relative group inline-block">
                                                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-900 cursor-help" />
                                                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-lg z-40 pointer-events-none">
                                                        <p className="font-bold text-[#CDFC56] mb-1">
                                                            {slider.glossaryTitle}
                                                        </p>
                                                        <p className="leading-relaxed text-slate-200 font-normal">
                                                            {slider.glossaryDesc}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-md bg-[#CDFC56] text-slate-900 font-extrabold border border-[#b5e43b]">
                                                {currentVal}%
                                            </span>
                                        </div>

                                        <div className="relative flex items-center">
                                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                                                <div
                                                    className="h-full bg-[#CDFC56] transition-all duration-75"
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
                                                className="pointer-events-none absolute w-4 h-4 rounded-full bg-slate-900 border-2 border-[#CDFC56] shadow-xs transition-all duration-75"
                                                style={{
                                                    left: `calc(${currentVal}% - 8px)`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Area Tombol Eksklusif Generate Grafik Komparasi */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs">
                                {hasUnappliedChanges ? (
                                    <>
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                        <span className="font-semibold text-amber-800">
                                            Parameter diubah — Klik{" "}
                                            <strong className="font-extrabold">
                                                Generate Grafik
                                            </strong>{" "}
                                            untuk menerapkan.
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="font-semibold text-slate-600">
                                            Grafik & skor komparasi sudah sesuai dengan slider saat ini.
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={generateComparisonGraph}
                                    disabled={isGeneratingGraph}
                                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm ${
                                        hasUnappliedChanges
                                            ? "bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 ring-2 ring-slate-900/15"
                                            : "bg-[#CDFC56]/80 hover:bg-[#CDFC56] text-slate-900"
                                    }`}
                                >
                                    <Sparkles
                                        className={`w-4 h-4 ${
                                            isGeneratingGraph ? "animate-spin" : ""
                                        }`}
                                    />
                                    <span>
                                        {isGeneratingGraph
                                            ? "Mengalkulasi Grafik..."
                                            : "Generate Grafik"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleGenerateAndNavigate}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-[#FFFFFF] transition cursor-pointer shadow-sm"
                                >
                                    <LineChart className="w-4 h-4" />
                                    <span>Generate & Buka Grafik</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pratinjau Top 3 Kecamatan Berdasarkan Hasil Generate Grafik */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#CDFC56] text-slate-900 text-xs font-extrabold hover:bg-[#b8e840] transition"
                            >
                                Lihat Grafik Lengkap
                                <ArrowRight className="w-3.5 h-3.5" />
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
                                        className={`p-4 rounded-xl border space-y-1.5 transition ${
                                            index === 0
                                                ? "bg-[#CDFC56]/30 border-[#b5e43b]"
                                                : "bg-slate-50 border-slate-200/80"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#FFFFFF] text-slate-900">
                                                Peringkat #{index + 1}
                                            </span>
                                            <span className="text-xs font-extrabold text-slate-900">
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
