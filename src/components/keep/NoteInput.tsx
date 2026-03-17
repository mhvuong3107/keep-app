import { useRef, useState, useEffect } from "react";
import { CheckSquare, Paintbrush, Image as ImageIcon, Pin } from "lucide-react";
import { getColorClass } from "./noteColors";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import NoteEditorContent from "./NoteEditorContent";
import NoteFormattingToolbar from "./NoteFormattingToolbar";
import NoteToolbar from "./NoteToolbar";
import NoteLabelSelector from "./NoteLabelSelector";
import { useLabels } from "@/hooks/useLabel";

interface NoteInputProps {
  onAddNote: (
    title: string,
    content: string,
    options?: { color?: string; pinned?: boolean; archived?: boolean; labelIds?: string[] }
  ) => void;
  labelIds?: string[]
}

const NoteInput = ({ onAddNote, labelIds }: NoteInputProps) => {
  const [expanded, setExpanded] = useState(false);
  const [color, setColor] = useState("default");
  const [pinned, setPinned] = useState(false);

  const [localLabelIds, setLocalLabelIds] = useState<string[]>(labelIds || []);
  const [showLabelPopover, setShowLabelPopover] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { labels: allLabels } = useLabels();

  const editor = useNoteEditor({ containerRef: containerRef as React.RefObject<HTMLElement> });

  const resetState = () => {
    editor.resetEditor();
    setColor("default");
    setPinned(false);
    if(!labelIds) setLocalLabelIds([]);
    setShowLabelPopover(false);
    setExpanded(false);
  };

  const handleClose = () => {
    const finalContent = editor.getContent();
    if (editor.title.trim() || finalContent.trim()) {
      onAddNote(editor.title, finalContent, { color, pinned, archived: false, labelIds: localLabelIds });
    }
    resetState();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (expanded && !showLabelPopover) handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, showLabelPopover]);

  const handleArchive = () => {
    const finalContent = editor.getContent();
    if (editor.title.trim() || finalContent.trim()) {
      onAddNote(editor.title, finalContent, {
        color,
        pinned: false,
        archived: true,
        labelIds: localLabelIds,
      });
    }
    resetState();
  };

  const colorClass = getColorClass(color);

  if (!expanded) {
    return (
      <div className="max-w-[600px] mx-auto mb-8">
        <div
          onClick={() => setExpanded(true)}
          className="flex items-center keep-shadow rounded-lg px-4 py-3 cursor-text bg-card"
        >
          <span className="flex-1 text-muted-foreground text-base">Tạo ghi chú...</span>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
                editor.setChecklistItems([{ id: crypto.randomUUID(), text: "", checked: false }]);
              }}
            >
              <CheckSquare className="w-5 h-5 text-keep-icon" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
              <Paintbrush className="w-5 h-5 text-keep-icon" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
              <ImageIcon className="w-5 h-5 text-keep-icon" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto mb-8" ref={containerRef}>
      <div className={`keep-shadow h-auto rounded-lg relative transition-colors ${colorClass}`}>
        {/* Pin */}
        <button
          onClick={() => setPinned(!pinned)}
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-secondary/50 transition-colors z-10"
          title={pinned ? "Bỏ ghim" : "Ghim ghi chú"}
        >
          <Pin className={`w-5 h-5 ${pinned ? "text-foreground fill-foreground" : "text-keep-icon"}`} />
        </button>

        {/* Title */}
        <input
          type="text"
          placeholder="Tiêu đề"
          value={editor.title}
          onChange={(e) => editor.handleTitleChange(e.target.value)}
          className="w-full px-4 pt-3 pb-1 bg-transparent outline-none text-foreground font-medium placeholder:text-muted-foreground pr-12"
          autoFocus
        />

        {/* Content */}
        <div className="py-1">
          <NoteEditorContent
            isChecklist={editor.isChecklist}
            checklistItems={editor.checklistItems}
            showCompleted={editor.showCompleted}
            editor={editor.editor}
            onToggleChecklistItem={editor.toggleChecklistItem}
            onUpdateChecklistItem={editor.updateChecklistItem}
            onChecklistKeyDown={editor.handleChecklistKeyDown}
            onRemoveChecklistItem={editor.removeChecklistItem}
            onAddChecklistItem={() =>
              editor.setChecklistItems([...editor.checklistItems, { id: crypto.randomUUID(), text: "", checked: false }])
            }
            onSetShowCompleted={editor.setShowCompleted}
            onReorderChecklist={editor.reorderCheckList}
            labelIds={localLabelIds}
            allLabels={allLabels}
            onRemoveLabel={(labelId) => setLocalLabelIds(prev => prev.filter(id => id !== labelId))}
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
        <NoteToolbar
          labelPopoverContent={
            <NoteLabelSelector
              labelIds={localLabelIds}
              onChange={setLocalLabelIds}
            />
          }
          showFormatting={editor.showFormatting}
          showColors={editor.showColors}
          showMore={editor.showMore}
          isChecklist={editor.isChecklist}
          archived={false}
          currentColor={color}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          colorRef={editor.colorRef as React.RefObject<HTMLDivElement>}
          moreRef={editor.moreRef as React.RefObject<HTMLDivElement>}
          onToggleFormatting={() => {
            editor.setShowFormatting(!editor.showFormatting);
            editor.setShowColors(false);
            editor.setShowMore(false);
          }}
          onToggleColors={() => {
            editor.setShowColors(!editor.showColors);
            editor.setShowMore(false);
          }}
          onToggleMore={() => {
            editor.setShowMore(!editor.showMore);
            editor.setShowColors(false);
          }}
          onColorSelect={(c) => { setColor(c); }}
          onArchive={handleArchive}
          onToggleChecklist={() => { editor.toggleChecklist(); editor.setShowMore(false); }}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onClose={handleClose}
          onLabelPopoverOpenChange={setShowLabelPopover}
        />
      </div>
    </div>
  );
};

export default NoteInput;