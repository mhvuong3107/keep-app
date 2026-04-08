import { configureStore, type Reducer } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import notesReducer from '@/lib/features/notesSlice';
import labelsReducer from '@/lib/features/labelsSlice';
import authReducer from '@/lib/features/authSlice';
import uiReducer, { type SidebarState } from '@/lib/features/sidebarSlice';

export const makeStore = () => {
    const preloadedState = {
        notes: {
            notes: [],
            searchQuery: "",
            userId: null,
            loading: false,
            loaded: false,
            error: null,
        },
        labels: {
            labels: [],
            loaded: false,
        },
        auth: {
            user: null,
            loading: true,
            error: null,
        },
        sidebar: {
            sidebarExpanded: false,
        },
    };

    // Redux-persist config for UI
    const uiPersistConfig = {
        key: 'sidebar-expanded',
        storage,
        whitelist: ['sidebarExpanded'],
    };

    const persistedSidebarReducer = persistReducer<SidebarState>(uiPersistConfig, uiReducer) as unknown as Reducer<SidebarState>;

    const store = configureStore({
        reducer: {
            notes: notesReducer,
            labels: labelsReducer,
            auth: authReducer,
            sidebar: persistedSidebarReducer,
        },
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                },
            }),
    });

    const persistor = persistStore(store);
    return { store, persistor };
};

export type AppStore = ReturnType<typeof makeStore>['store'];
export type AppPersistor = ReturnType<typeof makeStore>['persistor'];
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
