import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Note } from "@/types/note";

const NOTES_STORAGE_KEY = "keep-notes";

export interface NotesState {
    notes: Note[];
    searchQuery: string;
}

const initialState: NotesState = {
    notes: [],
    searchQuery: "",
};

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
        addNote(state, action: PayloadAction<{ title: string; content: string; options?: { color?: string; pinned?: boolean; archived?: boolean; labelIds?: string[] } }>) {
            const { title, content, options } = action.payload;
            const newNote: Note = {
                id: Date.now().toString(),
                title,
                content,
                color: options?.color || "default",
                pinned: options?.pinned || false,
                archived: options?.archived || false,
                deleted: false,
                labelIds: options?.labelIds || [],
            };
            state.notes = [newNote, ...state.notes];
        },
        pinNote(state, action: PayloadAction<string>) {
            state.notes = state.notes.map((note) =>
                note.id === action.payload
                    ? { ...note, pinned: !note.pinned, archived: false }
                    : note
            );
        },
        deleteNote(state, action: PayloadAction<string>) {
            state.notes = state.notes.map((note) =>
                note.id === action.payload ? { ...note, deleted: true } : note
            );
        },
        permanentDelete(state, action: PayloadAction<string>) {
            state.notes = state.notes.filter((note) => note.id !== action.payload);
        },
        clearDeletedNotes(state) {
            state.notes = state.notes.filter((note) => !note.deleted);
        },
        restoreNote(state, action: PayloadAction<string>) {
            state.notes = state.notes.map((note) =>
                note.id === action.payload
                    ? { ...note, deleted: false, archived: false }
                    : note
            );
        },
        archiveNote(state, action: PayloadAction<string>) {
            state.notes = state.notes.map((note) =>
                note.id === action.payload
                    ? { ...note, archived: !note.archived, pinned: false }
                    : note
            );
        },
        changeColor(state, action: PayloadAction<{ id: string; color: string }>) {
            state.notes = state.notes.map((note) =>
                note.id === action.payload.id ? { ...note, color: action.payload.color } : note
            );
        },
        updateNote(state, action: PayloadAction<{ id: string; updates: Partial<Note> }>) {
            state.notes = state.notes.map((note) =>
                note.id === action.payload.id ? { ...note, ...action.payload.updates } : note
            );
        },
        reorderNotes(state, action: PayloadAction<{ fromId: string; toId: string }>) {
            const fromIndex = state.notes.findIndex((note) => note.id === action.payload.fromId);
            const toIndex = state.notes.findIndex((note) => note.id === action.payload.toId);
            if (fromIndex === -1 || toIndex === -1) return;
            const notesCopy = [...state.notes];
            const [moved] = notesCopy.splice(fromIndex, 1);
            notesCopy.splice(toIndex, 0, moved);
            state.notes = notesCopy;
        },
        addLabelToNote(state, action: PayloadAction<{ noteId: string; labelId: string }>) {
            state.notes = state.notes.map((note) => {
                if (note.id !== action.payload.noteId) return note;
                const currentIds = note.labelIds || [];
                if (currentIds.includes(action.payload.labelId)) return note;
                return { ...note, labelIds: [...currentIds, action.payload.labelId] };
            });
        },
        removeLabelFromNote(state, action: PayloadAction<{ noteId: string; labelId: string }>) {
            state.notes = state.notes.map((note) =>
                note.id !== action.payload.noteId
                    ? note
                    : {
                        ...note,
                        labelIds: note.labelIds?.filter((id) => id !== action.payload.labelId),
                    }
            );
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
});

export const {
    setNotes,
    setSearchQuery,
    addNote,
    pinNote,
    deleteNote,
    permanentDelete,
    clearDeletedNotes,
    restoreNote,
    archiveNote,
    changeColor,
    updateNote,
    reorderNotes,
    addLabelToNote,
    removeLabelFromNote,
    mergeLabelReferences,
} = slice.actions;

export default slice.reducer;

export const loadNotesFromStorage = (): Note[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(NOTES_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};



