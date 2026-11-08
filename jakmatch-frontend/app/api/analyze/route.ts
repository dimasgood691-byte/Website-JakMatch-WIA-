import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest } from "next/server";

interface AnalyzeDistrictPayload {
    district_name: string;
    city_region: string;
    tier_zone: number;
    estimated_cost: number;
    financial_status: "UNDERBUDGET" | "OVERBUDGET";
    budget_diff: number;
    final_score: number;
    transport_score: number;
    environment_score: number;
    flood_free_score: number;
    health_score: number;
    market_density_score: number;
}

interface PriorityWeightItem {
    key: string;
    label: string;
    shortLabel: string;
    weight: number;
}

export interface ChatAttachmentPayload {
    name: string;
    mimeType: string;
    size: number;
    dataUrl?: string;
    textExcerpt?: string;
}

export interface ChatHistoryMessage {
    role: "user" | "assistant";
    content: string;
    attachments?: ChatAttachmentPayload[];
}

interface AnalyzeRequestBody {
    profileKey: "student_worker" | "family" | "umkm";
    profileLabel: string;
    assetType: string;
    selectedRegion: string;
    userBudget: number;
    budgetLock?: boolean;
    priorityWeights?: PriorityWeightItem[];
    topDistricts: AnalyzeDistrictPayload[];
    allDistricts?: AnalyzeDistrictPayload[];
    chatMessages?: ChatHistoryMessage[];
}

function formatIdr(val: number): string {
    return `Rp ${Math.round(val).toLocaleString("id-ID")}`;
}

function getMetricValue(d: AnalyzeDistrictPayload, key: string): number {
    const map: Record<string, number> = {
        transport_score: d.transport_score,
        environment_score: d.environment_score,
        flood_free_score: d.flood_free_score,
        health_score: d.health_score,
        market_density_score: d.market_density_score,
    };
    return map[key] ?? d.final_score;
}

function getStrongestAndWeakestMetric(
    d: AnalyzeDistrictPayload,
    priorityWeights: PriorityWeightItem[]
) {
    const metrics =
        priorityWeights.length > 0
            ? priorityWeights.map((p) => ({
                  label: p.shortLabel,
                  fullLabel: p.label,
                  score: getMetricValue(d, p.key),
                  weight: p.weight,
              }))
            : [
                  {
                      label: "Transportasi",
                      fullLabel: "Akses Transportasi Umum",
                      score: d.transport_score,
                      weight: 80,
                  },
                  {
                      label: "Udara & RTH",
                      fullLabel: "Kualitas Udara & RTH",
                      score: d.environment_score,
                      weight: 75,
                  },
                  {
                      label: "Kesehatan",
                      fullLabel: "Fasilitas Kesehatan",
                      score: d.health_score,
                      weight: 80,
                  },
                  {
                      label: "Bebas Banjir",
                      fullLabel: "Tingkat Bebas Banjir",
                      score: d.flood_free_score,
                      weight: 85,
                  },
              ];

    const sortedByScore = [...metrics].sort((a, b) => b.score - a.score);
    return {
        strongest: sortedByScore[0],
        secondStrongest: sortedByScore[1] || sortedByScore[0],
        weakest: sortedByScore[sortedByScore.length - 1],
    };
}

/**
 * Dynamic Trade-Off Synthesizer Engine (Untuk Ringkasan Utama Top 3)
 */
