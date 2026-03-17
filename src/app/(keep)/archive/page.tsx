"use client";
import { Note } from "@/types/note";
import { useState } from "react";
import { useNotesContext } from "@/context/NotesContext";
import NoteCard from "@/components/keep/NoteCard";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import { ArchiveIcon } from "lucide-react";

export default function Archive() {
    const { archivedNotes, updateNote, deleteNote, archiveNote, pinNote, changeColor } = useNotesContext();
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);

    const currentEditNote = editingNote ? archivedNotes.find(n => n.id === editingNote.id) || editingNote : null;

    const handleNoteClick = (note: Note, rect: DOMRect) => {
        setSourceRect(rect);
        setEditingNote(note);
    };

    return (
        <div className="w-full">
            {archivedNotes.length === 0 ? (
                <div className="mt-10 flex flex-col text-lg items-center justify-center flex-1 text-muted-foreground">
                    <ArchiveIcon className="opacity-50 w-30 h-30 mb-4" />
                    <p>Không có ghi chú nào đã lưu trữ.</p>
                </div>
            ) : (
                <div className="keep-masonry">
                    {archivedNotes.map((note) => (
                        <div key={note.id} className="keep-masonry-item">
                            <NoteCard
                                note={note}
                                onClick={(rect) => handleNoteClick(note, rect)}
                                onPin={() => { pinNote(note.id); }}
                                onDelete={() => { }}
                                onColorChange={() => { }}
                                onArchive={() => { archiveNote(note.id); }}
                                onRestore={() => { }}
                                onPermanentDelete={() => { }}
                                hidden={currentEditNote?.id === note.id}
                            />
                        </div>
                    ))}
                </div>
            )}

            {currentEditNote && (
                <NoteEditDialog
                    key={currentEditNote.id}
                    note={currentEditNote}
                    open={!!currentEditNote}
                    onClose={() => { setEditingNote(null); setSourceRect(null); }}
                    onUpdate={updateNote}
                    onDelete={(id) => { deleteNote(id); setEditingNote(null); }}
                    onArchive={(id) => { archiveNote(id); setEditingNote(null); }}
                    onPin={pinNote}
                    onColorChange={changeColor}
                    sourceRect={sourceRect}
                    onRestore={() => { }}
                    onPermanentDelete={() => { }}
                />
            )}
        </div>
    );
}
