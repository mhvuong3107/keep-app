"use client";
import { Note } from "@/types/note";
import { useState } from "react";
import { useNotesContext } from "@/context/NotesContext";
import NoteCard from "@/components/keep/NoteCard";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import { Trash2 } from "lucide-react";

export default function Trash() {
    const { restoreNote, permanentDelete, deletedNotes, clearDeletedNotes } = useNotesContext();

    const [viewingNote, setViewingNote] = useState<Note | null>(null);
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);

    const handleNoteClick = (note: Note, rect: DOMRect) => {
        setSourceRect(rect);
        setViewingNote(note);
    };

    return (
        <div className="p-4 min-h-screen">
            <div className=" flex justify-center italic text-lg text-muted-foreground mb-6">
                Ghi chú sẽ bị xóa sau 7 ngày. <button className="text-keep-primary hover:underline cursor-pointer" onClick={() => {
                    clearDeletedNotes();
                }}><p>Dọn sạch thùng rác?</p></button>
            </div>
            {deletedNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                    <Trash2 className="mx-auto mb-4 opacity-50 h-16 w-16" />
                    <p>Không có ghi chú nào trong thùng rác.</p>
                </div>
            ) : (
                <div className="keep-masonry">
                        {deletedNotes.map((note) => (
                            <div key={note.id} className="keep-masonry-item">
                                 <NoteCard
                                key={note.id}
                                note={note}
                                onPin={() => { }}
                                onDelete={() => { }}
                                onColorChange={() => { }}
                                onArchive={() => { }}
                                onRestore={() => {
                                    restoreNote(note.id);

                                }}
                                onPermanentDelete={() => {
                                    permanentDelete(note.id);

                                }}
                                onClick={(rect) => handleNoteClick(note, rect)}
                                hidden={viewingNote?.id === note.id}
                            />
                            </div>                
                        ))}
                </div>
            )}
            {viewingNote && (
                <NoteEditDialog
                    note={viewingNote}
                    open={!!viewingNote}
                    onClose={() => setViewingNote(null)}
                    onUpdate={() => { }}
                    onDelete={() => {
                        permanentDelete(viewingNote.id);
                        setViewingNote(null);
                    }}
                    onArchive={() => { }}
                    onPin={() => { }}
                    onColorChange={() => { }}
                    sourceRect={sourceRect}
                    onRestore={() => {
                        setViewingNote(null)
                        restoreNote(viewingNote.id);
                    }}
                    onPermanentDelete={() => {
                        permanentDelete(viewingNote.id);
                        setViewingNote(null)
                    }}
                />
            )}
        </div>
    );
}
