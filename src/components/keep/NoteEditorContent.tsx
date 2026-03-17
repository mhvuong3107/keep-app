import React, { useEffect, useMemo } from "react";
import { GripVertical, X } from "lucide-react";
import { EditorContent, type Editor } from "@tiptap/react";
import type { ChecklistItem } from "@/hooks/useNoteEditor";
import Label from "@/types/label";
import {
  DndContext,
  closestCenter,
  type DragEndEvent
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

interface SortableChecklistItemProps {
  item: ChecklistItem & { originalIndex: number };
  onToggle: (index: number) => void;
  onUpdate: (index: number, text: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onRemove: (index: number) => void;
}

const SortableChecklistItem = ({ item, onToggle, onUpdate, onKeyDown, onRemove }: SortableChecklistItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 group/item">
      <GripVertical
        className="w-4 h-4 text-muted-foreground/40 cursor-grab opacity-0 group-hover/item:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      />
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.originalIndex)}
        className="w-[18px] h-[18px] rounded border-muted-foreground/50 accent-primary cursor-pointer"
      />
      <input
        type="text"
        value={item.text}
        onChange={(e) => onUpdate(item.originalIndex, e.target.value)}
        onKeyDown={(e) => onKeyDown(item.originalIndex, e)}
        placeholder="Mục danh sách"
        className="checklist-input flex-1 px-2 py-1.5 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
      />
      <button
        onClick={() => onRemove(item.originalIndex)}
        className="p-1 rounded-full opacity-0 group-hover/item:opacity-100 hover:bg-secondary/50 transition-opacity"
      >
        <X className="w-3.5 h-3.5 text-keep-icon" />
      </button>
    </div>
  );
};

interface NoteEditorContentProps {
  editable?: boolean;
  isChecklist: boolean;
  checklistItems: ChecklistItem[];
  showCompleted: boolean;
  editor: Editor | null;
  labelIds?: string[];
  allLabels?: Label[];
  onRemoveLabel?: (labelId: string) => void;
  onToggleChecklistItem: (index: number) => void;
  onUpdateChecklistItem: (index: number, text: string) => void;
  onChecklistKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onRemoveChecklistItem: (index: number) => void;
  onAddChecklistItem: () => void;
  onSetShowCompleted: (show: boolean) => void;
  onReorderChecklist: (activeId: string, overId: string) => void;
  minHeight?: string;
}

const NoteEditorContent = ({
  isChecklist, checklistItems, showCompleted, editor,
  labelIds,
  allLabels,
  onRemoveLabel,
  onToggleChecklistItem, onUpdateChecklistItem,
  onChecklistKeyDown, onRemoveChecklistItem, onAddChecklistItem,
  onSetShowCompleted, onReorderChecklist, minHeight = "24px",
}: NoteEditorContentProps) => {
  const uncheckedItems = useMemo(
    () => checklistItems.map((item, i) => ({ ...item, originalIndex: i })).filter(item => !item.checked),
    [checklistItems]
  );
  const checkedItems = useMemo(
    () => checklistItems.map((item, i) => ({ ...item, originalIndex: i })).filter(item => item.checked),
    [checklistItems]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderChecklist(active.id as string, over.id as string);
    }
  };

  // Dùng chung cho cả 2 chế độ (checklist và text)
  const labelBadges = labelIds && labelIds.length > 0 && allLabels && (
    <div className="flex flex-wrap items-center gap-1 px-4 pb-2 pt-1">
      {allLabels.filter(l => labelIds.includes(l.id)).map(label => (
        <span
          key={label.id}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
        >
          {label.name}
          {onRemoveLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveLabel(label.id); }}
              className="ml-0.5 hover:text-foreground transition-colors"
              title="Xoá nhãn"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );

  if (isChecklist) {
    return (
      <div className="px-2 space-y-0.5">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={checklistItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {uncheckedItems.map((item) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                onToggle={onToggleChecklistItem}
                onUpdate={onUpdateChecklistItem}
                onKeyDown={onChecklistKeyDown}
                onRemove={onRemoveChecklistItem}
              />
            ))}

            <button
              onClick={onAddChecklistItem}
              className="flex items-center gap-2 px-5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg leading-none">+</span> Mục danh sách
            </button>

            {checkedItems.length > 0 && (
              <div className="border-t border-border/40 mt-1 pt-1">
                <button
                  onClick={() => onSetShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showCompleted ? "rotate-0" : "-rotate-90"}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  {checkedItems.length} mục đã hoàn tất
                </button>
                {showCompleted && checkedItems.map((item) => (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={onToggleChecklistItem}
                    onUpdate={onUpdateChecklistItem}
                    onKeyDown={onChecklistKeyDown}
                    onRemove={onRemoveChecklistItem}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
        {labelBadges}
      </div>
    );
  }

  return (
    <div>
      <div className="w-full px-4 mb-1 text-sm" style={{ minHeight }}>
        <EditorContent editor={editor} className="tiptap-editor outline-none" />
      </div>
      {labelBadges}
    </div>
  );
};

export default React.memo(NoteEditorContent);