"use client";

import React, { useId, useState } from "react";
import { ScoredDistrict, SliderConfig } from "./config";

interface ComparisonChartProps {
    districts: ScoredDistrict[];
    axes: readonly SliderConfig[];
}

const SERIES_COLORS = [
    {
        stroke: "#0F172A",
        fill: "#CDFC56",
        dotClass: "bg-slate-900 ring-2 ring-[#CDFC56]",
        barClass: "bg-slate-900",
        badgeClass: "bg-[#CDFC56] text-slate-900",
    },
    {
        stroke: "#2563EB",
        fill: "#2563EB",
        dotClass: "bg-[#2563EB]",
        barClass: "bg-[#2563EB]",
        badgeClass: "bg-blue-50 text-blue-700",
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

    const width = 680;
    const height = 290;
    const padLeft = 42;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 68;

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

    // Perhitungan koordinat untuk mode Radar Poligon
    const radarCx = 200;
    const radarCy = 155;
    const radarRadius = 105;
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
        <div className="w-full flex flex-col space-y-3">
            {/* Bar Kontrol Atas: Pilihan Mode Visual & Legend Interaktif */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start">
                    <button
                        type="button"
                        onClick={() => setChartMode("curve")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            chartMode === "curve"
                                ? "bg-[#CDFC56] text-slate-900 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Kurva Area
                    </button>
                    <button
                        type="button"
                        onClick={() => setChartMode("radar")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            chartMode === "radar"
                                ? "bg-[#CDFC56] text-slate-900 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Radar Poligon
                    </button>
                    <button
                        type="button"
                        onClick={() => setChartMode("bars")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            chartMode === "bars"
                                ? "bg-[#CDFC56] text-slate-900 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Mode Vertikal
                    </button>
                </div>

                {/* Legend Kecamatan */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {districts.map((district, idx) => {
                        const isHidden = !!hiddenDistricts[district.id];
                        const color = SERIES_COLORS[idx % SERIES_COLORS.length];

                        return (
                            <button
                                key={district.id}
                                type="button"
                                onClick={() => toggleDistrict(district.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer select-none ${
                                    isHidden
                                        ? "opacity-40 line-through bg-slate-50 border-slate-200 text-slate-400"
                                        : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-2xs"
                                }`}
                                title="Klik untuk menyembunyikan atau menampilkan kecamatan ini"
                            >
                                <span
                                    className={`w-2.5 h-2.5 rounded-full ${
                                        isHidden ? "bg-slate-300" : color.dotClass
                                    }`}
                                />
                                <span>
                                    {district.district_name} ({district.finalScore.toFixed(1)})
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MODE 1: GRAFIK KURVA DINAMIS */}
            {chartMode === "curve" && (
                <div className="relative w-full overflow-x-auto pb-1">
                    <div className="min-w-[480px] sm:min-w-0">
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
                                                stopOpacity={idx === 0 ? "0.45" : "0.20"}
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
                                            x={padLeft - 10}
                                            y={y + 4}
                                            textAnchor="end"
                                            className="text-[11px] fill-slate-400 font-semibold"
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
                                                stroke="#0F172A"
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
                                            y={baselineY + 20}
                                            textAnchor="middle"
                                            className={`text-[11px] font-bold transition-colors ${
                                                isHovered
                                                    ? "fill-slate-900"
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
                                                        ? 5.5
                                                        : 3.5
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
                </div>
            )}

            {/* MODE 2: RADAR POLIGON (SPIDER CHART) */}
            {chartMode === "radar" && (
                <div className="w-full flex justify-center py-2">
                    <svg
                        viewBox="0 0 400 310"
                        className="w-full max-w-[420px] h-auto select-none"
                    >
                        {[25, 50, 75, 100].map((level) => {
                            const ringPoints = axes
                                .map((_, idx) => {
                                    const pt = getRadarPoint(idx, level);
                                    return `${pt.x},${pt.y}`;
                                })
                                .join(" ");
                            return (
                                <polygon
                                    key={level}
                                    points={ringPoints}
                                    fill="none"
                                    stroke="#E2E8F0"
                                    strokeWidth="1"
                                />
                            );
                        })}

                        {axes.map((axis, idx) => {
                            const outer = getRadarPoint(idx, 100);
                            const labelPt = getRadarPoint(idx, 122);
                            return (
                                <g key={axis.key}>
                                    <line
                                        x1={radarCx}
                                        y1={radarCy}
                                        x2={outer.x}
                                        y2={outer.y}
                                        stroke="#CBD5E1"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={labelPt.x}
                                        y={labelPt.y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        onClick={() => setHoveredIndex(idx)}
                                        className="text-[10px] font-bold fill-slate-700 cursor-pointer"
                                    >
                                        {axis.shortLabel}
                                    </text>
                                </g>
                            );
                        })}

                        {districts.map((district, dIdx) => {
                            if (hiddenDistricts[district.id]) return null;
                            const color =
                                SERIES_COLORS[dIdx % SERIES_COLORS.length];
                            const polyPoints = axes
                                .map((axis, aIdx) => {
                                    const pt = getRadarPoint(
                                        aIdx,
                                        Number(district[axis.key]) || 0
                                    );
                                    return `${pt.x},${pt.y}`;
                                })
                                .join(" ");
                            return (
                                <g key={`radar-${district.id}`}>
                                    <polygon
                                        points={polyPoints}
                                        fill={color.fill}
                                        fillOpacity={dIdx === 0 ? 0.32 : 0.14}
                                        stroke={color.stroke}
                                        strokeWidth={dIdx === 0 ? "2.5" : "2"}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>
            )}

            {/* MODE 3: MATRIKS BAR VERTIKAL (Stack Layout Nyaman untuk Mobile) */}
            {chartMode === "bars" && (
                <div className="space-y-4 pt-1">
                    {axes.map((axis, aIdx) => (
                        <div
                            key={`bar-${axis.key}`}
                            onClick={() => setHoveredIndex(aIdx)}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-extrabold text-slate-900">
                                    {axis.label}
                                </span>
                                <span className="text-[10px] font-bold uppercase text-slate-400">
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
                                                <span className="font-semibold text-slate-700">
                                                    #{dIdx + 1} {district.district_name}
                                                </span>
                                                <span className="font-extrabold text-slate-900">
                                                    {score.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        dIdx === 0
                                                            ? "bg-slate-900"
                                                            : color.barClass
                                                    }`}
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

            {/* Bar Ringkasan Interaktif Indikator Terpilih */}
            {axes[activeHoverIdx] && (
                <div className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#CDFC56] text-slate-900 text-[10px] font-extrabold uppercase">
                            Indikator Aktif
                        </span>
                        <span className="font-bold text-[#CDFC56]">
                            {axes[activeHoverIdx].label}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {districts.map((d, idx) => {
                            if (hiddenDistricts[d.id]) return null;
                            const color =
                                SERIES_COLORS[idx % SERIES_COLORS.length];
                            const metricKey = axes[activeHoverIdx].key;
                            const val = Number(d[metricKey]) || 0;
                            return (
                                <span
                                    key={d.id}
                                    className="flex items-center gap-1.5 text-[11px]"
                                >
                                    <span
                                        className={`w-2.5 h-2.5 rounded-full ${color.dotClass}`}
                                    />
                                    <span className="text-slate-300">
                                        {d.district_name}:
                                    </span>
                                    <span className="font-extrabold text-[#CDFC56]">
                                        {val.toFixed(1)}
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pill Pemilih Indikator Cepat untuk Layar Sentuh / Mobile */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex flex-wrap gap-1.5">
                    {axes.map((axis, idx) => (
                        <button
                            key={`pill-${axis.key}`}
                            type="button"
                            onClick={() => setHoveredIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                activeHoverIdx === idx
                                    ? "bg-[#CDFC56] text-slate-900 border border-[#b2e23b]"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {axis.shortLabel}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-slate-400">
                    Klik nama kecamatan di atas untuk menyembunyikan/menampilkan kurva.
                </p>
            </div>
        </div>
    );
}
