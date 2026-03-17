'use client'
import { useEffect, useMemo, useState } from "react";
import { Note } from "@/../src/types/note";
import { useLabels } from "./useLabel";

const LocalStorageKey = "keep-notes";

export const loadNotes = (): Note[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(LocalStorageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading notes from localStorage:", error);
  }
  return [];
};

export const saveNotes = (notes: Note[]) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LocalStorageKey, JSON.stringify(notes));
    window.dispatchEvent(new Event("notesUpdated"))
  } catch (error) {
    console.error("Error saving notes:", error);
  }
};

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const { labels } = useLabels();
  const [searchQuery, setSearchQuery] = useState("");
  const updateNotes = (updated: Note[]) => {
    setNotes(updated);
    saveNotes(updated);
    window.dispatchEvent(new Event("notesUpdated"));
  };
  useEffect(() => {
    setNotes(loadNotes());
    //eslint-disable-next-line react-hooks/exhaustive-deps
    const syncNotes = () => {
      setNotes(loadNotes());
    };
    window.addEventListener("notesUpdated", syncNotes);

    return () => {
      window.removeEventListener("notesUpdated", syncNotes);
    };
  }, []);
  const getDeletedNotes = () => notes.filter((n) => n.deleted);


  const addNote = (title: string, content: string, options?: { color?: string; pinned?: boolean; archived?: boolean; labelIds?: string[] }) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      color: options?.color || "default",
      pinned: options?.pinned || false,
      archived: options?.archived || false,
      labelIds: options?.labelIds || [],
    };
    updateNotes([newNote, ...notes])
  };

  const pinNote = (id: string) => {
    updateNotes(notes.map((n) => (n.id === id ? {
      ...n,
      pinned: !n.pinned,
      archived: false,
    }
      : n)))
  };

  const deleteNote = (id: string) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, deleted: true } : n)))
  };

  const permanentDelete = (id: string) => {
    updateNotes(notes.filter((n) => n.id !== id));
  };
  const clearDeletedNotes = () => {
    updateNotes(notes.filter((n) => !n.deleted));
  }
  const restoreNote = (id: string) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, deleted: false, archived: false } : n)));
  };

  const archiveNote = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, archived: !n.archived, pinned: false } : n
    );
    updateNotes(updated);
  }
  const addLabel = (noteId: string, labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    if (!label) return;
    updateNotes(notes.map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          labelIds: [...(n.labelIds || []), labelId]
        };
      }
      return n;
    }));
  };
  const removeLabel = (id: string, labelId: string) => {
    updateNotes(notes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          labelIds: n.labelIds?.filter(id => id !== labelId)
        };
      }
      return n;
    }));
  };
  const changeColor = (id: string, color: string) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, color } : n)));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
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

  const reorderNotes = (fromId: string, toId: string) => {
    setNotes((prev) => {
      const oldIndex = prev.findIndex((n) => n.id === fromId);
      const newIndex = prev.findIndex((n) => n.id === toId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  };

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
    reorderNotes
  };
};
