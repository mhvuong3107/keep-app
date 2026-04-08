'use client';
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Y from "yjs";
import { Note } from "@/types/note";
import { RootState, AppDispatch } from "@/lib/store";

function parseInlineHTML(html: string): Array<{ text: string; marks: Record<string, boolean> }> {
  const segments: Array<{ text: string; marks: Record<string, boolean> }> = [];

  const tokens = html.split(/(<[^>]+>)/);

  const currentMarks: Record<string, boolean> = {};

  for (const token of tokens) {
    if (!token) continue;

    if (token.match(/^<\//)) {
      // Closing tag
      const tagName = token.replace(/^<\/(\w+)>$/, "$1").toLowerCase();
      if (tagName === "strong" || tagName === "b") currentMarks.bold = false;
      if (tagName === "em" || tagName === "i") currentMarks.italic = false;
      if (tagName === "u") currentMarks.underline = false;
      if (tagName === "s" || tagName === "strike") currentMarks.strike = false;
    } else if (token.match(/^</)) {
      // Opening tag
      const tagName = token.replace(/^<(\w+)[^>]*>$/, "$1").toLowerCase();
      if (tagName === "strong" || tagName === "b") currentMarks.bold = true;
      if (tagName === "em" || tagName === "i") currentMarks.italic = true;
      if (tagName === "u") currentMarks.underline = true;
      if (tagName === "s" || tagName === "strike") currentMarks.strike = true;
    } else {
      // Text node
      const text = token.trim();
      if (text) {
        segments.push({ text, marks: { ...currentMarks } });
      }
    }
  }

  return segments;
}

function seedYjsWithHTML(doc: Y.Doc, html: string) {
  const fragment = doc.getXmlFragment("default");

  // Simple HTML parser: split by block tags to create paragraphs/headings
  const blockElements = html.split(/(<h1>|<\/h1>|<h2>|<\/h2>|<p>|<\/p>)/i).filter(Boolean);

  for (let i = 0; i < blockElements.length; i++) {
    const part = blockElements[i];

    if (part.match(/^<h1>$/i)) {
      const element = new Y.XmlElement("heading");
      element.setAttribute("level", "1");
      const text = new Y.XmlText();
      insertFormattedText(text, blockElements[i + 1] || "");
      element.insert(0, [text]);
      fragment.push([element]);
      i++; // Skip the text part
    } else if (part.match(/^<h2>$/i)) {
      const element = new Y.XmlElement("heading");
      element.setAttribute("level", "2");
      const text = new Y.XmlText();
      insertFormattedText(text, blockElements[i + 1] || "");
      element.insert(0, [text]);
      fragment.push([element]);
      i++;
    } else if (part.match(/^<p>$/i)) {
      const element = new Y.XmlElement("paragraph");
      const text = new Y.XmlText();
      insertFormattedText(text, blockElements[i + 1] || "");
      element.insert(0, [text]);
      fragment.push([element]);
      i++;
    }
  }
}

// Insert text with inline formatting into Y.XmlText
function insertFormattedText(yText: Y.XmlText, html: string) {
  const segments = parseInlineHTML(html);

  if (segments.length === 0) return;

  let offset = 0;
  segments.forEach(({ text, marks }) => {
    yText.insert(offset, text);

    // Apply formatting marks to this text segment
    if (marks.bold) {
      yText.format(offset, text.length, { bold: true });
    }
    if (marks.italic) {
      yText.format(offset, text.length, { italic: true });
    }
    if (marks.underline) {
      yText.format(offset, text.length, { underline: true });
    }
    if (marks.strike) {
      yText.format(offset, text.length, { strike: true });
    }

    offset += text.length;
  });
}
import {
  setSearchQuery as setSearchQueryAction,
  setNotes,
  reorderNotes as reorderNotesAction,
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
  subscribeToUserNotes,
} from "@/lib/features/notesSlice";

export const useNotes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notes = useSelector((state: RootState) => state.notes.notes);
  const loaded = useSelector((state: RootState) => state.notes.loaded);
  const labels = useSelector((state: RootState) => state.labels.labels);
  const searchQuery = useSelector((state: RootState) => state.notes.searchQuery);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!user?.uid) {
      dispatch(setNotes([]));
      return;
    }

    // subscribeToUserNotes will handle both initial fetch and real-time updates
    const unsubscribe = subscribeToUserNotes(user.uid, user.email || "", (notes) => {
      dispatch(setNotes(notes));
    });

    return () => unsubscribe();
  }, [user?.uid, user?.email, dispatch]);

  const addNote = (title: string, content: string, options?: { color?: string; pinned?: boolean; archived?: boolean; labelIds?: string[]; memberIds?: string[] }) => {
    const doc = new Y.Doc();

    // Seed title vào Y.Text "title"
    const plainTitle = title.trim();
    if (plainTitle) {
      doc.getText("title").insert(0, plainTitle);
    }

    // Seed content — detect checklist hoặc text thường
    const plainContent = content.replace(/<[^>]*>/g, "").trim();
    const lines = plainContent.split("\n");
    const isChecklistContent = lines.some(l => l.startsWith("\u2610 ") || l.startsWith("\u2611 "));

    if (isChecklistContent) {
      // Lưu checklist vào Y.Array "checklist" — đúng key useNoteEditor dùng
      const yChecklist = doc.getArray("checklist");
      const items = lines.filter(l => l.trim()).map(l => {
        const m = new Y.Map();
        m.set("id", crypto.randomUUID());
        m.set("text", l.startsWith("\u2611 ") || l.startsWith("\u2610 ") ? l.slice(2) : l);
        m.set("checked", l.startsWith("\u2611 "));
        return m;
      });
      yChecklist.push(items);
    } else if (plainContent) {
      // Seed Yjs với HTML STRUCTURE
      seedYjsWithHTML(doc, content);
    }

    const ydocBytes = Y.encodeStateAsUpdate(doc);
    const ydocNumbers = Array.from(ydocBytes);

    // Save HTML content preview if available
    // Extract first 100 chars of HTML, preserving formatting tags
    const preview = isChecklistContent
      ? plainContent.substring(0, 100)
      : (content && content !== "<p></p>" ? content.substring(0, 200) : plainContent.substring(0, 100));

    // Calculate order for new note to appear at top
    // Get the minimum order from existing non-pinned notes
    const nonPinnedNotes = notes.filter((n) => !n.pinned && !n.archived && !n.deleted);
    const minOrder = nonPinnedNotes.length > 0
      ? Math.min(...nonPinnedNotes.map((n) => n.order ?? Infinity))
      : 0;
    const newOrder = minOrder === Infinity ? 0 : minOrder - 1;

    dispatch(addNoteToFirestore({
      userId: user?.uid || "",
      note: {
        title,
        contentPreview: preview,
        color: options?.color || "default",
        pinned: options?.pinned || false,
        archived: options?.archived || false,
        deleted: false,
        labelIds: options?.labelIds || [],
        ownerId: user?.uid || "",
        memberIds: options?.memberIds || [],
        ydoc: ydocNumbers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: newOrder,
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

    // Optimistic update: update state immediately for instant UI feedback
    dispatch(reorderNotesAction({ notes: nextNotes }));

    // Then sync with Firestore in the background
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

  const addCollaborator = (noteId: string, collaboratorId: string) => {
    if (!collaboratorId.trim()) return;
    dispatch(addCollaboratorToNoteInFirestore({ userId: user?.uid || "", noteId, collaboratorId }));
  };

  const removeCollaborator = (noteId: string, collaboratorId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    dispatch(removeCollaboratorFromNoteInFirestore({ userId: user?.uid || "", noteId, collaboratorId: collaboratorId }));
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
      const contentMatch = note.contentPreview?.toLowerCase().includes(query);
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
    loaded,
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
    addCollaborator,
    removeCollaborator,
    restoreNote,
    archiveNote,
    changeColor,
    updateNote,
    reorderNotes,
  };
};
