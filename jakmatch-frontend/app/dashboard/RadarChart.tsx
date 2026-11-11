"use client";

import React, { useId, useState } from "react";
import { ScoredDistrict, SliderConfig } from "./config";

interface ComparisonChartProps {
    districts: ScoredDistrict[];
    axes: readonly SliderConfig[];
}

const SERIES_COLORS = [
    {
        stroke: "#064E85",
        fill: "#CDFC56",
        dotClass: "bg-[#064E85] ring-2 ring-[#CDFC56]",
        barClass: "bg-[#064E85]",
        badgeClass: "bg-[#CDFC56] text-slate-900",
    },
    {
        stroke: "#0773BC",
        fill: "#38BDF8",
        dotClass: "bg-[#0773BC]",
        barClass: "bg-[#0773BC]",
        badgeClass: "bg-sky-50 text-[#0773BC]",
    },
    {
        stroke: "#10B981",
        fill: "#10B981",
        dotClass: "bg-[#10B981]",
        barClass: "bg-[#10B981]",
        badgeClass: "bg-emerald-50 text-emerald-700",
    },
];

function createSmoothLinePath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const controlX1 = current.x + (next.x - current.x) * 0.42;
        const controlY1 = current.y;
        const controlX2 = current.x + (next.x - current.x) * 0.58;
        const controlY2 = next.y;
        path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }
    return path;
}

