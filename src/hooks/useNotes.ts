'use client';
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Note } from "@/types/note";
import { RootState, AppDispatch } from "@/lib/store";
import {
  setSearchQuery as setSearchQueryAction,
  setNotes,
  fetchNotesFromFirestore,
  addNoteToFirestore,
  updateNoteInFirestore,
  deleteNoteFromFirestore,
  permanentlyDeleteNoteFromFirestore,
  clearDeletedNotesFromFirestore,
  archiveNoteInFirestore,
  reorderNotesInFirestore,
  addLabelToNoteInFirestore,
  subscribeToUserNotes,
} from "@/lib/features/notesSlice";

export const useNotes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notes = useSelector((state: RootState) => state.notes.notes);
  const labels = useSelector((state: RootState) => state.labels.labels);
  const searchQuery = useSelector((state: RootState) => state.notes.searchQuery);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!user?.uid) {
      dispatch(setNotes([]));
      return;
    }

    dispatch(fetchNotesFromFirestore(user.uid));
    const unsubscribe = subscribeToUserNotes(user.uid, (notes) => {
      dispatch(setNotes(notes));
    });

    return () => unsubscribe();
  }, [user?.uid, dispatch]);

  const addNote = (title: string, content: string, options?: { color?: string; pinned?: boolean; archived?: boolean; labelIds?: string[] }) => {
    dispatch(addNoteToFirestore({
      userId: user?.uid || "",
      note: {
        title,
        content,
        color: options?.color || "default",
        pinned: options?.pinned || false,
        archived: options?.archived || false,
        deleted: false,
        labelIds: options?.labelIds || [],
        createdAt: new Date().toISOString(),
      },
    }));
  };

  const pinNote = (id: string) => {
    const target = notes.find((note) => note.id === id);
    if (!target) return;
    dispatch(updateNoteInFirestore({
      userId: user?.uid || "",
      noteId: id,
      updatedFields: { pinned: !target.pinned, archived: false },
    }));
  };

  const deleteNote = (id: string) => {
    dispatch(deleteNoteFromFirestore({ userId: user?.uid || "", noteId: id }));
  };

  const permanentDelete = (id: string) => {
    dispatch(permanentlyDeleteNoteFromFirestore({ userId: user?.uid || "", noteId: id }));
  };

  const clearDeletedNotes = () => {
    dispatch(clearDeletedNotesFromFirestore(user?.uid || ""));
  };

  const restoreNote = (id: string) => {
    dispatch(
      updateNoteInFirestore({
        userId: user?.uid || "",
        noteId: id,
        updatedFields: { deleted: false, archived: false },
      })
    );
  };

  const archiveNote = (id: string) => {
    dispatch(archiveNoteInFirestore({ userId: user?.uid || "", noteId: id }));
  };

  const changeColor = (id: string, color: string) => {
    dispatch(updateNoteInFirestore({ userId: user?.uid || "", noteId: id, updatedFields: { color } }));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    dispatch(updateNoteInFirestore({ userId: user?.uid || "", noteId: id, updatedFields: updates }));
  };

  const reorderNotes = (fromId: string, toId: string) => {
    const fromIndex = notes.findIndex((n) => n.id === fromId);
    const toIndex = notes.findIndex((n) => n.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const nextNotes = [...notes];
    const [moved] = nextNotes.splice(fromIndex, 1);
    nextNotes.splice(toIndex, 0, moved);
    dispatch(reorderNotesInFirestore({ userId: user?.uid || "", orderedNotes: nextNotes }));
  };

  const addLabel = (noteId: string, labelId: string) => {
    dispatch(addLabelToNoteInFirestore({ userId: user?.uid || "", noteId, labelId }));
  };

  const removeLabel = (noteId: string, labelId: string) => {
    const note = notes.find((n) => n.id === noteId);
    const labelIds = note?.labelIds?.filter((id) => id !== labelId) || [];
    dispatch(updateNoteInFirestore({ userId: user?.uid || "", noteId, updatedFields: { labelIds } }));
  };

  const setSearchQuery = (query: string) => {
    dispatch(setSearchQueryAction(query));
  };

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;

    const labelMap = new Map(labels.map((l) => [l.id, l]));

    return notes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(query);
      const contentMatch = note.content?.toLowerCase().includes(query);
      const labelMatch = note.labelIds?.some((labelId) =>
        labelMap.get(labelId)?.name.toLowerCase().includes(query)
      );
      return Boolean(titleMatch || contentMatch || labelMatch);
    });
  }, [notes, searchQuery, labels]);

  const activeNotes = filteredNotes.filter((n) => !n.archived && !n.deleted);
  const archivedNotes = filteredNotes.filter((n) => n.archived && !n.deleted);
  const deletedNotes = filteredNotes.filter((n) => n.deleted);

  const getDeletedNotes = () => notes.filter((n) => n.deleted);

  return {
    notes,
    filteredNotes,
    activeNotes,
    archivedNotes,
    deletedNotes,
    searchQuery,
    setSearchQuery,
    getDeletedNotes,
    addNote,
    pinNote,
    deleteNote,
    permanentDelete,
    clearDeletedNotes,
    addLabel,
    removeLabel,
    restoreNote,
    archiveNote,
    changeColor,
    updateNote,
    reorderNotes,
  };
};
