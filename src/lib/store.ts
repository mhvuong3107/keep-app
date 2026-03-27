import { configureStore } from '@reduxjs/toolkit';
import notesReducer from '@/lib/features/notesSlice';
import labelsReducer from '@/lib/features/labelsSlice';
import authReducer from '@/lib/features/authSlice';

export const makeStore = () => {
    const preloadedState = {
        notes: {
            notes: [],
            searchQuery: "",
            userId: null,
            loading: false,
            error: null,
        },
        labels: {
            labels: [],
        },
        auth: {
            user: null,
            loading: true,
            error: null,
        },
    };

    const store = configureStore({
        reducer: {
            notes: notesReducer,
            labels: labelsReducer,
            auth: authReducer,
        },
        preloadedState,
    });

    // Firestore sync is handled by hooks and realtime subscriptions.
    // No localStorage persistence needed for notes and labels.

    return store;
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

