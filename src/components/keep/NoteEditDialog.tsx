import { useState, useRef, useEffect, useMemo } from "react";
import { Pin } from "lucide-react";
import { getColorClass } from "./noteColors";
import { Note } from "@/types/note";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import NoteEditorContent from "./NoteEditorContent";
import NoteFormattingToolbar from "./NoteFormattingToolbar";
import NoteToolbar from "./NoteToolbar";
import NoteLabelSelector from "./NoteLabelSelector";
import CollaboratorDialog from "./CollaboratorDialog";
import { Trash2, RotateCw } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { useLabels } from "@/hooks/useLabel";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useCollaborators } from "@/hooks/useCollaborators";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  onLeaveNote?: (id: string) => void;
  sourceRect?: DOMRect | null;
}

const NoteEditDialog = ({
  note, open, onClose, onDelete, onArchive, onPin, onUpdate,
  onColorChange, onRestore, onPermanentDelete, onLeaveNote, sourceRect
}: NoteEditDialogProps) => {
  const [phase, setPhase] = useState<"start" | "animate" | "done">("start");
  const dialogRef = useRef<HTMLDivElement>(null);
  const isDeleted = note.deleted;
  const { removeLabel, addCollaborator, removeCollaborator } = useNotes();
  const { labels: allLabels } = useLabels();
  const [, setShowLabelPopover] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const collaboratorIds = useMemo(() => [note.ownerId, ...(note.memberIds || [])], [note.ownerId, note.memberIds]);
  const { collaborators: collaboratorUsers } = useCollaborators(collaboratorIds);
  const filteredCollaborators = collaboratorUsers.filter(u => u.uid !== user?.uid);

  const editor = useNoteEditor({
    initialTitle: note.title,
    initialYdoc: note.ydoc,
    containerRef: dialogRef as React.RefObject<HTMLElement>,
  });


  const noteTitleRef = useRef(note.title);
  const noteContentRef = useRef(note.contentPreview);

  const prevOpenRef = useRef(false);
  const prevNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      editor.disconnectHocuspocus();
      prevOpenRef.current = false;
      return;
    }

    const opened = !prevOpenRef.current;
    const switchedNote = note.id !== prevNoteIdRef.current;

    if (opened || switchedNote) {
      if (switchedNote) editor.disconnectHocuspocus();

      editor.initFromContent(noteTitleRef.current, noteContentRef.current || "");

      requestAnimationFrame(() => {
        setPhase("start");
        requestAnimationFrame(() => setPhase("animate"));
      });
      const timer = setTimeout(() => setPhase("done"), 250);

      prevOpenRef.current = true;
      prevNoteIdRef.current = note.id;

      return () => clearTimeout(timer);
    }
    prevOpenRef.current = open;
    if (open) prevNoteIdRef.current = note.id;

  }, [note.id, open]);
  useEffect(() => {
    if (!open) return;

    if (!editor.editor) return;
    editor.connectHocuspocus(note.id, noteTitleRef.current);

  }, [open, note.id, editor.editor]);

  const handleSaveAndClose = () => {
    const currentContent = editor.getContent();
    const currentTitle = editor.title;

    const updates: Partial<Note> = {};
    if (currentContent !== note.contentPreview) {
      updates.contentPreview = currentContent;
    }
    if (currentTitle !== note.title) {
      updates.title = currentTitle;
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(note.id, updates);
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
            className="absolute cursor-pointer top-2 right-2 p-2 rounded-full hover:bg-secondary/50 transition-colors z-10"
            title={note.pinned ? "Bỏ ghim" : "Ghim ghi chú"}
          >
            <Pin className={`w-5 h-5 ${note.pinned ? "text-foreground fill-foreground" : "text-keep-icon"}`} />
          </button>

          {/* Title — controlled bởi Y.Text qua editor.title */}
          <input
            type="text"
            placeholder="Tiêu đề"
            value={editor.title}
            onChange={(e) => { if (!isDeleted) editor.handleTitleChange(e.target.value); }}
            disabled={isDeleted}
            className="w-full px-4 pt-3 pb-1 bg-transparent outline-none text-foreground font-medium placeholder:text-muted-foreground pr-12 text-base"
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
          {(note.memberIds && note.memberIds.length > 0) && (
            <div className=" mb-1 flex items-center gap-1 px-4 cursor-pointer" onClick={() => setShowCollaborators(true)}>
              {filteredCollaborators.slice(0, 5).map((user) => (
                <Avatar key={user.uid} className="h-6 w-6" title={user.displayName || user.email || "Unknown"}>
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback className="text-xs">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {filteredCollaborators.length > 5 && (
                <span className="text-xs text-muted-foreground ml-1">+{filteredCollaborators.length - 5}</span>
              )}
            </div>
          )}

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
              note={note}
              currentUser={user}
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
              onCollaboratorsClick={() => setShowCollaborators(true)}
              onDelete={() => {
                onDelete(note.id);
                onClose();
              }}
              onLeaveNote={() => {
                onLeaveNote?.(note.id);
                onClose();
              }}
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
                  onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(note.id); }}
                  className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
                  title="Xoá vĩnh viễn"
                >
                  <Trash2 className="w-4 h-4 text-keep-toolbar" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-1.5 cursor-pointer text-sm font-medium text-foreground hover:bg-secondary/50 rounded transition-colors"
              >
                Đóng
              </button>
            </div>
          )}

          <CollaboratorDialog
            open={showCollaborators}
            collaborators={note.memberIds ?? []}
            ownerId={note.ownerId}
            onClose={() => setShowCollaborators(false)}
            onAddCollaborator={(email) => addCollaborator(note.id, email)}
            onRemoveCollaborator={(email) => removeCollaborator(note.id, email)}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteEditDialog;
