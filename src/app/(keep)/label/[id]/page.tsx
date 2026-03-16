"use client";
import { Note } from "@/types/note";
import { useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import NoteCard from "@/components/keep/NoteCard";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import NoteInput from "@/components/keep/NoteInput";
import { useParams } from "next/navigation";
import { useLabels } from "@/hooks/useLabel";
import { ArchiveIcon, StickyNote } from "lucide-react";

export default function LabelPage() {
    const params = useParams();
    const labelId = params?.id as string;
    const { labels } = useLabels();
    const label = labels.find((l) => l.id === labelId) || labels.find((l) => l.name === labelId);

    const {
        notes,
        addNote,
        pinNote,
        deleteNote,
        archiveNote,
        restoreNote,
        changeColor,
        updateNote,
        permanentDelete,
    } = useNotes();

    const resolvedLabelId = label?.id;
    const labeledNotes = resolvedLabelId
        ? notes.filter((n) => n.labelIds?.includes(resolvedLabelId))
        : [];
    const activeLabeledNotes = labeledNotes.filter((n) => !n.archived && !n.deleted);
    const pinnedLabeledNotes = activeLabeledNotes.filter((n) => n.pinned);
    const otherLabeledNotes = activeLabeledNotes.filter((n) => !n.pinned);
    const archivedLabeledNotes = labeledNotes.filter((n) => n.archived && !n.deleted);

    const [currentEditNote, setEditingNote] = useState<Note | null>(null);
    const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);

    const currentEditNoteWithLatest =
        currentEditNote
            ?
            (notes.find((n) => n.id === currentEditNote.id) || currentEditNote)
            :
            null;

    const handleNoteClick = (note: Note, rect: DOMRect) => {
        setSourceRect(rect);
        setEditingNote(note);
    };

    if (!label) {
        return (
            <div className="mt-10 flex flex-col text-lg items-center justify-center flex-1 text-muted-foreground">
                <ArchiveIcon className="opacity-50 w-30 h-30 mb-4" />
                <p>Nhãn không tồn tại.</p>
            </div>
        );
    }

    const hasAnyNotes = activeLabeledNotes.length > 0 || archivedLabeledNotes.length > 0;

    return (
        <div className="space-y-6">
            <NoteInput onAddNote={addNote} labelIds={resolvedLabelId ? [resolvedLabelId] : []} />

            {!hasAnyNotes && (
                <div className="mt-10 flex flex-col text-lg items-center justify-center flex-1 text-muted-foreground">
                    <StickyNote className="opacity-50 w-30 h-30 mb-4" />
                    <p>Chưa có ghi chú trong nhãn này.</p>
                </div>
            )}

            {pinnedLabeledNotes.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
                        Đã ghim
                    </p>
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                        {pinnedLabeledNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onClick={(rect) => handleNoteClick(note, rect)}
                                onPin={pinNote}
                                onDelete={deleteNote}
                                onColorChange={changeColor}
                                onArchive={archiveNote}
                            />
                        ))}
                    </div>
                </div>
            )}

            {otherLabeledNotes.length > 0 && (
               <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
                    Khác
                </p>
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                    {otherLabeledNotes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onClick={(rect) => handleNoteClick(note, rect)}
                            onPin={pinNote}
                            onDelete={deleteNote}
                            onColorChange={changeColor}
                            onArchive={archiveNote}
                        />
                    ))}
                </div>
               </div>
            )}

            {archivedLabeledNotes.length > 0 && (
                <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
                        Lưu trữ
                    </p>
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                        {archivedLabeledNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onClick={(rect) => handleNoteClick(note, rect)}
                                onPin={pinNote}
                                onDelete={deleteNote}
                                onColorChange={changeColor}
                                onArchive={archiveNote}
                                onRestore={restoreNote}
                            />
                        ))}
                    </div>
                </>
            )}

            {currentEditNoteWithLatest && (
                <NoteEditDialog
                    note={currentEditNoteWithLatest}
                    open={!!currentEditNoteWithLatest}
                    onClose={() => {
                        setEditingNote(null);
                        setSourceRect(null);
                    }}
                    onUpdate={updateNote}
                    onDelete={(id) => {
                        deleteNote(id);
                        setEditingNote(null);
                    }}
                    onArchive={(id) => {
                        archiveNote(id);
                        setEditingNote(null);
                    }}
                    onPin={pinNote}
                    onColorChange={changeColor}
                    sourceRect={sourceRect}
                    onRestore={(id) => {
                        restoreNote(id);
                        setEditingNote(null);
                    }}
                    onPermanentDelete={(id) => {
                        permanentDelete(id);
                        setEditingNote(null);
                    }}
                />
            )}
        </div>
    );
}
