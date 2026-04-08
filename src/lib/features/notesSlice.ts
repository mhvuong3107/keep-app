import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { collection, doc, updateDoc, setDoc, onSnapshot, deleteDoc, writeBatch, getDocs, getDoc, query, where, QueryDocumentSnapshot, QuerySnapshot, DocumentData, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Note, FirestoreNote, UserNoteMeta } from "@/types/note";


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

const mapFirestoreNote = (doc: QueryDocumentSnapshot<DocumentData>): Note => {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title ?? "",
        contentPreview: data.contentPreview ?? "",
        color: data.color ?? "default",
        pinned: false,
        archived: false,
        deleted: false,
        labelIds: data.labelIds ?? [],
        ownerId: data.ownerId ?? "",
        memberIds: data.memberIds ?? [],
        createdAt: normalizeFirestoreTimestamp(data.createdAt),
        updatedAt: normalizeFirestoreTimestamp(data.updatedAt),
        order: undefined,
        ydoc: data.ydoc ?? [],
    };
};

const sortNotesByOrder = (notes: Note[]): Note[] => {
    return notes.sort((a, b) => {
        const orderA = a.order ?? Infinity;
        const orderB = b.order ?? Infinity;

        // Primary sort by order
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // Tiebreaker: sort by createdAt descending (most recent first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });
};

const applyUserMetaToNotes = (notes: Note[], metaList: UserNoteMeta[]): Note[] => {
    const metaMap = new Map(metaList.map((meta) => [meta.noteId, meta]));

    return notes.map((note) => {
        const meta = metaMap.get(note.id);
        if (meta) {
            return {
                ...note,
                pinned: meta.pinned,
                archived: meta.archived,
                deleted: meta.deleted,
                labelIds: meta.labelIds,
                order: meta.order,
            };
        } else {
            // Create default meta 
            return {
                ...note,
                pinned: false,
                archived: false,
                deleted: false,
                labelIds: [],
                order: Infinity,
            };
        }
    });
};

export interface NotesState {
    notes: Note[];
    searchQuery: string;
    userId: string | null;
    loading: boolean;
    loaded: boolean;
    error: string | null;
}

const initialState: NotesState = {
    notes: [],
    searchQuery: "",
    userId: null,
    loading: false,
    loaded: false,
    error: null,
};

const getNotesCollection = () => collection(db, "notes");
const getUserNoteMetaCollection = (userId: string) => query(collection(db, "userNoteMeta"), where("userId", "==", userId));
const getUserNoteMetaDoc = (userId: string, noteId: string) => doc(db, "userNoteMeta", `${userId}_${noteId}`);
const getNoteDoc = (noteId: string) => doc(db, "notes", noteId);

export const subscribeToUserNotes = (userId: string, userEmail: string, onNotesChange: (notes: Note[]) => void) => {
    const ownerQuery = query(getNotesCollection(), where("ownerId", "==", userId));
    const memberQuery = query(getNotesCollection(), where("memberIds", "array-contains", userId));
    const metaQuery = getUserNoteMetaCollection(userId);

    const notesMap = new Map<string, Note>();
    const metaMap = new Map<string, UserNoteMeta>();

    let ownerReady = false;
    let memberReady = false;
    let metaReady = false;
    let emitTimeout: NodeJS.Timeout | null = null;

    const emit = () => {
        if (!ownerReady || !memberReady || !metaReady) return;

        // Clear previous timeout
        if (emitTimeout) clearTimeout(emitTimeout);

        // Debounce: wait 50ms for all listeners to settle
        // This ensures batch write (note + metadata) is fully processed before updating UI
        emitTimeout = setTimeout(() => {
            const notes = Array.from(notesMap.values());
            onNotesChange(sortNotesByOrder(applyUserMetaToNotes(notes, Array.from(metaMap.values()))));
            emitTimeout = null;
        }, 50);
    };

    const handleNoteSnapshot = (snapshot: QuerySnapshot<DocumentData>, source: "owner" | "member") => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
                notesMap.delete(change.doc.id);
            } else {
                const incoming = mapFirestoreNote(change.doc);
                if (change.type === "modified") {
                    const existing = notesMap.get(incoming.id);
                    notesMap.set(incoming.id, existing ? { ...existing, ...incoming } : incoming);
                } else {
                    notesMap.set(incoming.id, incoming);
                }
            }
        });

        if (source === "owner") ownerReady = true;
        if (source === "member") memberReady = true;
        emit();
    };

    const handleMetaSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
                const m = change.doc.data() as UserNoteMeta;
                metaMap.delete(m.noteId);
            } else {
                const m = change.doc.data() as UserNoteMeta;
                m.id = change.doc.id;
                metaMap.set(m.noteId, m);
            }
        });
        metaReady = true;
        emit();
    };

    const ownerUnsub = onSnapshot(ownerQuery, (snap) => handleNoteSnapshot(snap, "owner"));
    const memberUnsub = onSnapshot(memberQuery, (snap) => handleNoteSnapshot(snap, "member"));
    const metaUnsub = onSnapshot(metaQuery, handleMetaSnapshot);

    return () => {
        ownerUnsub();
        memberUnsub();
        metaUnsub();
        if (emitTimeout) clearTimeout(emitTimeout);
    };
};
const fetchNotesFromFirestore = createAsyncThunk(
    "notes/fetchNotes",
    async (payload: { userId: string; userEmail: string }, { rejectWithValue }) => {
        const { userId } = payload;
        try {
            const ownerQuery = query(getNotesCollection(), where("ownerId", "==", userId));
            const memberQuery = query(getNotesCollection(), where("memberIds", "array-contains", userId));

            const [ownerSnapshot, memberSnapshot, metaSnapshot] = await Promise.all([
                getDocs(ownerQuery),
                getDocs(memberQuery),
                getDocs(getUserNoteMetaCollection(userId)),
            ]);

            const notesMap = new Map<string, Note>();
            ownerSnapshot.docs.concat(memberSnapshot.docs).forEach((doc) => {
                const note = mapFirestoreNote(doc);
                notesMap.set(note.id, note);
            });

            const notes = Array.from(notesMap.values());

            const metaList = metaSnapshot.docs.map((doc) => {
                const data = doc.data() as UserNoteMeta;
                return {
                    id: doc.id,
                    userId: data.userId,
                    noteId: data.noteId,
                    pinned: data.pinned ?? false,
                    archived: data.archived ?? false,
                    deleted: data.deleted ?? false,
                    labelIds: data.labelIds ?? [],
                    order: data.order ?? Infinity,
                };
            });

            return sortNotesByOrder(applyUserMetaToNotes(notes, metaList));
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : "An error occurred"
            );
        }
    }
);

