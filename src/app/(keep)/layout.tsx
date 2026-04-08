"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import KeepHeader from "@/components/keep/KeepHeader";
import KeepSidebar from "@/components/keep/KeepSidebar";
import { AuthGuard } from "@/components/keep/AuthGuard";
import { setSidebarExpanded, toggleSidebarExpanded } from "@/lib/features/sidebarSlice";
import type { RootState } from "@/lib/store";

export default function KeepLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useDispatch();
    const sidebarExpanded = useSelector((state: RootState) => state.sidebar.sidebarExpanded);

    // Check if mobile to decide whether to persist
    useEffect(() => {
        const checkMobile = () => {
            const isMobile = window.innerWidth < 768;
            // On mobile, always reset to false; on desktop/tablet, use persisted state
            if (isMobile && sidebarExpanded) {
                // Optional: collapse on mobile if window resizes to mobile
            }
        };
        checkMobile();
    }, []);

    return (
        <AuthGuard>
            <div className="min-h-screen bg-background">
                <KeepHeader onToggleSidebar={() => dispatch(toggleSidebarExpanded())} />
                <div className="flex">
                    <KeepSidebar
                        expanded={sidebarExpanded}
                        onNavigate={() => dispatch(setSidebarExpanded(false))}
                    />
                    <main className="flex-1 p-4 sm:p-8 transition-all duration-200">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
