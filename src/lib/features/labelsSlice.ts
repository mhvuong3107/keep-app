import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { collection, doc, addDoc, updateDoc, onSnapshot, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Label } from "@/types/label";


const getLabelsCollection = () => collection(db, "labels");

export const subscribeToUserLabels = (userId: string, onLabelsChange: (labels: Label[]) => void) => {
    const labelsQuery = query(getLabelsCollection(), where("userId", "==", userId));
    return onSnapshot(labelsQuery, (snapshot) => {
        const labels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Label));
        onLabelsChange(labels);
    });
};

const fetchLabelsFromFirestore = createAsyncThunk(
    "labels/fetchLabels",
    async (userId: string, { rejectWithValue }) => {
        try {
            const labelsQuery = query(getLabelsCollection(), where("userId", "==", userId));
            const snapshot = await getDocs(labelsQuery);
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
    async (payload: { userId: string; name: string }) => {
        const { userId, name } = payload;
        const labelsCollection = getLabelsCollection();
        const docRef = await addDoc(labelsCollection, { name: name.trim(), userId });
        return { id: docRef.id, userId, name: name.trim() };
    }
);

const updateLabelInFirestore = createAsyncThunk(
    "labels/updateLabel",
    async (payload: { userId: string; labelId: string; newName: string }) => {
        const { userId, labelId, newName } = payload;
        const labelDoc = doc(db, "labels", labelId);
        await updateDoc(labelDoc, { name: newName.trim() });
        return { id: labelId, userId, name: newName.trim() };
    }
);

const deleteLabelFromFirestore = createAsyncThunk(
    "labels/deleteLabel",
    async (payload: { userId: string; labelId: string }) => {
        const { userId, labelId } = payload;
        const labelDoc = doc(db, "labels", labelId);
        await deleteDoc(labelDoc);
        return { id: labelId, userId };
    }
);

export interface LabelsState {
    labels: Label[];
    loaded: boolean;
}

const initialState: LabelsState = {
    labels: [],
    loaded: false,
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
            state.loaded = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLabelsFromFirestore.fulfilled, (state, action: PayloadAction<Label[]>) => {
                state.labels = action.payload;
                state.loaded = true;
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

export const { setLabels } = slice.actions;

export {
    fetchLabelsFromFirestore,
    addLabelToFirestore,
    updateLabelInFirestore,
    deleteLabelFromFirestore,
};

export default slice.reducer;
