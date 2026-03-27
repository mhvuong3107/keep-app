'use client';
import { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store';
import { loadNotesFromStorage } from '@/lib/features/notesSlice';
import { loadLabelsFromStorage } from '@/lib/features/labelsSlice';
import { setNotes } from '@/lib/features/notesSlice';
import { setLabels } from '@/lib/features/labelsSlice';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
    const store = useMemo(() => makeStore(), []);

    useEffect(() => {
        const notes = loadNotesFromStorage();
        const labels = loadLabelsFromStorage();
        store.dispatch(setNotes(notes));
        store.dispatch(setLabels(labels));
    }, [store]);

    return <Provider store={store}>{children}</Provider>;
}
