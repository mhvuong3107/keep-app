'use client';
import { useMemo } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore } from '@/lib/store';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
    const { store, persistor } = useMemo(() => makeStore(), []);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
}
