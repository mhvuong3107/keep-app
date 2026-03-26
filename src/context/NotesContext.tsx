'use client'

import { createContext, useContext, ReactNode } from "react";
import { useNotes } from "@/hooks/useNotes";

type NotesContextType = ReturnType<typeof useNotes>;

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const note = useNotes();
    return <NotesContext.Provider value={note}>{children}</NotesContext.Provider>;
};

export const useNotesContext = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotesContext must be used within a NotesProvider");
  }
  return context;
};