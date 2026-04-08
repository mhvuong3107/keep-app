'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider as ToastPrimitiveProvider,
    ToastTitle,
    ToastViewport,
} from '@/components/ui/toast';

export interface ToastMessage {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    open: boolean;
}

interface ToastContextType {
    toasts: ToastMessage[];
    addToast: (options: {
        title: string;
        description?: string;
        variant?: 'default' | 'destructive';
        duration?: number;
    }) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToasts must be used within ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const removeToast = useCallback((id: string) => {
        // Clear timeout if exists
        const timeout = timeoutRefs.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeoutRefs.current.delete(id);
        }

        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
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
            const id = `toast-${Date.now()}-${Math.random()}`;
            const newToast: ToastMessage = {
                id,
                title,
                description,
                variant,
                open: true,
            };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                const timeout = setTimeout(() => {
                    removeToast(id);
                }, duration);
                timeoutRefs.current.set(id, timeout);
            }
        },
        [removeToast],
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            <ToastPrimitiveProvider>
                {children}
                <ToastViewport/>
                {toasts.map((toast) => (
                    <Toast key={toast.id} variant={toast.variant} >
                        <div className="grid gap-1">
                            <ToastTitle>{toast.title}</ToastTitle>
                            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
                        </div>
                        <ToastClose onClick={() => removeToast(toast.id)} />
                    </Toast>
                ))}
            </ToastPrimitiveProvider>
        </ToastContext.Provider>
    );
};
