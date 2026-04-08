"use client";
import { Note } from "@/types/note";
import { useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import NoteCard from "@/components/keep/NoteCard";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import { Trash2 } from "lucide-react";
import { useToasts } from "@/components/ToastProvider";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotesSkeleton } from "@/components/keep/NotesSkeleton";

export default function Trash() {
    const { loaded, restoreNote, permanentDelete, deletedNotes, clearDeletedNotes, updateNote } = useNotes();
    const { addToast } = useToasts();

    const [viewingNote, setViewingNote] = useState<Note | null>(null);
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);


    const handleNoteClick = (note: Note, rect: DOMRect) => {
        setSourceRect(rect);
        setViewingNote(note);
    };

    if (!loaded) {
        return <NotesSkeleton />;
    }

    return (
        <div className="p-4 min-h-screen">
            <div className=" flex justify-center italic text-lg text-muted-foreground mb-6">
                Ghi chú sẽ bị xóa sau 7 ngày. {deletedNotes.length > 0 && (
                    <button
                        onClick={() => setShowClearDialog(true)}
                        className="text-keep-primary hover:underline cursor-pointer"
                    >
                        Dọn sạch thùng rác?
                    </button>
                )}
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
                                    addToast({
                                        title: "Đã khôi phục ghi chú",
                                        variant: "default",
                                    });
                                }}
                                onPermanentDelete={() => {
                                    permanentDelete(note.id);
                                    addToast({
                                        title: "Đã xoá vĩnh viễn ghi chú",
                                        description: "Ghi chú không thể khôi phục.",
                                        variant: "destructive",
                                    });
                                }}
                                onUpdate={updateNote}
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
                        addToast({
                            title: "Đã xoá vĩnh viễn ghi chú",
                            description: "Ghi chú không thể khôi phục.",
                            variant: "destructive",
                        });
                    }}
                    onArchive={() => { }}
                    onPin={() => { }}
                    onColorChange={() => { }}
                    sourceRect={sourceRect}
                    onRestore={() => {
                        setViewingNote(null)
                        restoreNote(viewingNote.id);
                        addToast({
                            title: "Đã khôi phục ghi chú",
                            variant: "default",
                        });
                    }}
                    onPermanentDelete={() => {
                        permanentDelete(viewingNote.id);
                        setViewingNote(null)
                        addToast({
                            title: "Đã xoá vĩnh viễn ghi chú",
                            description: "Ghi chú không thể khôi phục.",
                            variant: "destructive",
                        });
                    }}
                />
            )}

            {/* Clear trash dialog */}
            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Dọn sạch thùng rác?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tất cả ghi chú trong thùng rác sẽ được xoá vĩnh viễn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-2">
                        <AlertDialogCancel className="hover:bg-secondary">
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowClearDialog(false);
                                clearDeletedNotes();
                                addToast({
                                    title: "Đã dọn sạch thùng rác",
                                    description: "Tất cả ghi chú đã được xoá vĩnh viễn.",
                                    variant: "destructive",
                                });
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Dọn sạch
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
