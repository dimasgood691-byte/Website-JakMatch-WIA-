"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Sparkles,
    RefreshCw,
    BookmarkCheck,
    Download,
    ArrowLeft,
    ArrowRight,
    Send,
    ImagePlus,
    Paperclip,
    FileText,
    X,
    Bot,
    User,
    MessageSquarePlus,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import InteractiveRadarChart from "../RadarChart";
import { formatRupiah } from "../config";

interface AttachmentItem {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    dataUrl: string;
    textExcerpt?: string;
}

interface ChatMessageItem {
    id: string;
    role: "user" | "assistant";
    content: string;
    attachments?: AttachmentItem[];
    timestamp: string;
}

const QUICK_PROMPTS = [
    "Bandingkan untung-rugi Peringkat #1 vs #2",
    "Simulasikan rincian biaya dari budget saya",
    "Evaluasi keamanan bebas banjir & lingkungan",
    "Bagaimana akses transportasi KRL/MRT/TransJakarta?",
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeUnsupportedCssColors(root: HTMLElement): void {
    const document = root.ownerDocument;
    const view = document.defaultView;
    const context = document.createElement("canvas").getContext("2d");
    if (!view || !context) {
        throw new Error("Browser tidak mendukung konversi warna untuk ekspor.");
    }

    const colorFunctionPattern = /\b(?:ok)?(?:lab|lch)\([^)]*\)|\bcolor\([^)]*\)/gi;
    const colorCache = new Map<string, string>();
    const normalizeColor = (color: string): string => {
        const cachedColor = colorCache.get(color);
        if (cachedColor) return cachedColor;

        context.fillStyle = "rgb(1, 2, 3)";
        context.fillStyle = color;
        if (context.fillStyle === "rgb(1, 2, 3)") {
            throw new Error(`Format warna tidak didukung saat ekspor: ${color}`);
        }
        context.fillRect(0, 0, 1, 1);
        const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
        const normalizedColor =
            alpha === 255
                ? `rgb(${red}, ${green}, ${blue})`
                : `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
        colorCache.set(color, normalizedColor);
        return normalizedColor;
    };

    const elements = [
        root,
        ...root.querySelectorAll<HTMLElement | SVGElement>("*"),
    ];
    for (const element of elements) {
        const computedStyle = view.getComputedStyle(element);
        for (let index = 0; index < computedStyle.length; index += 1) {
            const property = computedStyle[index];
            const value = computedStyle.getPropertyValue(property);
            if (!value || !colorFunctionPattern.test(value)) continue;

            colorFunctionPattern.lastIndex = 0;
            const normalizedValue = value.replace(
                colorFunctionPattern,
                normalizeColor
            );
            colorFunctionPattern.lastIndex = 0;
            element.style.setProperty(property, normalizedValue);
        }
    }
}

function renderFormattedText(raw: string) {
    const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={idx} className="font-extrabold text-slate-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
                <em key={idx} className="italic text-slate-700">
                    {part.slice(1, -1)}
                </em>
            );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
}

export default function AnalisisAiPage() {
    const reportCanvasRef = useRef<HTMLDivElement>(null);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
    const [inputPrompt, setInputPrompt] = useState("");
    const [pendingAttachments, setPendingAttachments] = useState<
        AttachmentItem[]
    >([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [previewImageModal, setPreviewImageModal] = useState<string | null>(
        null
    );

    const {
        allDistricts,
        appliedProfileConfig,
        appliedConfig,
        topThreeDistricts,
        aiNarrative,
        isAiStreaming,
        isSaving,
        triggerAiSynthesis,
        handleSaveComparison,
    } = useDashboard();

    const sortedPriorities = [...appliedProfileConfig.sliders]
        .map((s) => ({
            ...s,
            weight: appliedConfig.weights[s.key] ?? 50,
        }))
        .sort((a, b) => b.weight - a.weight);

    const firstDistrictName =
        topThreeDistricts[0]?.district_name || "Peringkat #1";
    const secondDistrictName =
        topThreeDistricts[1]?.district_name || "Peringkat #2";

    const dynamicQuickPrompts = [
        `Kenapa ${firstDistrictName} jadi peringkat #1?`,
        `Bandingkan ${firstDistrictName} vs ${secondDistrictName}`,
        "Kalau kerja di Sudirman/Kuningan bagusnya di mana?",
        "Kalau budget 2,5 juta dapat kecamatan mana?",
        "Checklist survei lapangan & tips negosiasi sewa",
    ];

    // Auto-scroll ke pesan terbaru saat ada pesan baru
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isChatLoading]);

    // Proses pembacaan file (Foto maupun Dokumen)
    const processSelectedFiles = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const newItems: AttachmentItem[] = [];
        for (const file of Array.from(fileList)) {
            if (file.size > 10 * 1024 * 1024) {
                continue; // Batas aman 10MB per file
            }

            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ""));
                reader.onerror = () => resolve("");
                reader.readAsDataURL(file);
            });

            let textExcerpt: string | undefined;
            if (
                file.type.startsWith("text/") ||
                file.name.endsWith(".csv") ||
                file.name.endsWith(".json") ||
                file.name.endsWith(".txt") ||
                file.name.endsWith(".md")
            ) {
                textExcerpt = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () =>
                        resolve(String(reader.result || "").slice(0, 600));
                    reader.onerror = () => resolve("");
                    reader.readAsText(file);
                });
            }

            newItems.push({
                id: crypto.randomUUID(),
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                size: file.size,
                dataUrl,
                textExcerpt,
            });
        }

        setPendingAttachments((prev) => [...prev, ...newItems].slice(0, 5));
    };

    const removePendingAttachment = (id: string) => {
        setPendingAttachments((prev) => prev.filter((item) => item.id !== id));
    };

    const handlePasteClipboard = (
        e: React.ClipboardEvent<HTMLTextAreaElement>
    ) => {
        if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            void processSelectedFiles(e.clipboardData.files);
        }
    };

    const handleSendMessage = async (customPromptText?: string) => {
        const textToSend = (customPromptText ?? inputPrompt).trim();
        if (
            (!textToSend && pendingAttachments.length === 0) ||
            isChatLoading ||
            topThreeDistricts.length === 0
        ) {
            return;
        }

        const currentAttachments = [...pendingAttachments];
        const userMsg: ChatMessageItem = {
            id: crypto.randomUUID(),
            role: "user",
            content:
                textToSend ||
                `Mohon analisis ${currentAttachments.length} lampiran (${currentAttachments.map((a) => a.name).join(", ")}) terhadap rekomendasi wilayah dan budget saya.`,
            attachments:
                currentAttachments.length > 0 ? currentAttachments : undefined,
            timestamp: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        const assistantMsgId = crypto.randomUUID();
        const placeholderAssistantMsg: ChatMessageItem = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        const updatedHistory = [...chatMessages, userMsg];
        setChatMessages([...updatedHistory, placeholderAssistantMsg]);
        if (!customPromptText) {
            setInputPrompt("");
        }
        setPendingAttachments([]);
        setIsChatLoading(true);

        try {
            const priorityWeights = appliedProfileConfig.sliders.map((s) => ({
                key: s.key,
                label: s.label,
                shortLabel: s.shortLabel,
                weight: appliedConfig.weights[s.key] ?? 50,
            }));

            const totalWeight = priorityWeights.reduce(
                (sum, p) => sum + p.weight,
                0
            );
            const mapDistrictToPayload = (d: (typeof allDistricts)[number]) => {
                const estimatedCost = Math.round(
                    d.base_rental_cost * appliedProfileConfig.costMultiplier
                );
                const budgetDiff = appliedConfig.budget - estimatedCost;
                const isUnderBudget = budgetDiff >= 0;
                const weightedSum = priorityWeights.reduce(
                    (acc, p) =>
                        acc +
                        (Number(d[p.key as keyof typeof d]) || 0) * p.weight,
                    0
                );
                const finalScore =
                    totalWeight > 0
                        ? Math.round((weightedSum / totalWeight) * 10) / 10
                        : d.transport_score;

                return {
                    district_name: d.district_name,
                    city_region: d.city_region,
                    tier_zone: d.tier_zone,
                    estimated_cost: estimatedCost,
                    financial_status: (isUnderBudget
                        ? "UNDERBUDGET"
                        : "OVERBUDGET") as "UNDERBUDGET" | "OVERBUDGET",
                    budget_diff: Math.abs(budgetDiff),
                    final_score: finalScore,
                    transport_score: d.transport_score,
                    environment_score: d.environment_score,
                    flood_free_score: d.flood_free_score,
                    health_score: d.health_score,
                    market_density_score: d.market_density_score,
                };
            };

            const payload = {
                profileKey: appliedConfig.profile,
                profileLabel: appliedProfileConfig.label,
                assetType: appliedProfileConfig.assetLabel,
                selectedRegion: appliedConfig.region,
                userBudget: appliedConfig.budget,
                budgetLock: appliedConfig.budgetLock,
                priorityWeights,
                topDistricts: topThreeDistricts.map((d) => ({
                    district_name: d.district_name,
                    city_region: d.city_region,
                    tier_zone: d.tier_zone,
                    estimated_cost: d.estimatedCost,
                    financial_status: d.isUnderBudget
                        ? "UNDERBUDGET"
                        : "OVERBUDGET",
                    budget_diff: Math.abs(d.budgetDiff),
                    final_score: d.finalScore,
                    transport_score: d.transport_score,
                    environment_score: d.environment_score,
                    flood_free_score: d.flood_free_score,
                    health_score: d.health_score,
                    market_density_score: d.market_density_score,
                })),
                allDistricts: allDistricts.map(mapDistrictToPayload),
                chatMessages: [
                    ...(aiNarrative
                        ? [{ role: "assistant" as const, content: aiNarrative }]
                        : []),
                    ...updatedHistory.map((m) => ({
                        role: m.role,
                        content: m.content,
                        attachments: m.attachments?.map((a) => ({
                            name: a.name,
                            mimeType: a.mimeType,
                            size: a.size,
                            textExcerpt: a.textExcerpt,
                        })),
                    })),
                ],
            };

            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok || !res.body) {
                const errText = await res.text();
                setChatMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMsgId
                            ? {
                                ...m,
                                content:
                                    errText ||
                                    "Maaf, terjadi kendala saat memproses pesan. Silakan coba lagi.",
                            }
                            : m
                    )
                );
                setIsChatLoading(false);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });
                const snapshot = accumulated;
                setChatMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: snapshot } : m
                    )
                );
            }
        } catch {
            setChatMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMsgId
                        ? {
                            ...m,
                            content:
                                "Maaf, koneksi terputus saat menghubungi Konsultan AI. Silakan coba kembali.",
                        }
                        : m
                )
            );
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleDownloadPNG = async () => {
        if (!reportCanvasRef.current) {
            setExportError("Konten laporan belum siap untuk diunduh.");
            return;
        }

        setIsExporting(true);
        setExportError(null);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(reportCanvasRef.current, {
                scale: 2,
                backgroundColor: "#FFFFFF",
                useCORS: true,
                onclone: (clonedDocument) => {
                    const clonedReport =
                        clonedDocument.getElementById("analysis-report-canvas");
                    if (!clonedReport) {
                        throw new Error("Konten laporan tidak ditemukan saat ekspor.");
                    }
                    Object.assign(clonedReport.style, {
                        position: "relative",
                        top: "auto",
                        left: "auto",
                        zIndex: "auto",
                        visibility: "visible",
                    });
                    normalizeUnsupportedCssColors(clonedReport);
                },
            });

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error("Browser gagal membuat file PNG."));
                    }
                }, "image/png");
            });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `Laporan-Riset-JakMatch-${appliedConfig.region.replace(
                /\s+/g,
                "-"
            )}.png`;
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        } catch (err) {
            console.error("Gagal mengekspor laporan PNG:", err);
            setExportError(
                "Gagal mengunduh laporan PNG. Silakan coba lagi."
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-w-0 space-y-4 sm:space-y-5">
            {/* Header & Aksi Fase 8 */}
            <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch">
                <header className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-white/25 bg-white/10 px-3.5 py-3.5 shadow-[0_8px_20px_rgba(7,55,100,0.1)] backdrop-blur-md sm:px-4 sm:py-4">
                    <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#CDFC56]/15 blur-2xl" />
                    <div className="relative flex min-w-0 items-start">
                        <div className="min-w-0">
                            <div className="min-w-0 space-y-1">
                                <h2 className="text-base font-extrabold leading-snug text-white sm:text-lg lg:text-xl">
                                    Konsultan AI Interaktif & Laporan Keputusan
                                </h2>
                                <p className="max-w-2xl text-[11px] leading-relaxed text-white/85 sm:text-xs">
                                    Diskusikan rekomendasi wilayah, unggah foto properti atau dokumen
                                    kontrak/brosur, lalu unduh laporan resmi.
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid w-full grid-cols-1 gap-2 min-[480px]:grid-cols-2 xl:w-auto xl:grid-cols-3 xl:content-center">
                    <Link
                        href="/dashboard/komparasi"
                        className="group inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#b6e838] bg-[#CDFC56] px-3 py-2 text-[11px] font-extrabold text-[#161616] shadow-[0_6px_20px_rgba(7,115,188,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#b8e840] hover:bg-[#b8e840] hover:shadow-[0_10px_26px_rgba(7,115,188,0.28)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0773BC] sm:px-4 sm:text-xs"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        <span className="truncate">Kembali ke Grafik</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleSaveComparison}
                        disabled={isSaving || topThreeDistricts.length === 0}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-800 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#b6e838] hover:bg-[#CDFC56] hover:shadow-sm active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDFC56] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer sm:px-4 sm:text-xs"
                    >
                        <BookmarkCheck className="w-4 h-4 text-slate-900" />
                        {isSaving ? "Menyimpan..." : "Simpan Hasil Riset"}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownloadPNG}
                        disabled={isExporting || topThreeDistricts.length === 0}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#CDFC56] px-3 py-2 text-[11px] font-extrabold text-slate-900 shadow-xs transition hover:bg-[#b8e840] disabled:opacity-50 cursor-pointer sm:px-4 sm:text-xs"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? "Mengekspor PNG..." : "Unduh Laporan (PNG)"}
                    </button>
                    {exportError && (
                        <p role="alert" className="col-span-full w-full text-center text-xs text-red-100">
                            {exportError}
                        </p>
                    )}
                </div>
            </div>

            {/* ===================================================== */}
            {/* BAGIAN 1: KANVAS LAPORAN RESMI (UNTUK UNDUH PNG)      */}
            {/* ===================================================== */}
            <div
                className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs sm:space-y-5 sm:p-5 lg:p-6"
            >
                <div className="flex min-w-0 flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between sm:pb-4">
                    <div className="min-w-0">
                        <h3 className="text-base font-extrabold leading-snug text-slate-900 sm:text-lg">
                            Rekomendasi Wilayah: {appliedProfileConfig.label}
                        </h3>
                        <p className="mt-1 break-words text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                            Cakupan: {appliedConfig.region} • Target Aset:{" "}
                            {appliedProfileConfig.assetLabel} • Anggaran:{" "}
                            {formatRupiah(appliedConfig.budget)}/bln
                        </p>
                    </div>
                </div>

                {/* Ringkasan Kesimpulan AI di dalam Kanvas Laporan */}
                <div className="space-y-1.5 rounded-lg border border-[#b8e840] bg-[#CDFC56]/20 p-3 sm:rounded-xl sm:p-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                        Kesimpulan Konsultan AI ({appliedProfileConfig.personaBadge})
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {aiNarrative ||
                            "Klik Analisis Ulang di atas untuk menyusun narasi laporan."}
                    </p>
                </div>

                {/* Ringkasan Grafik & 3 Kartu Pemenang di dalam Kanvas Laporan */}
                {topThreeDistricts.length > 0 && (
                    <div className="grid min-w-0 grid-cols-1 items-start gap-4 pt-1 lg:grid-cols-12 lg:gap-5">
                        <div className="min-w-0 rounded-xl border border-slate-100 p-2.5 sm:p-3 lg:col-span-7">
                            <InteractiveRadarChart
                                districts={topThreeDistricts}
                                axes={appliedProfileConfig.sliders}
                            />
                        </div>

                        <div className="min-w-0 space-y-2.5 lg:col-span-5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Ringkasan Top 3 Kandidat Kecamatan
                            </h4>
                            {topThreeDistricts.map((d, idx) => (
                                <div
                                    key={d.id}
                                    className={`flex min-w-0 items-center justify-between gap-2.5 rounded-lg border p-3 sm:p-3.5 ${idx === 0
                                        ? "bg-[#CDFC56]/30 border-[#b5e43b]"
                                        : "bg-slate-50 border-slate-200/80"
                                        }`}
                                >
                                    <div className="min-w-0">
                                        <span className="inline-block px-2 py-0.5 rounded bg-[#CDFC56] text-slate-900 text-[10px] font-extrabold uppercase">
                                            Peringkat #{idx + 1} • {d.city_region}
                                        </span>
                                        <p className="mt-1 truncate text-xs font-extrabold text-slate-900 sm:text-sm">
                                            {d.district_name}
                                        </p>
                                        <p className="text-[10px] leading-relaxed text-slate-500 sm:text-xs">
                                            Estimasi: {formatRupiah(d.estimatedCost)}/bln (
                                            {d.isUnderBudget ? "Underbudget" : "Overbudget"})
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="block text-[10px] text-slate-400">
                                            Skor
                                        </span>
                                        <span className="text-base font-extrabold text-slate-900">
                                            {d.finalScore.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div
                id="analysis-report-canvas"
                ref={reportCanvasRef}
                aria-hidden="true"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: -1,
                    visibility: "hidden",
                    width: 1120,
                    boxSizing: "border-box",
                    padding: 52,
                    backgroundColor: "#FFFFFF",
                    color: "#0B1526",
                    fontFamily: "Arial, Helvetica, sans-serif",
                }}
            >
                <header
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        paddingBottom: 28,
                        borderBottom: "2px solid #E8EEF4",
                    }}
                >
                    <div>
                        <div
                            style={{
                                color: "#0773BC",
                                fontSize: 13,
                                fontWeight: 800,
                                letterSpacing: 2,
                                textTransform: "uppercase",
                            }}
                        >
                            JakMatch • Spatial Insight
                        </div>
                        <h1
                            style={{
                                margin: "12px 0 6px",
                                fontSize: 32,
                                lineHeight: 1.2,
                                fontWeight: 800,
                                color: "#0B1526",
                            }}
                        >
                            Laporan Rekomendasi Wilayah
                        </h1>
                        <p style={{ margin: 0, fontSize: 15, color: "#64748B" }}>
                            Analisis pilihan kawasan berdasarkan kebutuhan dan prioritas Anda
                        </p>
                    </div>
                    <div
                        style={{
                            padding: "10px 16px",
                            borderRadius: 999,
                            backgroundColor: "#F1F8DD",
                            color: "#365314",
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {appliedProfileConfig.personaBadge}
                    </div>
                </header>

                <section
                    style={{
                        display: "flex",
                        gap: 14,
                        marginTop: 26,
                    }}
                >
                    {[
                        {
                            label: "PROFIL KEBUTUHAN",
                            value: appliedProfileConfig.label,
                        },
                        {
                            label: "JENIS PROPERTI",
                            value: appliedProfileConfig.assetLabel,
                        },
                        {
                            label: "ANGGARAN BULANAN",
                            value: formatRupiah(appliedConfig.budget),
                        },
                        {
                            label: "CAKUPAN WILAYAH",
                            value: appliedConfig.region,
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                padding: "16px 18px",
                                border: "1px solid #E2E8F0",
                                borderRadius: 14,
                                backgroundColor: "#F8FAFC",
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: 8,
                                    color: "#64748B",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: 0.8,
                                }}
                            >
                                {item.label}
                            </div>
                            <div
                                style={{
                                    color: "#0B1526",
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                    fontWeight: 700,
                                }}
                            >
                                {item.value}
                            </div>
                        </div>
                    ))}
                </section>

                <section
                    style={{
                        marginTop: 24,
                        padding: "22px 26px",
                        borderRadius: 16,
                        backgroundColor: "#0B1526",
                        borderLeft: "6px solid #CDFC56",
                    }}
                >
                    <div
                        style={{
                            marginBottom: 10,
                            color: "#CDFC56",
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                        }}
                    >
                        Kesimpulan Konsultan AI
                    </div>
                    <p
                        style={{
                            margin: 0,
                            color: "#F8FAFC",
                            fontSize: 15,
                            lineHeight: 1.7,
                            whiteSpace: "pre-line",
                        }}
                    >
                        {aiNarrative ||
                            "Belum ada kesimpulan. Jalankan analisis ulang untuk membuat rekomendasi."}
                    </p>
                </section>

                <section style={{ marginTop: 30 }}>
                    <div style={{ marginBottom: 14 }}>
                        <h2
                            style={{
                                margin: 0,
                                color: "#0B1526",
                                fontSize: 20,
                                fontWeight: 800,
                            }}
                        >
                            Tiga Rekomendasi Teratas
                        </h2>
                        <p
                            style={{
                                margin: "5px 0 0",
                                color: "#64748B",
                                fontSize: 13,
                            }}
                        >
                            Perbandingan skor akhir dan estimasi biaya bulanan
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 14 }}>
                        {topThreeDistricts.map((district, index) => {
                            const score = Math.max(
                                0,
                                Math.min(100, district.finalScore)
                            );
                            const isTopChoice = index === 0;
                            return (
                                <article
                                    key={district.id}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        padding: 20,
                                        border: `1px solid ${isTopChoice ? "#B8E840" : "#E2E8F0"
                                            }`,
                                        borderRadius: 16,
                                        backgroundColor: isTopChoice
                                            ? "#F7FCEB"
                                            : "#FFFFFF",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 18,
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: "6px 10px",
                                                borderRadius: 999,
                                                backgroundColor: isTopChoice
                                                    ? "#CDFC56"
                                                    : "#EFF6FF",
                                                color: "#0B1526",
                                                fontSize: 11,
                                                fontWeight: 800,
                                            }}
                                        >
                                            PERINGKAT #{index + 1}
                                        </span>
                                        <span
                                            style={{
                                                color: "#64748B",
                                                fontSize: 12,
                                            }}
                                        >
                                            {district.city_region}
                                        </span>
                                    </div>
                                    <h3
                                        style={{
                                            margin: "0 0 16px",
                                            color: "#0B1526",
                                            fontSize: 21,
                                            lineHeight: 1.25,
                                            fontWeight: 800,
                                        }}
                                    >
                                        {district.district_name}
                                    </h3>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "baseline",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <span style={{ color: "#64748B", fontSize: 12 }}>
                                            Skor kecocokan
                                        </span>
                                        <strong
                                            style={{
                                                color: "#0B1526",
                                                fontSize: 19,
                                            }}
                                        >
                                            {district.finalScore.toFixed(1)}
                                        </strong>
                                    </div>
                                    <div
                                        style={{
                                            height: 8,
                                            overflow: "hidden",
                                            borderRadius: 999,
                                            backgroundColor: "#E2E8F0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${score}%`,
                                                height: "100%",
                                                borderRadius: 999,
                                                backgroundColor: isTopChoice
                                                    ? "#0773BC"
                                                    : "#38BDF8",
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 18,
                                            paddingTop: 14,
                                            borderTop: "1px solid #E2E8F0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "#64748B",
                                                fontSize: 11,
                                            }}
                                        >
                                            ESTIMASI BIAYA / BULAN
                                        </div>
                                        <div
                                            style={{
                                                marginTop: 5,
                                                color: "#0B1526",
                                                fontSize: 16,
                                                fontWeight: 800,
                                            }}
                                        >
                                            {formatRupiah(district.estimatedCost)}
                                        </div>
                                        <div
                                            style={{
                                                marginTop: 8,
                                                color: district.isUnderBudget
                                                    ? "#15803D"
                                                    : "#B45309",
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {district.isUnderBudget
                                                ? "Sesuai anggaran"
                                                : "Melebihi anggaran"}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <footer
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 28,
                        paddingTop: 16,
                        borderTop: "1px solid #E2E8F0",
                        color: "#94A3B8",
                        fontSize: 11,
                    }}
                >
                    <span>JakMatch • Rekomendasi berdasarkan preferensi pengguna</span>
                    <span>Skor adalah estimasi kecocokan relatif, bukan jaminan hasil</span>
                </footer>
            </div>

            {/* ===================================================== */}
            {/* BAGIAN 2: CHATBOT MULTIMODAL KONSULTAN AI JAKMATCH    */}
            {/* ===================================================== */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    void processSelectedFiles(e.dataTransfer.files);
                }}
                className={`min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm flex flex-col transition-all ${isDraggingOver
                    ? "border-slate-900 ring-4 ring-[#CDFC56]"
                    : "border-slate-200"
                    }`}
            >
                {/* Header Chatbot */}
                <div className="flex flex-col gap-3 bg-slate-900 px-3.5 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CDFC56] text-slate-900 shadow-xs">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="text-xs font-extrabold text-white sm:text-sm">
                                    JakMatch AI Spatial Assistant
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CDFC56] text-slate-900">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                                    Ready
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:w-auto sm:shrink-0">
                        {chatMessages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setChatMessages([])}
                                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20 cursor-pointer sm:text-[11px]"
                            >
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                Bersihkan Chat
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => triggerAiSynthesis()}
                            disabled={isAiStreaming || topThreeDistricts.length === 0}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#CDFC56] px-3 py-1.5 text-[10px] font-extrabold text-slate-900 transition hover:bg-[#b8e840] disabled:opacity-50 cursor-pointer sm:text-[11px]"
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 ${isAiStreaming ? "animate-spin" : ""
                                    }`}
                            />
                            Analisis Ulang
                        </button>
                    </div>
                </div>

                {/* Bar Konteks Variabel Dinamis yang Aktif */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-[10px] sm:gap-2 sm:px-4 sm:text-[11px]">
                    <span className="font-bold text-slate-500">
                        Konteks Aktif:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-[#CDFC56] font-bold">
                        Budget: {formatRupiah(appliedConfig.budget)}/bln
                    </span>
                    {sortedPriorities.slice(0, 3).map((p, idx) => (
                        <span
                            key={p.key}
                            className={`px-2 py-0.5 rounded-md font-bold border ${idx === 0
                                ? "bg-[#CDFC56]/55 border-[#b2e23b] text-slate-900"
                                : "bg-white border-slate-200 text-slate-700"
                                }`}
                        >
                            {p.shortLabel}: {p.weight}%
                        </span>
                    ))}
                </div>

                {/* Ruang Percakapan (Chat Feed) */}
                <div className="max-h-[min(60dvh,520px)] space-y-3 overflow-y-auto bg-[#F8FAFC]/60 p-3 sm:max-h-[520px] sm:space-y-4 sm:p-4">
                    {/* Pesan Pertama: Analisis Otomatis Trade-Off Top 3 */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#CDFC56] border border-[#b2e23b] flex items-center justify-center text-slate-900 shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2 rounded-xl rounded-tl-xs border border-slate-200 bg-white p-3 shadow-2xs sm:p-4">
                            <div className="flex flex-wrap items-start justify-between gap-1.5">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 bg-[#CDFC56] px-2 py-0.5 rounded">
                                    Ringkasan Utama Top 3 Kecamatan
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    Otomatis • Strict JSON-Locked
                                </span>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                                {aiNarrative ? (
                                    <p className="whitespace-pre-line">
                                        {aiNarrative}
                                        {isAiStreaming && (
                                            <span className="inline-block w-2 h-4 ml-1 bg-slate-900 animate-pulse align-middle" />
                                        )}
                                    </p>
                                ) : (
                                    <p className="text-xs text-slate-400 italic py-2">
                                        Sedang menyusun analisis kompromi wilayah berdasarkan
                                        custom budget dan bobot prioritas Anda...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Daftar Riwayat Chat Interaktif User & AI */}
                    {chatMessages.map((msg) => {
                        const isUser = msg.role === "user";
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isUser
                                        ? "bg-slate-900 text-[#CDFC56]"
                                        : "bg-[#CDFC56] border border-[#b2e23b] text-slate-900"
                                        }`}
                                >
                                    {isUser ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>

                                <div
                                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs space-y-2.5 ${isUser
                                        ? "bg-slate-900 text-white rounded-tr-xs"
                                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                                        }`}
                                >
                                    {/* Lampiran Foto atau Dokumen pada Bubble Pesan */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pb-1">
                                            {msg.attachments.map((att) => {
                                                const isImg =
                                                    att.mimeType.startsWith("image/");
                                                return isImg ? (
                                                    <button
                                                        key={att.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewImageModal(
                                                                att.dataUrl
                                                            )
                                                        }
                                                        className="group relative w-28 h-24 rounded-xl overflow-hidden border border-white/20 bg-black/20 cursor-pointer"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={att.dataUrl}
                                                            alt={att.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                        <span className="absolute bottom-1 inset-x-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded truncate">
                                                            {att.name}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <div
                                                        key={att.id}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-left"
                                                    >
                                                        <FileText className="w-4 h-4 text-[#CDFC56] shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-white truncate max-w-[160px]">
                                                                {att.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-300">
                                                                {formatFileSize(att.size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Isi Teks Pesan */}
                                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                                        {msg.content ? (
                                            isUser ? (
                                                msg.content
                                            ) : (
                                                renderFormattedText(msg.content)
                                            )
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
                                                <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping" />
                                                Konsultan AI sedang menganalisis...
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className={`text-[10px] ${isUser
                                            ? "text-slate-400 text-right"
                                            : "text-slate-400"
                                            }`}
                                    >
                                        {msg.timestamp}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatBottomRef} />
                </div>

                {/* Bar Saran Pertanyaan Cepat */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 bg-white px-3 py-2.5 sm:gap-2 sm:px-4">
                    <span className="mr-0.5 text-[10px] font-bold text-slate-400 sm:text-[11px]">
                        Tanya Cepat:
                    </span>
                    {
                        dynamicQuickPrompts.map((q) => (
                            <button
                                key={q}
                                type="button"
                                disabled={isChatLoading}
                                onClick={() => void handleSendMessage(q)}
                                className="max-w-full rounded-full bg-slate-100 px-2.5 py-1.5 text-left text-[10px] font-bold leading-snug text-slate-700 transition hover:bg-[#CDFC56] hover:text-slate-900 cursor-pointer disabled:opacity-50 sm:px-3 sm:py-1 sm:text-[11px]"
                            >
                                {q}
                            </button>
                        ))
                    }
                </div>

                {/* Pratinjau Lampiran Foto / File Sebelum Dikirim */}
                {pendingAttachments.length > 0 && (
                    <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center gap-2.5">
                        {pendingAttachments.map((att) => {
                            const isImg = att.mimeType.startsWith("image/");
                            return (
                                <div
                                    key={att.id}
                                    className="relative group flex items-center gap-2.5 p-2 pr-7 rounded-xl bg-white border border-slate-200 shadow-2xs"
                                >
                                    {isImg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={att.dataUrl}
                                            alt={att.name}
                                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-[#CDFC56]/40 flex items-center justify-center text-slate-900 shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                                            {att.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {formatFileSize(att.size)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removePendingAttachment(att.id)
                                        }
                                        aria-label="Hapus lampiran"
                                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Input Komposer Chat & Tombol Upload Foto / File */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSendMessage();
                    }}
                    className="flex flex-col items-stretch gap-2 border-t border-slate-200 bg-white p-3 sm:flex-row sm:items-end sm:gap-2.5 sm:p-4"
                >
                    {/* Input Tersembunyi untuk Foto & Dokumen */}
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            void processSelectedFiles(e.target.files);
                            e.target.value = "";
                        }}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.csv,.json,.xls,.xlsx,image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            void processSelectedFiles(e.target.files);
                            e.target.value = "";
                        }}
                    />

                    <div className="flex shrink-0 items-center gap-1.5 sm:order-1">
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            title="Unggah Foto Properti / Lingkungan"
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-[#CDFC56] hover:text-slate-900 cursor-pointer"
                        >
                            <ImagePlus className="w-4 h-4" />
                            <span className=" sm:inline">Foto</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Lampirkan Dokumen / Brosur / CSV / PDF"
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-[#CDFC56] hover:text-slate-900 cursor-pointer"
                        >
                            <Paperclip className="w-4 h-4" />
                            <span className=" sm:inline">File</span>
                        </button>
                    </div>

                    <textarea
                        rows={1}
                        value={inputPrompt}
                        onPaste={handlePasteClipboard}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void handleSendMessage();
                            }
                        }}
                        placeholder="Ketik pertanyaan, tempel (paste) gambar, atau lampirkan foto kos/ruko & dokumen..."
                        className="min-h-[42px] max-h-28 w-full min-w-0 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 transition focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CDFC56] sm:order-2 sm:text-sm"
                    />

                    <button
                        type="submit"
                        disabled={
                            isChatLoading ||
                            (!inputPrompt.trim() &&
                                pendingAttachments.length === 0)
                        }
                        className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#CDFC56] px-5 py-2.5 text-xs font-extrabold text-slate-900 shadow-xs transition hover:bg-[#b8e840] disabled:opacity-50 cursor-pointer sm:order-3 sm:w-auto"
                    >
                        <Send className="w-4 h-4" />
                        <span>Kirim</span>
                    </button>
                </form>
            </div>

            <div className="flex justify-stretch sm:justify-end">
                <Link
                    href="/dashboard/riwayat"
                    className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#CDFC56] px-4 py-2 text-[11px] font-extrabold text-slate-900 transition hover:bg-[#b8e840] sm:w-auto sm:text-xs"
                >
                    Lihat Daftar Riwayat Riset Tersimpan
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Modal Lightbox Pratinjau Foto Lampiran */}
            {previewImageModal && (
                <div
                    onClick={() => setPreviewImageModal(null)}
                    className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-3xl w-full bg-white rounded-2xl p-3 shadow-2xl"
                    >
                        <button
                            type="button"
                            onClick={() => setPreviewImageModal(null)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewImageModal}
                            alt="Pratinjau Lampiran"
                            className="w-full max-h-[75vh] object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
