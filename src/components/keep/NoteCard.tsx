import { useState, useRef, useEffect } from "react";
import {
  Pin, Palette, Bell, UserPlus, Image as ImageIcon,
  Archive, MoreVertical, Trash2, Tag, RotateCw, X
} from "lucide-react";
import { Note } from "../../types/note";
import NoteLabelSelector from "./NoteLabelSelector";
import { noteColors, getColorClass } from "./noteColors";
import { useNotes } from "@/hooks/useNotes";
import { useLabels } from "@/hooks/useLabel";

interface NoteCardProps {
  note: Note;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onClick?: (rect: DOMRect) => void;
  hidden?: boolean;
}

const NoteCard = ({
  note, onPin, onDelete, onColorChange, onArchive,
  onRestore, onPermanentDelete, onClick, hidden
}: NoteCardProps) => {
  const [showMore, setShowMore] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const { removeLabel } = useNotes();
  const { labels: allLabels } = useLabels();
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        moreRef.current && !moreRef.current.contains(target) &&
        labelRef.current && !labelRef.current.contains(target)
      ) {
        setShowMore(false);
        setShowLabels(false);
      }
      if (colorRef.current && !colorRef.current.contains(target)) {
        setShowColors(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      className={`group relative rounded-lg keep-border hover:keep-shadow-hover transition-shadow cursor-pointer break-inside-avoid mb-4 ${getColorClass(note.color)} ${hidden ? "invisible" : ""}`}
      ref={cardRef}
      onClick={() => {
        if (onClick && cardRef.current) {
          onClick(cardRef.current.getBoundingClientRect());
        }
      }}
    >
      {/* Pin */}
      <button
        hidden={note.deleted}
        onClick={(e) => { e.stopPropagation(); onPin(note.id); }}
        className={`absolute top-2 right-2 p-2 rounded-full transition-opacity ${note.pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"} hover:bg-secondary/50`}
      >
        <Pin className={`w-4 h-4 ${note.pinned ? "text-foreground fill-foreground" : "text-keep-icon"}`} />
      </button>

      {/* Content */}
      <div className="px-4 pt-3 pb-1 pr-10">
        {note.title && (
          <h3 className="text-lg font-medium text-foreground mb-1 pr-8">{note.title}</h3>
        )}
        <div
          className="text-sm text-foreground/80 line-clamp-8 leading-relaxed note-content"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />

        {/* Label badges */}
        {note.labelIds && note.labelIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {allLabels.filter(l => note.labelIds?.includes(l.id)).map(label => (
              <span
                key={label.id}
                className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
              >
                {label.name}
                <button
                  onClick={(e) => { e.stopPropagation(); removeLabel(note.id, label.id); }}
                  className="ml-0.5 hover:text-foreground transition-colors cursor-pointer"
                  title="Xoá nhãn"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {note.deleted ? (
        <div className="flex items-center gap-0.5 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onRestore?.(note.id); }}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title="Khôi phục"
          >
            <RotateCw className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(note.id); }}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title="Xoá vĩnh viễn"
          >
            <Trash2 className="w-4 h-4 text-keep-toolbar" />
          </button>
        </div>
      ) : (
        <div className={`flex items-center gap-0.5 px-1.5 py-1 transition-opacity ${showMore || showColors || showLabels ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {/* Color picker */}
          <div ref={colorRef} className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowColors(!showColors); setShowMore(false); }}
              className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
              title="Màu nền"
            >
              <Palette className="w-4 h-4 text-keep-toolbar" />
            </button>
            {showColors && (
              <div className="absolute top-full left-0 mb-1 p-2 bg-card rounded-lg keep-shadow z-10 flex gap-1 flex-wrap w-[156px]">
                {noteColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => { onColorChange(note.id, c.value); setShowColors(false); }}
                    className={`w-6 h-6 rounded-full border-2 ${note.color === c.value ? "border-primary" : "border-transparent hover:border-keep-icon"} ${c.class}`}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <button className="p-2 rounded-full hover:bg-secondary/50 transition-colors" title="Nhắc tôi">
            <Bell className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button className="p-2 rounded-full hover:bg-secondary/50 transition-colors" title="Cộng tác viên">
            <UserPlus className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button className="p-2 rounded-full hover:bg-secondary/50 transition-colors" title="Thêm hình ảnh">
            <ImageIcon className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onArchive?.(note.id); }}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title={note.archived ? "Bỏ lưu trữ" : "Lưu trữ"}
          >
            <Archive className="w-4 h-4 text-keep-toolbar" />
          </button>

          {/* More options */}
          <div ref={moreRef} className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); setShowColors(false); }}
              className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
              title="Tuỳ chọn khác"
            >
              <MoreVertical className="w-4 h-4 text-keep-toolbar" />
            </button>

            {showMore && (
              <div className="absolute top-full left-0 mb-1 bg-card rounded-lg keep-shadow z-10 py-1 min-w-[160px]">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(note.id); setShowMore(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
                >
                  Xoá ghi chú
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMore(false); setShowLabels(true); }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
                >
                  Thêm nhãn
                </button>
              </div>
            )}
            {showLabels && (
              <div
                ref={labelRef}
                className="absolute top-full left-0 mb-1 bg-card rounded-lg keep-shadow z-10 p-3 w-64"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <NoteLabelSelector
                  noteId={note.id}
                  labelIds={note.labelIds ?? []}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;