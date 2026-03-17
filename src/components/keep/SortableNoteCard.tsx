import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import NoteCard from "./NoteCard";
import { Note } from "@/types/note";

interface SortableNoteCardProps {
  note: Note;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onArchive?: (id: string) => void;
  onClick?: (rect: DOMRect) => void;
  hidden?: boolean;
}

const SortableNoteCard = ({ note, ...props }: SortableNoteCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    width: "100%",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NoteCard note={note} {...props} />
    </div>
  );
};

export default SortableNoteCard;


