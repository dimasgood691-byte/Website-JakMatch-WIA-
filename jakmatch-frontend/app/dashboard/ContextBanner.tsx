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
        <div className="space-y-3 mb-5 sm:mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 px-4 sm:px-5 py-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-wrap items-start sm:items-center gap-2.5 sm:gap-5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#CDFC56] flex items-center justify-center text-slate-900 shrink-0">
                            <UserCheck className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-slate-400">Profil:</span>
                        <span className="font-bold text-slate-800 truncate">
                            {appliedProfileConfig.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#CDFC56] flex items-center justify-center text-slate-900 shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-slate-400">Cakupan:</span>
                        <span className="font-bold text-slate-800 truncate">
                            {appliedConfig.region}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-[#CDFC56] flex items-center justify-center text-slate-900 shrink-0">
                            <Wallet className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-slate-400">Anggaran:</span>
                        <span className="font-bold text-slate-800">
                            {formatRupiah(appliedConfig.budget)}/bln
                        </span>
                        {appliedConfig.budgetLock && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CDFC56] text-slate-900 border border-[#b5e43b]">
                                Terkunci
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
                    {hasUnappliedChanges && (
                        <button
                            type="button"
                            onClick={generateComparisonGraph}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-slate-900 text-[#CDFC56] hover:bg-slate-800 transition cursor-pointer shadow-xs"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Update Grafik</span>
                        </button>
                    )}

                    <div className="flex items-center gap-2 text-xs bg-[#CDFC56]/55 border border-[#b8e840] px-3.5 py-1.5 rounded-xl">
                        <Trophy className="w-4 h-4 text-slate-900 shrink-0" />
                        <span className="text-slate-700 font-medium">
                            Rekomendasi #1:
                        </span>
                        <span className="font-extrabold text-slate-900">
                            {topWinner
                                ? `${topWinner.district_name} (${topWinner.finalScore.toFixed(1)})`
                                : "Tidak Ada yang Cocok"}
                        </span>
                    </div>
                </div>
            </div>

            {generateFeedback && (
                <div className="px-4 py-2.5 rounded-xl bg-[#CDFC56] border border-white/70 text-slate-900 text-xs font-extrabold shadow-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    <span>{generateFeedback}</span>
                </div>
            )}

            {saveFeedback && (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveFeedback}</span>
                </div>
            )}
        </div>
    );
}
