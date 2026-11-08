"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
    District,
    ProfileKey,
    PROFILE_CONFIGS,
    ProfileMetadata,
    ScoredDistrict,
} from "./config";
import { clearSession, getValidSession } from "@/app/lib/session";
import { verifyServerSession } from "@/app/lib/auth";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const DISTRICTS_CACHE_KEY = "jakmatch_districts_cache_v1";

// Dataset Lengkap 42 Kecamatan Daratan DKI Jakarta (Mengacu Indikator BPS DKI Jakarta)
const FALLBACK_DISTRICTS: District[] = [
    // JAKARTA PUSAT (8 Kecamatan)
    { id: 1, district_name: "Menteng", city_region: "Jakarta Pusat", tier_zone: 1, transport_score: 96.0, environment_score: 90.0, flood_free_score: 88.0, health_score: 95.0, market_density_score: 89.0, base_rental_cost: 6500000 },
    { id: 2, district_name: "Tanah Abang", city_region: "Jakarta Pusat", tier_zone: 1, transport_score: 97.5, environment_score: 72.0, flood_free_score: 76.0, health_score: 89.0, market_density_score: 98.5, base_rental_cost: 5800000 },
    { id: 3, district_name: "Gambir", city_region: "Jakarta Pusat", tier_zone: 1, transport_score: 96.5, environment_score: 86.0, flood_free_score: 89.0, health_score: 93.0, market_density_score: 88.0, base_rental_cost: 5500000 },
    { id: 4, district_name: "Sawah Besar", city_region: "Jakarta Pusat", tier_zone: 1, transport_score: 91.0, environment_score: 75.0, flood_free_score: 78.0, health_score: 88.0, market_density_score: 92.0, base_rental_cost: 4200000 },
    { id: 5, district_name: "Kemayoran", city_region: "Jakarta Pusat", tier_zone: 2, transport_score: 88.0, environment_score: 77.0, flood_free_score: 81.0, health_score: 87.0, market_density_score: 90.0, base_rental_cost: 3500000 },
    { id: 6, district_name: "Senen", city_region: "Jakarta Pusat", tier_zone: 2, transport_score: 93.0, environment_score: 74.0, flood_free_score: 82.0, HealthScoreFallback: 94.0, health_score: 94.0, market_density_score: 93.5, base_rental_cost: 3600000 } as District,
    { id: 7, district_name: "Cempaka Putih", city_region: "Jakarta Pusat", tier_zone: 2, transport_score: 86.0, environment_score: 84.0, flood_free_score: 86.0, health_score: 92.0, market_density_score: 85.0, base_rental_cost: 3800000 },
    { id: 8, district_name: "Johar Baru", city_region: "Jakarta Pusat", tier_zone: 3, transport_score: 84.0, environment_score: 68.0, flood_free_score: 79.0, health_score: 83.0, market_density_score: 94.0, base_rental_cost: 2300000 },

    // JAKARTA SELATAN (10 Kecamatan)
    { id: 9, district_name: "Kebayoran Baru", city_region: "Jakarta Selatan", tier_zone: 1, transport_score: 95.5, environment_score: 89.0, flood_free_score: 85.0, health_score: 94.0, market_density_score: 95.0, base_rental_cost: 6200000 },
    { id: 10, district_name: "Setiabudi", city_region: "Jakarta Selatan", tier_zone: 1, transport_score: 96.0, environment_score: 85.0, flood_free_score: 88.0, health_score: 93.0, market_density_score: 96.5, base_rental_cost: 6400000 },
    { id: 11, district_name: "Mampang Prapatan", city_region: "Jakarta Selatan", tier_zone: 1, transport_score: 89.0, environment_score: 78.0, flood_free_score: 74.0, health_score: 87.0, market_density_score: 91.0, base_rental_cost: 4500000 },
    { id: 12, district_name: "Pancoran", city_region: "Jakarta Selatan", tier_zone: 1, transport_score: 91.0, environment_score: 79.0, flood_free_score: 77.0, health_score: 88.0, market_density_score: 90.0, base_rental_cost: 4100000 },
    { id: 13, district_name: "Tebet", city_region: "Jakarta Selatan", tier_zone: 1, transport_score: 92.5, environment_score: 78.0, flood_free_score: 75.0, health_score: 88.0, market_density_score: 94.0, base_rental_cost: 3500000 },
    { id: 14, district_name: "Cilandak", city_region: "Jakarta Selatan", tier_zone: 2, transport_score: 90.0, environment_score: 86.0, flood_free_score: 83.0, health_score: 91.0, market_density_score: 88.5, base_rental_cost: 4300000 },
    { id: 15, district_name: "Kebayoran Lama", city_region: "Jakarta Selatan", tier_zone: 2, transport_score: 88.5, environment_score: 80.0, flood_free_score: 79.0, health_score: 89.0, market_density_score: 91.5, base_rental_cost: 3900000 },
    { id: 16, district_name: "Pasar Minggu", city_region: "Jakarta Selatan", tier_zone: 2, transport_score: 87.5, environment_score: 81.0, flood_free_score: 80.0, health_score: 87.0, market_density_score: 89.0, base_rental_cost: 3200000 },
    { id: 17, district_name: "Pesanggrahan", city_region: "Jakarta Selatan", tier_zone: 2, transport_score: 82.0, environment_score: 81.0, flood_free_score: 78.0, health_score: 84.0, market_density_score: 83.0, base_rental_cost: 2700000 },
    { id: 18, district_name: "Jagakarsa", city_region: "Jakarta Selatan", tier_zone: 2, transport_score: 80.0, environment_score: 88.5, flood_free_score: 90.0, health_score: 82.0, market_density_score: 76.0, base_rental_cost: 2200000 },

    // JAKARTA BARAT (8 Kecamatan)
    { id: 19, district_name: "Grogol Petamburan", city_region: "Jakarta Barat", tier_zone: 1, transport_score: 91.5, environment_score: 75.0, flood_free_score: 74.0, health_score: 92.0, market_density_score: 95.0, base_rental_cost: 3800000 },
    { id: 20, district_name: "Kembangan", city_region: "Jakarta Barat", tier_zone: 1, transport_score: 85.0, environment_score: 86.0, flood_free_score: 83.0, health_score: 90.0, market_density_score: 89.0, base_rental_cost: 4400000 },
    { id: 21, district_name: "Taman Sari", city_region: "Jakarta Barat", tier_zone: 1, transport_score: 89.0, environment_score: 70.0, flood_free_score: 75.0, health_score: 86.0, market_density_score: 96.0, base_rental_cost: 3400000 },
    { id: 22, district_name: "Palmerah", city_region: "Jakarta Barat", tier_zone: 2, transport_score: 86.0, environment_score: 74.0, flood_free_score: 80.0, health_score: 85.0, market_density_score: 91.0, base_rental_cost: 2500000 },
    { id: 23, district_name: "Kebon Jeruk", city_region: "Jakarta Barat", tier_zone: 2, transport_score: 85.5, environment_score: 80.0, flood_free_score: 81.0, health_score: 89.0, market_density_score: 88.0, base_rental_cost: 3100000 },
    { id: 24, district_name: "Tambora", city_region: "Jakarta Barat", tier_zone: 2, transport_score: 84.0, environment_score: 66.0, flood_free_score: 72.0, health_score: 82.0, market_density_score: 95.5, base_rental_cost: 2400000 },
    { id: 25, district_name: "Cengkareng", city_region: "Jakarta Barat", tier_zone: 3, transport_score: 82.0, environment_score: 73.0, flood_free_score: 70.0, health_score: 84.0, market_density_score: 91.0, base_rental_cost: 2100000 },
    { id: 26, district_name: "Kalideres", city_region: "Jakarta Barat", tier_zone: 3, transport_score: 78.0, environment_score: 74.0, flood_free_score: 72.0, health_score: 81.0, market_density_score: 86.0, base_rental_cost: 1850000 },

    // JAKARTA TIMUR (10 Kecamatan)
    { id: 27, district_name: "Jatinegara", city_region: "Jakarta Timur", tier_zone: 1, transport_score: 90.0, environment_score: 74.0, flood_free_score: 72.0, health_score: 89.0, market_density_score: 93.0, base_rental_cost: 3100000 },
    { id: 28, district_name: "Matraman", city_region: "Jakarta Timur", tier_zone: 1, transport_score: 89.5, environment_score: 77.0, flood_free_score: 82.0, health_score: 88.0, market_density_score: 90.0, base_rental_cost: 2900000 },
    { id: 29, district_name: "Pulo Gadung", city_region: "Jakarta Timur", tier_zone: 2, transport_score: 86.5, environment_score: 79.0, flood_free_score: 83.0, health_score: 88.5, market_density_score: 89.0, base_rental_cost: 3000000 },
    { id: 30, district_name: "Duren Sawit", city_region: "Jakarta Timur", tier_zone: 2, transport_score: 78.0, environment_score: 80.0, flood_free_score: 82.0, health_score: 84.0, market_density_score: 85.0, base_rental_cost: 2000000 },
    { id: 31, district_name: "Kramat Jati", city_region: "Jakarta Timur", tier_zone: 2, transport_score: 84.0, environment_score: 76.0, flood_free_score: 75.0, health_score: 87.5, market_density_score: 89.0, base_rental_cost: 2200000 },
    { id: 32, district_name: "Cakung", city_region: "Jakarta Timur", tier_zone: 2, transport_score: 81.0, environment_score: 73.0, flood_free_score: 74.0, health_score: 83.0, market_density_score: 88.0, base_rental_cost: 1950000 },
    { id: 33, district_name: "Makasar", city_region: "Jakarta Timur", tier_zone: 2, transport_score: 83.0, environment_score: 78.0, flood_free_score: 79.0, health_score: 84.0, market_density_score: 82.0, base_rental_cost: 2150000 },
    { id: 34, district_name: "Ciracas", city_region: "Jakarta Timur", tier_zone: 3, transport_score: 79.0, environment_score: 83.0, flood_free_score: 85.0, health_score: 82.0, market_density_score: 80.0, base_rental_cost: 1850000 },
    { id: 35, district_name: "Pasar Rebo", city_region: "Jakarta Timur", tier_zone: 3, transport_score: 78.5, environment_score: 82.0, flood_free_score: 84.0, health_score: 83.0, market_density_score: 81.0, base_rental_cost: 1800000 },
    { id: 36, district_name: "Cipayung", city_region: "Jakarta Timur", tier_zone: 3, transport_score: 77.5, environment_score: 88.0, flood_free_score: 87.0, health_score: 81.0, market_density_score: 77.0, base_rental_cost: 1700000 },

    // JAKARTA UTARA (6 Kecamatan)
    { id: 37, district_name: "Kelapa Gading", city_region: "Jakarta Utara", tier_zone: 1, transport_score: 86.0, environment_score: 84.0, flood_free_score: 73.0, health_score: 92.0, market_density_score: 96.0, base_rental_cost: 5200000 },
    { id: 38, district_name: "Penjaringan", city_region: "Jakarta Utara", tier_zone: 1, transport_score: 84.0, environment_score: 81.0, flood_free_score: 71.0, health_score: 89.0, market_density_score: 93.0, base_rental_cost: 4600000 },
    { id: 39, district_name: "Pademangan", city_region: "Jakarta Utara", tier_zone: 1, transport_score: 85.0, environment_score: 76.0, flood_free_score: 73.0, health_score: 86.0, market_density_score: 92.0, base_rental_cost: 3700000 },
    { id: 40, district_name: "Tanjung Priok", city_region: "Jakarta Utara", tier_zone: 2, transport_score: 86.0, environment_score: 72.0, flood_free_score: 76.0, health_score: 85.0, market_density_score: 90.0, base_rental_cost: 2600000 },
    { id: 41, district_name: "Koja", city_region: "Jakarta Utara", tier_zone: 3, transport_score: 79.0, environment_score: 73.0, flood_free_score: 75.0, health_score: 84.0, market_density_score: 86.0, base_rental_cost: 1900000 },
    { id: 42, district_name: "Cilincing", city_region: "Jakarta Utara", tier_zone: 3, transport_score: 76.0, environment_score: 71.0, flood_free_score: 73.0, health_score: 80.0, market_density_score: 84.0, base_rental_cost: 1650000 },
];

