'use client'
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableNoteCard from "@/components/keep/SortableNoteCard";
import NoteCard from "@/components/keep/NoteCard";
import NoteInput from "@/components/keep/NoteInput";
import MasonryGrid from "@/components/keep/MasonryGrid";
import { Note } from "@/types/note";
import NoteEditDialog from "@/components/keep/NoteEditDialog";
import { useNotes } from "@/hooks/useNotes";

const Home = () => {
  const { activeNotes, addNote, pinNote, deleteNote, archiveNote, changeColor, updateNote, reorderNotes } = useNotes();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const pinnedNotes = activeNotes.filter((n) => n.pinned);
  const otherNotes = activeNotes.filter((n) => !n.pinned);

  const currentEditNote = editingNote ? activeNotes.find(n => n.id === editingNote.id) || editingNote : null;
  const draggingNote = activeId ? activeNotes.find(n => n.id === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      reorderNotes(active.id as string, over.id as string);
    }
  };

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {pinnedNotes.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Đã ghim
            </p>
            <SortableContext items={pinnedNotes.map(n => n.id)} strategy={rectSortingStrategy}>
              <MasonryGrid>
                {pinnedNotes.map(renderNoteCard)}
              </MasonryGrid>
            </SortableContext>
          </>
        )}

        {otherNotes.length > 0 && pinnedNotes.length > 0 && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-6 px-2">
            Khác
          </p>
        )}
        <SortableContext items={otherNotes.map(n => n.id)} strategy={rectSortingStrategy}>
          <MasonryGrid>
            {otherNotes.map(renderNoteCard)}
          </MasonryGrid>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {draggingNote ? (
            <div className="w-[240px] rotate-1 opacity-90 drop-shadow-xl">
              <NoteCard
                note={draggingNote}
                onPin={() => { }}
                onDelete={() => { }}
                onColorChange={() => { }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
    </>
  );
};

export default Home;