const addNoteToFirestore = createAsyncThunk(
    "notes/addNote",
    async (payload: { userId: string; note: Omit<Note, "id"> }) => {
        const { userId, note } = payload;
        const createdAt = Date.now();

        // Create references for both note and metadata
        const noteRef = doc(collection(db, "notes"));
        const metaRef = getUserNoteMetaDoc(userId, noteRef.id);

        const noteToSave: FirestoreNote = {
            id: noteRef.id,
            title: note.title,
            color: note.color,
            ownerId: note.ownerId,
            memberIds: note.memberIds ?? [],
            ydoc: note.ydoc ?? [],
            contentPreview: note.contentPreview ?? "",
            createdAt,
            updatedAt: createdAt,
        };

        const meta: UserNoteMeta = {
            id: `${userId}_${noteRef.id}`,
            userId,
            noteId: noteRef.id,
            pinned: note.pinned ?? false,
            archived: note.archived ?? false,
            deleted: note.deleted ?? false,
            labelIds: note.labelIds ?? [],
            order: note.order ?? 0,
        };

        // Use batch write to ensure note and metadata are created atomically
        // This prevents the race condition where note appears without metadata
        const batch = writeBatch(db);
        batch.set(noteRef, noteToSave);
        batch.set(metaRef, meta);
        await batch.commit();

        return {
            ...note,
            id: noteRef.id,
            createdAt: new Date(createdAt).toISOString(),
            updatedAt: new Date(createdAt).toISOString(),
        };
    }
);

const updateNoteInFirestore = createAsyncThunk(
    "notes/updateNote",
    async (payload: { userId: string; noteId: string; updatedFields: Partial<Note> }) => {
        const { userId, noteId, updatedFields } = payload;
        const noteDoc = getNoteDoc(noteId);
        const metaDoc = getUserNoteMetaDoc(userId, noteId);

        const noteFields: Partial<FirestoreNote> = {};
        const metaFields: Partial<UserNoteMeta> = {};

        const noteKeys = ["title", "color", "ownerId", "memberIds", "ydoc", "contentPreview", "createdAt", "updatedAt"] as const;
        const metaKeys = ["pinned", "archived", "deleted", "labelIds", "order"] as const;

        noteKeys.forEach((key) => {
            if (key in updatedFields) {
                const value = updatedFields[key as keyof Note];
                if (value !== undefined) {
                    (noteFields as unknown as Record<string, unknown>)[key] = value;
                }
            }
        });

        metaKeys.forEach((key) => {
            if (key in updatedFields) {
                const value = updatedFields[key as keyof Note];
                if (value !== undefined) {
                    (metaFields as unknown as Record<string, unknown>)[key] = value;
                }
            }
        });

        if (Object.keys(noteFields).length > 0) {
            await updateDoc(noteDoc, {
                ...noteFields,
                updatedAt: Date.now(),
            });
        }

        if (Object.keys(metaFields).length > 0) {
            await setDoc(metaDoc, { ...metaFields, userId, noteId }, { merge: true });
        }

        return { id: noteId, ...updatedFields };
    }
);

