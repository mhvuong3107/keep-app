import {
  Palette, Bell, UserPlus, Image as ImageIcon, Archive,
  MoreVertical, Undo2, Redo2, Baseline, Tag, Copy,
  CheckSquare, Trash2,
} from "lucide-react";
import { noteColors } from "./noteColors";

interface NoteToolbarProps {
  // State
  showFormatting: boolean;
  showColors: boolean;
  showMore: boolean;
  isChecklist: boolean;
  currentColor: string;
  canUndo: boolean;
  canRedo: boolean;
  // Refs
  colorRef: React.RefObject<HTMLDivElement>;
  moreRef: React.RefObject<HTMLDivElement>;
  // Callbacks
  onToggleFormatting: () => void;
  onToggleColors: () => void;
  onToggleMore: () => void;
  onColorSelect: (color: string) => void;
  onArchive: () => void;
  onToggleChecklist: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
  onDelete?: () => void;
  // Dropdown direction
  dropdownDirection?: "up" | "down";
}

const NoteToolbar = ({
  showFormatting, showColors, showMore, isChecklist, currentColor,
  canUndo, canRedo, colorRef, moreRef,
  onToggleFormatting, onToggleColors, onToggleMore, onColorSelect,
  onArchive, onToggleChecklist, onUndo, onRedo, onClose, onDelete,
  dropdownDirection = "down",
}: NoteToolbarProps) => {
  const dropdownPos = dropdownDirection === "up"
    ? "absolute bottom-full left-0 mb-1"
    : "absolute top-full left-0 mt-1";

  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* Formatting toggle */}
        <button
          onClick={onToggleFormatting}
          className={`p-2 rounded-full hover:bg-secondary/50 transition-colors ${showFormatting ? "bg-secondary/50" : ""}`}
          title="Tuỳ chọn định dạng"
        >
          <Baseline className="w-4 h-4 text-keep-toolbar" />
        </button>

        {/* Color picker */}
        <div ref={colorRef} className="relative">
          <button
            onClick={onToggleColors}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title="Màu nền"
          >
            <Palette className="w-4 h-4 text-keep-toolbar" />
          </button>
          {showColors && (
            <div className={`${dropdownPos} p-2 bg-card rounded-lg keep-shadow z-20 flex gap-1 flex-wrap w-[180px] animate-in fade-in zoom-in-95`}>
              {noteColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onColorSelect(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    currentColor === c.value ? "border-primary scale-110" : "border-transparent hover:border-keep-icon"
                  } ${c.class}`}
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
        <button onClick={onArchive} className="p-2 rounded-full hover:bg-secondary/50 transition-colors" title="Lưu trữ">
          <Archive className="w-4 h-4 text-keep-toolbar" />
        </button>

        {/* More options */}
        <div ref={moreRef} className="relative">
          <button
            onClick={onToggleMore}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            title="Tuỳ chọn khác"
          >
            <MoreVertical className="w-4 h-4 text-keep-toolbar" />
          </button>
          {showMore && (
            <div className={`${dropdownPos} bg-card rounded-lg keep-shadow z-20 py-1 min-w-[180px] animate-in fade-in zoom-in-95`}>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá ghi chú
                </button>
              )}
              <button
                onClick={onToggleChecklist}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                {isChecklist ? "Ẩn hộp kiểm" : "Hiện hộp kiểm"}
              </button>
              <button
                onClick={() => {}}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
              >
                <Tag className="w-4 h-4" />
                Thêm nhãn
              </button>
              <button
                onClick={() => {}}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
              >
                <Copy className="w-4 h-4" />
                Tạo bản sao
              </button>
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded-full hover:bg-secondary/50 transition-colors disabled:opacity-30" title="Hoàn tác">
          <Undo2 className="w-4 h-4 text-keep-toolbar" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded-full hover:bg-secondary/50 transition-colors disabled:opacity-30" title="Làm lại">
          <Redo2 className="w-4 h-4 text-keep-toolbar" />
        </button>
      </div>

      <button
        onClick={onClose}
        className="px-6 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/50 rounded transition-colors"
      >
        Đóng
      </button>
    </div>
  );
};

export default NoteToolbar;
