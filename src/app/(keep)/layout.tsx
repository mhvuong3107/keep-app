"use client";
import { useState } from "react";
import KeepHeader from "@/components/keep/KeepHeader";
import KeepSidebar from "@/components/keep/KeepSidebar";
import { AuthGuard } from "@/components/keep/AuthGuard";

export default function KeepLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    return (
        <AuthGuard>
            <div className="min-h-screen bg-background">
                <KeepHeader onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)} />
                <div className="flex">
                    <KeepSidebar expanded={sidebarExpanded} />
                    <main className="flex-1 p-4 sm:p-8 transition-all duration-200">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