const deleteNoteFromFirestore = createAsyncThunk(
    "notes/deleteNote",
    async (payload: { userId: string; noteId: string }) => {
        const { noteId } = payload;
        const noteDoc = getNoteDoc(noteId);
        const noteSnapshot = await getDoc(noteDoc);
        if (!noteSnapshot.exists()) {
            throw new Error("Note not found");
        }
        const noteData = noteSnapshot.data() as FirestoreNote;
        const ownerId = noteData.ownerId;
        await updateDoc(noteDoc, { deleted: true, memberIds: [] });

        const noteMetaQuery = query(collection(db, "userNoteMeta"), where("noteId", "==", noteId));
        const metaSnapshot = await getDocs(noteMetaQuery);
        const batch = writeBatch(db);

        metaSnapshot.docs.forEach((metaDoc) => {
            const metaData = metaDoc.data() as UserNoteMeta;
            if (metaData.userId === ownerId) {
                batch.set(metaDoc.ref, { deleted: true, userId: ownerId, noteId }, { merge: true });
            } else {
                batch.delete(metaDoc.ref);
            }
        });
        const ownerMetaExists = metaSnapshot.docs.some((metaDoc) => {
            const metaData = metaDoc.data() as UserNoteMeta;
            return metaData.userId === ownerId;
        });

        if (!ownerMetaExists) {
            const ownerMetaDoc = getUserNoteMetaDoc(ownerId, noteId);
            batch.set(ownerMetaDoc, {
                id: `${ownerId}_${noteId}`,
                userId: ownerId,
                noteId,
                pinned: false,
                archived: false,
                deleted: true,
                labelIds: [],
                order: 0,
            });
        }

        await batch.commit();

        return { id: noteId };
    }
);

