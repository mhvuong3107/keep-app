import React from "react";
import {
  Palette, Bell, UserPlus, Image as ImageIcon, Archive,
  MoreVertical, Undo2, Redo2, Baseline, Tag, Copy,
  CheckSquare, Trash2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  archived: boolean;
  // Refs
  colorRef: React.RefObject<HTMLDivElement>;
  moreRef: React.RefObject<HTMLDivElement>;
  // Label popover content — cha tự cung cấp, toolbar không cần biết nguồn dữ liệu
  labelPopoverContent?: React.ReactNode;
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
  onLabelPopoverOpenChange?: (open: boolean) => void;
  // Dropdown direction
  dropdownDirection?: "up" | "down";
}

const NoteToolbar = ({
  showFormatting, showColors, showMore, isChecklist, currentColor,
  canUndo, canRedo, colorRef, moreRef, archived,
  labelPopoverContent,
  onToggleFormatting, onToggleColors, onToggleMore, onColorSelect,
  onArchive, onToggleChecklist, onUndo, onRedo, onClose, onDelete,
  onLabelPopoverOpenChange,
}: NoteToolbarProps) => {


  const [showLabels, setShowLabels] = React.useState(false);

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
            <div className={`absolute top-full left-0 p-2 bg-card rounded-lg keep-shadow z-20 flex gap-1 flex-wrap w-[180px] animate-in fade-in zoom-in-95`}>
              {noteColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onColorSelect(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${currentColor === c.value ? "border-primary scale-110" : "border-transparent hover:border-keep-icon"
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

        {/* Label popover — render nội dung do cha truyền vào */}
        <Popover open={showLabels} onOpenChange={(open) => { setShowLabels(open); onLabelPopoverOpenChange?.(open); }}>
          <PopoverTrigger asChild>
            <button
              className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
              title="Nhãn"
            >
              <Tag className="w-4 h-4 text-keep-toolbar" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="!w-72">
            {labelPopoverContent}
          </PopoverContent>
        </Popover>

        <button
          onClick={onArchive}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          title={archived ? "Bỏ lưu trữ" : "Lưu trữ"}
        >
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
            <div className={`absolute top-full left-0 bg-card rounded-lg keep-shadow z-20 py-1 min-w-[180px] animate-in fade-in zoom-in-95`}>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
                >
                  Xoá ghi chú
                </button>
              )}
              <button
                onClick={onToggleChecklist}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
              >
                {isChecklist ? "Ẩn hộp kiểm" : "Hiện hộp kiểm"}
              </button>
              <button
                onClick={() => { }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
              >
                Tạo bản sao
              </button>
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors disabled:opacity-30"
          title="Hoàn tác"
        >
          <Undo2 className="w-4 h-4 text-keep-toolbar" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors disabled:opacity-30"
          title="Làm lại"
        >
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

export default React.memo(NoteToolbar);