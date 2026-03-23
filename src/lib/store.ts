import { configureStore } from '@reduxjs/toolkit';
import notesReducer from '@/lib/features/notesSlice';
import labelsReducer from '@/lib/features/labelsSlice';

export const makeStore = () => {
    const preloadedState = {
        notes: {
            notes: [],
            searchQuery: "",
        },
        labels: {
            labels: [],
        },
    };

    const store = configureStore({
        reducer: {
            notes: notesReducer,
            labels: labelsReducer,
        },
        preloadedState,
    });

    if (typeof window !== 'undefined') {
        store.subscribe(() => {
            const state = store.getState();
            try {
                localStorage.setItem('keep-notes', JSON.stringify(state.notes.notes));
                localStorage.setItem('keep_labels', JSON.stringify(state.labels.labels));
            } catch (error) {
                console.error('Failed to persist keep state', error);
            }
        });
    }

    return store;
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

