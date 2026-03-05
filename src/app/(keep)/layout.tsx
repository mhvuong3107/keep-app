"use client";

import KeepHeader from "@/components/keep/KeepHeader";
import KeepSidebar from "@/components/keep/KeepSidebar";

export default function KeepLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <KeepHeader />
            <div className="flex flex-1 overflow-hidden">
                <KeepSidebar />
                <main className="flex-1 p-4 sm:p-8 transition-all duration-200">
                  {children}
                </main>
            </div>
        </div>
    );
}
