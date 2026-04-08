"use client";
import { Note } from "@/types/note";
import { useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import NoteCard from "@/components/keep/NoteCard";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import { ArchiveIcon } from "lucide-react";
import { useToasts } from "@/components/ToastProvider";
import { NotesSkeleton } from "@/components/keep/NotesSkeleton";

export default function Archive() {
    const { loaded, archivedNotes, updateNote, deleteNote, archiveNote, pinNote, changeColor } = useNotes();
    const { addToast } = useToasts();
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);

    const currentEditNote = editingNote ? archivedNotes.find(n => n.id === editingNote.id) || editingNote : null;

    const handleNoteClick = (note: Note, rect: DOMRect) => {
        setSourceRect(rect);
        setEditingNote(note);
    };

    if (!loaded) {
        return <NotesSkeleton />;
    }

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
                                onPin={() => {
                                    pinNote(note.id);
                                    addToast({
                                        title: note.pinned ? "Gỡ ghim ghi chú" : "Ghim ghi chú",
                                        variant: "default",
                                    });
                                }}
                                onDelete={(id) => {
                                    deleteNote(id);
                                    setEditingNote(null);
                                    addToast({
                                        title: "Đã xoá ghi chú",
                                        description: "Ghi chú đã được di chuyển đến thùng rác.",
                                        variant: "default",
                                    });
                                }}
                                onColorChange={(id, color) => {changeColor(id, color); }}
                                onArchive={() => {
                                    archiveNote(note.id);
                                    addToast({
                                        title: "Bỏ lưu trữ ghi chú",
                                        variant: "default",
                                    });
                                }}
                                onUpdate={updateNote}
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
                    onDelete={(id) => {
                        deleteNote(id);
                        setEditingNote(null);
                        addToast({
                            title: "Đã xoá ghi chú",
                            description: "Ghi chú đã được di chuyển đến thùng rác.",
                            variant: "default",
                        });
                    }}
                    onArchive={(id) => {
                        archiveNote(id);
                        setEditingNote(null);
                        addToast({
                            title: "Bỏ lưu trữ ghi chú",
                            variant: "default",
                        });
                    }}
                    onPin={(id) => {
                        pinNote(id);
                        addToast({
                            title: currentEditNote.pinned ? "Gỡ ghim ghi chú" : "Ghim ghi chú",
                            variant: "default",
                        });
                    }}
                    onColorChange={changeColor}
                    sourceRect={sourceRect}
                    onRestore={() => { }}
                    onPermanentDelete={() => { }}
                />
            )}
        </div>
    );
}
