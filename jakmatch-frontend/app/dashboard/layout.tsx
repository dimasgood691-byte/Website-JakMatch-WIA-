"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardProvider } from "./DashboardContext";
import Sidebar from "./Sidebar";
import ContextBanner from "./ContextBanner";
import { getValidSession, clearSession } from "@/app/lib/session";
import { verifyServerSession } from "@/app/lib/auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // =========================================================================
    // AUTH GUARD: Lindungi route /dashboard agar wajib login terlebih dahulu
    // =========================================================================
    useEffect(() => {
        const session = getValidSession();

        // 1. Jika sesi tidak ada di localStorage, segera alihkan ke /login
        if (!session) {
            setIsAuthenticated(false);
            void clearSession().finally(() => {
                router.replace("/login");
            });
            return;
        }

        // 2. Sesi ditemukan di client -> izinkan render dashboard sementara
        setIsAuthenticated(true);

        // 3. Verifikasi validitas sesi ke backend secara background
        let cancelled = false;
        verifyServerSession(session).then((status) => {
            if (cancelled) return;
            if (status === "unauthorized") {
                setIsAuthenticated(false);
                void clearSession().finally(() => {
                    router.replace("/login");
                });
            }
        });

        // 4. Sinkronisasi jika user logout di tab lain
        const handleStorageSync = (e: StorageEvent) => {
            if (e.key === "jakmatch_session" && !e.newValue) {
                setIsAuthenticated(false);
                router.replace("/login");
            }
        };
        window.addEventListener("storage", handleStorageSync);

        return () => {
            cancelled = true;
            window.removeEventListener("storage", handleStorageSync);
        };
    }, [router]);

    // Saat masih memverifikasi sesi (belum terbukti login), tampilkan indikator loading
    // untuk mencegah "flashing" konten dashboard kepada pengguna yang belum login
    if (isAuthenticated === null || isAuthenticated === false) {
        return (
            <div className="min-h-dvh w-full flex items-center justify-center bg-linear-to-b from-[#0773BC] via-[#2B95DC] to-[#81D8FF]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 border-3 border-white/30 border-t-[#CDFC56] rounded-full animate-spin" />
                    <span className="text-white text-xs font-semibold tracking-wide">
                        Memverifikasi sesi akun...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <DashboardProvider>
            <div className="min-h-dvh lg:h-dvh lg:overflow-hidden text-slate-900 flex flex-col lg:flex-row bg-linear-to-b from-[#0773BC] via-[#2B95DC] to-[#81D8FF]">
                <Sidebar />
                <div className="flex-1 min-w-0 lg:h-dvh lg:overflow-y-auto overflow-x-hidden bg-linear-to-b from-[#0773BC] via-[#2B95DC] to-[#81D8FF]">
                    <div className="px-3.5 py-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-[1280px] mx-auto w-full">
                        <ContextBanner />
                        <main className="w-full min-w-0">{children}</main>
                    </div>
                </div>
            </div>
        </DashboardProvider>
    );
}
