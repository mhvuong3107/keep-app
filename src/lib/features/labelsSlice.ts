import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { collection, doc, addDoc, updateDoc, onSnapshot, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import Label from "@/types/label";


const getUserLabelsCollection = (userId: string) => collection(db, "users", userId, "labels");

export const subscribeToUserLabels = (userId: string, onLabelsChange: (labels: Label[]) => void) => {
    const labelsCollection = getUserLabelsCollection(userId);
    return onSnapshot(labelsCollection, (snapshot) => {
        const labels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Label));
        onLabelsChange(labels);
    });
};

const fetchLabelsFromFirestore = createAsyncThunk(
    "labels/fetchLabels",
    async (userId: string, { rejectWithValue }) => {
        try {
            const labelsCollection = getUserLabelsCollection(userId);
            const snapshot = await getDocs(labelsCollection);
            const labels = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Label));
            return labels;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "An error occurred"
            );
        }
    }
);

const addLabelToFirestore = createAsyncThunk(
    "labels/addLabel",
    async (payload: { userId: string; name: string }, { rejectWithValue }) => {
        const { userId, name } = payload;
        const labelsCollection = getUserLabelsCollection(userId);
        const docRef = await addDoc(labelsCollection, { name: name.trim() });
        return { id: docRef.id, name: name.trim() };
    }
);

const updateLabelInFirestore = createAsyncThunk(
    "labels/updateLabel",
    async (payload: { userId: string; labelId: string; newName: string }, { rejectWithValue }) => {
        const { userId, labelId, newName } = payload;
        const labelDoc = doc(db, "users", userId, "labels", labelId);
        await updateDoc(labelDoc, { name: newName.trim() });
        return { id: labelId, name: newName.trim() };
    }
);

const deleteLabelFromFirestore = createAsyncThunk(
    "labels/deleteLabel",
    async (payload: { userId: string; labelId: string }, { rejectWithValue }) => {
        const { userId, labelId } = payload;
        const labelDoc = doc(db, "users", userId, "labels", labelId);
        await deleteDoc(labelDoc);
        return { id: labelId };
    }
);

export interface LabelsState {
    labels: Label[];
}

const initialState: LabelsState = {
    labels: [],
};

const uniqueLabels = (labels: Label[]): Label[] => {
    const map = new Map<string, Label>();
    for (const label of labels) {
        if (!map.has(label.id)) {
            map.set(label.id, label);
        }
    }
    return Array.from(map.values());
};

const slice = createSlice({
    name: "labels",
    initialState,
    reducers: {
        setLabels(state, action: PayloadAction<Label[]>) {
            state.labels = uniqueLabels(action.payload);
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
    extraReducers: (builder) => {
        builder
            .addCase(fetchLabelsFromFirestore.fulfilled, (state, action: PayloadAction<Label[]>) => {
                state.labels = action.payload;
            })
            .addCase(addLabelToFirestore.fulfilled, (state, action: PayloadAction<Label>) => {
                const exists = state.labels.some((label) => label.id === action.payload.id);
                if (!exists) {
                    state.labels = [...state.labels, action.payload];
                }
            })
            .addCase(updateLabelInFirestore.fulfilled, (state, action: PayloadAction<Label>) => {
                state.labels = state.labels.map((label) =>
                    label.id === action.payload.id ? { ...label, name: action.payload.name } : label
                );
            })
            .addCase(deleteLabelFromFirestore.fulfilled, (state, action) => {
                state.labels = state.labels.filter((label) => label.id !== action.payload.id);
            });
    },
});

export const { setLabels, addLabel, removeLabel, updateLabel, mergeLabel } = slice.actions;

export {
    fetchLabelsFromFirestore,
    addLabelToFirestore,
    updateLabelInFirestore,
    deleteLabelFromFirestore,
};

export default slice.reducer;
