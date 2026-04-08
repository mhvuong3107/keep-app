'use client'
import { useState, useCallback, useEffect, useRef } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { useToasts } from "@/components/ToastProvider";
import { NotesSkeleton } from "@/components/keep/NotesSkeleton";
import { StickyNote } from "lucide-react";

const Home = () => {
  const { loaded, activeNotes, addNote, pinNote, deleteNote, archiveNote, changeColor, updateNote, reorderNotes, addCollaborator, removeCollaborator } = useNotes();
  const { user } = useAuth();
  const { addToast } = useToasts();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pendingRemovalToastRef = useRef<{
    noteId: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      reorderNotes(active.id as string, over.id as string);
    }
  }, [reorderNotes]);

  useEffect(() => {
    const pendingRemovalToast = pendingRemovalToastRef.current;
    if (!pendingRemovalToast) return;

    const noteStillVisible = activeNotes.some((note) => note.id === pendingRemovalToast.noteId);
    if (!noteStillVisible) {
      addToast({
        title: pendingRemovalToast.title,
        description: pendingRemovalToast.description,
        variant: pendingRemovalToast.variant,
      });
      pendingRemovalToastRef.current = null;
    }
  }, [activeNotes, addToast]);

  const handleNoteClick = useCallback((note: Note, rect: DOMRect) => {
    setSourceRect(rect);
    setEditingNote(note);
  }, []);

  const handlePin = useCallback((id: string) => {
    const note = activeNotes.find(n => n.id === id);
    pinNote(id);
    addToast({
      title: note?.pinned ? "Bỏ ghim ghi chú" : "Ghim ghi chú",
      variant: "default",
    });
  }, [pinNote, activeNotes, addToast]);

  const handleDelete = useCallback((id: string) => {
    deleteNote(id);
    pendingRemovalToastRef.current = {
      noteId: id,
      title: "Đã xoá ghi chú",
      description: "Ghi chú đã được di chuyển đến thùng rác.",
      variant: "default",
    };
  }, [deleteNote]);

  const handleColorChange = useCallback((id: string, color: string) => changeColor(id, color), [changeColor]);

  const handleArchive = useCallback((id: string) => {
    const note = activeNotes.find(n => n.id === id);
    archiveNote(id);
    addToast({
      title: note?.archived ? "Bỏ lưu trữ ghi chú" : "Lưu trữ ghi chú",
      variant: "default",
    });
  }, [archiveNote, activeNotes, addToast]);

  const handleAddCollaborator = useCallback((id: string, email: string) => addCollaborator(id, email), [addCollaborator]);
  const handleRemoveCollaborator = useCallback((id: string, collaboratorId: string) => {
    const isSelfLeave = collaboratorId && user?.uid === collaboratorId;
    removeCollaborator(id, collaboratorId);

    if (isSelfLeave) {
      pendingRemovalToastRef.current = {
        noteId: id,
        title: "Đã huỷ cộng tác",
        description: "Ghi chú này sẽ không còn xuất hiện với bạn.",
        variant: "default",
      };
    } else {
      addToast({
        title: "Xoá cộng tác viên thành công",
        description: "Người dùng đã được xoá khỏi ghi chú.",
        variant: "default",
      });
    }
  }, [removeCollaborator, user?.uid, addToast]);

  const renderNoteCard = useCallback((note: Note) => (
    <SortableNoteCard
      key={note.id}
      note={note}
      onPin={handlePin}
      onDelete={handleDelete}
      onColorChange={handleColorChange}
      onArchive={handleArchive}
      onUpdate={updateNote}
      onClick={(rect) => handleNoteClick(note, rect)}
      onCollaboratorsAdd={handleAddCollaborator}
      onCollaboratorsRemove={handleRemoveCollaborator}
      onLeaveNote={(id) => handleRemoveCollaborator(id, user?.uid || "")}
      hidden={editingNote?.id === note.id}
    />
  ), [handlePin, handleDelete, handleColorChange, handleArchive, handleNoteClick, handleAddCollaborator, handleRemoveCollaborator, updateNote, editingNote?.id, user?.uid]);

  if (!loaded) {
    return <NotesSkeleton />;
  }

  const pinnedNotes = activeNotes.filter((n) => n.pinned);
  const otherNotes = activeNotes.filter((n) => !n.pinned);

  const currentEditNote = editingNote ? activeNotes.find(n => n.id === editingNote.id) || editingNote : null;
  const draggingNote = activeId ? activeNotes.find(n => n.id === activeId) : null;
  if (pinnedNotes.length === 0 && otherNotes.length === 0) {
    return (
      <>
        <NoteInput onAddNote={addNote} />
        <div className="mt-10 flex flex-col text-lg items-center justify-center flex-1 text-muted-foreground">
          <StickyNote className="opacity-50 w-30 h-30 mb-4" />
          <p>Bạn chưa có ghi chú nào</p>
        </div>
      </>
    );
  }
  return (
    <>
      <NoteInput onAddNote={addNote} />
      <div style={{ pointerEvents: editingNote ? 'none' : 'auto' }}>
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
              <div className="w-60 rotate-1 opacity-90 drop-shadow-xl">
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
      </div>

      {currentEditNote && (
        <NoteEditDialog
          key={currentEditNote.id}
          note={currentEditNote}
          open={!!currentEditNote}
          onClose={() => { setEditingNote(null); setSourceRect(null); }}
          onUpdate={updateNote}
          onDelete={(id) => {
            handleDelete(id);
            setEditingNote(null);
          }}
          onArchive={(id) => {
            archiveNote(id);
            setEditingNote(null);
            addToast({
              title: "Lưu trữ ghi chú",
              variant: "default",
            });
          }}
          onPin={(id) => {
            const note = activeNotes.find(n => n.id === id);
            pinNote(id);
            addToast({
              title: note?.pinned ? "Gỡ ghim ghi chú" : "Ghim ghi chú",
              variant: "default",
            });
          }}
          onColorChange={changeColor}
          sourceRect={sourceRect}
          onRestore={() => { }}
          onPermanentDelete={() => { }}
          onLeaveNote={(id) => handleRemoveCollaborator(id, user?.uid || "")}
        />
      )}
    </>
  );
};

export default Home;