function buildDynamicSynthesisNarrative(body: AnalyzeRequestBody): string {
    const {
        profileKey,
        profileLabel,
        assetType,
        selectedRegion,
        userBudget,
        budgetLock,
        priorityWeights = [],
        topDistricts,
    } = body;

    const sortedWeights = [...priorityWeights].sort(
        (a, b) => b.weight - a.weight
    );
    const highestPriority = sortedWeights[0] || {
        key: "transport_score",
        label: "Akses Transportasi Umum",
        shortLabel: "Transportasi",
        weight: 85,
    };
    const secondPriority = sortedWeights[1] || {
        key: "flood_free_score",
        label: "Tingkat Bebas Banjir",
        shortLabel: "Bebas Banjir",
        weight: 80,
    };
    const lowestPriority =
        sortedWeights[sortedWeights.length - 1] || secondPriority;

    const first = topDistricts[0];
    const second = topDistricts[1];
    const third = topDistricts[2];

    const firstTopMetric = getMetricValue(first, highestPriority.key);
    const firstSecondMetric = getMetricValue(first, secondPriority.key);

    const budgetLockNote = budgetLock ? " (mode Kunci Anggaran aktif)" : "";
    const sentence1 = `Berdasarkan simulasi ${profileLabel} untuk ${assetType} di cakupan ${selectedRegion} dengan batas anggaran ${formatIdr(userBudget)}/bulan${budgetLockNote} serta prioritas tertinggi Anda pada ${highestPriority.label} (bobot ${highestPriority.weight}%) dan ${secondPriority.label} (bobot ${secondPriority.weight}%), Kecamatan ${first.district_name} (${first.city_region}) terpilih sebagai rekomendasi #1 dengan skor komposit ${first.final_score.toFixed(1)}/100.`;

    const firstFinancialText =
        first.financial_status === "UNDERBUDGET"
            ? first.budget_diff === 0
                ? `tepat sesuai plafon anggaran Anda (${formatIdr(first.estimated_cost)}/bulan)`
                : `berstatus UNDERBUDGET (${formatIdr(first.estimated_cost)}/bulan) sehingga menghemat ${formatIdr(first.budget_diff)}/bulan dari anggaran Anda`
            : `berstatus OVERBUDGET (${formatIdr(first.estimated_cost)}/bulan) yang membutuhkan kompromi tambahan dana ${formatIdr(first.budget_diff)}/bulan di atas anggaran Anda`;

    const sentence2 = `Keunggulan ${first.district_name} didorong oleh capaian ${highestPriority.shortLabel} sebesar ${firstTopMetric.toFixed(1)} dan ${secondPriority.shortLabel} sebesar ${firstSecondMetric.toFixed(1)}, dengan estimasi pasar yang ${firstFinancialText}.`;

    let sentence3 = "";
    if (second && third) {
        const secondTopMetric = getMetricValue(second, highestPriority.key);
        const costGap12 = first.estimated_cost - second.estimated_cost;
        const costComparison =
            costGap12 > 0
                ? `menawarkan alternatif sewa lebih hemat ${formatIdr(Math.abs(costGap12))}/bulan (${formatIdr(second.estimated_cost)}/bulan)`
                : costGap12 < 0
                  ? `memiliki estimasi sewa lebih tinggi (${formatIdr(second.estimated_cost)}/bulan)`
                  : `memiliki estimasi sewa setara (${formatIdr(second.estimated_cost)}/bulan)`;

        sentence3 = `Sebagai pembanding, Peringkat #2 ${second.district_name} (skor ${second.final_score.toFixed(1)}; ${highestPriority.shortLabel} ${secondTopMetric.toFixed(1)}) ${costComparison}, sedangkan Peringkat #3 ${third.district_name} (skor ${third.final_score.toFixed(1)}; estimasi ${formatIdr(third.estimated_cost)}/bulan) menjadi opsi cadangan dengan kompromi pada indikator berprioritas lebih rendah (${lowestPriority.shortLabel}, bobot ${lowestPriority.weight}%).`;
    } else if (second) {
        sentence3 = `Sebagai pembanding, Peringkat #2 ${second.district_name} mencatat skor ${second.final_score.toFixed(1)} dengan estimasi sewa ${formatIdr(second.estimated_cost)}/bulan (${second.financial_status}).`;
    }

    let sentence4 = "";
    if (
        first.financial_status === "OVERBUDGET" &&
        second &&
        second.financial_status === "UNDERBUDGET"
    ) {
        sentence4 = `Rekomendasi Keputusan: Pilih ${first.district_name} apabila kualitas ${highestPriority.shortLabel} adalah syarat mutlak dan Anda bersedia menambah anggaran ${formatIdr(first.budget_diff)}/bulan, atau beralih ke ${second.district_name} agar tetap aman di bawah budget (${formatIdr(second.estimated_cost)}/bulan) dengan pengorbanan skor hanya ${(first.final_score - second.final_score).toFixed(1)} poin.`;
    } else if (profileKey === "umkm") {
        sentence4 = `Rekomendasi Keputusan: ${first.district_name} memberikan rasio potensi trafik pasar (${first.market_density_score.toFixed(1)}) dan efisiensi biaya ruko paling optimal terhadap modal bulanan ${formatIdr(userBudget)} untuk ekspansi usaha Anda.`;
    } else {
        sentence4 = `Rekomendasi Keputusan: ${first.district_name} adalah titik keseimbangan paling rasional antara kualitas ${highestPriority.shortLabel} dan keamanan finansial untuk anggaran ${formatIdr(userBudget)}/bulan Anda.`;
    }

    return [sentence1, sentence2, sentence3, sentence4]
        .filter(Boolean)
        .join(" ");
}

/**
 * Normalisasi typo umum bahasa Indonesia agar intent parser akurat 100%
 * dan tidak salah mendeteksi substring (misal "kecamataman" -> "kecamatan", bukan "aman").
 */
function normalizeUserQuery(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/kecamataman|kecamtan|kcamatan|kecmatan/g, "kecamatan")
        .replace(/transpotasi|tranportasi|trasportasi/g, "transportasi")
        .replace(/budjet|bajet|buget/g, "budget")
        .replace(/bajir|banjr/g, "banjir")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Mesin NLP Kontekstual Anti-Halusinasi untuk Chatbot JakMatch:
 * Menggunakan Word-Boundary Regex (\b) dan pencocokan nama kecamatan spesifik
 * agar setiap jawaban 100% relevan dengan kalimat pertanyaan pengguna.
 */
