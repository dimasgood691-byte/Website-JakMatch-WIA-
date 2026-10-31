"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getValidSession, clearSession, UserSession } from "@/app/lib/session";
import { verifyServerSession } from "@/app/lib/auth";

export default function DashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState("");

    useEffect(() => {
        const checkAccess = async () => {
            const activeSession = getValidSession();
            if (!activeSession) {
                router.replace("/login");
                return;
            }

            const status = await verifyServerSession(activeSession);
            if (status === "unauthorized") {
                await clearSession();
                router.replace("/login");
                return;
            }

            if (status === "error") {
                setSessionError(
                    "Sesi belum dapat diverifikasi. Periksa koneksi dan coba lagi."
                );
                setLoading(false);
                return;
            }

            setSession(activeSession);
            setLoading(false);
        };

        void checkAccess();
    }, [router]);

    const handleLogout = async () => {
        await clearSession();
        router.replace("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <p className="text-sm text-slate-500 font-medium">
                    Memeriksa sesi keamanan...
                </p>
            </div>
        );
    }

    if (sessionError) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 p-6">
                <p role="alert" className="text-sm text-slate-600">
                    {sessionError}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-[#2B2B33] px-4 py-2 text-sm font-semibold text-white cursor-pointer"
                >
                    Coba lagi
                </button>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E2E8F0] mb-6 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-[#0F172A]">
                        Dashboard JakMatch
                    </h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#EF4444] text-sm font-semibold rounded-lg transition cursor-pointer"
                >
                    Logout
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0]">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
                    Selamat Datang di Dashbord JakMatch
                </h2>
                <p className="text-sm text-slate-600">
                    Halaman ini aman dan hanya bisa diakses oleh pengguna yang telah
                    terautentikasi.
                </p>
            </div>
        </div>
    );
}
