"use client";
import { Note } from "@/types/note";
import { useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import NoteCard from "@/components/keep/NoteCard";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import { ArchiveIcon } from "lucide-react";
export default function Archive() {
    const { archivedNotes,updateNote,deleteNote,archiveNote, pinNote,changeColor} = useNotes();
    const [currentEditNote, setEditingNote] = useState<Note | null>(null);
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
    const handleNoteClick = (note: Note, rect: DOMRect) => {
        setSourceRect(rect);
        setEditingNote(note);
    };
    return (
        <div className="space-y-6">
        {
            archivedNotes.length === 0 ? (
                <div className="mt-10 flex flex-col text-lg items-center justify-center flex-1 text-muted-foreground">
                    <ArchiveIcon className="opacity-50 w-30 h-30 mb-4" />
                    <p>Không có ghi chú nào đã lưu trữ.</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                    {archivedNotes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onClick={(rect) => handleNoteClick(note, rect)}
                            onPin={() => { pinNote(note.id); }}
                            onDelete={() => { }}
                            onColorChange={() => { }}
                            onArchive={() => { archiveNote(note.id); }}
                            onRestore={() => { }}
                            onPermanentDelete={() => { }}
                        />
                    ))}
                </div>
            )
        }
        {currentEditNote && (
            <NoteEditDialog
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
