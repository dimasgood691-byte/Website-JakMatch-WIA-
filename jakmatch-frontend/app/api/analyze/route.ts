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
    const num = Math.round(Number(val) || 0);
    const sign = num < 0 ? "-" : "";
    const formatted = Math.abs(num)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${sign}Rp ${formatted}`;
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
                key: p.key,
                label: p.shortLabel,
                fullLabel: p.label,
                score: getMetricValue(d, p.key),
                weight: p.weight,
            }))
            : [
                {
                    key: "transport_score",
                    label: "Transportasi",
                    fullLabel: "Akses Transportasi Umum",
                    score: d.transport_score,
                    weight: 80,
                },
                {
                    key: "environment_score",
                    label: "Udara & RTH",
                    fullLabel: "Kualitas Udara & RTH",
                    score: d.environment_score,
                    weight: 75,
                },
                {
                    key: "health_score",
                    label: "Kesehatan",
                    fullLabel: "Fasilitas Kesehatan",
                    score: d.health_score,
                    weight: 80,
                },
                {
                    key: "flood_free_score",
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
 */
function normalizeUserQuery(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[^\w\s.,?-]/g, " ")
        .replace(/\b(gusy|gyus|gays|gaes|guys)\b/g, "teman")
        .replace(/\b(hallo|helo|hello|hay|haii+|haloo+)\b/g, "halo")
        .replace(/kecamataman|kecamtan|kcamatan|kecmatan/g, "kecamatan")
        .replace(/transpotasi|tranportasi|trasportasi/g, "transportasi")
        .replace(/budjet|bajet|buget/g, "budget")
        .replace(/bajir|banjr/g, "banjir")
        .replace(/pulogadung/g, "pulo gadung")
        .replace(/kelapagading/g, "kelapa gading")
        .replace(/tanahabang/g, "tanah abang")
        .replace(/sawabesar|sawahbesar/g, "sawah besar")
        .replace(/cempakaputih/g, "cempaka putih")
        .replace(/joharbaru/g, "johar baru")
        .replace(/kebayoranbaru/g, "kebayoran baru")
        .replace(/kebayoranlama/g, "kebayoran lama")
        .replace(/pasarminggu/g, "pasar minggu")
        .replace(/kebonjeruk/g, "kebon jeruk")
        .replace(/durensawit/g, "duren sawit")
        .replace(/kramatjati/g, "kramat jati")
        .replace(/pasarrebo/g, "pasar rebo")
        .replace(/tanjungpriok|tanjungpriuk|tg priok|priok|priuk/g, "tanjung priok")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Deteksi apakah pengguna berbicara dengan gaya santai ("lu", "gue", "bro", "kak", "nih", "dong")
 */
function detectUserPronounStyle(raw: string): {
    userPronoun: string;
    botPronoun: string;
    isCasual: boolean;
} {
    const lower = raw.toLowerCase();
    if (/\b(lu|lo|elu|gue|gw|gua)\b/.test(lower)) {
        return { userPronoun: "kamu", botPronoun: "saya", isCasual: true };
    }
    if (/\b(aku|kamu|kak|bro|bang|min|gan|nih|dong|deh|sih|gimana)\b/.test(lower)) {
        return { userPronoun: "kamu", botPronoun: "saya", isCasual: true };
    }
    return { userPronoun: "Anda", botPronoun: "saya", isCasual: false };
}

/**
 * Pencocokan cerdas nama kecamatan (termasuk nama pendek populer seperti "grogol", "gading", "mampang")
 */
function findMentionedDistricts(
    q: string,
    pool: AnalyzeDistrictPayload[]
): AnalyzeDistrictPayload[] {
    const aliasMap: Record<string, string[]> = {
        "grogol petamburan": ["grogol", "petamburan", "jelambar", "tanjung duren"],
        "kelapa gading": ["kelapa gading", "gading"],
        "mampang prapatan": ["mampang", "kemang"],
        "taman sari": ["taman sari", "tamansari", "glodok", "mangga besar"],
        "sawah besar": ["sawah besar", "pasar baru", "mangga dua"],
        "kebon jeruk": ["kebon jeruk"],
        "pasar minggu": ["pasar minggu", "pejaten", "ragunan"],
        "kramat jati": ["kramat jati", "condet", "cililitan"],
        "pasar rebo": ["pasar rebo", "cijantung"],
        "duren sawit": ["duren sawit", "pondok bambu", "klender"],
        "pulo gadung": ["pulo gadung", "rawamangun"],
        "tanah abang": ["tanah abang", "bendungan hilir", "benhil"],
        "setiabudi": ["setiabudi", "kuningan"],
        "kebayoran baru": ["kebayoran baru", "senopati", "blok m"],
        "kebayoran lama": ["kebayoran lama", "pondok indah", "permata hijau"],
        "cilandak": ["cilandak", "fatmawati", "cipete", "lebak bulus"],
        "jagakarsa": ["jagakarsa", "lenteng agung", "ciganjur"],
        "penjaringan": ["penjaringan", "pik", "pluit", "muara karang"],
        "pademangan": ["pademangan", "ancol"],
    };

    const matched: AnalyzeDistrictPayload[] = [];
    for (const d of pool) {
        const lowerName = d.district_name.toLowerCase();
        const escaped = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\b${escaped}\\b`, "i").test(q)) {
            matched.push(d);
            continue;
        }
        const aliases = aliasMap[lowerName] || [];
        if (
            aliases.some((alias) =>
                new RegExp(
                    `\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                    "i"
                ).test(q)
            )
        ) {
            matched.push(d);
        }
    }
    return matched;
}

/**
 * Deteksi apakah pengguna menanyakan wilayah kota administrasi tertentu di chat
 */
function detectRequestedRegion(q: string): string | null {
    if (/\b(jakarta selatan|jaksel)\b/i.test(q)) return "Jakarta Selatan";
    if (/\b(jakarta pusat|jakpus)\b/i.test(q)) return "Jakarta Pusat";
    if (/\b(jakarta barat|jakbar)\b/i.test(q)) return "Jakarta Barat";
    if (/\b(jakarta timur|jaktim)\b/i.test(q)) return "Jakarta Timur";
    if (/\b(jakarta utara|jakut)\b/i.test(q)) return "Jakarta Utara";
    return null;
}

/**
 * Deteksi pusat aktivitas / kampus / kawasan kantor di Jakarta
 */
function detectActivityHub(q: string): {
    hubName: string;
    recommendedDistrictNames: string[];
    commuteNote: string;
} | null {
    if (/\b(sudirman|thamrin|scbd|semanggi|dukuh atas)\b/i.test(q)) {
        return {
            hubName: "Kawasan Sudirman – Thamrin – SCBD",
            recommendedDistrictNames: [
                "Setiabudi",
                "Tanah Abang",
                "Tebet",
                "Palmerah",
                "Matraman",
                "Cilandak",
            ],
            commuteNote:
                "terhubung langsung melalui jalur MRT Jakarta (Lebak Bulus–Bundaran HI), KRL Commuter Line (Stasiun Sudirman/Karet/Palmerah), dan Koridor 1/6/9 TransJakarta",
        };
    }
    if (/\b(kuningan|rasuna said|gatot subroto|gatsu)\b/i.test(q)) {
        return {
            hubName: "Kawasan Kuningan – Rasuna Said – Gatot Subroto",
            recommendedDistrictNames: [
                "Setiabudi",
                "Tebet",
                "Pancoran",
                "Mampang Prapatan",
                "Jatinegara",
                "Matraman",
            ],
            commuteNote:
                "memiliki akses tercepat ke LRT Jabodebek, Koridor 6 & 9 TransJakarta, serta jalan arteri menuju Mega Kuningan dan Gatot Subroto",
        };
    }
    if (/\b(simatupang|tb simatupang|pondok indah|fatmawati)\b/i.test(q)) {
        return {
            hubName: "Koridor TB Simatupang – Fatmawati",
            recommendedDistrictNames: [
                "Cilandak",
                "Pasar Minggu",
                "Jagakarsa",
                "Kebayoran Lama",
                "Pancoran",
            ],
            commuteNote:
                "dekat dengan jalur MRT Fatmawati/Lebak Bulus, Koridor 8 TransJakarta, dan akses langsung sepanjang TB Simatupang",
        };
    }
    if (/\b(ui|universitas indonesia|depok)\b/i.test(q)) {
        return {
            hubName: "Kampus UI / Arah Depok",
            recommendedDistrictNames: [
                "Jagakarsa",
                "Pasar Minggu",
                "Pancoran",
                "Tebet",
                "Pasar Rebo",
            ],
            commuteNote:
                "dilalui jalur utama KRL Commuter Line lintas Bogor (Stasiun Tanjung Barat, Lenteng Agung, Universitas Pancasila, Pasar Minggu, hingga Tebet)",
        };
    }
    if (/\b(binus|trisakti|untar|tarumanagara|ukrida|esa unggul)\b/i.test(q)) {
        return {
            hubName: "Kawasan Kampus Jakarta Barat (Binus / Trisakti / Untar)",
            recommendedDistrictNames: [
                "Palmerah",
                "Grogol Petamburan",
                "Kebon Jeruk",
                "Kembangan",
                "Tambora",
            ],
            commuteNote:
                "berada tepat di klaster pendidikan Jakarta Barat dengan akses TransJakarta Koridor 3, 8, dan 9 serta Stasiun Grogol/Palmerah",
        };
    }
    if (/\b(unj|rawamangun|pulomas|kawasan industri pulogadung)\b/i.test(q)) {
        return {
            hubName: "Kawasan UNJ Rawamangun & Pulo Gadung",
            recommendedDistrictNames: [
                "Pulo Gadung",
                "Matraman",
                "Cempaka Putih",
                "Duren Sawit",
                "Jatinegara",
            ],
            commuteNote:
                "terkoneksi langsung dengan LRT Jakarta (Velodrome–Pegangsaan Dua), Koridor 4 TransJakarta (Pulo Gadung–Dukuh Atas), dan angkutan JakLingko Timur",
        };
    }
    return null;
}

/**
 * Ekstraksi nominal anggaran jika pengguna mengetik angka budget di dalam chat
 */
function extractCustomBudgetFromQuery(q: string): number | null {
    const jutaMatch = q.match(
        /(\d+(?:[.,]\d+)?)\s*(?:juta|jt|jtan|jutaan)\b/i
    );
    if (jutaMatch) {
        const num = parseFloat(jutaMatch[1].replace(",", "."));
        if (!isNaN(num) && num >= 0.5 && num <= 100) {
            return Math.round(num * 1_000_000);
        }
    }
    const rbMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:ribu|rb)\b/i);
    if (rbMatch) {
        const num = parseFloat(rbMatch[1].replace(",", "."));
        if (!isNaN(num) && num >= 500 && num <= 99000) {
            return Math.round(num * 1_000);
        }
    }
    const rawMillionsMatch = q.match(/\b(\d{1,2})\.(\d{3})\.(\d{3})\b/);
    if (rawMillionsMatch) {
        const val = parseInt(
            rawMillionsMatch[1] + rawMillionsMatch[2] + rawMillionsMatch[3],
            10
        );
        if (val >= 500_000 && val <= 100_000_000) return val;
    }
    const plainDigitsMatch = q.match(/\b([1-9]\d{5,7})\b/);
    if (plainDigitsMatch) {
        const val = parseInt(plainDigitsMatch[1], 10);
        if (val >= 500_000 && val <= 100_000_000) return val;
    }
    return null;
}

/**
 * Deteksi apakah pertanyaan benar-benar di luar topik Jakarta / hunian / wilayah / data
 */
function isCompletelyOffTopic(q: string): boolean {
    return /\b(resep|masak|nasi goreng|ayam goreng|sepak bola|liga inggris|cristiano|messi|presiden|politik|partai|agama|jodoh|pacar|putus cinta|film|bioskop|lagu|musik|chord|kunci gitar|game|mobile legends|valorant|pubg|genshin|zodiak|ramalan|horoskop|kripto|bitcoin|saham|forex|coding|python|javascript|html|css|tugas matematika|integral|fisika|biologi|kimia)\b/i.test(
        q
    );
}

/**
 * Mesin Dialog Kontekstual & Fleksibel Anti-Halusinasi JakMatch
 */
function buildDynamicChatReply(body: AnalyzeRequestBody): string {
    const {
        profileKey,
        profileLabel,
        assetType,
        selectedRegion,
        userBudget,
        budgetLock,
        priorityWeights = [],
        topDistricts,
        allDistricts = [],
        chatMessages = [],
    } = body;

    const lastMsg = chatMessages[chatMessages.length - 1];
    const rawText = (lastMsg?.content || "").trim();
    const q = normalizeUserQuery(rawText);
    const attachments = lastMsg?.attachments || [];
    const { userPronoun, isCasual } = detectUserPronounStyle(rawText);

    // Cari pesan asisten sebelumnya untuk konteks multi-turn ("iya", "boleh", "yang nomor 2", dll.)
    const previousAssistantMsgs = chatMessages
        .slice(0, -1)
        .filter((m) => m.role === "assistant");
    const lastAssistantText =
        previousAssistantMsgs[previousAssistantMsgs.length - 1]?.content || "";
    const turnCount = chatMessages.filter((m) => m.role === "user").length;

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

    // -------------------------------------------------------------------------
    // 0. GUARDRAIL ANTI-HALUSINASI KE TOPIK LAIN
    // -------------------------------------------------------------------------
    if (isCompletelyOffTopic(q) && attachments.length === 0) {
        return isCasual
            ? `Waduh, kalau soal itu di luar ranah analisis saya 😄 Fokus saya dikunci khusus sebagai **Konsultan Spasial & Hunian DKI Jakarta** supaya data 42 kecamatan, simulasi harga sewa, dan evaluasi properti kamu tetap 100% akurat dan gak halu.\n\nTapi kalau kamu mau diskusi soal perbandingan kecamatan di Jakarta, simulasi budget kos/kontrakan/ruko, atau cek kelayakan foto properti, langsung tanyakan saja ya!`
            : `Mohon maaf, topik tersebut berada di luar cakupan analisis saya 😊 Sistem saya dirancang khusus sebagai **Konsultan Analitik Spasial & Hunian DKI Jakarta** agar setiap rekomendasi wilayah, harga sewa, dan skor indikator tetap akurat tanpa halusinasi.\n\nSilakan tanyakan hal seputar perbandingan kecamatan DKI Jakarta, simulasi anggaran sewa, akses transportasi, risiko banjir, atau unggah foto/dokumen properti Anda.`;
    }

    // -------------------------------------------------------------------------
    // 1. JIKA ADA LAMPIRAN FOTO ATAU FILE DOKUMEN
    // -------------------------------------------------------------------------
    if (attachments.length > 0) {
        const sections: string[] = [];
        const imageFiles = attachments.filter((a) =>
            a.mimeType.startsWith("image/")
        );
        const docFiles = attachments.filter(
            (a) => !a.mimeType.startsWith("image/")
        );

        if (imageFiles.length > 0) {
            const imgNames = imageFiles.map((f) => `"${f.name}"`).join(", ");
            sections.push(
                    `📸 **Evaluasi Visual Properti (${imgNames}):**\nJika kita kaitkan foto yang ${userPronoun} kirim dengan target **${assetType}** di kandidat utama **Kecamatan ${first.district_name}** (${first.city_region}):\n` +
                `- **Benchmark Harga Pasar:** Rata-rata sewa di ${first.district_name} adalah **${formatIdr(first.estimated_cost)}/bulan** (${first.financial_status === "UNDERBUDGET" ? `masih hemat ${formatIdr(first.budget_diff)} dari budget ${userPronoun}` : `selisih ${formatIdr(first.budget_diff)} di atas budget ${userPronoun}`}). Jika pemilik properti di foto menawarkan harga di bawah atau setara angka tersebut dengan kondisi bangunan terawat, itu sudah sangat kompetitif.\n` +
                `- **Poin Cek Fisik Penting:** Di ${first.district_name}, skor Bebas Banjir tercatat **${first.flood_free_score.toFixed(1)}/100** dan Kualitas Udara/RTH **${first.environment_score.toFixed(1)}/100**. Pastikan tinggi lantai bangunan pada foto minimal 15–20 cm di atas jalan depan, terdapat jendela hidup untuk sirkulasi udara, dan cek jarak jalan kaki ke halte/stasiun terdekat (Skor Transportasi **${first.transport_score.toFixed(1)}/100**).`
            );
        }

        if (docFiles.length > 0) {
            const docNames = docFiles.map((f) => `"${f.name}"`).join(", ");
            const excerpt = docFiles[0]?.textExcerpt
                    ? `\n- **Cuplikan Isi Dokumen:** "${docFiles[0].textExcerpt.slice(0, 160).replace(/\s+/g, " ")}..."`
                    : "";
            sections.push(
                    `📄 **Analisis Dokumen Lampiran (${docNames}):**${excerpt}\n` +
                `- **Komparasi Nilai Sewa:** Berdasarkan profil **${profileLabel}** (budget **${formatIdr(userBudget)}/bln**), bandingkan klausul biaya pada dokumen tersebut terhadap 3 acuan wilayah terbaik ${userPronoun}: **#1 ${first.district_name}** (${formatIdr(first.estimated_cost)}/bln, Skor ${first.final_score.toFixed(1)})${second ? `, **#2 ${second.district_name}** (${formatIdr(second.estimated_cost)}/bln, Skor ${second.final_score.toFixed(1)})` : ""}${third ? `, dan **#3 ${third.district_name}** (${formatIdr(third.estimated_cost)}/bln, Skor ${third.final_score.toFixed(1)})` : ""}.\n` +
                `- **Tips Kontrak:** Pastikan biaya pemeliharaan (IPL/listrik/air) dan klausul pengembalian deposit tertulis jelas sebelum pembayaran.`
            );
        }

        if (!rawText || rawText.startsWith("Mohon analisis ")) {
            sections.push(
                `Apakah properti pada lampiran di atas berlokasi di **${first.district_name}** atau di kecamatan lain? Sebutkan nama kecamatannya dan harga yang ditawarkan agar saya bantu hitung apakah *worth it* atau kemahalan!`
            );
            return sections.join("\n\n");
        }
    }

    // -------------------------------------------------------------------------
    // 2. PERTANYAAN TENTANG KEMAMPUAN AI / BISA ANALISIS APA SAJA / SUMBER DATA
    // (Contoh di screenshot: "berarti lu bisa menganalisis data ya", "kamu bisa apa aja?", "datanya dari mana?")
    // -------------------------------------------------------------------------
    if (
        /\b(bisa menganalisis|bisa analisis|menganalisis data|analisis data|bisa ngapain|bisa apa|fitur kamu|kemampuan|cara kerja|datanya dari mana|data darimana|sumber data|akurat ga|akurat nggak|valid ga|metodologi|cara hitung)\b/i.test(
            q
        ) ||
        (/\b(berarti|jadi)\b/i.test(q) && /\b(bisa|mampu|ngerti|paham|tau)\b/i.test(q))
    ) {
        return (
            `Betul banget! Sebagai asisten analitik spasial di **JakMatch**, saya dirancang untuk membedah data secara *real-time* dari beberapa sisi sekaligus tanpa mengarang angka di luar dataset:\n\n` +
            `1. **Analisis Data 42 Kecamatan DKI Jakarta:** Saya membaca skor **Transportasi Umum**, **Tingkat Bebas Banjir**, **Kualitas Udara (ISPU) & RTH**, **Fasilitas Kesehatan**, dan **Kepadatan Pasar UMKM** yang dihitung dengan rumus *Weighted Multi-Criteria* sesuai bobot slider yang ${userPronoun} atur.\n` +
            `2. **Simulasi Keterjangkauan Finansial:** Saya bisa langsung memfilter kecamatan mana saja di seluruh Jakarta yang masuk ke dalam budget bulanan ${userPronoun} (misalnya kalau ${userPronoun} tanya *"kalau budget 2 juta di Jaksel dapat mana?"*).\n` +
            `3. **Rekomendasi Rute Kampus / Kantor:** Sebutkan lokasi kantor atau kampus ${userPronoun} (misal Sudirman, Kuningan, UI, Binus, atau Rawamangun), saya akan carikan kecamatan dengan akses komuter terbaik dan harga sewa paling masuk akal.\n` +
            `4. **Evaluasi Foto & Dokumen (Multimodal):** ${isCasual ? "Kamu" : "Anda"} juga bisa klik tombol **Foto** atau **File** di bawah untuk kirim foto kos/ruko atau file brosur/kontrak.\n\n` +
            `Mau langsung kita tes yang mana dulu nih? Mau coba simulasi angka budget tertentu, atau bedah kenapa **${first.district_name}** bisa jadi peringkat #1 ${userPronoun}?`
        );
    }

    // -------------------------------------------------------------------------
    // 3. RESPON KONTEKSTUAL MULTI-TURN ("iya", "boleh", "coba", "lanjut", "yang pertama", "nomor 2")
    // -------------------------------------------------------------------------
    if (
        q.split(/\s+/).length <= 5 &&
        /\b(iya|ya|boleh|coba|lanjut|gas|ayok|ayo|jelasin|bedah|yang pertama|nomor 1|no 1|yang kedua|nomor 2|no 2|yang ketiga|nomor 3|no 3)\b/i.test(
            q
        )
    ) {
        if (/\b(kedua|nomor 2|no 2|#2)\b/i.test(q) && second) {
            const m2 = getStrongestAndWeakestMetric(second, priorityWeights);
            return (
                `Siap, kita bedah kandidat **#2 Kecamatan ${second.district_name}** (${second.city_region} • Zona Tier ${second.tier_zone}):\n\n` +
                `- **Skor Komposit:** **${second.final_score.toFixed(1)}/100** (hanya terpaut ${(first.final_score - second.final_score).toFixed(1)} poin dari #1 ${first.district_name}).\n` +
                `- **Keunggulan Utama:** Sangat menonjol di **${m2.strongest.fullLabel} (${m2.strongest.score.toFixed(1)}/100)** dan **${m2.secondStrongest.fullLabel} (${m2.secondStrongest.score.toFixed(1)}/100)**.\n` +
                `- **Sisi Biaya Sewa (${assetType}):** Rata-rata pasar **${formatIdr(second.estimated_cost)}/bulan** (${second.financial_status === "UNDERBUDGET" ? `🟢 Underbudget — hemat ${formatIdr(second.budget_diff)}/bln dari budget ${formatIdr(userBudget)}` : `🔴 Overbudget — lewat ${formatIdr(second.budget_diff)}/bln dari budget ${formatIdr(userBudget)}`}).\n` +
                `- **Hal yang Perlu Diperhatikan:** Skor terendahnya ada pada **${m2.weakest.fullLabel} (${m2.weakest.score.toFixed(1)}/100)**.\n\n` +
                `Kalau dibandingkan dengan **${first.district_name}** (${formatIdr(first.estimated_cost)}/bln), ${second.estimated_cost < first.estimated_cost ? `**${second.district_name}** lebih hemat **${formatIdr(first.estimated_cost - second.estimated_cost)}/bulan**` : `**${first.district_name}** masih lebih unggul dari sisi efisiensi biaya maupun skor`}. Bagaimana menurut ${userPronoun}, lebih cocok karakteristik ${second.district_name} atau mau kita lihat kandidat **#3 ${third ? third.district_name : "lainnya"}**?`
            );
        }

        if (/\b(ketiga|nomor 3|no 3|#3)\b/i.test(q) && third) {
            const m3 = getStrongestAndWeakestMetric(third, priorityWeights);
            return (
                `Oke, ini rincian mendalam untuk kandidat **#3 Kecamatan ${third.district_name}** (${third.city_region} • Zona Tier ${third.tier_zone}):\n\n` +
                `- **Skor Komposit:** **${third.final_score.toFixed(1)}/100**.\n` +
                `- **Daya Tarik Utama:** Unggul pada **${m3.strongest.fullLabel} (${m3.strongest.score.toFixed(1)}/100)** dan **${m3.secondStrongest.fullLabel} (${m3.secondStrongest.score.toFixed(1)}/100)**.\n` +
                `- **Estimasi Sewa (${assetType}):** **${formatIdr(third.estimated_cost)}/bulan** (${third.financial_status === "UNDERBUDGET" ? `🟢 Hemat ${formatIdr(third.budget_diff)}/bln dari budget ${userPronoun}` : `🔴 Melebihi budget sebesar ${formatIdr(third.budget_diff)}/bln`}).\n` +
                `- **Kompromi Lokasi:** Indikator **${m3.weakest.fullLabel}** berada di angka **${m3.weakest.score.toFixed(1)}/100**.\n\n` +
                `Biasanya **${third.district_name}** cocok dijadikan opsi alternatif jika ${userPronoun} ingin suasana lingkungan yang berbeda atau mencari variasi properti. Apakah ${userPronoun} punya patokan lokasi kantor/kampus tertentu supaya saya carikan yang paling dekat?`
            );
        }

        // Default ketika user menjawab "iya / boleh / coba / lanjut": bedah #1 vs #2 secara tajam
        const m1 = getStrongestAndWeakestMetric(first, priorityWeights);
        return (
            `Oke, langsung saya bedah alasan utamanya ya! 🔍\n\n` +
            `Kenapa **Kecamatan ${first.district_name}** berada di posisi **#1 (Skor ${first.final_score.toFixed(1)}/100)** untuk profil **${profileLabel}** ${userPronoun}?\n` +
            `1. **Kecocokan Bobot Prioritas:** Karena ${userPronoun} memasang bobot tinggi pada **${topPriority.label} (${topPriority.weight}%)**, sistem memberi nilai tambah besar pada ${first.district_name} yang punya skor **${m1.strongest.fullLabel} ${m1.strongest.score.toFixed(1)}/100** dan **${m1.secondStrongest.fullLabel} ${m1.secondStrongest.score.toFixed(1)}/100**.\n` +
            `2. **Analisis Biaya vs Budget (${formatIdr(userBudget)}/bln):** Harga pasar ${assetType} di ${first.district_name} sekitar **${formatIdr(first.estimated_cost)}/bulan** (${first.financial_status === "UNDERBUDGET" ? `masih sisa **${formatIdr(first.budget_diff)}/bulan** untuk biaya hidup harian` : `butuh tambahan **${formatIdr(first.budget_diff)}/bulan** di atas budget`}).\n` +
            (second
                ? `3. **Head-to-Head dengan #2 (${second.district_name}):** ${second.district_name} punya skor **${second.final_score.toFixed(1)}/100** dengan sewa **${formatIdr(second.estimated_cost)}/bulan**. Selisih harganya **${formatIdr(Math.abs(first.estimated_cost - second.estimated_cost))}/bulan**.\n\n`
                : "\n") +
            `Kalau dari aktivitas harian ${userPronoun} sendiri, lebih sering beraktivitas di sekitar wilayah mana (misal pusat bisnis Sudirman/Kuningan, kampus, atau area lokal)?`
        );
    }

        // -------------------------------------------------------------------------
        // 4. SAPAAN / GREETING ("halo", "hi", "pagi", "assalamualaikum")
        // -------------------------------------------------------------------------
        const hasDomainKeyword =
            /\b(kecamatan|wilayah|daerah|lokasi|kos|kontrakan|rumah|ruko|kios|sewa|harga|budget|anggaran|biaya|murah|mahal|banjir|transportasi|mrt|krl|lrt|transjakarta|busway|kesehatan|rs|udara|rth|umkm|usaha|bisnis|bandingkan|vs|pilih|rekomendasi|saran|terbaik|bagus|cocok|kenapa|mengapa|jaksel|jakpus|jakbar|jaktim|jakut|jakarta|kerja|kuliah|kampus|kantor)\b/i.test(
                q
            );

        if (
            !hasDomainKeyword &&
            /\b(halo|hi|hai|pagi|siang|sore|malam|assalamualaikum|permisi|tes|test|ping|apa kabar|halo teman)\b/i.test(
                q
            )
        ) {
            if (turnCount > 1) {
                return `Halo lagi! 👋 Ada skenario wilayah, perbandingan kecamatan, atau simulasi budget baru yang mau kita bedah bareng untuk area **${selectedRegion}**?`;
            }
            return (
                    `Halo! 👋 Selamat datang di **JakMatch AI Spatial Assistant**.\n\n` +
                `Saya melihat ruang kerja ${userPronoun} sedang disetel untuk **${profileLabel}** (${assetType}) di **${selectedRegion}** dengan budget **${formatIdr(userBudget)}/bulan**, dan saat ini **Kecamatan ${first.district_name}** memimpin di peringkat **#1 (Skor ${first.final_score.toFixed(1)}/100)**.\n\n` +
                `Kita bisa ngobrol santai untuk membedah data ini. ${isCasual ? "Kamu" : "Anda"} sedang cari lokasi untuk dekat tempat kerja/kampus, untuk tempat tinggal keluarga, atau untuk buka usaha?`
            );
        }

        // -------------------------------------------------------------------------
        // 5. UCAPAN TERIMA KASIH / PENUTUP SINGKAT ("makasih", "oke", "mantap", "sip")
        // -------------------------------------------------------------------------
        if (
            !hasDomainKeyword &&
            q.split(/\s+/).length <= 5 &&
            /\b(makasih|terima kasih|terimakasih|thanks|thank you|tq|mantap|oke|ok|okey|baik|siap|paham|mengerti|sip|keren|nice|good)\b/i.test(
                q
            )
        ) {
            return (
                    `Sama-sama, senang bisa bantu! 🙌\n\n` +
                `Kalau nanti ${userPronoun} mau cek kecamatan lain di luar **${selectedRegion}**, simulasi angka budget berbeda, atau mau kirim foto properti hasil survei untuk dievaluasi, langsung ketik aja di sini ya!`
            );
        }

        // -------------------------------------------------------------------------
        // 6. PERTANYAAN KOMUTER / LOKASI KERJA / KAMPUS (Sudirman, Kuningan, UI, Binus, UNJ, dll.)
        // -------------------------------------------------------------------------
        const activityHub = detectActivityHub(q);
        if (activityHub) {
            const hubDistricts = searchablePool
                .filter((d) =>
                    activityHub.recommendedDistrictNames.some(
                        (name) =>
                            name.toLowerCase() === d.district_name.toLowerCase()
                    )
                )
                .sort((a, b) => {
                    // Prioritaskan yang masuk budget pengguna terlebih dahulu, lalu skor tertinggi
                    const aUnder = a.estimated_cost <= userBudget ? 1 : 0;
                    const bUnder = b.estimated_cost <= userBudget ? 1 : 0;
                    if (aUnder !== bUnder) return bUnder - aUnder;
                    return b.final_score - a.final_score;
                });

            const topHubPicks = hubDistricts.slice(0, 4);
            const affordablePick =
                topHubPicks.find((d) => d.estimated_cost <= userBudget) ||
                [...topHubPicks].sort((a, b) => a.estimated_cost - b.estimated_cost)[0];

            return (
                `🏢 **Rekomendasi Hunian Strategis ke ${activityHub.hubName}:**\n` +
                `Untuk mobilitas harian menuju **${activityHub.hubName}**, wilayah-wilayah berikut paling ideal karena ${activityHub.commuteNote}:\n\n` +
                topHubPicks
                    .map(
                        (d, idx) =>
                            `${idx + 1}. **Kecamatan ${d.district_name}** (${d.city_region}) — Skor **${d.final_score.toFixed(1)}/100** | Transportasi: **${d.transport_score.toFixed(1)}** | Sewa ${assetType}: **${formatIdr(d.estimated_cost)}/bln** (${d.estimated_cost <= userBudget ? `🟢 Masuk budget, hemat ${formatIdr(userBudget - d.estimated_cost)}` : `🔴 Di atas budget ${formatIdr(d.estimated_cost - userBudget)}`})`
                    )
                    .join("\n") +
                (affordablePick
                    ? `\n\n💡 **Saran Terbaik untuk Budget ${formatIdr(userBudget)}/bln:** Pilih **Kecamatan ${affordablePick.district_name}** (${formatIdr(affordablePick.estimated_cost)}/bln) karena memberikan keseimbangan terbaik antara waktu tempuh komuter dan keamanan finansial ${userPronoun}. Mau saya bandingkan waktu/kelebihan antara dua kecamatan di atas?`
                    : "")
            );
        }

        // -------------------------------------------------------------------------
        // 7. JIKA PENGGUNA MENYEBUT NAMA KECAMATAN SPESIFIK (1 ATAU LEBIH DARI 42 KECAMATAN)
        // -------------------------------------------------------------------------
        const mentionedDistricts = findMentionedDistricts(q, searchablePool);

        if (mentionedDistricts.length >= 2) {
            const d1 = mentionedDistricts[0];
            const d2 = mentionedDistricts[1];
            const winner = d1.final_score >= d2.final_score ? d1 : d2;
            const cheaper = d1.estimated_cost <= d2.estimated_cost ? d1 : d2;
        const costDiff = Math.abs(d1.estimated_cost - d2.estimated_cost);

            return (
                `⚖️ **Duel Komparasi: Kecamatan ${d1.district_name} vs ${d2.district_name}**\n\n` +
                `Berikut perbandingan objektif berdasarkan data indikator spasial dan budget **${formatIdr(userBudget)}/bulan** ${userPronoun}:\n` +
                `1. **Skor Total (Sesuai Prioritas ${userPronoun}):** **${d1.district_name}** mencetak **${d1.final_score.toFixed(1)}/100**, sedangkan **${d2.district_name}** mencetak **${d2.final_score.toFixed(1)}/100** (unggul **${winner.district_name}** selisih ${Math.abs(d1.final_score - d2.final_score).toFixed(1)} poin).\n` +
                `2. **Estimasi Sewa (${assetType}):**\n` +
                `   - **${d1.district_name} (${d1.city_region}):** **${formatIdr(d1.estimated_cost)}/bln** (${d1.estimated_cost <= userBudget ? `🟢 Underbudget hemat ${formatIdr(userBudget - d1.estimated_cost)}` : `🔴 Overbudget ${formatIdr(d1.estimated_cost - userBudget)}`})\n` +
                `   - **${d2.district_name} (${d2.city_region}):** **${formatIdr(d2.estimated_cost)}/bln** (${d2.estimated_cost <= userBudget ? `🟢 Underbudget hemat ${formatIdr(userBudget - d2.estimated_cost)}` : `🔴 Overbudget ${formatIdr(d2.estimated_cost - userBudget)}`})\n` +
                `3. **Perbandingan 4 Indikator Kunci:**\n` +
                `   - 🚆 Transportasi: **${d1.district_name} (${d1.transport_score.toFixed(1)})** vs **${d2.district_name} (${d2.transport_score.toFixed(1)})**\n` +
                `   - 🌊 Bebas Banjir: **${d1.district_name} (${d1.flood_free_score.toFixed(1)})** vs **${d2.district_name} (${d2.flood_free_score.toFixed(1)})**\n` +
                `   - 🏥 Kesehatan: **${d1.district_name} (${d1.health_score.toFixed(1)})** vs **${d2.district_name} (${d2.health_score.toFixed(1)})**\n` +
                `   - 🌿 Udara & RTH: **${d1.district_name} (${d1.environment_score.toFixed(1)})** vs **${d2.district_name} (${d2.environment_score.toFixed(1)})**\n\n` +
                `**Rekomendasi Keputusan:** Jika ${userPronoun} mengejar kualitas indikator tertinggi, ambil **${winner.district_name}**. Namun jika ingin berhemat **${formatIdr(costDiff)}/bulan**, **${cheaper.district_name}** (${formatIdr(cheaper.estimated_cost)}/bln) adalah pilihan yang lebih ramah kantong.`
            );
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
                        ? `Peringkat #${rankIdx + 1} di filter aktif ${userPronoun}`
                        : `Wilayah ${target.city_region}`;
            const { strongest, secondStrongest, weakest } =
                getStrongestAndWeakestMetric(target, priorityWeights);

            if (/\b(kenapa|mengapa|kok bisa|alasan|alasannya)\b/i.test(q)) {
            return (
                    `🔍 **Mengapa Kecamatan ${target.district_name} Unggul (${rankLabel})?**\n\n` +
                    `1. **Selaras dengan Prioritas Tertinggi ${userPronoun}:** ${isCasual ? "Kamu" : "Anda"} mengatur bobot prioritas tertinggi pada **${topPriority.label} (${topPriority.weight}%)** dan **${secondPriority.label} (${secondPriority.weight}%)**. Di dua aspek ini, **${target.district_name}** meraih skor **${getMetricValue(target, topPriority.key).toFixed(1)}/100** dan **${getMetricValue(target, secondPriority.key).toFixed(1)}/100**, sehingga skor akhirnya menembus **${target.final_score.toFixed(1)}/100**.\n` +
                    `2. **Kekuatan Dominan:** Indikator terkuatnya adalah **${strongest.fullLabel} (${strongest.score.toFixed(1)}/100)** dan **${secondStrongest.fullLabel} (${secondStrongest.score.toFixed(1)}/100)**.\n` +
                    `3. **Kesesuaian Finansial:** Dengan estimasi sewa **${formatIdr(target.estimated_cost)}/bulan**, statusnya **${target.estimated_cost <= userBudget ? `UNDERBUDGET (hemat ${formatIdr(userBudget - target.estimated_cost)}/bln dari budget ${formatIdr(userBudget)})` : `OVERBUDGET (selisih ${formatIdr(target.estimated_cost - userBudget)}/bln di atas budget ${formatIdr(userBudget)})`}**.\n\n` +
                    `Apakah ${userPronoun} ingin membandingkan **${target.district_name}** ini dengan kecamatan tetangganya di ${target.city_region}?`
                );
            }

        return (
                `📍 **Profil Lengkap Kecamatan ${target.district_name} (${rankLabel}):**\n` +
                `- **Skor Komposit:** **${target.final_score.toFixed(1)}/100** (Zona Tier ${target.tier_zone} • ${target.city_region}).\n` +
                `- **Estimasi Sewa (${assetType}):** **${formatIdr(target.estimated_cost)}/bulan** — ${target.estimated_cost <= userBudget ? `🟢 **Masuk Budget** (hemat ${formatIdr(userBudget - target.estimated_cost)}/bln dari anggaran ${formatIdr(userBudget)})` : `🔴 **Melebihi Budget** (kurang ${formatIdr(target.estimated_cost - userBudget)}/bln dari anggaran ${formatIdr(userBudget)})`}.\n` +
                `- **Rincian Skor Spasial:** Transportasi **${target.transport_score.toFixed(1)}** | Bebas Banjir **${target.flood_free_score.toFixed(1)}** | Kesehatan **${target.health_score.toFixed(1)}** | Udara & RTH **${target.environment_score.toFixed(1)}** | Potensi Pasar **${target.market_density_score.toFixed(1)}**.\n` +
                `- **Kelebihan vs Kompromi:** Paling unggul di **${strongest.fullLabel} (${strongest.score.toFixed(1)})**, sedangkan aspek yang perlu dikompromikan adalah **${weakest.fullLabel} (${weakest.score.toFixed(1)})**.\n\n` +
                (target.district_name !== first.district_name
                    ? `Dibandingkan kandidat #1 **${first.district_name}** (Skor ${first.final_score.toFixed(1)}, sewa ${formatIdr(first.estimated_cost)}/bln), selisih biayanya adalah **${formatIdr(Math.abs(target.estimated_cost - first.estimated_cost))}/bulan**. Mau kita adu langsung ${target.district_name} vs ${first.district_name}?`
                    : `Karena **${target.district_name}** adalah kandidat #1 ${userPronoun}, apakah ada hal spesifik di kecamatan ini (seperti titik rawan genangan atau akses transportasi) yang ingin ${userPronoun} pastikan?`)
            );
        }

        // -------------------------------------------------------------------------
        // 8. SIMULASI NOMINAL BUDGET BARU DI CHAT ("kalau 2 juta dapat mana?", "budget 3,5 jt")
        // -------------------------------------------------------------------------
        const customBudget = extractCustomBudgetFromQuery(q);
        const requestedRegion = detectRequestedRegion(q);

        if (customBudget !== null) {
            const regionTarget = requestedRegion || selectedRegion;
            const regionPool = searchablePool.filter((d) =>
                regionTarget === "Semua Wilayah"
                    ? true
                    : d.city_region.toLowerCase() === regionTarget.toLowerCase()
            );
            const affordable = regionPool
                .filter((d) => d.estimated_cost <= customBudget)
                .sort((a, b) => b.final_score - a.final_score);

            if (affordable.length > 0) {
                const topAffordable = affordable.slice(0, 4);
                return (
                    `💰 **Hasil Simulasi Cepat Budget ${formatIdr(customBudget)}/bulan (${regionTarget}):**\n` +
                    `Saya sudah menyaring data kecamatan di **${regionTarget}** untuk kategori **${assetType}**. Ada **${affordable.length} kecamatan** yang harganya masuk di bawah **${formatIdr(customBudget)}/bulan**:\n\n` +
                    topAffordable
                        .map(
                            (d, idx) =>
                                    `${idx + 1}. **Kecamatan ${d.district_name}** (${d.city_region}) — Skor **${d.final_score.toFixed(1)}/100** | Estimasi sewa: **${formatIdr(d.estimated_cost)}/bln** (Sisa dana **${formatIdr(customBudget - d.estimated_cost)}/bln**)`
                        )
                        .join("\n") +
                        `\n\n✨ **Kesimpulan:** Dengan plafon **${formatIdr(customBudget)}/bulan**, **Kecamatan ${topAffordable[0].district_name}** memberikan skor fasilitas paling tinggi (**${topAffordable[0].final_score.toFixed(1)}/100**). Mau kita bedah detail fasilitas di **${topAffordable[0].district_name}**?`
                );
            } else {
                const cheapestInPool = [...regionPool].sort(
                    (a, b) => a.estimated_cost - b.estimated_cost
                )[0];
                const allJakartaAffordable = searchablePool
                    .filter((d) => d.estimated_cost <= customBudget)
                    .sort((a, b) => b.final_score - a.final_score)
                    .slice(0, 3);

                return (
                        `⚠️ **Evaluasi Budget ${formatIdr(customBudget)}/bulan di ${regionTarget}:**\n` +
                    `Untuk aset **${assetType}**, rata-rata pasar di **${regionTarget}** saat ini belum ada yang berada di bawah **${formatIdr(customBudget)}/bulan**.\n\n` +
                    `- **Opsi Termurah di ${regionTarget}:** **Kecamatan ${cheapestInPool.district_name}** (**${formatIdr(cheapestInPool.estimated_cost)}/bulan**, Skor **${cheapestInPool.final_score.toFixed(1)}/100**).\n` +
                    (allJakartaAffordable.length > 0
                        ? `- **Alternatif di Wilayah Jakarta Lain yang Masuk Budget ${formatIdr(customBudget)}:** ${allJakartaAffordable.map((d) => `**${d.district_name}** (${d.city_region} — ${formatIdr(d.estimated_cost)}/bln, Skor ${d.final_score.toFixed(1)})`).join(", ")}.\n\n`
                        : "\n") +
                    `Apakah ${userPronoun} bersedia menaikkan budget sedikit ke kisaran **${formatIdr(cheapestInPool.estimated_cost)}/bln**, atau ingin mempertimbangkan wilayah alternatif di atas?`
                );
            }
        }

        // -------------------------------------------------------------------------
        // 9. PERTANYAAN LINTAS WILAYAH KOTA ("kalau di Jaksel gimana?", "di Jakarta Pusat yang bagus mana?")
        // -------------------------------------------------------------------------
        if (requestedRegion) {
            const regionMatches = searchablePool
                .filter(
                    (d) =>
                        d.city_region.toLowerCase() ===
                        requestedRegion.toLowerCase()
                )
                .sort((a, b) => b.final_score - a.final_score);

            if (regionMatches.length > 0) {
                const topInRegion = regionMatches.slice(0, 3);
                const cheapestInRegion = [...regionMatches].sort(
                    (a, b) => a.estimated_cost - b.estimated_cost
                )[0];

                return (
                    `🗺️ **Bedah Wilayah ${requestedRegion} (${regionMatches.length} Kecamatan):**\n` +
                    `Mengacu pada bobot prioritas ${userPronoun} (**${topPriority.label} ${topPriority.weight}%**) dan budget **${formatIdr(userBudget)}/bulan**, ini **3 Kecamatan Terbaik di ${requestedRegion}**:\n\n` +
                    topInRegion
                        .map(
                            (d, idx) =>
                                `${idx + 1}. **${d.district_name}** — Skor **${d.final_score.toFixed(1)}/100** | Sewa: **${formatIdr(d.estimated_cost)}/bln** (${d.estimated_cost <= userBudget ? `🟢 Underbudget hemat ${formatIdr(userBudget - d.estimated_cost)}` : `🔴 Overbudget ${formatIdr(d.estimated_cost - userBudget)}`})`
                        )
                        .join("\n") +
                        `\n\n- **Paling Unggul Kualitasnya:** **${topInRegion[0].district_name}** (Skor **${topInRegion[0].final_score.toFixed(1)}**).\n` +
                    `- **Paling Ekonomis di ${requestedRegion}:** **${cheapestInRegion.district_name}** (**${formatIdr(cheapestInRegion.estimated_cost)}/bln**, Skor **${cheapestInRegion.final_score.toFixed(1)}**).\n\n` +
                    `Mau saya bandingkan juara ${requestedRegion} (**${topInRegion[0].district_name}**) dengan kandidat #1 ${userPronoun} saat ini (**${first.district_name}**)?`
                );
            }
        }

        // -------------------------------------------------------------------------
        // 10. TIPS SURVEI LAPANGAN / NEGOSIASI / CHECKLIST SEWA KOS / RUMAH / RUKO
        // -------------------------------------------------------------------------
        if (
                /\b(tips|survei|survey|cek apa|harus dicek|nego|negosiasi|kontrak|perjanjian|pindah|pemula|bingung|galau)\b/i.test(
                    q
                )
            ) {
            const firstM = getStrongestAndWeakestMetric(first, priorityWeights);
            return (
                    `📋 **Checklist Survei & Strategi Sewa untuk ${profileLabel} (${assetType}):**\n` +
                `Supaya ${userPronoun} tidak salah pilih saat survei lapangan di **${first.district_name}** atau **${second ? second.district_name : selectedRegion}**, perhatikan 4 poin praktis ini:\n\n` +
                `1. **Patokan Negosiasi Harga:** Harga rata-rata pasar di **${first.district_name}** adalah **${formatIdr(first.estimated_cost)}/bulan**. Gunakan angka ini sebagai batas wajar; jika properti masuk gang sempit atau fasilitasnya standar, ${userPronoun} punya ruang nego sekitar 5%–12%.\n` +
                `2. **Mitigasi Indikator Terlemah (${firstM.weakest.fullLabel} — Skor ${firstM.weakest.score.toFixed(1)}):** Saat di lokasi, cek langsung kondisi fisik terkait aspek ini (misalnya kondisi selokan depan saat hujan, ventilasi udara, atau jarak ke fasilitas terdekat).\n` +
                `3. **Uji Waktu Komuter Jam Sibuk:** Coba cek rute dari titik properti ke halte TransJakarta/stasiun terdekat pada pukul 07.00–08.30 atau 17.00–19.00 (Skor Transportasi ${first.district_name}: **${first.transport_score.toFixed(1)}/100**).\n` +
                `4. **Biaya Tersembunyi:** Pastikan apakah harga sewa sudah termasuk air, IPL/keamanan lingkungan, parkir kendaraan, dan kuota listrik.\n\n` +
                `Apakah ${userPronoun} sudah punya kandidat properti incaran di **${first.district_name}**, atau masih menimbang antara **${first.district_name}** dan **${second ? second.district_name : "kecamatan lain"}**?`
            );
        }

        // -------------------------------------------------------------------------
        // 11. PERTANYAAN "KENAPA / MENGAPA" PERINGKAT #1 TERPILIH
        // -------------------------------------------------------------------------
        if (/\b(kenapa|mengapa|kok bisa|alasan|alasannya)\b/i.test(q)) {
            const firstM = getStrongestAndWeakestMetric(first, priorityWeights);
            return (
                `🔍 **Kenapa Kecamatan ${first.district_name} Menjadi Rekomendasi #1?**\n\n` +
                `1. **Bobot Prioritas ${isCasual ? "Kamu" : "Anda"}:** Sistem menghitung rata-rata tertimbang (*weighted score*) dari slider yang ${userPronoun} atur, di mana prioritas tertinggi ada pada **${topPriority.label} (${topPriority.weight}%)** dan **${secondPriority.label} (${secondPriority.weight}%)**.\n` +
                `2. **Skor Spasial Tertinggi di Filter Ini:** Di cakupan **${selectedRegion}**, **${first.district_name}** meraih skor akhir **${first.final_score.toFixed(1)}/100**, didorong oleh **${firstM.strongest.fullLabel} (${firstM.strongest.score.toFixed(1)}/100)** dan **${firstM.secondStrongest.fullLabel} (${firstM.secondStrongest.score.toFixed(1)}/100)**.\n` +
                `3. **Status Anggaran:** Estimasi sewa ${assetType} di sini **${formatIdr(first.estimated_cost)}/bulan**, sehingga berstatus **${first.financial_status}** (${first.financial_status === "UNDERBUDGET" ? `hemat ${formatIdr(first.budget_diff)}/bln` : `lewat ${formatIdr(first.budget_diff)}/bln`} dari budget ${formatIdr(userBudget)}).\n\n` +
                `Apakah ada indikator tertentu yang menurut ${userPronoun} lebih penting lagi untuk ditingkatkan bobotnya?`
            );
        }

        // -------------------------------------------------------------------------
        // 12. PERBANDINGAN HEAD-TO-HEAD / UNTUNG-RUGI TOP 3
        // -------------------------------------------------------------------------
        if (
            /\b(bandingkan|perbandingan|untung rugi|kelebihan|kekurangan|kelemahan|keunggulan|plus minus|bedanya|perbedaan|vs|komparasi)\b/i.test(
                q
            )
        ) {
            const breakdown = topDistricts
                .map((d, idx) => {
                    const { strongest, secondStrongest, weakest } =
                        getStrongestAndWeakestMetric(d, priorityWeights);
                    return (
                        `**#${idx + 1} ${d.district_name} (Skor ${d.final_score.toFixed(1)} • ${formatIdr(d.estimated_cost)}/bln):**\n` +
                            `   - ➕ **Kelebihan:** Unggul kuat di ${strongest.fullLabel} (**${strongest.score.toFixed(1)}**) & ${secondStrongest.fullLabel} (**${secondStrongest.score.toFixed(1)}**).\n` +
                        `   - ➖ **Kompromi:** Skor ${weakest.label} relatif lebih rendah (**${weakest.score.toFixed(1)}**) & status finansial **${d.financial_status}** (${d.financial_status === "UNDERBUDGET" ? `hemat ${formatIdr(d.budget_diff)}` : `lewat ${formatIdr(d.budget_diff)} dari budget`}).`
                    );
                })
                .join("\n\n");

            return (
                `⚖️ **Analisis Untung-Rugi (Trade-Off) Top 3 Kecamatan:**\n\n${breakdown}\n\n` +
                `**Saran Konsultan:** **${first.district_name}** unggul secara kualitas keseluruhan, tetapi kalau ${userPronoun} ingin membandingkan salah satu kecamatan di atas dengan kecamatan lain di Jakarta, sebutkan saja namanya!`
            );
        }

        // -------------------------------------------------------------------------
        // 13. SPESIFIK TOPIK BANJIR / DRAINASE
        // -------------------------------------------------------------------------
        if (
            /\b(banjir|kebanjiran|genangan|drainase|luapan|musim hujan|hujan|rawan)\b/i.test(
                q
            )
        ) {
            const poolToRank =
                /\b(seluruh jakarta|se-jakarta|semua wilayah|paling aman di jakarta)\b/i.test(
                    q
                )
                    ? searchablePool
                    : topDistricts;
            const sortedFlood = [...poolToRank]
                .sort((a, b) => b.flood_free_score - a.flood_free_score)
                .slice(0, 3);
            const safest = sortedFlood[0];

            return (
                `🌊 **Evaluasi Ketahanan Banjir & Drainase:**\n` +
                sortedFlood
                    .map(
                        (d, idx) =>
                                `${idx + 1}. **${d.district_name}** (${d.city_region}): Skor Bebas Banjir **${d.flood_free_score.toFixed(1)}/100** (${d.flood_free_score >= 85 ? "Sangat Aman / Elevasi & Drainase Ideal" : d.flood_free_score >= 76 ? "Aman Sedang" : "Perlu Waspada Drainase Lokal"}) — Sewa ${formatIdr(d.estimated_cost)}/bln.`
                    )
                    .join("\n") +
                    `\n\n**Rekomendasi Mitigasi:** **Kecamatan ${safest.district_name}** (Skor **${safest.flood_free_score.toFixed(1)}/100**) adalah opsi paling tangguh terhadap curah hujan tinggi. Apakah bebas banjir menjadi syarat mutlak utama ${userPronoun}?`
            );
        }

        // -------------------------------------------------------------------------
        // 14. SPESIFIK TOPIK BIAYA / BUDGET / PALING MURAH / PALING MAHAL
        // -------------------------------------------------------------------------
        if (
                /\b(biaya|budget|anggaran|harga|sewa|murah|termurah|mahal|termahal|hemat|pengeluaran|finansial|uang|rincian|terjangkau)\b/i.test(
                    q
                )
            ) {
            const isAskingAllPool =
                /\b(paling murah|termurah|paling hemat|paling mahal|termahal|di jakarta|se-jakarta)\b/i.test(
                    q
                );
            const targetPool = isAskingAllPool
                ? searchablePool.filter((d) =>
                    selectedRegion === "Semua Wilayah"
                        ? true
                        : d.city_region.toLowerCase() ===
                        selectedRegion.toLowerCase()
                )
                : topDistricts;

            const isAskingExpensive = /\b(paling mahal|termahal)\b/i.test(q);
            const sortedByCost = [...targetPool]
                .sort((a, b) =>
                    isAskingExpensive
                        ? b.estimated_cost - a.estimated_cost
                        : a.estimated_cost - b.estimated_cost
                )
                .slice(0, 4);
            const bestCostPick = sortedByCost[0];
            const remainingIfCheapest = userBudget - bestCostPick.estimated_cost;

            return (
                    `💰 **Analisis Harga Sewa & Efisiensi Budget (${formatIdr(userBudget)}/bulan):**\n` +
                    `Berikut urutan kecamatan ${isAskingExpensive ? "dengan harga pasar tertinggi" : "paling hemat"} untuk **${assetType}** di **${selectedRegion}**:\n` +
                    sortedByCost
                        .map(
                            (d, idx) =>
                                    `${idx + 1}. **${d.district_name}** (${d.city_region}): **${formatIdr(d.estimated_cost)}/bln** — ${d.estimated_cost <= userBudget ? `🟢 **Underbudget** (Sisa **${formatIdr(userBudget - d.estimated_cost)}/bln**)` : `🔴 **Overbudget** (Kurang **${formatIdr(d.estimated_cost - userBudget)}/bln**)`} | Skor: **${d.final_score.toFixed(1)}**`
                        )
                        .join("\n") +
                    `\n\n**Saran Finansial:** ` +
                    (remainingIfCheapest >= 0
                    ? `Jika memilih **${bestCostPick.district_name}** (${formatIdr(bestCostPick.estimated_cost)}/bln), ${userPronoun} bisa menghemat **${formatIdr(remainingIfCheapest)}/bulan** untuk tabungan atau biaya utilitas harian. Mau saya cek detail fasilitas di **${bestCostPick.district_name}**?`
                    : `Opsi paling terjangkau adalah **${bestCostPick.district_name}** (${formatIdr(bestCostPick.estimated_cost)}/bln). Sebutkan saja berapa nominal budget ideal ${userPronoun} di chat ini, nanti saya saringkan kecamatannya!`)
        );
        }

        // -------------------------------------------------------------------------
        // 15. SPESIFIK TOPIK TRANSPORTASI / KRL / MRT / LRT / TRANSJAKARTA / KENDARAAN
        // -------------------------------------------------------------------------
        if (
                /\b(transportasi|transport|mrt|krl|lrt|transjakarta|busway|stasiun|halte|akses|mobilitas|macet|komuter|logistik|ojol|motor|mobil)\b/i.test(
                    q
                )
            ) {
            const sortedTrans = [...topDistricts].sort(
                (a, b) => b.transport_score - a.transport_score
            );
            const bestTrans = sortedTrans[0];

            return (
                `🚆 **Evaluasi Konektivitas & Transportasi (${selectedRegion}):**\n` +
                sortedTrans
                    .map(
                        (d, idx) =>
                                `${idx + 1}. **${d.district_name}:** Skor Transportasi **${d.transport_score.toFixed(1)}/100** (${d.transport_score >= 90 ? "Simpul Transit Utama MRT/KRL/TransJakarta" : d.transport_score >= 82 ? "Terkoneksi Koridor TransJakarta / Stasiun KRL" : "Akses Feeder JakLingko & Jalan Sekunder"}) — Sewa ${formatIdr(d.estimated_cost)}/bln.`
                    )
                    .join("\n") +
                    `\n\n**Kesimpulan Mobilitas:** **${bestTrans.district_name}** (${bestTrans.transport_score.toFixed(1)}/100) paling unggul untuk menghemat waktu perjalanan harian. Ngomong-ngomong, tujuan perjalanan harian ${userPronoun} paling sering ke daerah mana?`
            );
        }

        // -------------------------------------------------------------------------
        // 16. SPESIFIK TOPIK KESEHATAN / RUMAH SAKIT / UDARA / RTH / LINGKUNGAN
        // -------------------------------------------------------------------------
        if (
                /\b(kesehatan|rs|rumah sakit|puskesmas|klinik|apotek|medis|dokter|udara|polusi|ispu|rth|taman|hijau|asri|lingkungan|tenang|nyaman|aman)\b/i.test(
                    q
                )
            ) {
            const bestHealth = [...topDistricts].sort(
                (a, b) => b.health_score - a.health_score
            )[0];
            const bestEnv = [...topDistricts].sort(
                (a, b) => b.environment_score - a.environment_score
            )[0];

            return (
                `🌿 **Evaluasi Kenyamanan Lingkungan (ISPU & RTH) dan Layanan Medis:**\n` +
                topDistricts
                    .map(
                        (d, idx) =>
                            `${idx + 1}. **${d.district_name}:** Udara & RTH **${d.environment_score.toFixed(1)}/100** | Fasilitas Kesehatan **${d.health_score.toFixed(1)}/100** | Bebas Banjir **${d.flood_free_score.toFixed(1)}/100** (${formatIdr(d.estimated_cost)}/bln)`
                    )
                    .join("\n") +
                    `\n\n- **Lingkungan Paling Asri & Minim Polusi:** **${bestEnv.district_name}** (Skor Udara & RTH **${bestEnv.environment_score.toFixed(1)}/100**).\n` +
                `- **Fasilitas RS & Klinik Terlengkap:** **${bestHealth.district_name}** (Skor Kesehatan **${bestHealth.health_score.toFixed(1)}/100**).`
            );
        }

        // -------------------------------------------------------------------------
        // 17. SPESIFIK TOPIK UMKM / BISNIS / RUKO / PASAR
        // -------------------------------------------------------------------------
        if (
                /\b(umkm|usaha|bisnis|ruko|kios|cabang|pasar|pembeli|pelanggan|omzet|ramai|komersial|toko|kuliner|kopi|jualan)\b/i.test(
                    q
                )
            ) {
            const sortedMarket = [...topDistricts].sort(
                (a, b) => b.market_density_score - a.market_density_score
            );
            const bestMarket = sortedMarket[0];

            return (
                `🏪 **Analisis Potensi Pasar & Trafik Konsumen UMKM:**\n` +
                sortedMarket
                    .map(
                        (d, idx) =>
                                `${idx + 1}. **${d.district_name}:** Potensi Pasar **${d.market_density_score.toFixed(1)}/100** | Logistik/Akses **${d.transport_score.toFixed(1)}/100** | Aman Genangan **${d.flood_free_score.toFixed(1)}/100** — Sewa ${formatIdr(d.estimated_cost)}/bln.`
                    )
                    .join("\n") +
                    `\n\n**Rekomendasi Bisnis:** **${bestMarket.district_name}** memiliki kepadatan potensi pembeli tertinggi (**${bestMarket.market_density_score.toFixed(1)}/100**). Jenis usaha apa yang sedang ${userPronoun} rencanakan (kuliner/F&B, ritel, atau jasa)?`
            );
        }

        // -------------------------------------------------------------------------
        // 18. PERTANYAAN REKOMENDASI UTAMA ("LEBIH BAIK MANA?", "PILIH MANA?", "SARAN")
        // -------------------------------------------------------------------------
    if (
            /\b(lebih baik|lebih bagus|pilih mana|mending mana|mendingan mana|kecamatan mana|daerah mana|wilayah mana|lokasi mana|rekomendasi|saran|terbaik|paling bagus|paling cocok|paling pas|urutkan|top 3|kesimpulan|pendapat|menurut kamu|menurutmu|menurut lu|kos|kontrakan|hunian)\b/i.test(
                q
            ) ||
            (q.includes("menurut") && q.includes("mana"))
    ) {
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
                    decisionAdvice = `✅ **Keputusan Paling Optimal: Pilih #1 ${first.district_name} (${first.city_region})**\nSelain mencetak skor tertinggi (**${first.final_score.toFixed(1)}/100**), harga sewanya (**${formatIdr(first.estimated_cost)}/bulan**) juga **masih di bawah budget ${userPronoun}** (${formatIdr(userBudget)}/bulan, hemat ${formatIdr(first.budget_diff)}/bulan).`;
                } else if (underBudgetOptions.length > 0) {
                    const bestAffordable = underBudgetOptions[0];
                    decisionAdvice =
                    `✅ **Ada 2 Opsi Keputusan Terbaik untuk ${isCasual ? "Kamu" : "Anda"}:**\n` +
                        `1. **Utamakan Kualitas Terbaik → #1 ${first.district_name} (Skor ${first.final_score.toFixed(1)}/100):** Unggul kuat di ${firstMetrics.strongest.label} (${firstMetrics.strongest.score.toFixed(1)}), namun sewanya (**${formatIdr(first.estimated_cost)}/bln**) lewat **${formatIdr(first.budget_diff)}/bln** dari budget.\n` +
                        `2. **Utamakan Aman di Bawah Budget → ${bestAffordable.district_name} (Skor ${bestAffordable.final_score.toFixed(1)}/100):** Sewanya **${formatIdr(bestAffordable.estimated_cost)}/bln** (hemat ${formatIdr(bestAffordable.budget_diff)}/bln) dengan selisih skor hanya **${(first.final_score - bestAffordable.final_score).toFixed(1)} poin**.`;
                } else {
                    decisionAdvice =
                    `✅ **Rekomendasi Antara Kualitas vs Efisiensi Biaya:**\n` +
                        `1. **Kualitas Tertinggi → #1 ${first.district_name} (Skor ${first.final_score.toFixed(1)}/100):** Paling unggul di **${topPriority.label}** (${formatIdr(first.estimated_cost)}/bln).\n` +
                        `2. **Paling Mendekati Budget → ${cheapestInTop3.district_name} (Skor ${cheapestInTop3.final_score.toFixed(1)}/100):** Sewa paling rendah di antara Top 3 (**${formatIdr(cheapestInTop3.estimated_cost)}/bln**).`;
                }

                return (
                    `🎯 **Saran Keputusan untuk Profil ${profileLabel}:**\n\n${decisionAdvice}\n\n` +
                    `Dari opsi di atas, apakah ${userPronoun} lebih condong ke **${first.district_name}** atau **${second ? second.district_name : cheapestInTop3.district_name}**? Ketik **"Bandingkan ${first.district_name} vs ${second ? second.district_name : cheapestInTop3.district_name}"** jika ingin melihat adu skor lengkapnya.`
                );
            }

            // -------------------------------------------------------------------------
            // 19. RESPON DIALOG DINAMIS (Tanpa Template Kaku yang Berulang!)
            // -------------------------------------------------------------------------
            const cheapestOverall = [...searchablePool]
                .filter((d) =>
                    selectedRegion === "Semua Wilayah"
                        ? true
                        : d.city_region.toLowerCase() === selectedRegion.toLowerCase()
                )
                .sort((a, b) => a.estimated_cost - b.estimated_cost)[0] || first;

            // Jika pada pesan sebelumnya asisten sudah menampilkan daftar Top 3, jangan tampilkan daftar Top 3 yang sama lagi!
            const alreadyListedTop3Recently =
                lastAssistantText.includes(`#1 ${first.district_name}`) &&
                second &&
                lastAssistantText.includes(second.district_name);

            if (alreadyListedTop3Recently) {
                const m1 = getStrongestAndWeakestMetric(first, priorityWeights);
                return (
                    `Siap! Supaya kita bisa kerucutkan pilihan terbaik buat ${userPronoun} di **${selectedRegion}**, ada satu insight menarik dari data ${userPronoun} saat ini:\n\n` +
                    `- Kalau ${userPronoun} mengejar **fasilitas & aksesibilitas terbaik**, **${first.district_name}** memimpin di skor **${first.final_score.toFixed(1)}/100** (unggul di ${m1.strongest.fullLabel}: **${m1.strongest.score.toFixed(1)}**) dengan sewa **${formatIdr(first.estimated_cost)}/bln**.\n` +
                    `- Tapi kalau ${userPronoun} ingin **menekan pengeluaran bulanan serendah mungkin** di ${selectedRegion}, kecamatan paling ekonomis adalah **${cheapestOverall.district_name}** dengan estimasi **${formatIdr(cheapestOverall.estimated_cost)}/bulan** (Skor **${cheapestOverall.final_score.toFixed(1)}/100**).\n\n` +
                    `Sebutkan saja apa yang paling ${userPronoun} pertimbangkan saat ini (misal: *"lokasi kerja saya di Sudirman"*, *"cari yang di bawah 2,5 juta"*, atau sebut nama kecamatan mana pun di Jakarta) supaya langsung saya bedah!`
                );
            }

            return (
                    `Siap, mari kita bedah berdasarkan konfigurasi aktif ${userPronoun} (**${profileLabel}** di **${selectedRegion}**, budget **${formatIdr(userBudget)}/bulan**):\n\n` +
                `Saat ini **Kecamatan ${first.district_name}** menjadi kandidat terkuat (**Skor ${first.final_score.toFixed(1)}/100** • sewa **${formatIdr(first.estimated_cost)}/bln**)${second ? `, disusul **${second.district_name}** (Skor **${second.final_score.toFixed(1)}** • ${formatIdr(second.estimated_cost)}/bln)` : ""}${third ? ` dan **${third.district_name}** (Skor **${third.final_score.toFixed(1)}** • ${formatIdr(third.estimated_cost)}/bln)` : ""}.\n\n` +
                `${isCasual ? "Kamu" : "Anda"} bebas tanya dengan gaya bahasa sehari-hari, misalnya:\n` +
                `- Sebutkan lokasi kantor/kampus (contoh: *"Kalau kerja di Kuningan/Sudirman bagusnya kos di mana?"*)\n` +
                `- Tanyakan simulasi angka budget (contoh: *"Kalau budget 2 juta dapat kecamatan mana?"*)\n` +
                `- Atau ketik nama kecamatan mana saja dari 42 kecamatan DKI Jakarta untuk kita bedah datanya!`
            );
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

                // Jika GOOGLE_GENERATIVE_AI_API_KEY belum dipasang di .env.local, gunakan Mesin Dialog Kontekstual Anti-Halusinasi
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
- Anggaran Bulanan Maksimal: ${formatIdr(userBudget)} ${budgetLock ? "(Budget Lock Aktif)" : ""}
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
                        .slice(-8)
                        .map(
                            (m) =>
                                `${m.role === "user" ? "Pengguna" : "Konsultan AI"}: ${m.content}`
                        )
                        .join("\n\n");

            const chatSystemPrompt = `Kamu adalah ${ personaRole } di platform JakMatch yang interaktif, luwes, komunikatif, tetapi 100 % berpegang pada fakta dataset.
                        ${ contextHeader }
ATURAN INTERAKSI & ANTI-HALUSINASI:
1. Berkomunikasilah secara fleksibel dan interaktif mengikuti gaya bahasa pengguna (santai/formal), jangan menjawab dengan template kaku yang berulang.
2. Jika pengguna bertanya tentang kemampuanmu ("berarti kamu bisa analisis data ya?"), jelaskan kemampuan analitikmu secara natural dan ajak pengguna berdiskusi.
3. Jika pengguna bertanya di luar topik wilayah/properti/Jakarta, tolak dengan ramah dan arahkan kembali ke konsultasi lokasi JakMatch.
4. HANYA gunakan angka, skor, dan estimasi harga yang ada pada JSON di atas. DILARANG mengarang angka di luar data.`;

                    const result = streamText({
                        model: google("gemini-2.5-flash"),
                        system: chatSystemPrompt,
                        prompt: `${historyTranscript}${attachmentSummary}\n\nBerikan balasan yang interaktif, natural, relevan dengan kalimat terakhir pengguna, dan bebas halusinasi:`,
                        temperature: 0.3,
                    });

                    return result.toTextStreamResponse();
                }

                const systemPrompt = `Kamu adalah ${personaRole}.
ATURAN KETAT ANTI-HALUSINASI & PERSONALISASI DINAMIS:
1. Kamu HANYA boleh menggunakan angka, nama kecamatan, skor, bobot prioritas, dan harga yang tertulis di dalam payload JSON pengguna.
2. DILARANG KERAS mengarang harga, fasilitas, atau nama daerah di luar JSON yang diberikan.
3. WAJIB menyebutkan secara eksplisit anggaran bulanan pengguna (${formatIdr(userBudget)}) dan mengaitkan rekomendasi dengan bobot prioritas tertinggi yang diatur pengguna (${weightsSummary}).
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