const permanentlyDeleteNoteFromFirestore = createAsyncThunk(
    "notes/permanentDeleteNote",
    async (payload: { userId: string; noteId: string }) => {
        const { noteId } = payload;
        const noteDoc = getNoteDoc(noteId);
        await deleteDoc(noteDoc);

        const noteMetaQuery = query(collection(db, "userNoteMeta"), where("noteId", "==", noteId));
        const metaSnapshot = await getDocs(noteMetaQuery);
        const batch = writeBatch(db);
        metaSnapshot.docs.forEach((metaDoc) => {
            batch.delete(metaDoc.ref);
        });
        await batch.commit();

        return { id: noteId };
    }
);
const clearDeletedNotesFromFirestore = createAsyncThunk(
    "notes/clearDeletedNotes",
    async (userId: string) => {
        const metaQuery = query(collection(db, "userNoteMeta"), where("userId", "==", userId), where("deleted", "==", true));
        const snapshot = await getDocs(metaQuery);
        const batch = writeBatch(db);
        snapshot.docs.forEach((docMeta) => {
            const meta = docMeta.data() as UserNoteMeta;
            batch.delete(docMeta.ref);
            batch.delete(getNoteDoc(meta.noteId));
        });
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

            const metaRef = getUserNoteMetaDoc(userId, noteId);

            const snapshot = await getDoc(metaRef);

            if (!snapshot.exists()) {
                throw new Error("Note metadata not found");
            }

            const currentData = snapshot.data() as UserNoteMeta;
            const archived = !currentData.archived;
            await setDoc(metaRef, { archived, pinned: false }, { merge: true });

            return {
                id: noteId,
                archived,
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
    async (payload: { userId: string; orderedNotes: Note[] }) => {
        const { userId, orderedNotes } = payload;
        const batch = writeBatch(db);
        const updatedNotes: Note[] = [];
        orderedNotes.forEach((note, index) => {
            const metaDoc = getUserNoteMetaDoc(userId, note.id);
            batch.set(metaDoc, { order: index }, { merge: true });
            updatedNotes.push({ ...note, order: index });
        });
        await batch.commit();
        return updatedNotes;
    }
);


const addLabelToNoteInFirestore = createAsyncThunk(
    "notes/addLabelToNote",
    async (payload: { userId: string; noteId: string; labelId: string }) => {
        const { userId, noteId, labelId } = payload;
        const metaRef = getUserNoteMetaDoc(userId, noteId);
        const snapshot = await getDoc(metaRef);
        const currentData = snapshot.exists()
            ? (snapshot.data() as UserNoteMeta)
            : {
                id: `${userId}_${noteId}`,
                userId,
                noteId,
                pinned: false,
                archived: false,
                deleted: false,
                labelIds: [],
                order: 0,
            } as UserNoteMeta;

        const currentIds = currentData.labelIds || [];
        if (currentIds.includes(labelId)) {
            return { id: noteId, labelIds: currentIds };
        }
        const updatedIds = [...currentIds, labelId];
        await setDoc(metaRef, { labelIds: updatedIds, userId, noteId }, { merge: true });
        return { id: noteId, labelIds: updatedIds };
    }
);

const addCollaboratorToNoteInFirestore = createAsyncThunk(
    "notes/addCollaboratorToNote",
    async (payload: { userId: string; noteId: string; collaboratorId: string }) => {
        const { noteId, collaboratorId } = payload;

        // find the collaborator user by ID
        const usersQuery = query(collection(db, "users"), where("uid", "==", collaboratorId));
        const userSnapshot = await getDocs(usersQuery);

        if (userSnapshot.empty) {
            throw new Error("User not found with this ID");
        }

        // Update the note's memberIds with user ID
        const noteRef = getNoteDoc(noteId);
        const noteSnap = await getDoc(noteRef);
        if (!noteSnap.exists()) {
            throw new Error("Note not found");
        }
        const noteData = noteSnap.data() as FirestoreNote;

        // Check if collaborator is the owner of the note
        if (collaboratorId === noteData.ownerId) {
            throw new Error("Cannot add note owner as collaborator");
        }

        const currentMembers = noteData.memberIds || [];
        if (currentMembers.includes(collaboratorId)) {
            return { id: noteId, memberIds: currentMembers };
        }
        const updatedMembers = [...currentMembers, collaboratorId];
        await updateDoc(noteRef, { memberIds: updatedMembers });
        const metaRef = getUserNoteMetaDoc(collaboratorId, noteId);
        const metaSnapshot = await getDoc(metaRef);
        if (!metaSnapshot.exists()) {
            const meta: UserNoteMeta = {
                id: `${collaboratorId}_${noteId}`,
                userId: collaboratorId,
                noteId,
                pinned: false,
                archived: false,
                deleted: false,
                labelIds: [],
                order: Infinity,
            };
            await setDoc(metaRef, meta);
        }
        return { id: noteId, memberIds: updatedMembers };
    }
);

const removeCollaboratorFromNoteInFirestore = createAsyncThunk(
    "notes/removeCollaboratorFromNote",
    async (payload: { userId: string; noteId: string; collaboratorId: string }) => {
        const { noteId, collaboratorId } = payload;

        // Find the collaborator user by ID
        const usersQuery = query(collection(db, "users"), where("uid", "==", collaboratorId));
        const userSnapshot = await getDocs(usersQuery);

        if (userSnapshot.empty) {
            throw new Error("User not found with this ID");
        }

        // Update the note's memberIds
        const noteRef = getNoteDoc(noteId);
        const noteSnap = await getDoc(noteRef);
        if (!noteSnap.exists()) {
            throw new Error("Note not found");
        }
        const noteData = noteSnap.data() as FirestoreNote;
        const updatedMembers = (noteData.memberIds || []).filter(id => id !== collaboratorId);
        await updateDoc(noteRef, { memberIds: updatedMembers });
        const metaRef = getUserNoteMetaDoc(collaboratorId, noteId);
        await deleteDoc(metaRef);
        return { id: noteId, memberIds: updatedMembers };
    }
);

const slice = createSlice({
    name: "notes",
    initialState,
    reducers: {
        setNotes(state, action: PayloadAction<Note[]>) {
            state.notes = action.payload;
            state.loaded = true;
        },
        setSearchQuery(state, action: PayloadAction<string>) {
            state.searchQuery = action.payload;
        },
        reorderNotes(state, action: PayloadAction<{ notes: Note[] }>) {
            state.notes = action.payload.notes;
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
                state.loaded = true;
            })
            .addCase(fetchNotesFromFirestore.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addNoteToFirestore.pending, (state) => {
                state.loading = true;
            })
            .addCase(addNoteToFirestore.fulfilled, (state) => {
                // Note will be added by snapshot listener after batch write completes
                // This ensures both note and metadata are ready before adding to store
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
            })
            .addCase(addCollaboratorToNoteInFirestore.fulfilled, (state, action) => {
                state.notes = state.notes.map((note) =>
                    note.id === action.payload.id
                        ? { ...note, memberIds: action.payload.memberIds }
                        : note
                );
            })
            .addCase(removeCollaboratorFromNoteInFirestore.fulfilled, (state, action) => {
                state.notes = state.notes.map((note) =>
                    note.id === action.payload.id
                        ? { ...note, memberIds: action.payload.memberIds }
                        : note
                );
            });
    },
});

export const {
    setNotes,
    setSearchQuery,
    reorderNotes,
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
    addCollaboratorToNoteInFirestore,
    removeCollaboratorFromNoteInFirestore,
};

export default slice.reducer;
