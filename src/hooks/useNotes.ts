'use client';
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Note } from "@/types/note";
import { RootState, AppDispatch } from "@/lib/store";
import {
  addNote as addNoteAction,
  pinNote as pinNoteAction,
  deleteNote as deleteNoteAction,
  permanentDelete as permanentDeleteAction,
  clearDeletedNotes as clearDeletedNotesAction,
  restoreNote as restoreNoteAction,
  archiveNote as archiveNoteAction,
  changeColor as changeColorAction,
  updateNote as updateNoteAction,
  reorderNotes as reorderNotesAction,
  addLabelToNote,
  removeLabelFromNote,
  setSearchQuery as setSearchQueryAction,
} from "@/lib/features/notesSlice";

export const useNotes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notes = useSelector((state: RootState) => state.notes.notes);
  const labels = useSelector((state: RootState) => state.labels.labels);
  const searchQuery = useSelector((state: RootState) => state.notes.searchQuery);

  const addNote = (title: string, content: string, options?: { color?: string; pinned?: boolean; archived?: boolean; labelIds?: string[] }) => {
    dispatch(addNoteAction({ title, content, options }));
  };

  const pinNote = (id: string) => {
    dispatch(pinNoteAction(id));
  };

  const deleteNote = (id: string) => {
    dispatch(deleteNoteAction(id));
  };

  const permanentDelete = (id: string) => {
    dispatch(permanentDeleteAction(id));
  };

  const clearDeletedNotes = () => {
    dispatch(clearDeletedNotesAction());
  };

  const restoreNote = (id: string) => {
    dispatch(restoreNoteAction(id));
  };

  const archiveNote = (id: string) => {
    dispatch(archiveNoteAction(id));
  };

  const changeColor = (id: string, color: string) => {
    dispatch(changeColorAction({ id, color }));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    dispatch(updateNoteAction({ id, updates }));
  };

  const reorderNotes = (fromId: string, toId: string) => {
    dispatch(reorderNotesAction({ fromId, toId }));
  };

  const addLabel = (noteId: string, labelId: string) => {
    dispatch(addLabelToNote({ noteId, labelId }));
  };

  const removeLabel = (noteId: string, labelId: string) => {
    dispatch(removeLabelFromNote({ noteId, labelId }));
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
