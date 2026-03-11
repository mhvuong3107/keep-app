import { useState, useRef, useEffect } from "react";
import {
  Pin,
  Palette,
  Bell,
  UserPlus,
  Image as ImageIcon,
  Archive,
  MoreVertical,
  Trash2,
  Tag,
} from "lucide-react";

import { Note } from "../../types/note";

interface NoteCardProps {
  note: Note;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onArchive?: (id: string) => void;
  onClick?: (rect: DOMRect) => void;
  hidden?: boolean;
}

import { noteColors, getColorClass } from "./noteColors";

const NoteCard = ({ note, onPin, onDelete, onColorChange, onArchive, onClick, hidden }: NoteCardProps) => {
  const [showMore, setShowMore] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColors(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  
  return (
    <div
      className={`group relative rounded-lg keep-border hover:keep-shadow-hover transition-shadow cursor-pointer break-inside-avoid mb-4 ${getColorClass(
        note.color
      )} ${hidden ? 'invisible' : ''}`}
      ref={cardRef}
      onClick={() => {
        if (onClick && cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          onClick(rect);
        }
      }}
    >
      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPin(note.id); }}
        className={`absolute top-2 right-2 p-2 rounded-full transition-opacity ${note.pinned
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
          } hover:bg-secondary/50`}
      >
        <Pin
          className={`w-4 h-4 ${note.pinned ? "text-foreground fill-foreground" : "text-keep-icon"
            }`}
        />
      </button>

      {/* Content */}
      <div className="px-4 pt-3 pb-1 pr-10">
        {note.title && (
          <h3 className="text-lg font-medium text-foreground mb-1 pr-8">
            {note.title}
          </h3>
        )}
        <div
          className="text-sm text-foreground/80 leading-relaxed note-content"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {/* Color picker */}
        <div ref={colorRef} className="relative">
          <button
            onClick={() => {
              setShowColors(!showColors);
              setShowMore(false);
            }}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title="Màu nền"
          >
            <Palette className="w-4 h-4 text-keep-toolbar" />
          </button>
          {showColors && (
            <div className="absolute bottom-full left-0 mb-1 p-2 bg-card rounded-lg keep-shadow z-10 flex gap-1 flex-wrap w-[156px]">
              {noteColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    onColorChange(note.id, c.value);
                    setShowColors(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 ${note.color === c.value
                      ? "border-primary"
                      : "border-transparent hover:border-keep-icon"
                    } ${c.class}`}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        <button
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          title="Nhắc tôi"
        >
          <Bell className="w-4 h-4 text-keep-toolbar" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          title="Cộng tác viên"
        >
          <UserPlus className="w-4 h-4 text-keep-toolbar" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          title="Thêm hình ảnh"
        >
          <ImageIcon className="w-4 h-4 text-keep-toolbar" />
        </button>
        <button
          onClick={() => onArchive?.(note.id)}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          title="Lưu trữ"
        >
          <Archive className="w-4 h-4 text-keep-toolbar" />
        </button>

        {/* More options */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => {
              setShowMore(!showMore);
              setShowColors(false);
            }}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title="Tuỳ chọn khác"
          >
            <MoreVertical className="w-4 h-4 text-keep-toolbar" />
          </button>
          {showMore && (
            <div className="absolute top-full left-0 mb-1 bg-card rounded-lg keep-shadow z-10 py-1 min-w-[160px]">
              <button
                onClick={() => {
                  onDelete(note.id);
                  setShowMore(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xoá ghi chú
              </button>
              <button
                onClick={() => setShowMore(false)}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
              >
                <Tag className="w-4 h-4" />
                Thêm nhãn
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
