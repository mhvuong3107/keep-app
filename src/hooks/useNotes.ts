'use client'
import { useEffect, useState } from "react";
import { Note } from "@/../src/types/note";

const LocalStorageKey = "keep-notes";

const loadNotes = (): Note[] => {
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

const saveNotes = (notes: Note[]) => {
  try {
    localStorage.setItem(LocalStorageKey, JSON.stringify(notes));
  } catch (error) {
    console.error("Error saving notes to localStorage:", error);
  }
};

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const updateNotes = (updated: Note[]) => {
  setNotes(updated);
  saveNotes(updated);
};
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotes(loadNotes)
    }, 0);
    return () => clearTimeout(timer);
  },[])
  const getDeletedNotes = () => notes.filter((n) => n.deleted);

  const addNote = (title: string, content: string, options?: { color?: string; pinned?: boolean; archived?: boolean }) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      color: options?.color || "default",
      pinned: options?.pinned || false,
      archived: options?.archived || false,
    };
   updateNotes([newNote, ...notes])
  };

  const pinNote = (id: string) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)))
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
};

  const changeColor = (id: string, color: string) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, color } : n)));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const activeNotes = notes.filter((n) => !n.archived && !n.deleted);
  const archivedNotes = notes.filter((n) => n.archived && !n.deleted);
  const deletedNotes = notes.filter((n) => n.deleted);

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
    activeNotes,
    archivedNotes,
    deletedNotes,
    getDeletedNotes,
    addNote,
    pinNote,
    deleteNote,
    permanentDelete,
    clearDeletedNotes,
    restoreNote,
    archiveNote,
    changeColor,
    updateNote,
    reorderNotes
  };
};
