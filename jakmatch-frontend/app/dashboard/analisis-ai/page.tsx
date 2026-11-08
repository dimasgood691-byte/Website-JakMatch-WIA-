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

function renderFormattedText(raw: string) {
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={idx} className="font-extrabold text-slate-900">
                    {part.slice(2, -2)}
                </strong>
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
        if (!reportCanvasRef.current) return;
        setIsExporting(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(reportCanvasRef.current, {
                scale: 2,
                backgroundColor: "#FFFFFF",
                useCORS: true,
            });
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `Laporan-Riset-JakMatch-${appliedConfig.region.replace(
                /\s+/g,
                "-"
            )}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Gagal mengekspor laporan PNG:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Aksi Fase 8 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#CDFC56] text-slate-900 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                        Tahap 03 • AI Chatbot Consultant & Ekspor Laporan
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-xs mt-1.5">
                        Konsultan AI Interaktif & Laporan Keputusan
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                        Diskusikan rekomendasi wilayah, unggah foto properti atau dokumen
                        kontrak/brosur, lalu unduh laporan resmi.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link
                        href="/dashboard/komparasi"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Grafik
                    </Link>

                    <button
                        type="button"
                        onClick={handleSaveComparison}
                        disabled={isSaving || topThreeDistricts.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
                    >
                        <BookmarkCheck className="w-4 h-4 text-slate-900" />
                        {isSaving ? "Menyimpan..." : "Simpan Hasil Riset"}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownloadPNG}
                        disabled={isExporting || topThreeDistricts.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 shadow-xs disabled:opacity-50 transition cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? "Mengekspor PNG..." : "Unduh Laporan (PNG)"}
                    </button>
                </div>
            </div>

            {/* ===================================================== */}
            {/* BAGIAN 1: CHATBOT MULTIMODAL KONSULTAN AI JAKMATCH    */}
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
                className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden flex flex-col ${
                    isDraggingOver
                        ? "border-slate-900 ring-4 ring-[#CDFC56]"
                        : "border-slate-200"
                }`}
            >
                {/* Header Chatbot */}
                <div className="px-5 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#CDFC56] text-slate-900 flex items-center justify-center shadow-xs shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold text-white">
                                    JakMatch AI Spatial Assistant
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CDFC56] text-slate-900">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                                    Multimodal Ready
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-300">
                                {appliedProfileConfig.personaBadge} • Bisa tanya jawab,
                                kirim foto kos/ruko, atau lampirkan file dokumen
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {chatMessages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setChatMessages([])}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            >
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                Bersihkan Chat
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => triggerAiSynthesis()}
                            disabled={isAiStreaming || topThreeDistricts.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#CDFC56] text-slate-900 hover:bg-[#b8e840] disabled:opacity-50 transition cursor-pointer"
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 ${
                                    isAiStreaming ? "animate-spin" : ""
                                }`}
                            />
                             Analisis Ulang
                        </button>
                    </div>
                </div>

                {/* Bar Konteks Variabel Dinamis yang Aktif */}
                <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-500">
                        Konteks Aktif:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-[#CDFC56] font-bold">
                        Budget: {formatRupiah(appliedConfig.budget)}/bln
                    </span>
                    {sortedPriorities.slice(0, 3).map((p, idx) => (
                        <span
                            key={p.key}
                            className={`px-2 py-0.5 rounded-md font-bold border ${
                                idx === 0
                                    ? "bg-[#CDFC56]/55 border-[#b2e23b] text-slate-900"
                                    : "bg-white border-slate-200 text-slate-700"
                            }`}
                        >
                            {p.shortLabel}: {p.weight}%
                        </span>
                    ))}
                </div>

                {/* Ruang Percakapan (Chat Feed) */}
                <div className="p-4 sm:p-5 space-y-4 max-h-[460px] overflow-y-auto bg-[#F8FAFC]/60">
                    {/* Pesan Pertama: Analisis Otomatis Trade-Off Top 3 */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#CDFC56] border border-[#b2e23b] flex items-center justify-center text-slate-900 shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-xs border border-slate-200 p-4 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
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
                                className={`flex items-start gap-3 ${
                                    isUser ? "flex-row-reverse" : ""
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                        isUser
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
                                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs space-y-2.5 ${
                                        isUser
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
                                        className={`text-[10px] ${
                                            isUser
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
                <div className="px-4 sm:px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">
                        Tanya Cepat:
                    </span>
                    {QUICK_PROMPTS.map((q) => (
                        <button
                            key={q}
                            type="button"
                            disabled={isChatLoading}
                            onClick={() => void handleSendMessage(q)}
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-[#CDFC56] text-slate-700 hover:text-slate-900 transition cursor-pointer shrink-0 disabled:opacity-50"
                        >
                            {q}
                        </button>
                    ))}
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
                    className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5"
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

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            title="Unggah Foto Properti / Lingkungan"
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-[#CDFC56] text-slate-700 hover:text-slate-900 transition cursor-pointer"
                        >
                            <ImagePlus className="w-4 h-4" />
                            <span className=" sm:inline">Foto</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Lampirkan Dokumen / Brosur / CSV / PDF"
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-[#CDFC56] text-slate-700 hover:text-slate-900 transition cursor-pointer"
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
                        className="flex-1 min-h-[42px] max-h-28 resize-none rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#CDFC56] focus:border-slate-900 transition"
                    />

                    <button
                        type="submit"
                        disabled={
                            isChatLoading ||
                            (!inputPrompt.trim() &&
                                pendingAttachments.length === 0)
                        }
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#CDFC56] hover:bg-[#b8e840] text-slate-900 disabled:opacity-50 transition cursor-pointer shrink-0 shadow-xs"
                    >
                        <Send className="w-4 h-4" />
                        <span>Kirim</span>
                    </button>
                </form>
            </div>

            {/* ===================================================== */}
            {/* BAGIAN 2: KANVAS LAPORAN RESMI (UNTUK UNDUH PNG)      */}
            {/* ===================================================== */}
            <div
                ref={reportCanvasRef}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 lg:p-8 shadow-xs space-y-6"
            >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                        <span className="inline-block px-2.5 py-0.5 rounded bg-[#CDFC56] text-slate-900 text-[10px] font-extrabold uppercase tracking-wider">
                            Kanvas Laporan Keputusan Lokasi JakMatch
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                            Rekomendasi Wilayah: {appliedProfileConfig.label}
                        </h3>
                        <p className="text-xs text-slate-500">
                            Cakupan: {appliedConfig.region} • Target Aset:{" "}
                            {appliedProfileConfig.assetLabel} • Anggaran:{" "}
                            {formatRupiah(appliedConfig.budget)}/bln
                        </p>
                    </div>
                </div>

                {/* Ringkasan Kesimpulan AI di dalam Kanvas Laporan */}
                <div className="p-4 rounded-xl bg-[#CDFC56]/20 border border-[#b8e840] space-y-1.5">
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
                        <div className="lg:col-span-7 border border-slate-100 rounded-2xl p-4">
                            <InteractiveRadarChart
                                districts={topThreeDistricts}
                                axes={appliedProfileConfig.sliders}
                            />
                        </div>

                        <div className="lg:col-span-5 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Ringkasan Top 3 Kandidat Kecamatan
                            </h4>
                            {topThreeDistricts.map((d, idx) => (
                                <div
                                    key={d.id}
                                    className={`p-4 rounded-xl border flex items-center justify-between ${
                                        idx === 0
                                            ? "bg-[#CDFC56]/30 border-[#b5e43b]"
                                            : "bg-slate-50 border-slate-200/80"
                                    }`}
                                >
                                    <div>
                                        <span className="inline-block px-2 py-0.5 rounded bg-[#CDFC56] text-slate-900 text-[10px] font-extrabold uppercase">
                                            Peringkat #{idx + 1} • {d.city_region}
                                        </span>
                                        <p className="text-sm font-extrabold text-slate-900 mt-1">
                                            {d.district_name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Estimasi: {formatRupiah(d.estimatedCost)}/bln (
                                            {d.isUnderBudget ? "Underbudget" : "Overbudget"})
                                        </p>
                                    </div>
                                    <div className="text-right">
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

            <div className="flex justify-end">
                <Link
                    href="/dashboard/riwayat"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CDFC56] text-slate-900 text-xs font-extrabold hover:bg-[#b8e840] transition"
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