export const DEFAULT_WEIGHTS: Record<string, number> = {
    transport_score: 85,
    environment_score: 75,
    health_score: 80,
    flood_free_score: 90,
    market_density_score: 85,
};

export interface SavedComparisonItem {
    id: string;
    user_id: string;
    selected_region: string;
    user_budget: number;
    selected_profile: ProfileKey;
    budget_lock?: boolean;
    weights?: Record<string, number>;
    top_districts_result: ScoredDistrict[];
    ai_summary_text: string;
    created_at: string;
}

interface ActiveUser {
    id: string;
    email: string;
    token: string;
    displayName?: string | null;
    photoURL?: string | null;
}

export interface AppliedComparisonConfig {
    profile: ProfileKey;
    region: string;
    budget: number;
    budgetLock: boolean;
    weights: Record<string, number>;
    generatedAt: number;
}

interface DashboardContextValue {
    activeUser: ActiveUser;
    allDistricts: District[];
    dataLoading: boolean;
    // Draft / Control Center State (Halaman Parameter & Prioritas)
    selectedProfile: ProfileKey;
    currentProfileConfig: ProfileMetadata;
    selectedRegion: string;
    userBudget: number;
    budgetLock: boolean;
    weights: Record<string, number>;
    draftFilteredCount: number;
    // Applied / Generated State (Halaman Komparasi & Analisis AI)
    appliedConfig: AppliedComparisonConfig;
    appliedProfileConfig: ProfileMetadata;
    hasUnappliedChanges: boolean;
    isGeneratingGraph: boolean;
    generateFeedback: string | null;
    topThreeDistricts: ScoredDistrict[];
    totalFilteredCount: number;
    // AI & Persistence
    aiNarrative: string;
    isAiStreaming: boolean;
    isSaving: boolean;
    saveFeedback: string | null;
    savedList: SavedComparisonItem[];
    loadingHistory: boolean;
    // Actions
    handleProfileChange: (profile: ProfileKey) => void;
    setSelectedRegion: (region: string) => void;
    setUserBudget: (budget: number) => void;
    setBudgetLock: (locked: boolean) => void;
    updateWeight: (key: string, value: number) => void;
    resetWeightsToDefault: () => void;
    generateComparisonGraph: () => void;
    triggerAiSynthesis: (customDistricts?: ScoredDistrict[]) => Promise<void>;
    handleSaveComparison: () => Promise<void>;
    fetchSavedHistory: () => Promise<void>;
    handleDeleteHistory: (id: string) => Promise<void>;
    restoreSavedComparison: (
        item: SavedComparisonItem,
        targetPath?: "/dashboard" | "/dashboard/komparasi" | "/dashboard/analisis-ai"
    ) => void;
    handleLogout: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(
    undefined
);

function calculateScoredDistricts(
    allDistricts: District[],
    region: string,
    profileConfig: ProfileMetadata,
    budget: number,
    budgetLock: boolean,
    weights: Record<string, number>
): { topThreeDistricts: ScoredDistrict[]; totalFilteredCount: number } {
    const geoFiltered = allDistricts.filter((d) =>
        region === "Semua Wilayah"
            ? true
            : d.city_region.toLowerCase() === region.toLowerCase()
    );

    const activeSliders = profileConfig.sliders;
    const totalWeight = activeSliders.reduce(
        (sum, s) => sum + (weights[s.key] ?? 50),
        0
    );

    const scored: ScoredDistrict[] = geoFiltered
        .map((d) => {
            const estimatedCost = Math.round(
                d.base_rental_cost * profileConfig.costMultiplier
            );
            const budgetDiff = budget - estimatedCost;
            const isUnderBudget = budgetDiff >= 0;

            let weightedSum = 0;
            activeSliders.forEach((slider) => {
                const metricVal = Number(d[slider.key]) || 0;
                const sliderWeight = weights[slider.key] ?? 50;
                weightedSum += metricVal * sliderWeight;
            });

            const finalScore =
                totalWeight > 0 ? weightedSum / totalWeight : d.transport_score;

            return {
                ...d,
                estimatedCost,
                budgetDiff,
                isUnderBudget,
                finalScore: Math.round(finalScore * 10) / 10,
            };
        })
        .filter((d) => (budgetLock ? d.isUnderBudget : true))
        .sort((a, b) => b.finalScore - a.finalScore);

    return {
        topThreeDistricts: scored.slice(0, 3),
        totalFilteredCount: scored.length,
    };
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const [activeUser, setActiveUser] = useState<ActiveUser>({
        id: "",
        email: "anonymous@gmail.com",
        token: "",
    });
    const [allDistricts, setAllDistricts] =
        useState<District[]>(FALLBACK_DISTRICTS);
    const [dataLoading, setDataLoading] = useState<boolean>(true);

    // 1. State Draft / Control Center (diubah bebas di Halaman Parameter & Prioritas)
    const [selectedProfile, setSelectedProfile] =
        useState<ProfileKey>("student_worker");
    const [selectedRegion, setSelectedRegion] =
        useState<string>("Semua Wilayah");
    const [userBudget, setUserBudget] = useState<number>(3500000);
    const [budgetLock, setBudgetLock] = useState<boolean>(false);
    const [weights, setWeights] = useState<Record<string, number>>({
        ...DEFAULT_WEIGHTS,
    });

    // 2. State Terkunci / Hasil Generate (digunakan oleh Grafik Komparasi & Analisis AI)
    // Hanya berubah ketika tombol "Generate Grafik" ditekan!
    const [appliedConfig, setAppliedConfig] = useState<AppliedComparisonConfig>({
        profile: "student_worker",
        region: "Semua Wilayah",
        budget: 3500000,
        budgetLock: false,
        weights: { ...DEFAULT_WEIGHTS },
        generatedAt: 0,
    });
    const [isGeneratingGraph, setIsGeneratingGraph] = useState<boolean>(false);
    const [generateFeedback, setGenerateFeedback] = useState<string | null>(null);

    // 3. AI Streaming (Fase 7)
    const [aiNarrative, setAiNarrative] = useState<string>("");
    const [isAiStreaming, setIsAiStreaming] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 4. Database Persistence & Riwayat (Fase 8)
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
    const [savedList, setSavedList] = useState<SavedComparisonItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // Inisialisasi Sesi Autentikasi & Pre-Fetch Spasial Cepat dengan Session Cache
    useEffect(() => {
        const session = getValidSession();
        if (session) {
            setActiveUser({
                id: session.user.id,
                email: session.user.email,
                token: session.token,
                displayName: session.user.displayName,
                photoURL: session.user.photoURL,
            });

            verifyServerSession(session).then((status) => {
                if (status === "unauthorized") {
                    void clearSession().then(() => {
                        router.replace("/login");
                    });
                }
            });
        } else {
            // Cek kompatibilitas key lama jika ada
            try {
                const rawLegacy =
                    localStorage.getItem("session") || localStorage.getItem("user");
                const rawToken =
                    localStorage.getItem("jakmatch_token") ||
                    localStorage.getItem("token") ||
                    "";
                if (rawLegacy) {
                    const parsed = JSON.parse(rawLegacy);
                    setActiveUser({
                        id: parsed?.user?.id || parsed?.id || "",
                        email:
                            parsed?.user?.email ||
                            parsed?.email ||
                            "anonymous@gmail.com",
                        token: parsed?.token || rawToken,
                    });
                }
            } catch {
                // Abaikan jika sesi kosong
            }
        }

        // Sinkronisasi lintas tab ketika user logout di tab lain
        const handleStorageSync = (e: StorageEvent) => {
            if (e.key === "jakmatch_session" && !e.newValue) {
                router.replace("/login");
            }
        };
        window.addEventListener("storage", handleStorageSync);

        async function fetchAllDistrictsOnce() {
            // Gunakan cache sessionStorage terlebih dahulu agar transisi 0ms instan
            try {
                const cached = sessionStorage.getItem(DISTRICTS_CACHE_KEY);
                if (cached) {
                    const parsedCache = JSON.parse(cached) as District[];
                    if (Array.isArray(parsedCache) && parsedCache.length > 0) {
                        setAllDistricts(parsedCache);
                        setDataLoading(false);
                        return;
                    }
                }
            } catch {
                // Lanjutkan fetch
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            try {
                const res = await fetch(`${API_BASE_URL}/districts`, {
                    signal: controller.signal,
                });
                const json = await res.json();
                if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
                    setAllDistricts(json.data);
                    try {
                        sessionStorage.setItem(
                            DISTRICTS_CACHE_KEY,
                            JSON.stringify(json.data)
                        );
                    } catch {
                        // Abaikan storage limit
                    }
                }
            } catch {
                // Fallback 42 Kecamatan Lokal sudah siap tanpa jeda
            } finally {
                clearTimeout(timeoutId);
                setDataLoading(false);
            }
        }

        fetchAllDistrictsOnce();

        return () => {
            window.removeEventListener("storage", handleStorageSync);
        };
    }, [router]);

    const currentProfileConfig = PROFILE_CONFIGS[selectedProfile];
    const appliedProfileConfig = PROFILE_CONFIGS[appliedConfig.profile];

    const handleProfileChange = useCallback((newProfile: ProfileKey) => {
        setSelectedProfile(newProfile);
        if (newProfile === "student_worker") {
            setUserBudget(3500000);
        } else if (newProfile === "family") {
            setUserBudget(6000000);
        } else if (newProfile === "umkm") {
            setUserBudget(9500000);
        }
    }, []);

    const updateWeight = useCallback((key: string, value: number) => {
        setWeights((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const resetWeightsToDefault = useCallback(() => {
        setWeights({ ...DEFAULT_WEIGHTS });
    }, []);

    // Deteksi apakah ada perubahan slider/parameter yang belum di-generate ke grafik
    const hasUnappliedChanges = useMemo(() => {
        if (
            selectedProfile !== appliedConfig.profile ||
            selectedRegion !== appliedConfig.region ||
            userBudget !== appliedConfig.budget ||
            budgetLock !== appliedConfig.budgetLock
        ) {
            return true;
        }
        const activeKeys = currentProfileConfig.sliders.map((s) => s.key);
        return activeKeys.some(
            (key) => (weights[key] ?? 50) !== (appliedConfig.weights[key] ?? 50)
        );
    }, [
        selectedProfile,
        selectedRegion,
        userBudget,
        budgetLock,
        weights,
        appliedConfig,
        currentProfileConfig,
    ]);

    // Hitungan ringan jumlah kandidat pada draft control center
    const draftFilteredCount = useMemo(() => {
        return allDistricts.filter((d) => {
            const regionMatch =
                selectedRegion === "Semua Wilayah" ||
                d.city_region.toLowerCase() === selectedRegion.toLowerCase();
            if (!regionMatch) return false;
            if (!budgetLock) return true;
            const cost = Math.round(
                d.base_rental_cost * currentProfileConfig.costMultiplier
            );
            return userBudget >= cost;
        }).length;
    }, [
        allDistricts,
        selectedRegion,
        budgetLock,
        userBudget,
        currentProfileConfig,
    ]);

    // Kalkulasi Top 3 Kecamatan HANYA berdasarkan appliedConfig (Hasil tombol Generate Grafik)
    const { topThreeDistricts, totalFilteredCount } = useMemo(() => {
        return calculateScoredDistricts(
            allDistricts,
            appliedConfig.region,
            appliedProfileConfig,
            appliedConfig.budget,
            appliedConfig.budgetLock,
            appliedConfig.weights
        );
    }, [allDistricts, appliedConfig, appliedProfileConfig]);

    // Fase 7: Generative AI Trade-Off Synthesizer (Membaca appliedConfig secara dinamis)
    const triggerAiSynthesis = useCallback(
        async (
            customDistricts?: ScoredDistrict[],
            overrideConfig?: AppliedComparisonConfig
        ) => {
            const activeCfg = overrideConfig || appliedConfig;
            const activeMeta = PROFILE_CONFIGS[activeCfg.profile];
            const targetDistricts = customDistricts || topThreeDistricts;

            if (targetDistricts.length === 0) {
                setAiNarrative("");
                return;
            }

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            setIsAiStreaming(true);
            setAiNarrative("");

            try {
                const priorityWeights = activeMeta.sliders.map((s) => ({
                    key: s.key,
                    label: s.label,
                    shortLabel: s.shortLabel,
                    weight: activeCfg.weights[s.key] ?? 50,
                }));

                const payload = {
                    profileKey: activeCfg.profile,
                    profileLabel: activeMeta.label,
                    assetType: activeMeta.assetLabel,
                    selectedRegion: activeCfg.region,
                    userBudget: activeCfg.budget,
                    budgetLock: activeCfg.budgetLock,
                    priorityWeights,
                    topDistricts: targetDistricts.map((d) => ({
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
                };

                const response = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });

                if (!response.ok || !response.body) {
                    const errText = await response.text();
                    setAiNarrative(
                        errText ||
                            "Klik tombol 'Minta Analisis AI Ulang' untuk menyusun analisis kompromi wilayah."
                    );
                    setIsAiStreaming(false);
                    return;
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedText = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;
                    setAiNarrative(accumulatedText);
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }
                setAiNarrative(
                    "Klik tombol 'Minta Analisis AI Ulang' untuk menyusun ringkasan kompromi wilayah berdasarkan parameter Anda."
                );
            } finally {
                setIsAiStreaming(false);
            }
        },
        [appliedConfig, topThreeDistricts]
    );

    // Tombol Eksklusif: Generate Grafik Komparasi & Peringkat
    const generateComparisonGraph = useCallback(() => {
        setIsGeneratingGraph(true);
        const nextConfig: AppliedComparisonConfig = {
            profile: selectedProfile,
            region: selectedRegion,
            budget: userBudget,
            budgetLock,
            weights: { ...weights },
            generatedAt: Date.now(),
        };

        setAppliedConfig(nextConfig);

        const nextMeta = PROFILE_CONFIGS[nextConfig.profile];
        const { topThreeDistricts: nextTopThree } = calculateScoredDistricts(
            allDistricts,
            nextConfig.region,
            nextMeta,
            nextConfig.budget,
            nextConfig.budgetLock,
            nextConfig.weights
        );

        void triggerAiSynthesis(nextTopThree, nextConfig);

        setTimeout(() => {
            setIsGeneratingGraph(false);
            setGenerateFeedback(
                "Grafik komparasi & peringkat Top 3 berhasil diperbarui!"
            );
            setTimeout(() => setGenerateFeedback(null), 3500);
        }, 280);
    }, [
        selectedProfile,
        selectedRegion,
        userBudget,
        budgetLock,
        weights,
        allDistricts,
        triggerAiSynthesis,
    ]);

    // Jalankan analisis AI awal 1x saat komponen pertama kali siap
    const initialAiTriggered = useRef(false);
    useEffect(() => {
        if (!dataLoading && !initialAiTriggered.current && topThreeDistricts.length > 0) {
            initialAiTriggered.current = true;
            void triggerAiSynthesis(topThreeDistricts, appliedConfig);
        }
    }, [dataLoading, topThreeDistricts, appliedConfig, triggerAiSynthesis]);

    // Fase 8: Simpan ke Riwayat (Backend PostgreSQL + Fallback LocalStorage)
    const handleSaveComparison = useCallback(async () => {
        if (topThreeDistricts.length === 0) return;
        setIsSaving(true);
        setSaveFeedback(null);

        const summaryToSave =
            aiNarrative ||
            `Rekomendasi teratas: ${topThreeDistricts
                .map((d) => d.district_name)
                .join(", ")}`;

        const newLocalRecord: SavedComparisonItem = {
            id: crypto.randomUUID(),
            user_id: activeUser.id || "00000000-0000-0000-0000-000000000000",
            selected_region: appliedConfig.region,
            user_budget: appliedConfig.budget,
            selected_profile: appliedConfig.profile,
            budget_lock: appliedConfig.budgetLock,
            weights: { ...appliedConfig.weights },
            top_districts_result: topThreeDistricts,
            ai_summary_text: summaryToSave,
            created_at: new Date().toISOString(),
        };

        try {
            const response = await fetch(`${API_BASE_URL}/comparisons`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(activeUser.token
                        ? { Authorization: `Bearer ${activeUser.token}` }
                        : {}),
                },
                body: JSON.stringify({
                    user_id: newLocalRecord.user_id,
                    selected_region: appliedConfig.region,
                    user_budget: appliedConfig.budget,
                    selected_profile: appliedConfig.profile,
                    top_districts_result: topThreeDistricts,
                    ai_summary_text: summaryToSave,
                }),
            });

            if (response.ok) {
                setSaveFeedback("Hasil riset berhasil disimpan ke database akun!");
            } else {
                setSaveFeedback("Hasil riset disimpan ke riwayat lokal perangkat!");
            }
        } catch {
            setSaveFeedback("Hasil riset disimpan ke riwayat lokal perangkat!");
        } finally {
            try {
                const existingRaw = localStorage.getItem("jakmatch_saved_history");
                const existingList: SavedComparisonItem[] = existingRaw
                    ? JSON.parse(existingRaw)
                    : [];
                const updated = [newLocalRecord, ...existingList];
                localStorage.setItem(
                    "jakmatch_saved_history",
                    JSON.stringify(updated)
                );
                setSavedList(updated);
            } catch {
                // Abaikan jika storage penuh
            }

            setIsSaving(false);
            setTimeout(() => setSaveFeedback(null), 4000);
        }
    }, [topThreeDistricts, aiNarrative, activeUser, appliedConfig]);

    const fetchSavedHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const localRaw = localStorage.getItem("jakmatch_saved_history");
            const localItems: SavedComparisonItem[] = localRaw
                ? JSON.parse(localRaw)
                : [];

            if (activeUser.id) {
                const res = await fetch(
                    `${API_BASE_URL}/comparisons?user_id=${activeUser.id}`,
                    {
                        headers: activeUser.token
                            ? { Authorization: `Bearer ${activeUser.token}` }
                            : undefined,
                    }
                );
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json.data) && json.data.length > 0) {
                        setSavedList(json.data);
                        setLoadingHistory(false);
                        return;
                    }
                }
            }
            setSavedList(localItems);
        } catch {
            const localRaw = localStorage.getItem("jakmatch_saved_history");
            if (localRaw) {
                setSavedList(JSON.parse(localRaw));
            }
        } finally {
            setLoadingHistory(false);
        }
    }, [activeUser.id, activeUser.token]);

    const handleDeleteHistory = useCallback(
        async (id: string) => {
            try {
                await fetch(`${API_BASE_URL}/comparisons/${id}`, {
                    method: "DELETE",
                    headers: activeUser.token
                        ? { Authorization: `Bearer ${activeUser.token}` }
                        : undefined,
                });
            } catch {
                // Lanjutkan penghapusan di state lokal
            }

            setSavedList((prev) => {
                const filtered = prev.filter((item) => item.id !== id);
                try {
                    localStorage.setItem(
                        "jakmatch_saved_history",
                        JSON.stringify(filtered)
                    );
                } catch {
                    // Abaikan error
                }
                return filtered;
            });
        },
        [activeUser.token]
    );

    const restoreSavedComparison = useCallback(
        (
            item: SavedComparisonItem,
            targetPath:
                | "/dashboard"
                | "/dashboard/komparasi"
                | "/dashboard/analisis-ai" = "/dashboard/komparasi"
        ) => {
            const validProfile: ProfileKey =
                item.selected_profile in PROFILE_CONFIGS
                    ? item.selected_profile
                    : "student_worker";
            const restoredWeights = item.weights
                ? { ...DEFAULT_WEIGHTS, ...item.weights }
                : { ...DEFAULT_WEIGHTS };
            const restoredLock = Boolean(item.budget_lock);

            setSelectedProfile(validProfile);
            setSelectedRegion(item.selected_region || "Semua Wilayah");
            setUserBudget(Number(item.user_budget) || 3500000);
            setBudgetLock(restoredLock);
            setWeights(restoredWeights);

            setAppliedConfig({
                profile: validProfile,
                region: item.selected_region || "Semua Wilayah",
                budget: Number(item.user_budget) || 3500000,
                budgetLock: restoredLock,
                weights: restoredWeights,
                generatedAt: Date.now(),
            });

            if (item.ai_summary_text) {
                setAiNarrative(item.ai_summary_text);
            }

            setGenerateFeedback(
                `Riwayat riset (${item.selected_region}) berhasil dibuka kembali ke ruang kerja!`
            );
            setTimeout(() => setGenerateFeedback(null), 4000);

            router.push(targetPath);
        },
        [router]
    );

    const handleLogout = useCallback(() => {
        void clearSession().finally(() => {
            sessionStorage.clear();
            router.replace("/login");
        });
    }, [router]);

    return (
        <DashboardContext.Provider
            value={{
                activeUser,
                allDistricts,
                dataLoading,
                selectedProfile,
                currentProfileConfig,
                selectedRegion,
                userBudget,
                budgetLock,
                weights,
                draftFilteredCount,
                appliedConfig,
                appliedProfileConfig,
                hasUnappliedChanges,
                isGeneratingGraph,
                generateFeedback,
                topThreeDistricts,
                totalFilteredCount,
                aiNarrative,
                isAiStreaming,
                isSaving,
                saveFeedback,
                savedList,
                loadingHistory,
                handleProfileChange,
                setSelectedRegion,
                setUserBudget,
                setBudgetLock,
                updateWeight,
                resetWeightsToDefault,
                generateComparisonGraph,
                triggerAiSynthesis,
                handleSaveComparison,
                fetchSavedHistory,
                handleDeleteHistory,
                restoreSavedComparison,
                handleLogout,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error(
            "useDashboard harus digunakan di dalam komponen DashboardProvider"
        );
    }
    return context;
}
