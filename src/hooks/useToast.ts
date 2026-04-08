'use client';

import { useState, useCallback } from 'react';

export interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    open: boolean;
}

export interface UseToastReturn {
    toasts: Toast[];
    toast: (options: {
        title: string;
        description?: string;
        variant?: 'default' | 'destructive';
        duration?: number;
    }) => void;
    dismiss: (toastId?: string) => void;
}

export const useToast = (): UseToastReturn => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((toastId?: string) => {
        if (toastId) {
            setToasts((prev) => prev.filter((t) => t.id !== toastId));
        } else {
            setToasts([]);
        }
    }, []);

    const toast = useCallback(
        ({
            title,
            description,
            variant = 'default',
            duration = 3000,
        }: {
            title: string;
            description?: string;
            variant?: 'default' | 'destructive';
            duration?: number;
        }) => {
            const id = Math.random().toString(36).substr(2, 9);
            const newToast: Toast = {
                id,
                title,
                description,
                variant,
                open: true,
            };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => {
                    dismiss(id);
                }, duration);
            }
        },
        [dismiss],
    );

    return {
        toasts,
        toast,
        dismiss,
    };
};
