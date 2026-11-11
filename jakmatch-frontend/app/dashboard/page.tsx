"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    UserCheck,
    MapPin,
    Wallet,
    SlidersHorizontal,
    Info,
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
        hasUnappliedChanges,
        isGeneratingGraph,
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
        <div className="space-y-3.5 sm:space-y-5">
            <header className="relative overflow-hidden rounded-xl border border-white/25 bg-white/10 px-3 py-3 shadow-[0_8px_20px_rgba(7,55,100,0.1)] backdrop-blur-md sm:px-4 sm:py-4">
                <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#CDFC56]/15 blur-2xl" />
                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                        <div className="min-w-0 space-y-1">
                            <h2 className="text-lg font-extrabold leading-tight text-white sm:text-xl">
                                Profil & Prioritas
                            </h2>
                            <p className="max-w-2xl text-[11px] leading-relaxed text-white/85 sm:text-xs">
                                Atur profil, wilayah, anggaran, dan bobot indikator. Generate
                                grafik untuk melihat hasil komparasi yang sesuai kebutuhanmu.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid min-w-0 grid-cols-1 items-start gap-3.5 sm:gap-4 lg:grid-cols-12 xl:gap-5">
                {/* Kolom Kiri: 3 Parameter Dasar (Fase 4) */}
                <div className="min-w-0 space-y-4 rounded-xl border border-white/80 bg-white/95 p-3 shadow-[0_8px_24px_rgba(7,115,188,0.12)] backdrop-blur-md sm:space-y-5 sm:p-4 lg:col-span-5 xl:p-5">
                    <div className="flex items-start gap-2.5 border-b border-slate-100 pb-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0773BC]/10 text-[#0773BC]">
                            <Wallet className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                                Parameter Finansial & Wilayah
                            </h3>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                                Tentukan konteks dan batas pencarian komparasi.
                            </p>
                        </div>
                    </div>

                    {/* Langkah 4.1: Pemilihan Konteks Profil */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 sm:text-xs">
                            <span className="w-6 h-6 rounded-lg bg-[#C4C4C4]/10 flex items-center justify-center text-[#FFFFF] shrink-0">
                                <UserCheck className="w-3.5 h-3.5" />
                            </span>
                            Konteks Profil Pengguna
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
                    </div>

                    {/* Langkah 4.2: Penyaringan Wilayah */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 sm:text-xs">
                            <span className="w-6 h-6 rounded-lg bg-[#C4C4C4]/10 flex items-center justify-center text-[#FFFFF] shrink-0">
                                <MapPin className="w-3.5 h-3.5" />
                            </span>
                            Cakupan Wilayah DKI Jakarta
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
                            <label className="flex min-w-0 items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 sm:text-xs">
                                <span className="w-6 h-6 rounded-lg bg-[#C4C4C4]/10 flex items-center justify-center text-[#FFFFF] shrink-0">
                                    <Wallet className="w-3.5 h-3.5" />
                                </span>
                                Batas Anggaran Bulanan
                            </label>
                            <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-extrabold text-white sm:text-xs">
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
                        <div className="grid grid-cols-2 gap-1.5 min-[400px]:grid-cols-3 sm:flex sm:flex-wrap">
                            {BUDGET_PRESETS.map((preset) => {
                                const isActive = userBudget === preset.value;
                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => setUserBudget(preset.value)}
                                        className={`min-h-9 rounded-lg border px-2 py-1 text-[10px] font-extrabold text-center transition cursor-pointer sm:px-2 sm:text-[11px] ${isActive
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
                            className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 sm:p-3 cursor-pointer transition ${budgetLock
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
                <div className="min-w-0 space-y-3.5 sm:space-y-4 lg:col-span-7">
                    <div className="min-w-0 space-y-4 rounded-xl border border-white/80 bg-white/95 p-3 shadow-[0_8px_24px_rgba(7,115,188,0.12)] backdrop-blur-md sm:space-y-5 sm:p-4 xl:p-5">
                        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#CDFC56]/35 text-slate-900">
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                                        Prioritas Indikator
                                    </h3>
                                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                                        {currentProfileConfig.label} · Atur bobot tiap indikator
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={resetWeightsToDefault}
                                className="group inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-900 hover:shadow-sm active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC] focus-visible:ring-offset-2 cursor-pointer shrink-0 sm:text-[11px]"
                                title="Kembalikan bobot slider ke pengaturan awal"
                            >
                                <RotateCcw className="w-3 h-3 transition-transform duration-300 group-hover:-rotate-45 group-active:rotate-0" />
                                <span>Reset Bobot</span>
                            </button>
                        </div>

                        {/* Daftar Slider Bobot Prioritas */}
                        <div className="space-y-3">
                            {currentProfileConfig.sliders.map((slider) => {
                                const currentVal = weights[slider.key] ?? 50;
                                const isGlossaryOpen = openGlossaryKey === slider.key;
                                return (
                                    <div
                                        key={slider.key}
                                        className="space-y-2 rounded-lg border border-slate-200/70 bg-slate-50/80 p-2.5 transition-colors hover:border-slate-300 sm:p-3"
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

                                        <div className="relative flex min-h-7 items-center py-1">
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
                        <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div
                                role="status"
                                aria-live="polite"
                                className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-xs sm:max-w-md sm:flex-1 ${hasUnappliedChanges
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

                            <div className="w-full sm:w-auto sm:shrink-0">
                                <button
                                    type="button"
                                    onClick={handleGenerateAndNavigate}
                                    disabled={isGeneratingGraph}
                                    aria-busy={isGeneratingGraph}
                                    className="group inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#b6e838] bg-[#CDFC56] px-4 py-2.5 text-[11px] font-extrabold text-slate-900 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#b8e840] hover:shadow-[0_8px_20px_rgba(7,115,188,0.2)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC] focus-visible:ring-offset-2 cursor-pointer disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-sm sm:w-auto sm:text-xs"
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
                </div>
            </div>
        </div>
    );
}
