import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { collection, doc, addDoc, updateDoc, onSnapshot, deleteDoc, writeBatch, getDocs, getDoc, QueryDocumentSnapshot,DocumentData,Timestamp  } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Note } from "@/types/note";


const normalizeFirestoreTimestamp = (value: Timestamp): string | undefined => {
    if (!value) return undefined;
    if (value?.toDate && typeof value.toDate === "function") {
        return value.toDate().toISOString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "number") {
        return new Date(value).toISOString();
    }
    if (typeof value === "string") {
        return value;
    }
    return undefined;
};

const mapFirestoreNote = (doc : QueryDocumentSnapshot<DocumentData>): Note => {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title ?? "",
        content: data.content ?? "",
        color: data.color ?? "default",
        pinned: data.pinned ?? false,
        archived: data.archived ?? false,
        deleted: data.deleted ?? false,
        labelIds: data.labelIds ?? [],
        createdAt: normalizeFirestoreTimestamp(data.createdAt),
        order: typeof data.order === "number" ? data.order : undefined,
    };
};

const sortNotesByOrder = (notes: Note[]): Note[] => {
    return notes.sort((a, b) => {
        const orderA = a.order ?? Infinity;
        const orderB = b.order ?? Infinity;
        return orderA - orderB;
    });
};

export interface NotesState {
    notes: Note[];
    searchQuery: string;
    userId: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: NotesState = {
    notes: [],
    searchQuery: "",
    userId: null,
    loading: false,
    error: null,
};
const getUserNotesCollection = (userId: string) => collection(db, "users", userId, "notes");

export const subscribeToUserNotes = (userId: string, onNotesChange: (notes: Note[]) => void) => {
    const notesCollection = getUserNotesCollection(userId);
    return onSnapshot(notesCollection, (snapshot) => {
        const notes = snapshot.docs.map((doc) => mapFirestoreNote(doc));
        onNotesChange(sortNotesByOrder(notes));
    });
};
const fetchNotesFromFirestore = createAsyncThunk(
  "notes/fetchNotes",
  async (userId: string, { rejectWithValue }) => {
    try {
      const notesCollection = getUserNotesCollection(userId);

      const snapshot = await getDocs(notesCollection);

      const notes = snapshot.docs.map((doc) => mapFirestoreNote(doc));

      return sortNotesByOrder(notes);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  }
);

const addNoteToFirestore = createAsyncThunk(
    "notes/addNote",
    async (payload: { userId: string; note: Omit<Note, "id"> }, { rejectWithValue }) => {
        const { userId, note } = payload;
        const notesCollection = getUserNotesCollection(userId);
        const docRef = await addDoc(notesCollection, note);
        return { ...note, id: docRef.id };
    }
);

const updateNoteInFirestore = createAsyncThunk(
    "notes/updateNote",
    async (payload: { userId: string; noteId: string; updatedFields: Partial<Note> }, { rejectWithValue }) => {
        const { userId, noteId, updatedFields } = payload;
        const noteDoc = doc(db, "users", userId, "notes", noteId);
        await updateDoc(noteDoc, updatedFields);
        return { id: noteId, ...updatedFields };
    }
);

const deleteNoteFromFirestore = createAsyncThunk(
    "notes/deleteNote",
    async (payload: { userId: string; noteId: string }, { rejectWithValue }) => {
        const { userId, noteId } = payload;
        const noteDoc = doc(db, "users", userId, "notes", noteId);
        await updateDoc(noteDoc, { deleted: true });
        return { id: noteId };
    }
);
const permanentlyDeleteNoteFromFirestore = createAsyncThunk(
    "notes/permanentDeleteNote",
    async (payload: { userId: string; noteId: string }, { rejectWithValue }) => {
        const { userId, noteId } = payload;
        const noteDoc = doc(db, "users", userId, "notes", noteId);
        await deleteDoc(noteDoc);
        return { id: noteId };
    }
);
const clearDeletedNotesFromFirestore = createAsyncThunk(
    "notes/clearDeletedNotes",
    async (userId: string, { rejectWithValue }) => {
        const notesCollection = getUserNotesCollection(userId);
        const snapshot = await getDocs(notesCollection);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            const data = doc.data() as Note;
            if (data.deleted) {
                batch.delete(doc.ref);
            }     });
        await batch.commit();
    }
);

