import React from "react";
import { DashboardProvider } from "./DashboardContext";
import Sidebar from "./Sidebar";
import ContextBanner from "./ContextBanner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardProvider>
            <div className="min-h-screen text-slate-900 flex flex-col lg:flex-row bg-slate-50 overflow-x-hidden">
                <Sidebar />
                <div className="flex-1 min-w-0 min-h-screen bg-linear-to-b from-[#0773BC] via-[#2B95DC] to-[#81D8FF]">
                    <div className="px-3.5 py-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-[1280px] mx-auto w-full">
                        <ContextBanner />
                        <main className="w-full min-w-0">{children}</main>
                    </div>
                </div>
            </div>
        </DashboardProvider>
    );
}
