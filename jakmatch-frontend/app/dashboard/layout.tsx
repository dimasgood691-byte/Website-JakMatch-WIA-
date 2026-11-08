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
            <div className="min-h-screen text-slate-900 flex flex-col lg:flex-row bg-linear-to-b from-[#0773BC] to-[#81D8FF]">
                <Sidebar />
                <div className="flex-1 min-w-0 min-h-screen bg-linear-to-b from-[#0773BC] to-[#81D8FF]">
                    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1280px] mx-auto w-full">
                        <ContextBanner />
                        <main>{children}</main>
                    </div>
                </div>
            </div>
        </DashboardProvider>
    );
}
