import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SidebarState {
    sidebarExpanded: boolean;
}

const initialState: SidebarState = {
    sidebarExpanded: false,
};

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
            state.sidebarExpanded = action.payload;
        },
        toggleSidebarExpanded: (state) => {
            state.sidebarExpanded = !state.sidebarExpanded;
        },
    },
});

export const { setSidebarExpanded, toggleSidebarExpanded } = sidebarSlice.actions;
export default sidebarSlice.reducer;