export default function InteractiveRadarChart({
    districts,
    axes,
}: ComparisonChartProps) {
    const chartId = useId().replace(/:/g, "");
    const [hiddenDistricts, setHiddenDistricts] = useState<
        Record<number, boolean>
    >({});
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
    const [chartMode, setChartMode] = useState<"curve" | "radar" | "bars">(
        "curve"
    );

    const toggleDistrict = (id: number) => {
        setHiddenDistricts((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const width = 660;
    const height = 280;
    const padLeft = 36;
    const padRight = 24;
    const padTop = 18;
    const padBottom = 56;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;
    const yTicks = [0, 25, 50, 75, 100];

    const getX = (index: number) => {
        if (axes.length <= 1) return padLeft;
        return padLeft + (index / (axes.length - 1)) * plotWidth;
    };

    const getY = (value: number) => {
        const clamped = Math.max(0, Math.min(100, value));
        return padTop + plotHeight - (clamped / 100) * plotHeight;
    };

    const baselineY = getY(0);

    // Perhitungan koordinat untuk mode Radar Poligon (dengan padding ekstra agar label aman di layar HP)
    const radarCx = 210;
    const radarCy = 155;
    const radarRadius = 96;
    const getRadarPoint = (axisIndex: number, value: number) => {
        const total = Math.max(3, axes.length);
        const angle = (Math.PI * 2 * axisIndex) / total - Math.PI / 2;
        const r = (Math.max(0, Math.min(100, value)) / 100) * radarRadius;
        return {
            x: radarCx + r * Math.cos(angle),
            y: radarCy + r * Math.sin(angle),
        };
    };

    const activeHoverIdx =
        hoveredIndex !== null && hoveredIndex < axes.length ? hoveredIndex : 0;

    return (
        <div className="w-full flex flex-col space-y-3.5">
            {/* Bar Kontrol Atas: Pilihan Mode Visual & Legend Interaktif */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                {/* Segmented control: 50-50 seimbang & rapi di HP, auto-fit di tablet/desktop */}
                <div
                    role="group"
                    aria-label="Mode tampilan grafik"
                    className="grid w-full grid-cols-2 gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 sm:flex sm:w-auto"
                >
                    {(
                        [
                            { key: "curve", label: "Kurva Area" },
                            { key: "bars", label: "Mode Vertikal" },
                        ] as const
                    ).map((mode) => {
                        const isActive = chartMode === mode.key;
                        return (
                            <button
                                key={mode.key}
                                type="button"
                                onClick={() => setChartMode(mode.key)}
                                aria-pressed={isActive}
                                className={`h-8 cursor-pointer whitespace-nowrap rounded-lg px-3 text-xs font-bold transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC]/30 ${
                                    isActive
                                        ? "bg-[#CDFC56] text-slate-900 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {mode.label}
                            </button>
                        );
                    })}
                </div>

                {/* Legend kecamatan: satu baris rapi / scroll horizontal di HP (tanpa patah/wrap aneh), inline di layar lebar */}
                <div
                    role="group"
                    aria-label="Tampilkan atau sembunyikan kecamatan"
                    className="-mx-1 flex w-full gap-1.5 sm:gap-2 overflow-x-auto px-1 pb-1 sm:pb-0 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
                >
                    {districts.map((district, idx) => {
                        const isHidden = !!hiddenDistricts[district.id];
                        const color = SERIES_COLORS[idx % SERIES_COLORS.length];

                        return (
                            <button
                                key={district.id}
                                type="button"
                                onClick={() => toggleDistrict(district.id)}
                                aria-pressed={!isHidden}
                                title={
                                    isHidden
                                        ? "Tampilkan kecamatan ini"
                                        : "Sembunyikan kecamatan ini"
                                }
                                className={`inline-flex h-8 shrink-0 cursor-pointer select-none items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg border px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC]/30 ${
                                    isHidden
                                        ? "border-slate-200 bg-slate-50 text-slate-400"
                                        : "border-slate-200 bg-white text-slate-800 shadow-2xs hover:border-[#0773BC]/40"
                                }`}
                            >
                                <span
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                        isHidden ? "bg-slate-300" : color.dotClass
                                    }`}
                                    aria-hidden="true"
                                />
                                <span className={isHidden ? "line-through text-slate-400" : "text-slate-800"}>
                                    {district.district_name}
                                </span>
                                <span
                                    className={`tabular-nums font-bold ${
                                        isHidden ? "text-slate-300" : "text-slate-500"
                                    }`}
                                >
                                    ({district.finalScore.toFixed(1)})
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MODE 1: GRAFIK KURVA DINAMIS (Responsif Penuh Tanpa Scroll Horizontal Paksa) */}
            {chartMode === "curve" && (
                <div className="w-full pt-1">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-auto overflow-visible select-none"
                    >
                        <defs>
                            {districts.map((district, idx) => {
                                const color =
                                    SERIES_COLORS[idx % SERIES_COLORS.length];
                                return (
                                    <linearGradient
                                        key={`grad-${district.id}`}
                                        id={`area-grad-${chartId}-${district.id}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={color.fill}
                                            stopOpacity={idx === 0 ? "0.48" : "0.22"}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={color.fill}
                                            stopOpacity="0.0"
                                        />
                                    </linearGradient>
                                );
                            })}
                        </defs>

                        {/* Grid Horizontal */}
                        {yTicks.map((tick) => {
                            const y = getY(tick);
                            return (
                                <g key={tick}>
                                    <line
                                        x1={padLeft}
                                        y1={y}
                                        x2={width - padRight}
                                        y2={y}
                                        stroke="#E2E8F0"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={padLeft - 8}
                                        y={y + 4}
                                        textAnchor="end"
                                        className="text-[9px] fill-slate-400 font-semibold"
                                    >
                                        {tick}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Label Sumbu X Dinamis */}
                        {axes.map((axis, idx) => {
                            const x = getX(idx);
                            const isHovered = activeHoverIdx === idx;
                            return (
                                <g key={axis.key}>
                                    {isHovered && (
                                        <line
                                            x1={x}
                                            y1={padTop}
                                            x2={x}
                                            y2={baselineY}
                                            stroke="#0773BC"
                                            strokeWidth="1.5"
                                            strokeDasharray="4 4"
                                        />
                                    )}
                                    <line
                                        x1={x}
                                        y1={baselineY}
                                        x2={x}
                                        y2={baselineY + 5}
                                        stroke="#CBD5E1"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={x}
                                        y={baselineY + 22}
                                        textAnchor="middle"
                                        className={`text-[9px] font-extrabold transition-colors ${isHovered
                                                ? "fill-[#0773BC]"
                                                : "fill-slate-500"
                                            }`}
                                    >
                                        {axis.shortLabel}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Kurva & Area */}
                        {districts.map((district, dIdx) => {
                            if (hiddenDistricts[district.id]) return null;
                            const color =
                                SERIES_COLORS[dIdx % SERIES_COLORS.length];

                            const points = axes.map((axis, aIdx) => ({
                                x: getX(aIdx),
                                y: getY(Number(district[axis.key]) || 0),
                                score: Number(district[axis.key]) || 0,
                                label: axis.label,
                            }));

                            const linePath = createSmoothLinePath(points);
                            const areaPath = `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

                            return (
                                <g key={district.id}>
                                    <path
                                        d={areaPath}
                                        fill={`url(#area-grad-${chartId}-${district.id})`}
                                    />
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke={color.stroke}
                                        strokeWidth={dIdx === 0 ? "3" : "2.25"}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {points.map((pt, pIdx) => (
                                        <circle
                                            key={`${district.id}-${pIdx}`}
                                            cx={pt.x}
                                            cy={pt.y}
                                            r={
                                                activeHoverIdx === pIdx
                                                    ? 6
                                                    : 4
                                            }
                                            fill={
                                                dIdx === 0
                                                    ? "#CDFC56"
                                                    : "#FFFFFF"
                                            }
                                            stroke={color.stroke}
                                            strokeWidth="2.5"
                                            className="transition-all duration-150"
                                        >
                                            <title>{`${district.district_name} • ${pt.label}: ${pt.score.toFixed(1)}`}</title>
                                        </circle>
                                    ))}
                                </g>
                            );
                        })}

                        {/* Area Interaktif Hover & Tap */}
                        {axes.map((axis, idx) => {
                            const x = getX(idx);
                            const colWidth = plotWidth / axes.length;
                            return (
                                <rect
                                    key={`hover-${axis.key}`}
                                    x={x - colWidth / 2}
                                    y={padTop}
                                    width={colWidth}
                                    height={plotHeight}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredIndex(idx)}
                                    onClick={() => setHoveredIndex(idx)}
                                />
                            );
                        })}
                    </svg>
                </div>
            )}

            {/* MODE 2: MATRIKS BAR VERTIKAL (Stack Layout Nyaman untuk Mobile) */}
            {chartMode === "bars" && (
                <div className="space-y-3 pt-1">
                    {axes.map((axis, aIdx) => (
                        <div
                            key={`bar-${axis.key}`}
                            onClick={() => setHoveredIndex(aIdx)}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 cursor-pointer hover:border-[#0773BC]/30 transition"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-extrabold text-slate-900">
                                    {axis.label}
                                </span>
                                <span className="text-[10px] font-bold uppercase text-[#0773BC] bg-[#0773BC]/10 px-2 py-0.5 rounded">
                                    Skala 0–100
                                </span>
                            </div>
                            <div className="space-y-2">
                                {districts.map((district, dIdx) => {
                                    if (hiddenDistricts[district.id]) return null;
                                    const score = Number(district[axis.key]) || 0;
                                    const color =
                                        SERIES_COLORS[dIdx % SERIES_COLORS.length];
                                    return (
                                        <div
                                            key={`${axis.key}-${district.id}`}
                                            className="space-y-1"
                                        >
                                            <div className="flex justify-between text-[11px]">
                                                <span className="font-bold text-slate-700">
                                                    #{dIdx + 1} {district.district_name}
                                                </span>
                                                <span className="font-extrabold text-slate-900">
                                                    {score.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${color.barClass}`}
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Card Indikator Aktif: pemilih indikator + nilai tiap kecamatan */}
            {axes[activeHoverIdx] && (
                <ActiveIndicatorCard
                    axes={axes}
                    activeIndex={activeHoverIdx}
                    onSelect={setHoveredIndex}
                    districts={districts}
                    hiddenDistricts={hiddenDistricts}
                />
            )}
        </div>
    );
}

// Kelas grid statis (agar terbaca Tailwind) sesuai jumlah kecamatan yang tampil
const SM_GRID_COLS: Record<number, string> = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
};

interface ActiveIndicatorCardProps {
    axes: readonly SliderConfig[];
    activeIndex: number;
    onSelect: (index: number) => void;
    districts: ScoredDistrict[];
    hiddenDistricts: Record<number, boolean>;
}

function ActiveIndicatorCard({
    axes,
    activeIndex,
    onSelect,
    districts,
    hiddenDistricts,
}: ActiveIndicatorCardProps) {
    const axis = axes[activeIndex];

    // Pertahankan urutan peringkat (#1, #2, #3) & warna seri asli
    const rows = districts
        .map((d, rank) => ({
            district: d,
            rank,
            color: SERIES_COLORS[rank % SERIES_COLORS.length],
            value: Number(d[axis.key]) || 0,
        }))
        .filter((row) => !hiddenDistricts[row.district.id]);

    const best = rows.length > 1 ? Math.max(...rows.map((r) => r.value)) : null;

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            {/* Header */}
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">
                        Indikator aktif
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
                        {axis.label}
                    </p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                    {activeIndex + 1} dari {axes.length}
                </span>
            </div>

            {/* Pemilih indikator: geser horizontal di HP, membungkus di layar lebar */}
            <div
                role="group"
                aria-label="Pilih indikator"
                className="-mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
                {axes.map((a, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                        <button
                            key={`pill-${a.key}`}
                            type="button"
                            onClick={() => onSelect(idx)}
                            aria-pressed={isActive}
                            className={`h-8 shrink-0 cursor-pointer rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0773BC]/30 ${
                                isActive
                                    ? "border-[#b6e838] bg-[#CDFC56] text-slate-900"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            }`}
                        >
                            {a.shortLabel}
                        </button>
                    );
                })}
            </div>

            {/* Nilai tiap kecamatan */}
            {rows.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">
                    Semua kecamatan sedang disembunyikan. Ketuk nama kecamatan di
                    atas grafik untuk menampilkannya lagi.
                </p>
            ) : (
                <ul
                    className={`mt-3 grid grid-cols-1 gap-2 ${SM_GRID_COLS[Math.min(rows.length, 3)]}`}
                >
                    {rows.map(({ district, rank, color, value }) => {
                        const isBest = best !== null && value === best;
                        return (
                            <li
                                key={district.id}
                                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:flex-col sm:items-stretch sm:gap-2"
                            >
                                {/* Nama kecamatan */}
                                <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                                    <span
                                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dotClass}`}
                                        aria-hidden="true"
                                    />
                                    <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                                        #{rank + 1}
                                    </span>
                                    <span className="truncate text-xs font-medium text-slate-700">
                                        {district.district_name}
                                    </span>
                                    {isBest && (
                                        <span className="ml-auto hidden shrink-0 text-[10px] font-medium text-emerald-600 sm:inline">
                                            Tertinggi
                                        </span>
                                    )}
                                </div>

                                {/* Bar + skor */}
                                <div className="flex shrink-0 items-center gap-2.5 sm:shrink">
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 min-[400px]:w-24 sm:w-auto sm:flex-1">
                                        <div
                                            className={`h-full rounded-full transition-[width] duration-300 ${color.barClass}`}
                                            style={{
                                                width: `${Math.max(0, Math.min(100, value))}%`,
                                            }}
                                        />
                                    </div>
                                    <span
                                        className={`w-9 text-right text-sm font-semibold tabular-nums ${
                                            isBest ? "text-emerald-700" : "text-slate-900"
                                        }`}
                                    >
                                        {value.toFixed(1)}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <p className="mt-2.5 text-[11px] text-slate-400">
                Ketuk indikator di atas atau titik pada grafik untuk berpindah
                indikator.
            </p>
        </div>
    );
}