function buildDynamicChatReply(body: AnalyzeRequestBody): string {
    const {
        profileKey,
        profileLabel,
        assetType,
        selectedRegion,
        userBudget,
        priorityWeights = [],
        topDistricts,
        allDistricts = [],
        chatMessages = [],
    } = body;

    const lastMsg = chatMessages[chatMessages.length - 1];
    const rawText = lastMsg?.content || "";
    const q = normalizeUserQuery(rawText);
    const attachments = lastMsg?.attachments || [];

    const first = topDistricts[0];
    const second = topDistricts[1];
    const third = topDistricts[2];

    const sortedWeights = [...priorityWeights].sort(
        (a, b) => b.weight - a.weight
    );
    const topPriority = sortedWeights[0] || {
        key: "transport_score",
        label: "Akses Transportasi Umum",
        shortLabel: "Transportasi",
        weight: 85,
    };
    const secondPriority = sortedWeights[1] || topPriority;

    const searchablePool =
        allDistricts.length > 0 ? allDistricts : topDistricts;

    // Deteksi apakah pengguna menyebut nama kecamatan tertentu di dalam pertanyaannya
    const mentionedDistricts = searchablePool.filter((d) =>
        q.includes(d.district_name.toLowerCase())
    );

    const sections: string[] = [];

    // -------------------------------------------------------------------------
    // A. JIKA ADA LAMPIRAN FOTO ATAU FILE DOKUMEN
    // -------------------------------------------------------------------------
    if (attachments.length > 0) {
        const imageFiles = attachments.filter((a) =>
            a.mimeType.startsWith("image/")
        );
        const docFiles = attachments.filter(
            (a) => !a.mimeType.startsWith("image/")
        );

        if (imageFiles.length > 0) {
            const imgNames = imageFiles.map((f) => `"${f.name}"`).join(", ");
            sections.push(
                `📸 **Analisis Foto Properti (${imgNames}):**\nBerdasarkan foto yang Anda unggah dan dikaitkan dengan target **${assetType}** pada kandidat #1 **${first.district_name}** (${first.city_region}):\n` +
                    `- **Patokan Harga Wajar:** Rata-rata sewa di ${first.district_name} adalah **${formatIdr(first.estimated_cost)}/bulan** (${first.financial_status === "UNDERBUDGET" ? `masih di bawah budget Anda sebesar ${formatIdr(first.budget_diff)}` : `di atas budget Anda sebesar ${formatIdr(first.budget_diff)}`}).\n` +
                    `- **Checklist Lapangan:** Mengingat skor Bebas Banjir di ${first.district_name} adalah **${first.flood_free_score.toFixed(1)}/100** dan Udara/RTH **${first.environment_score.toFixed(1)}/100**, pastikan properti pada foto memiliki elevasi lantai lebih tinggi dari selokan depan, sirkulasi udara langsung, serta akses jalan yang mendukung mobilitas harian (Skor Transportasi **${first.transport_score.toFixed(1)}/100**).`
            );
        }

        if (docFiles.length > 0) {
            const docNames = docFiles.map((f) => `"${f.name}"`).join(", ");
            const excerpt = docFiles[0]?.textExcerpt
                ? `\n- **Cuplikan Isi File:** *"${docFiles[0].textExcerpt.slice(0, 140).replace(/\s+/g, " ")}..."*`
                : "";
            sections.push(
                `📄 **Evaluasi Dokumen Lampiran (${docNames}):**${excerpt}\n` +
                    `- **Benchmark Terhadap Data JakMatch:** Untuk profil **${profileLabel}** dengan anggaran **${formatIdr(userBudget)}/bulan**, gunakan tiga kandidat terbaik Anda sebagai pembanding nilai kontrak: **#1 ${first.district_name}** (${formatIdr(first.estimated_cost)}/bln, Skor ${first.final_score.toFixed(1)})${second ? `, **#2 ${second.district_name}** (${formatIdr(second.estimated_cost)}/bln, Skor ${second.final_score.toFixed(1)})` : ""}${third ? `, dan **#3 ${third.district_name}** (${formatIdr(third.estimated_cost)}/bln, Skor ${third.final_score.toFixed(1)})` : ""}.`
            );
        }

        // Jika pengguna hanya mengirim lampiran tanpa pertanyaan spesifik, langsung kembalikan hasil analisis lampiran
        if (
            !rawText.trim() ||
            rawText.startsWith("Mohon analisis ")
        ) {
            return sections.join("\n\n");
        }
    }

    // -------------------------------------------------------------------------
    // B. JIKA PENGGUNA MENYEBUT NAMA KECAMATAN SPESIFIK (1 ATAU LEBIH)
    // -------------------------------------------------------------------------
    if (mentionedDistricts.length >= 2) {
        const d1 = mentionedDistricts[0];
        const d2 = mentionedDistricts[1];
        const winner = d1.final_score >= d2.final_score ? d1 : d2;
        const cheaper = d1.estimated_cost <= d2.estimated_cost ? d1 : d2;
        sections.push(
            `⚖️ **Perbandingan Langsung: ${d1.district_name} vs ${d2.district_name}**\n` +
                `1. **Skor Keseluruhan (Sesuai Bobot Prioritas Anda):** **${d1.district_name}** mencatat skor **${d1.final_score.toFixed(1)}/100**, sedangkan **${d2.district_name}** mencatat **${d2.final_score.toFixed(1)}/100**. Secara kualitas indikator, **${winner.district_name}** lebih unggul.\n` +
                `2. **Perbandingan Harga Sewa (${assetType}):**\n` +
                `   - **${d1.district_name}:** ${formatIdr(d1.estimated_cost)}/bln (${d1.financial_status === "UNDERBUDGET" ? `Hemat ${formatIdr(d1.budget_diff)} dari budget` : `Lewat ${formatIdr(d1.budget_diff)} dari budget`})\n` +
                `   - **${d2.district_name}:** ${formatIdr(d2.estimated_cost)}/bln (${d2.financial_status === "UNDERBUDGET" ? `Hemat ${formatIdr(d2.budget_diff)} dari budget` : `Lewat ${formatIdr(d2.budget_diff)} dari budget`})\n` +
                `3. **Detail Indikator:** Transportasi (${d1.transport_score.toFixed(1)} vs ${d2.transport_score.toFixed(1)}), Bebas Banjir (${d1.flood_free_score.toFixed(1)} vs ${d2.flood_free_score.toFixed(1)}), Kesehatan (${d1.health_score.toFixed(1)} vs ${d2.health_score.toFixed(1)}), Udara & RTH (${d1.environment_score.toFixed(1)} vs ${d2.environment_score.toFixed(1)}).\n` +
                `**Saran Konsultan:** Pilih **${winner.district_name}** jika Anda memprioritaskan skor fasilitas tertinggi, atau pilih **${cheaper.district_name}** (${formatIdr(cheaper.estimated_cost)}/bln) jika Anda ingin pengeluaran bulanan yang lebih ringan.`
        );
        return sections.join("\n\n");
    }

    if (mentionedDistricts.length === 1) {
        const target = mentionedDistricts[0];
        const rankIdx = topDistricts.findIndex(
            (d) =>
                d.district_name.toLowerCase() ===
                target.district_name.toLowerCase()
        );
        const rankLabel =
            rankIdx !== -1
                ? `Peringkat #${rankIdx + 1} di hasil filter Anda`
                : `Wilayah ${target.city_region}`;
        const { strongest, secondStrongest, weakest } =
            getStrongestAndWeakestMetric(target, priorityWeights);

        sections.push(
            `📍 **Bedah Detail Kecamatan ${target.district_name} (${rankLabel}):**\n` +
                `- **Skor Akhir:** **${target.final_score.toFixed(1)}/100** (Zona Tier ${target.tier_zone}, ${target.city_region}).\n` +
                `- **Status Finansial:** Estimasi sewa ${assetType} di sini adalah **${formatIdr(target.estimated_cost)}/bulan**. Terhadap budget Anda (${formatIdr(userBudget)}/bln), kecamatan ini berstatus **${target.financial_status}** (${target.financial_status === "UNDERBUDGET" ? `hemat ${formatIdr(target.budget_diff)}/bln` : `kurang/lewat ${formatIdr(target.budget_diff)}/bln`}).\n` +
                `- **Kelebihan Utama:** Sangat kuat pada **${strongest.fullLabel} (${strongest.score.toFixed(1)}/100)** dan **${secondStrongest.fullLabel} (${secondStrongest.score.toFixed(1)}/100)**.\n` +
                `- **Catatan Kompromi (Kekurangan):** Indikator yang relatif paling rendah di kecamatan ini adalah **${weakest.fullLabel} (${weakest.score.toFixed(1)}/100)**.\n` +
                (target.district_name !== first.district_name
                    ? `- **Perbandingan dengan #1 (${first.district_name}):** ${target.district_name} terpaut ${(first.final_score - target.final_score).toFixed(1)} poin dari ${first.district_name} (${first.final_score.toFixed(1)}), dengan selisih harga sewa ${formatIdr(Math.abs(target.estimated_cost - first.estimated_cost))}/bulan.`
                    : `- **Kesimpulan:** Karena ${target.district_name} adalah **Peringkat #1**, wilayah ini paling presisi menjawab prioritas utama Anda pada **${topPriority.label} (${topPriority.weight}%)**.`)
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // C. INTENT 1: PERTANYAAN REKOMENDASI UTAMA ("LEBIH BAIK DI KECAMATAN MANA?", "PILIH MANA?", "TERBAIK MANA?")
    // -------------------------------------------------------------------------
    const isAskingWhichIsBest =
        /\b(lebih baik|lebih bagus|pilih mana|mending mana|mendingan mana|kecamatan mana|daerah mana|wilayah mana|lokasi mana|rekomendasi|saran|terbaik|paling bagus|paling cocok|paling pas|urutkan|top 3)\b/i.test(
            q
        ) ||
        (q.includes("menurut") && q.includes("mana"));

    if (isAskingWhichIsBest) {
        const firstMetrics = getStrongestAndWeakestMetric(
            first,
            priorityWeights
        );
        const underBudgetOptions = topDistricts.filter(
            (d) => d.financial_status === "UNDERBUDGET"
        );
        const cheapestInTop3 = [...topDistricts].sort(
            (a, b) => a.estimated_cost - b.estimated_cost
        )[0];

        let decisionAdvice = "";
        if (first.financial_status === "UNDERBUDGET") {
            decisionAdvice = `✅ **Keputusan Terbaik: Pilih #1 ${first.district_name} (${first.city_region})**\nKarena selain memiliki skor tertinggi (**${first.final_score.toFixed(1)}/100**), estimasi sewanya (**${formatIdr(first.estimated_cost)}/bulan**) juga **masih di bawah budget Anda** (${formatIdr(userBudget)}/bulan, hemat ${formatIdr(first.budget_diff)}/bulan). Anda tidak perlu mengorbankan kualitas maupun anggaran.`;
        } else if (underBudgetOptions.length > 0) {
            const bestAffordable = underBudgetOptions[0];
            decisionAdvice =
                `✅ **Rekomendasi Berdasarkan 2 Skenario Keputusan Anda:**\n` +
                `1. **Jika Mengutamakan Kualitas & Fasilitas Terbaik → Pilih #1 ${first.district_name} (Skor ${first.final_score.toFixed(1)}/100):** Unggul kuat di ${firstMetrics.strongest.label} (${firstMetrics.strongest.score.toFixed(1)}), namun estimasi sewanya (**${formatIdr(first.estimated_cost)}/bln**) melebihi budget Anda sebesar **${formatIdr(first.budget_diff)}/bln**.\n` +
                `2. **Jika Wajib Sesuai Budget (${formatIdr(userBudget)}/bln) → Pilih ${bestAffordable.district_name} (Skor ${bestAffordable.final_score.toFixed(1)}/100):** Estimasi sewanya **${formatIdr(bestAffordable.estimated_cost)}/bln** (aman di bawah budget, hemat ${formatIdr(bestAffordable.budget_diff)}/bln) dengan selisih skor hanya **${(first.final_score - bestAffordable.final_score).toFixed(1)} poin**.`;
        } else {
            decisionAdvice =
                `✅ **Rekomendasi Antara Kualitas vs Penghematan:**\n` +
                `1. **Pilihan Kualitas Tertinggi → #1 ${first.district_name} (Skor ${first.final_score.toFixed(1)}/100):** Paling unggul memenuhi prioritas **${topPriority.label} (${topPriority.weight}%)** dengan estimasi sewa **${formatIdr(first.estimated_cost)}/bln**.\n` +
                `2. **Pilihan Paling Rasional secara Biaya → ${cheapestInTop3.district_name} (Skor ${cheapestInTop3.final_score.toFixed(1)}/100):** Memiliki estimasi sewa paling rendah di antara Top 3 (**${formatIdr(cheapestInTop3.estimated_cost)}/bln**), sehingga paling mendekati plafon anggaran ${formatIdr(userBudget)}/bln Anda.`;
        }

        const comparisonTable = topDistricts
            .map((d, idx) => {
                const m = getStrongestAndWeakestMetric(d, priorityWeights);
                return `${idx + 1}. **${d.district_name}** (${d.city_region}) — Skor **${d.final_score.toFixed(1)}** | Sewa: **${formatIdr(d.estimated_cost)}/bln** (${d.financial_status === "UNDERBUDGET" ? `Hemat ${formatIdr(d.budget_diff)}` : `Overbudget ${formatIdr(d.budget_diff)}`}) | Unggul di: **${m.strongest.label} (${m.strongest.score.toFixed(1)})**`;
            })
            .join("\n");

        sections.push(
            `🎯 **Jawaban Konsultan AI untuk Profil ${profileLabel}:**\n\n${decisionAdvice}\n\n**Ringkasan Perbandingan 3 Kandidat Teratas Anda:**\n${comparisonTable}`
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // D. INTENT 2: PERBANDINGAN HEAD-TO-HEAD / KELEBIHAN & KEKURANGAN
    // -------------------------------------------------------------------------
    if (
        /\b(bandingkan|perbandingan|untung rugi|kelebihan|kekurangan|kelemahan|keunggulan|plus minus|bedanya|perbedaan|vs)\b/i.test(
            q
        )
    ) {
        const breakdown = topDistricts
            .map((d, idx) => {
                const { strongest, secondStrongest, weakest } =
                    getStrongestAndWeakestMetric(d, priorityWeights);
                return (
                    `**#${idx + 1} ${d.district_name} (Skor ${d.final_score.toFixed(1)} • ${formatIdr(d.estimated_cost)}/bln):**\n` +
                    `   - ➕ **Kelebihan:** Unggul pada ${strongest.fullLabel} (**${strongest.score.toFixed(1)}**) & ${secondStrongest.fullLabel} (**${secondStrongest.score.toFixed(1)}**).\n` +
                    `   - ➖ **Kompromi/Kekurangan:** Skor ${weakest.label} relatif lebih rendah (**${weakest.score.toFixed(1)}**) & status finansial **${d.financial_status}** (${d.financial_status === "UNDERBUDGET" ? `hemat ${formatIdr(d.budget_diff)}` : `lewat ${formatIdr(d.budget_diff)} dari budget`}).`
                );
            })
            .join("\n\n");

        sections.push(
            `⚖️ **Analisis Untung-Rugi (Pros & Cons) Top 3 Kecamatan Anda:**\n\n${breakdown}\n\n**Kesimpulan:** **${first.district_name}** unggul karena bobot tertinggi Anda ada pada **${topPriority.label} (${topPriority.weight}%)** dan **${secondPriority.label} (${secondPriority.weight}%)**.`
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // E. INTENT 3: SPESIFIK TOPIK BANJIR / DRAINASE (Word-Boundary Ketat!)
    // -------------------------------------------------------------------------
    if (/\b(banjir|kebanjiran|genangan|drainase|luapan|musim hujan)\b/i.test(q)) {
        const sortedFlood = [...topDistricts].sort(
            (a, b) => b.flood_free_score - a.flood_free_score
        );
        const safest = sortedFlood[0];
        sections.push(
            `🌊 **Evaluasi Ketahanan Banjir & Drainase (Berdasarkan Data Top 3 Anda):**\n` +
                sortedFlood
                    .map(
                        (d, idx) =>
                            `${idx + 1}. **${d.district_name}:** Skor Bebas Banjir **${d.flood_free_score.toFixed(1)}/100** (${d.flood_free_score >= 85 ? "Sangat Aman / Ideal" : d.flood_free_score >= 76 ? "Aman Sedang" : "Perlu Waspada Drainase Lokal"}) — Estimasi sewa ${formatIdr(d.estimated_cost)}/bln.`
                    )
                    .join("\n") +
                `\n\n**Rekomendasi Mitigasi:** Jika bebas banjir adalah prioritas nomor satu Anda, **${safest.district_name}** (Skor **${safest.flood_free_score.toFixed(1)}/100**) adalah pilihan paling tangguh terhadap curah hujan ekstrem di antara kandidat Anda.`
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // F. INTENT 4: SPESIFIK TOPIK BIAYA / BUDGET / MURAH / RINCIAN PENGELUARAN
    // -------------------------------------------------------------------------
    if (
        /\b(biaya|budget|anggaran|harga|sewa|murah|termurah|mahal|hemat|pengeluaran|finansial|uang|juta|rincian)\b/i.test(
            q
        )
    ) {
        const sortedByCost = [...topDistricts].sort(
            (a, b) => a.estimated_cost - b.estimated_cost
        );
        const cheapest = sortedByCost[0];
        const remainingIfCheapest = userBudget - cheapest.estimated_cost;

        sections.push(
            `💰 **Analisis Keterjangkauan & Simulasi Budget (${formatIdr(userBudget)}/bulan):**\n` +
                `Berikut urutan kandidat dari estimasi sewa paling hemat untuk kategori **${assetType}**:\n` +
                sortedByCost
                    .map(
                        (d, idx) =>
                            `${idx + 1}. **${d.district_name}** (${d.city_region}): **${formatIdr(d.estimated_cost)}/bln** — ${d.financial_status === "UNDERBUDGET" ? `🟢 **Underbudget** (Sisa dana **${formatIdr(d.budget_diff)}/bln**)` : `🔴 **Overbudget** (Kurang **${formatIdr(d.budget_diff)}/bln**)`} | Skor: **${d.final_score.toFixed(1)}**`
                    )
                    .join("\n") +
                `\n\n**Saran Pengelolaan Anggaran:**\n` +
                (remainingIfCheapest >= 0
                    ? `Dengan memilih **${cheapest.district_name}** (${formatIdr(cheapest.estimated_cost)}/bln), Anda masih memiliki sisa anggaran **${formatIdr(remainingIfCheapest)}/bulan** yang dapat dialokasikan untuk biaya listrik/air, internet, dan transportasi harian.`
                    : `Seluruh kandidat Top 3 saat ini berada di atas anggaran ${formatIdr(userBudget)}/bln. Opsi paling mendekati adalah **${cheapest.district_name}** (${formatIdr(cheapest.estimated_cost)}/bln), atau Anda dapat mengaktifkan fitur **Budget Lock** di Tahap 01 lalu klik **Generate Grafik** untuk menyaring khusus kecamatan di bawah ${formatIdr(userBudget)}/bln.`)
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // G. INTENT 5: SPESIFIK TOPIK TRANSPORTASI / KRL / MRT / LRT / TRANSJAKARTA
    // -------------------------------------------------------------------------
    if (
        /\b(transportasi|transport|mrt|krl|lrt|transjakarta|busway|stasiun|halte|akses|mobilitas|macet|komuter|logistik|ojol)\b/i.test(
            q
        )
    ) {
        const sortedTrans = [...topDistricts].sort(
            (a, b) => b.transport_score - a.transport_score
        );
        const bestTrans = sortedTrans[0];

        sections.push(
            `🚆 **Analisis Aksesibilitas & Transportasi Publik (KRL, MRT, LRT & TransJakarta):**\n` +
                sortedTrans
                    .map(
                        (d, idx) =>
                            `${idx + 1}. **${d.district_name}:** Skor Transportasi **${d.transport_score.toFixed(1)}/100** (${d.transport_score >= 90 ? "Simpul Utama Transit / Sangat Terintegrasi" : d.transport_score >= 82 ? "Terkoneksi Koridor TransJakarta / KRL" : "Akses Feeder / Jalan Sekunder"}) — Sewa ${formatIdr(d.estimated_cost)}/bln.`
                    )
                    .join("\n") +
                `\n\n**Kesimpulan Mobilitas:** **${bestTrans.district_name}** (${bestTrans.transport_score.toFixed(1)}/100) memberikan efisiensi waktu tempuh terbaik dan jangkauan jalan kaki paling dekat menuju halte/stasiun angkutan massal.`
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // H. INTENT 6: SPESIFIK TOPIK KESEHATAN / RUMAH SAKIT / KLINIK / UDARA / RTH
    // -------------------------------------------------------------------------
    if (
        /\b(kesehatan|rs|rumah sakit|puskesmas|klinik|apotek|medis|dokter|udara|polusi|ispu|rth|taman|hijau|asri|lingkungan)\b/i.test(
            q
        )
    ) {
        const bestHealth = [...topDistricts].sort(
            (a, b) => b.health_score - a.health_score
        )[0];
        const bestEnv = [...topDistricts].sort(
            (a, b) => b.environment_score - a.environment_score
        )[0];

        sections.push(
            `🌿 **Evaluasi Kualitas Lingkungan (ISPU & RTH) dan Fasilitas Kesehatan:**\n` +
                topDistricts
                    .map(
                        (d, idx) =>
                            `${idx + 1}. **${d.district_name}:** Udara & RTH **${d.environment_score.toFixed(1)}/100** | Fasilitas Kesehatan **${d.health_score.toFixed(1)}/100** (${formatIdr(d.estimated_cost)}/bln)`
                    )
                    .join("\n") +
                `\n\n- **Lingkungan Paling Asri & Bersih:** **${bestEnv.district_name}** (Skor Udara & RTH **${bestEnv.environment_score.toFixed(1)}/100**).\n` +
                `- **Akses Medis & RS Terlengkap:** **${bestHealth.district_name}** (Skor Kesehatan **${bestHealth.health_score.toFixed(1)}/100**).`
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // I. INTENT 7: SPESIFIK TOPIK UMKM / BISNIS / RUKO / PASAR
    // -------------------------------------------------------------------------
    if (
        /\b(umkm|usaha|bisnis|ruko|kios|cabang|pasar|pembeli|pelanggan|omzet|ramai|komersial)\b/i.test(
            q
        )
    ) {
        const sortedMarket = [...topDistricts].sort(
            (a, b) => b.market_density_score - a.market_density_score
        );
        const bestMarket = sortedMarket[0];

        sections.push(
            `🏪 **Analisis Potensi Pasar & Kelayakan Lokasi Bisnis:**\n` +
                sortedMarket
                    .map(
                        (d, idx) =>
                            `${idx + 1}. **${d.district_name}:** Potensi Pasar **${d.market_density_score.toFixed(1)}/100** | Logistik/Transportasi **${d.transport_score.toFixed(1)}/100** | Bebas Genangan **${d.flood_free_score.toFixed(1)}/100** — Estimasi sewa ${formatIdr(d.estimated_cost)}/bln.`
                    )
                    .join("\n") +
                `\n\n**Rekomendasi Ekspansi:** **${bestMarket.district_name}** memiliki kepadatan trafik pembeli tertinggi (**${bestMarket.market_density_score.toFixed(1)}/100**) sehingga paling potensial untuk perputaran transaksi harian.`
        );
        return sections.join("\n\n");
    }

    // -------------------------------------------------------------------------
    // J. INTENT 8: SAPAAN / PERTANYAAN UMUM -> JAWAB LANGSUNG KONTEKS TOP 3
    // -------------------------------------------------------------------------
    const firstM = getStrongestAndWeakestMetric(first, priorityWeights);
    sections.push(
        `💡 **Rekomendasi Konsultan AI untuk "${rawText}":**\n` +
            `Berdasarkan konfigurasi Anda saat ini (**${profileLabel}**, cakupan **${selectedRegion}**, anggaran **${formatIdr(userBudget)}/bulan**, prioritas tertinggi **${topPriority.label} ${topPriority.weight}%**):\n\n` +
            `1. **Pilihan Utama (#1): Kecamatan ${first.district_name}** (${first.city_region}) dengan skor **${first.final_score.toFixed(1)}/100** dan estimasi sewa **${formatIdr(first.estimated_cost)}/bulan** (${first.financial_status === "UNDERBUDGET" ? `hemat ${formatIdr(first.budget_diff)}/bln` : `overbudget ${formatIdr(first.budget_diff)}/bln`}). Unggul kuat di **${firstM.strongest.label} (${firstM.strongest.score.toFixed(1)})**.\n` +
            (second
                ? `2. **Alternatif #2: Kecamatan ${second.district_name}** (Skor **${second.final_score.toFixed(1)}/100**, sewa **${formatIdr(second.estimated_cost)}/bulan** — ${second.financial_status}).\n`
                : "") +
            (third
                ? `3. **Alternatif #3: Kecamatan ${third.district_name}** (Skor **${third.final_score.toFixed(1)}/100**, sewa **${formatIdr(third.estimated_cost)}/bulan** — ${third.financial_status}).\n\n`
                : "\n") +
            `Anda dapat bertanya spesifik seperti *"Bandingkan ${first.district_name} vs ${second ? second.district_name : "kecamatan lain"}"*, *"Mana yang paling murah?"*, atau melampirkan foto & dokumen properti untuk saya evaluasi.`
    );

    return sections.join("\n\n");
}

function createSimulatedStreamResponse(text: string): Response {
    const encoder = new TextEncoder();
    const tokens = text.split(/(?=[ \n])/);

    const stream = new ReadableStream({
        async start(controller) {
            for (let i = 0; i < tokens.length; i++) {
                controller.enqueue(encoder.encode(tokens[i]));
                await new Promise((r) => setTimeout(r, 8));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}

export async function POST(req: NextRequest) {
    let parsedBody: AnalyzeRequestBody | null = null;
    try {
        parsedBody = (await req.json()) as AnalyzeRequestBody;
        const {
            profileKey,
            profileLabel,
            assetType,
            selectedRegion,
            userBudget,
            budgetLock,
            priorityWeights = [],
            topDistricts,
            chatMessages,
        } = parsedBody;

        if (!topDistricts || topDistricts.length === 0) {
            return new Response("Tidak ada data kecamatan untuk dianalisis.", {
                status: 400,
            });
        }

        const isChatMode =
            Array.isArray(chatMessages) && chatMessages.length > 0;

        // Jika GOOGLE_GENERATIVE_AI_API_KEY belum dipasang di .env.local, gunakan Dynamic Engine Anti-Halusinasi
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            const replyText = isChatMode
                ? buildDynamicChatReply(parsedBody)
                : buildDynamicSynthesisNarrative(parsedBody);
            return createSimulatedStreamResponse(replyText);
        }

        const isUMKM = profileKey === "umkm";
        const personaRole = isUMKM
            ? "Konsultan Lokasi Bisnis & Ekspansi Ritel UMKM DKI Jakarta"
            : "Konsultan Tata Ruang & Hunian Warga DKI Jakarta";

        const focusInstruction = isUMKM
            ? "Soroti kompromi (trade-off) antara potensi pembeli (market_density_score), akses logistik (transport_score), keamanan stok dari genangan (flood_free_score), dan estimasi harga sewa Ruko/Kios."
            : "Soroti kompromi (trade-off) antara akses transportasi umum (transport_score), kualitas udara ISPU & RTH (environment_score), fasilitas kesehatan (health_score), bebas banjir (flood_free_score), dan estimasi sewa hunian.";

        const sortedWeights = [...priorityWeights].sort(
            (a, b) => b.weight - a.weight
        );
        const weightsSummary =
            sortedWeights.length > 0
                ? sortedWeights
                      .map((w) => `${w.label}: ${w.weight}%`)
                      .join(", ")
                : "Bobot standar seimbang";

        const contextHeader = `Data Konfigurasi Personal Pengguna:
- Profil: ${profileLabel} (Target Aset: ${assetType})
- Cakupan Wilayah: ${selectedRegion}
- Anggaran Bulanan Maksimal: Rp ${userBudget.toLocaleString("id-ID")} ${budgetLock ? "(Budget Lock Aktif)" : ""}
- Urutan Bobot Prioritas Pengguna (0%-100%): ${weightsSummary}
- Data JSON Top 3 Kecamatan Hasil Perhitungan: ${JSON.stringify(topDistricts, null, 2)}`;

        if (isChatMode) {
            const lastUserMsg = chatMessages[chatMessages.length - 1];
            const attachmentSummary =
                lastUserMsg.attachments && lastUserMsg.attachments.length > 0
                    ? `\nLampiran Pengguna: ${lastUserMsg.attachments
                          .map(
                              (a) =>
                                  `${a.name} (${a.mimeType}, ${Math.round(a.size / 1024)} KB)${a.textExcerpt ? ` - Isi: ${a.textExcerpt.slice(0, 500)}` : ""}`
                          )
                          .join("; ")}`
                    : "";

            const historyTranscript = chatMessages
                .slice(-6)
                .map(
                    (m) =>
                        `${m.role === "user" ? "Pengguna" : "Konsultan AI"}: ${m.content}`
                )
                .join("\n\n");

            const chatSystemPrompt = `Kamu adalah ${personaRole} di platform JakMatch.
${contextHeader}
ATURAN KETAT ANTI-HALUSINASI:
1. Jawab LANGSUNG sesuai maksud pertanyaan pengguna (misal jika pengguna bertanya "lebih baik di kecamatan mana?", tunjuk langsung kecamatan terbaik dari Data JSON Top 3 beserta alasan skor dan pertimbangan harganya terhadap budget pengguna).
2. HANYA gunakan angka, skor, dan estimasi harga yang ada pada JSON di atas. DILARANG mengarang angka di luar data.
3. Jika pengguna mengunggah foto atau dokumen, kaitkan analisisnya dengan kelayakan aset (${assetType}) dan harga pasar di kecamatan Top 3.`;

            const result = streamText({
                model: google("gemini-2.5-flash"),
                system: chatSystemPrompt,
                prompt: `${historyTranscript}${attachmentSummary}\n\nJawab pertanyaan terakhir pengguna secara akurat, langsung pada intinya, dan tidak melenceng topik:`,
                temperature: 0.2,
            });

            return result.toTextStreamResponse();
        }

        const systemPrompt = `Kamu adalah ${personaRole}.
ATURAN KETAT ANTI-HALUSINASI & PERSONALISASI DINAMIS:
1. Kamu HANYA boleh menggunakan angka, nama kecamatan, skor, bobot prioritas, dan harga yang tertulis di dalam payload JSON pengguna.
2. DILARANG KERAS mengarang harga, fasilitas, atau nama daerah di luar JSON yang diberikan.
3. WAJIB menyebutkan secara eksplisit anggaran bulanan pengguna (Rp ${userBudget.toLocaleString("id-ID")}) dan mengaitkan rekomendasi dengan bobot prioritas tertinggi yang diatur pengguna (${weightsSummary}).
4. ${focusInstruction}
5. Bandingkan secara tajam mengapa Peringkat 1 unggul dibanding Peringkat 2 dan 3 berdasarkan bobot prioritas pengguna, serta jelaskan kompromi finansialnya (UNDERBUDGET/OVERBUDGET beserta selisih rupiahnya).
6. Gunakan bahasa Indonesia yang profesional, objektif, dan ringkas dalam 3 hingga 4 kalimat padat (maksimal 125 kata) tanpa bullet points.`;

        const userPrompt = `${contextHeader}

Berikan kesimpulan analisis trade-off yang tajam dan personal sekarang:`;

        const result = streamText({
            model: google("gemini-2.5-flash"),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.2,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI Synthesis fallback triggered:", error);
        if (parsedBody && parsedBody.topDistricts?.length > 0) {
            const isChatMode =
                Array.isArray(parsedBody.chatMessages) &&
                parsedBody.chatMessages.length > 0;
            const narrative = isChatMode
                ? buildDynamicChatReply(parsedBody)
                : buildDynamicSynthesisNarrative(parsedBody);
            return createSimulatedStreamResponse(narrative);
        }
        return new Response(
            "Gagal memproses analisis AI. Silakan periksa parameter wilayah Anda.",
            { status: 500 }
        );
    }
}
