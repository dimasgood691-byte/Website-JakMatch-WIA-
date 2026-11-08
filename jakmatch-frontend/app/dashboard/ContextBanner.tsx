"use client";

import React from "react";
import {
    UserCheck,
    MapPin,
    Wallet,
    Trophy,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";
import { formatRupiah } from "./config";

export default function ContextBanner() {
    const {
        appliedProfileConfig,
        appliedConfig,
        topThreeDistricts,
        hasUnappliedChanges,
        generateFeedback,
        saveFeedback,
        generateComparisonGraph,
    } = useDashboard();

    const topWinner = topThreeDistricts[0];

    return (
        <div className="space-y-2.5 mb-4 sm:mb-6">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-3 sm:px-5 sm:py-3.5 shadow-[0_8px_28px_rgba(7,115,188,0.14)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Grid Ringkas 2 Kolom di Handphone, Baris Menyatu di Desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 sm:gap-4 text-xs">
                    <div className="flex items-center gap-2 min-w-0 bg-slate-50 lg:bg-transparent px-2.5 py-1.5 lg:p-0 rounded-xl border border-slate-100 lg:border-0">
                        <span className="w-6 h-6 rounded-lg bg-[#0773BC]/10 text-[#0773BC] flex items-center justify-center shrink-0">
                            <UserCheck className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 block lg:inline lg:mr-1 leading-none">
                                Profil:
                            </span>
                            <span className="font-extrabold text-slate-800 truncate block lg:inline text-[11px] sm:text-xs">
                                {appliedProfileConfig.label}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 min-w-0 bg-slate-50 lg:bg-transparent px-2.5 py-1.5 lg:p-0 rounded-xl border border-slate-100 lg:border-0">
                        <span className="w-6 h-6 rounded-lg bg-[#0773BC]/10 text-[#0773BC] flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 block lg:inline lg:mr-1 leading-none">
                                Cakupan:
                            </span>
                            <span className="font-extrabold text-slate-800 truncate block lg:inline text-[11px] sm:text-xs">
                                {appliedConfig.region}
                            </span>
                        </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-2 bg-slate-50 lg:bg-transparent px-2.5 py-1.5 lg:p-0 rounded-xl border border-slate-100 lg:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-[#0773BC]/10 text-[#0773BC] flex items-center justify-center shrink-0">
                                <Wallet className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0">
                                <span className="text-[10px] text-slate-400 block lg:inline lg:mr-1 leading-none">
                                    Anggaran:
                                </span>
                                <span className="font-extrabold text-slate-800 text-[11px] sm:text-xs">
                                    {formatRupiah(appliedConfig.budget)}/bln
                                </span>
                            </div>
                        </div>
                        {appliedConfig.budgetLock && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#CDFC56] text-slate-900 shrink-0">
                                Terkunci
                            </span>
                        )}
                    </div>
                </div>

                {/* Bagian Kanan: Update Grafik & Badge Rekomendasi #1 */}
                <div className="flex items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t border-slate-100 lg:border-0">
                    {hasUnappliedChanges && (
                        <button
                            type="button"
                            onClick={generateComparisonGraph}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#0773BC] text-white hover:bg-[#065f9d] transition cursor-pointer shadow-xs shrink-0"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#CDFC56]" />
                            <span>Update Grafik</span>
                        </button>
                    )}

                    <div className="flex-1 lg:flex-initial flex items-center justify-center lg:justify-start gap-2 text-xs bg-[#CDFC56] border border-[#b6e838] px-3.5 py-1.5 rounded-xl shadow-2xs min-w-0">
                        <Trophy className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                        <span className="text-slate-700 font-semibold hidden sm:inline shrink-0">
                            Rekomendasi #1:
                        </span>
                        <span className="font-extrabold text-slate-900 truncate">
                            {topWinner
                                ? `${topWinner.district_name} (${topWinner.finalScore.toFixed(1)})`
                                : "Tidak Ada yang Cocok"}
                        </span>
                    </div>
                </div>
            </div>

            {generateFeedback && (
                <div className="px-4 py-2.5 rounded-xl bg-[#CDFC56] border border-white/80 text-slate-900 text-xs font-extrabold shadow-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    <span>{generateFeedback}</span>
                </div>
            )}

            {saveFeedback && (
                <div className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveFeedback}</span>
                </div>
            )}
        </div>
    );
}