const archiveNoteInFirestore = createAsyncThunk(
  "notes/archiveNote",
  async (
    payload: { userId: string; noteId: string },
    { rejectWithValue }
  ) => {
    try {
      const { userId, noteId } = payload;

      const noteRef = doc(db, "users", userId, "notes", noteId);

      const snapshot = await getDoc(noteRef);

      if (!snapshot.exists()) {
        throw new Error("Note not found");
      }

      const currentData = snapshot.data() as Note;

      await updateDoc(noteRef, {
        archived: !currentData.archived,
        pinned: false,
      });

      return {
        id: noteId,
        archived: !currentData.archived,
        pinned: false,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  }
);

const reorderNotesInFirestore = createAsyncThunk(
  "notes/reorderNotes",
  async (payload: { userId: string; orderedNotes: Note[] }, { rejectWithValue }) => {
    const { userId, orderedNotes } = payload;
    const batch = writeBatch(db);
    const updatedNotes: Note[] = [];
    orderedNotes.forEach((note, index) => {
      const noteDoc = doc(db, "users", userId, "notes", note.id);
      batch.update(noteDoc, { order: index });
      updatedNotes.push({ ...note, order: index });
    });
    await batch.commit();
    return updatedNotes;
  }
);


const addLabelToNoteInFirestore = createAsyncThunk(
    "notes/addLabelToNote",
    async (payload: { userId: string; noteId: string; labelId: string }, { rejectWithValue }) => {
        const { userId, noteId, labelId } = payload;
        const noteRef = doc(db, "users", userId, "notes", noteId);
        const snapshot = await getDoc(noteRef);
        if (!snapshot.exists()) {
            throw new Error("Note not found");
        }
        const currentData = snapshot.data() as Note;
        const currentIds = currentData.labelIds || [];
        if (currentIds.includes(labelId)) {
            return { id: noteId, labelIds: currentIds };
        }
        const updatedIds = [...currentIds, labelId];
        await updateDoc(noteRef, { labelIds: updatedIds });
        return { id: noteId, labelIds: updatedIds };
    }
);
const slice = createSlice({
    name: "notes",
    initialState,
    reducers: {
        setNotes(state, action: PayloadAction<Note[]>) {
            state.notes = action.payload;
        },
        setSearchQuery(state, action: PayloadAction<string>) {
            state.searchQuery = action.payload;
        },
        mergeLabelReferences(state, action: PayloadAction<{ sourceId: string; targetId: string }>) {
            const { sourceId, targetId } = action.payload;
            state.notes = state.notes.map((note) => {
                if (!note.labelIds?.includes(sourceId)) return note;
                const ids = note.labelIds.filter((id) => id !== sourceId);
                if (!ids.includes(targetId)) ids.push(targetId);
                return { ...note, labelIds: ids };
            });
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotesFromFirestore.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotesFromFirestore.fulfilled, (state, action: PayloadAction<Note[]>) => {
                state.notes = action.payload;
                state.loading = false;
            })
            .addCase(fetchNotesFromFirestore.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addNoteToFirestore.fulfilled, (state, action: PayloadAction<Note>) => {
                const noteExists = state.notes.some((note) => note.id === action.payload.id);
                if (!noteExists) {
                    state.notes = [...state.notes, action.payload];
                    state.notes = sortNotesByOrder(state.notes);
                }
                state.loading = false;
            })
            .addCase(addNoteToFirestore.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateNoteInFirestore.fulfilled, (state, action) => {
                state.notes = state.notes.map((note) =>
                    note.id === action.payload.id ? { ...note, ...action.payload } : note
                );
                state.loading = false;
            })
            .addCase(updateNoteInFirestore.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteNoteFromFirestore.fulfilled, (state, action) => {
                state.notes = state.notes.map((note) =>
                    note.id === action.payload.id ? { ...note, deleted: true } : note
                );
            })
            .addCase(permanentlyDeleteNoteFromFirestore.fulfilled, (state, action) => {
                state.notes = state.notes.filter((note) => note.id !== action.payload.id);
            })
            .addCase(clearDeletedNotesFromFirestore.fulfilled, (state) => {
                state.notes = state.notes.filter((note) => !note.deleted);
            })
            .addCase(archiveNoteInFirestore.fulfilled, (state, action) => {
                state.notes = state.notes.map((note) =>
                    note.id === action.payload.id
                        ? { ...note, archived: action.payload.archived, pinned: false }
                        : note
                );
            })
            .addCase(reorderNotesInFirestore.fulfilled, (state, action: PayloadAction<Note[]>) => {
                state.notes = action.payload;
            })
            .addCase(addLabelToNoteInFirestore.fulfilled, (state, action) => {
                state.notes = state.notes.map((note) =>
                    note.id === action.payload.id
                        ? { ...note, labelIds: action.payload.labelIds }
                        : note
                );
            });
    },
});

export const {
    setNotes,
    setSearchQuery,
    mergeLabelReferences,
} = slice.actions;

export {
    fetchNotesFromFirestore,
    addNoteToFirestore,
    updateNoteInFirestore,
    deleteNoteFromFirestore,
    permanentlyDeleteNoteFromFirestore,
    clearDeletedNotesFromFirestore,
    archiveNoteInFirestore,
    reorderNotesInFirestore,
    addLabelToNoteInFirestore,
};

export default slice.reducer;



