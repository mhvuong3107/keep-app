'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthButton } from './AuthButton';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Welcome to Keep</h1>
                        <p className="text-muted-foreground">Sign in to access your notes</p>
                    </div>
                    <AuthButton />
                </div>
            </div>
        );
    }

    return <>{children}</>;
};