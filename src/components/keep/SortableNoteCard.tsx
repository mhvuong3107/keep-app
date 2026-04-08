import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import NoteCard from "./NoteCard";
import { Note } from "@/types/note";
import { memo, useState } from "react";

interface SortableNoteCardProps {
  note: Note;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onArchive?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Note>) => void;
  onClick?: (rect: DOMRect) => void;
  onCollaboratorsAdd?: (id: string, email: string) => void;
  onCollaboratorsRemove?: (id: string, email: string) => void;
  onLeaveNote?: (id: string) => void;
  hidden?: boolean;
  isDialogOpen?: boolean;
}

const SortableNoteCard = ({ note, isDialogOpen = false, ...props }: SortableNoteCardProps) => {
  const [isBlockingUI, setIsBlockingUI] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    // Disable dragging when any dialog is open in the card
    disabled: isBlockingUI || isDialogOpen
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    width: "100%",
    minWidth: 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NoteCard
        note={note}
        {...props}
        onBlockingStateChange={setIsBlockingUI}
      />
    </div>
  );
};

export default memo(SortableNoteCard);
