import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import Label from "@/types/label";

const LABELS_STORAGE_KEY = "keep_labels";

export interface LabelsState {
    labels: Label[];
}

const initialState: LabelsState = {
    labels: [],
};

const slice = createSlice({
    name: "labels",
    initialState,
    reducers: {
        setLabels(state, action: PayloadAction<Label[]>) {
            state.labels = action.payload;
        },
        addLabel(state, action: PayloadAction<{ name: string }>) {
            const newLabel: Label = { id: Date.now().toString(), name: action.payload.name.trim() };
            state.labels = [...state.labels, newLabel];
        },
        removeLabel(state, action: PayloadAction<string>) {
            state.labels = state.labels.filter((label) => label.id !== action.payload);
        },
        updateLabel(state, action: PayloadAction<{ id: string; newName: string }>) {
            state.labels = state.labels.map((label) =>
                label.id === action.payload.id
                    ? { ...label, name: action.payload.newName.trim() }
                    : label
            );
        },
        mergeLabel(state, action: PayloadAction<{ sourceId: string; targetId: string }>) {
            state.labels = state.labels.filter((label) => label.id !== action.payload.sourceId);
        },
    },
});

export const { setLabels, addLabel, removeLabel, updateLabel, mergeLabel } = slice.actions;
export const loadLabelsFromStorage = (): Label[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(LABELS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export default slice.reducer;
