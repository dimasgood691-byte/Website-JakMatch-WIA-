export type ProfileKey = "student_worker" | "family" | "umkm";

export interface District {
    id: number;
    district_name: string;
    city_region: string;
    tier_zone: number;
    transport_score: number;
    environment_score: number;
    flood_free_score: number;
    health_score: number;
    market_density_score: number;
    base_rental_cost: number;
}

export interface ScoredDistrict extends District {
    estimatedCost: number;
    budgetDiff: number;
    isUnderBudget: boolean;
    finalScore: number;
}

export interface SliderConfig {
    key: keyof Pick<
        District,
        | "transport_score"
        | "environment_score"
        | "flood_free_score"
        | "health_score"
        | "market_density_score"
    >;
    label: string;
    shortLabel: string;
    glossaryTitle: string;
    glossaryDesc: string;
}

export interface ProfileMetadata {
    key: ProfileKey;
    label: string;
    assetLabel: string;
    costMultiplier: number; // Mengonversi base_rental_cost sesuai jenis aset properti
    personaBadge: string;
    sliders: SliderConfig[];
}

export const REGIONS = [
    "Semua Wilayah",
    "Jakarta Selatan",
    "Jakarta Pusat",
    "Jakarta Barat",
    "Jakarta Timur",
    "Jakarta Utara",
] as const;

export const PROFILE_CONFIGS: Record<ProfileKey, ProfileMetadata> = {
    student_worker: {
        key: "student_worker",
        label: "Mahasiswa / Pekerja Lajang",
        assetLabel: "Sewa Kos 1 Kamar / Studio",
        costMultiplier: 1.0,
        personaBadge: "Konsultan Hunian Personal",
        sliders: [
            {
                key: "transport_score",
                label: "Akses Transportasi Umum",
                shortLabel: "Transportasi",
                glossaryTitle: "Integrasi KRL, MRT, LRT & TransJakarta",
                glossaryDesc:
                    "Mengukur kemudahan berjalan kaki ke halte/stasiun terdekat dan frekuensi armada angkutan umum harian.",
            },
            {
                key: "environment_score",
                label: "Kualitas Udara (ISPU) & RTH",
                shortLabel: "Udara & RTH",
                glossaryTitle: "Indeks Standar Pencemar Udara & Ruang Terbuka Hijau",
                glossaryDesc:
                    "ISPU menilai kebersihan udara harian, sedangkan RTH adalah proporsi taman dan pepohonan publik di kecamatan tersebut.",
            },
            {
                key: "health_score",
                label: "Fasilitas Kesehatan",
                shortLabel: "Kesehatan",
                glossaryTitle: "Rasio RS, Puskesmas & Apotek",
                glossaryDesc:
                    "Ketersediaan layanan medis darurat, klinik 24 jam, dan rumah sakit rujukan yang mudah dijangkau warga.",
            },
            {
                key: "flood_free_score",
                label: "Tingkat Bebas Banjir",
                shortLabel: "Bebas Banjir",
                glossaryTitle: "Ketahanan Drainase & Histori Genangan",
                glossaryDesc:
                    "Semakin tinggi skor (mendekati 100), semakin aman wilayah tersebut dari risiko banjir tahunan saat curah hujan ekstrem.",
            },
        ],
    },
    family: {
        key: "family",
        label: "Keluarga Kecil",
        assetLabel: "Sewa Rumah Tapak / Kontrakan",
        costMultiplier: 1.85,
        personaBadge: "Konsultan Hunian Keluarga",
        sliders: [
            {
                key: "flood_free_score",
                label: "Tingkat Bebas Banjir",
                shortLabel: "Bebas Banjir",
                glossaryTitle: "Keamanan Lingkungan Hunian Keluarga",
                glossaryDesc:
                    "Indikator keamanan properti rumah tapak dari luapan sungai maupun genangan saluran air saat musim hujan.",
            },
            {
                key: "health_score",
                label: "Fasilitas Kesehatan",
                shortLabel: "Kesehatan",
                glossaryTitle: "Akses RS Ibu & Anak / Puskesmas",
                glossaryDesc:
                    "Kepadatan fasilitas kesehatan keluarga, rumah sakit umum, dan klinik tumbuh kembang di dalam kecamatan.",
            },
            {
                key: "environment_score",
                label: "Kualitas Udara (ISPU) & RTH",
                shortLabel: "Udara & RTH",
                glossaryTitle: "Taman Bermain & Kualitas Udara (ISPU)",
                glossaryDesc:
                    "Mengukur ketersediaan taman ramah anak (RTH) dan tingkat polusi udara rendah untuk kesehatan jangka panjang keluarga.",
            },
            {
                key: "transport_score",
                label: "Akses Transportasi Umum",
                shortLabel: "Transportasi",
                glossaryTitle: "Konektivitas Komuter & Jalan Utama",
                glossaryDesc:
                    "Kemudahan mobilitas anggota keluarga menuju kawasan pusat kerja dan sekolah menggunakan transportasi publik.",
            },
        ],
    },
    umkm: {
        key: "umkm",
        label: "Pelaku UMKM (Buka Cabang)",
        assetLabel: "Sewa Ruko / Kios Komersial",
        costMultiplier: 2.75,
        personaBadge: "Konsultan Lokasi Bisnis & Ritel",
        sliders: [
            {
                key: "market_density_score",
                label: "Kepadatan Penduduk (Potensi Pembeli)",
                shortLabel: "Potensi Pasar",
                glossaryTitle: "Market Size & Foot Traffic Harian",
                glossaryDesc:
                    "Mengukur daya beli dan kepadatan lalu-lalang warga/pekerja di area tersebut yang berpotensi menjadi pelanggan langsung.",
            },
            {
                key: "transport_score",
                label: "Akses Logistik & Jalan Raya",
                shortLabel: "Logistik",
                glossaryTitle: "Kemudahan Distribusi & Ojol",
                glossaryDesc:
                    "Kemudahan akses kurir logistik, pengiriman stok barang, serta jangkauan pengemudi transportasi online (ojol).",
            },
            {
                key: "flood_free_score",
                label: "Tingkat Bebas Genangan (Keamanan Stok)",
                shortLabel: "Aman Genangan",
                glossaryTitle: "Mitigasi Kerugian Inventaris Toko",
                glossaryDesc:
                    "Memastikan kios/ruko tidak tergenang air saat hujan deras sehingga stok barang dagangan dan operasional tetap aman.",
            },
        ],
    },
};

export function formatRupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

// Traffic Light Badge Helper (Fase 6.3)
export function getTrafficLightBadge(score: number): {
    label: string;
    bgClass: string;
    textClass: string;
    dotClass: string;
} {
    if (score >= 85) {
        return {
            label: "Ideal",
            bgClass: "bg-emerald-50 border-emerald-200",
            textClass: "text-emerald-700",
            dotClass: "bg-emerald-500",
        };
    }
    if (score >= 76) {
        return {
            label: "Sedang",
            bgClass: "bg-amber-50 border-amber-200",
            textClass: "text-amber-700",
            dotClass: "bg-amber-500",
        };
    }
    return {
        label: "Kurang",
        bgClass: "bg-rose-50 border-rose-200",
        textClass: "text-rose-700",
        dotClass: "bg-rose-500",
    };
}