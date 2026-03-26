'use client';
import { useMemo } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
    const store = useMemo(() => makeStore(), []);

    return <Provider store={store}>{children}</Provider>;
}
