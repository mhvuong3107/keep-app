import { useState, useRef, useEffect } from "react";
import { Pin } from "lucide-react";
import { getColorClass } from "./noteColors";
import { Note } from "@/types/note";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import NoteEditorContent from "./NoteEditorContent";
import NoteFormattingToolbar from "./NoteFormattingToolbar";
import NoteToolbar from "./NoteToolbar";
import NoteLabelSelector from "./NoteLabelSelector";
import { Trash2, RotateCw } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { useLabels } from "@/hooks/useLabel";

interface NoteEditDialogProps {
  note: Note;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onPin: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  sourceRect?: DOMRect | null;
}

const NoteEditDialog = ({
  note, open, onClose, onUpdate, onDelete, onArchive, onPin,
  onColorChange, onRestore, onPermanentDelete, sourceRect
}: NoteEditDialogProps) => {
  const [phase, setPhase] = useState<"start" | "animate" | "done">("start");
  const dialogRef = useRef<HTMLDivElement>(null);
  const isDeleted = note.deleted;
  const { removeLabel } = useNotes();
  const { labels: allLabels } = useLabels();
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const editor = useNoteEditor({
    initialTitle: note.title,
    initialContent: note.content,
    containerRef: dialogRef as React.RefObject<HTMLElement>,
  });

  const prevOpenRef = useRef(false);
  const prevNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    const opened = open && !prevOpenRef.current;
    const switchedNote = open && note.id !== prevNoteIdRef.current;

    if (opened || switchedNote) {
      editor.initFromContent(note.title, note.content);
      requestAnimationFrame(() => {
        setPhase("start");
        requestAnimationFrame(() => setPhase("animate"));
      });
      const timer = setTimeout(() => setPhase("done"), 250);

      prevOpenRef.current = open;
      if (open) {
        prevNoteIdRef.current = note.id;
      }

      return () => clearTimeout(timer);
    }

    prevOpenRef.current = open;
    if (open) {
      prevNoteIdRef.current = note.id;
    }
  }, [note.id, open, note.title, note.content, editor]);

  const handleSaveAndClose = () => {
    if (!note.deleted) {
      onUpdate(note.id, {
        title: editor.title,
        content: editor.getContent(),
      });
    }
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleSaveAndClose();
  };

  if (!open) return null;

  const colorClass = getColorClass(note.color);
  const isAnimating = phase === "start";

  const getDialogStyle = (): React.CSSProperties => {
    if (phase === "start" && sourceRect) {
      return {
        position: "fixed",
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
        maxWidth: sourceRect.width,
        maxHeight: sourceRect.height,
        transition: "none",
        overflow: "hidden",
      };
    }
    return {};
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-colors duration-200 ${isAnimating ? "bg-black/0" : "bg-black/50"}`}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex items-center justify-center min-h-full p-4">
        <div
          ref={dialogRef}
          className={`w-full max-w-[600px] rounded-lg keep-shadow relative ${colorClass} flex flex-col transition-all duration-200 ease-out ${isAnimating ? "overflow-hidden" : "max-h-[80vh]"}`}
          style={getDialogStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pin */}
          <button
            hidden={isDeleted}
            onClick={() => onPin(note.id)}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-secondary/50 transition-colors z-10"
            title={note.pinned ? "Bỏ ghim" : "Ghim ghi chú"}
          >
            <Pin className={`w-5 h-5 ${note.pinned ? "text-foreground fill-foreground" : "text-keep-icon"}`} />
          </button>

          {/* Title */}
          <input
            type="text"
            placeholder="Tiêu đề"
            value={editor.title}
            onChange={(e) => { if (!isDeleted) editor.handleTitleChange(e.target.value); }}
            disabled={isDeleted}
            className="w-full px-4 pt-3 pb-1 bg-transparent outline-none text-foreground font-medium placeholder:text-muted-foreground pr-12 text-base"
            autoFocus
          />

          {/* Content + label badges */}
          <div className="py-1 overflow-y-auto flex-1 min-h-0 note-scroll">
            <NoteEditorContent
              editable={!isDeleted}
              isChecklist={editor.isChecklist}
              checklistItems={editor.checklistItems}
              showCompleted={editor.showCompleted}
              editor={editor.editor}
              onToggleChecklistItem={editor.toggleChecklistItem}
              onUpdateChecklistItem={editor.updateChecklistItem}
              onChecklistKeyDown={editor.handleChecklistKeyDown}
              onRemoveChecklistItem={editor.removeChecklistItem}
              onAddChecklistItem={() => editor.setChecklistItems([...editor.checklistItems, { id: crypto.randomUUID(), text: "", checked: false }])}
              onSetShowCompleted={editor.setShowCompleted}
              onReorderChecklist={editor.reorderCheckList}
              minHeight="60px"
              labelIds={note.labelIds ?? []}
              allLabels={allLabels}
              onRemoveLabel={(labelId) => removeLabel(note.id, labelId)}
            />
          </div>

          {/* Formatting toolbar */}
          {editor.showFormatting && !editor.isChecklist && (
            <NoteFormattingToolbar
              activeFormats={editor.activeFormats}
              onApplyFormat={editor.applyFormat}
              onApplyHeading={editor.applyHeading}
            />
          )}

          {/* Main toolbar */}
          {!isDeleted ? (
            <NoteToolbar
              labelPopoverContent={
                <NoteLabelSelector
                  noteId={note.id}
                  labelIds={note.labelIds ?? []}
                />
              }
              showFormatting={editor.showFormatting}
              showColors={editor.showColors}
              showMore={editor.showMore}
              isChecklist={editor.isChecklist}
              currentColor={note.color}
              archived={note.archived}
              canUndo={editor.canUndo}
              canRedo={editor.canRedo}
              colorRef={editor.colorRef as React.RefObject<HTMLDivElement>}
              moreRef={editor.moreRef as React.RefObject<HTMLDivElement>}
              onToggleFormatting={() => { editor.setShowFormatting(!editor.showFormatting); editor.setShowColors(false); editor.setShowMore(false); }}
              onToggleColors={() => { editor.setShowColors(!editor.showColors); editor.setShowMore(false); }}
              onToggleMore={() => { editor.setShowMore(!editor.showMore); editor.setShowColors(false); }}
              onColorSelect={(c) => { onColorChange(note.id, c); }}
              onArchive={() => { onArchive(note.id); onClose(); }}
              onToggleChecklist={() => { editor.toggleChecklist(); editor.setShowMore(false); }}
              onUndo={editor.undo}
              onRedo={editor.redo}
              onClose={handleSaveAndClose}
              onDelete={() => { onDelete(note.id); onClose(); }}
              onLabelPopoverOpenChange={setShowLabelPopover}
            />
          ) : (
            <div className="flex justify-between items-center gap-0.5 px-1.5 py-1 opacity-100 transition-opacity">
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRestore?.(note.id); }}
                  className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
                  title="Khôi phục"
                >
                  <RotateCw className="w-4 h-4 text-keep-toolbar" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation();  onPermanentDelete?.(note.id); }}
                  className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
                  title="Xoá vĩnh viễn"
                >
                  <Trash2 className="w-4 h-4 text-keep-toolbar" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/50 rounded transition-colors"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEditDialog;