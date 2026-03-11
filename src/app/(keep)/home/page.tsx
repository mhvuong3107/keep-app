'use client'
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableNoteCard from "@/components/keep/SortableNoteCard";
import NoteInput from "@/components/keep/NoteInput";
import { Note } from "@/types/note";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import { useNotesContext } from "@/context/NotesContext";

const Index = () => {
  const { activeNotes, addNote, pinNote, deleteNote, archiveNote, changeColor, updateNote, reorderNotes } = useNotesContext();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);

  const pinnedNotes = activeNotes.filter((n) => n.pinned);
  const otherNotes = activeNotes.filter((n) => !n.pinned);

  const currentEditNote = editingNote ? activeNotes.find(n => n.id === editingNote.id) || editingNote : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderNotes(active.id as string, over.id as string);
    }
  }
  const handleNoteClick = (note: Note, rect: DOMRect) => {
    setSourceRect(rect);
    setEditingNote(note);
  };

  const renderNoteCard = (note: Note) => (
    <SortableNoteCard
      key={note.id}
      note={note}
      onPin={pinNote}
      onDelete={deleteNote}
      onColorChange={changeColor}
      onArchive={archiveNote}
      onClick={(rect) => handleNoteClick(note, rect)}
      hidden={editingNote?.id === note.id}
    />
  );

  return (
    <>
      <NoteInput onAddNote={addNote} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {pinnedNotes.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Đã ghim
            </p>
            <SortableContext items={pinnedNotes.map(n => n.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {pinnedNotes.map(renderNoteCard)}
              </div>
            </SortableContext>
          </>
        )}

        {otherNotes.length > 0 && pinnedNotes.length > 0 && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Khác
          </p>
        )}
        <SortableContext items={otherNotes.map(n => n.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
            {otherNotes.map(renderNoteCard)}
          </div>
        </SortableContext>
      </DndContext>

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
    </>
  );
};

export default Index;

