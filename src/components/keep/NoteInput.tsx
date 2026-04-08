import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { CheckSquare, Paintbrush, Image as ImageIcon, Pin, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColorClass } from "./noteColors";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import NoteEditorContent from "./NoteEditorContent";
import NoteFormattingToolbar from "./NoteFormattingToolbar";
import NoteToolbar from "./NoteToolbar";
import NoteLabelSelector from "./NoteLabelSelector";
import CollaboratorDialog from "./CollaboratorDialog";
import { useLabels } from "@/hooks/useLabel";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface NoteInputProps {
  onAddNote: (
    title: string,
    content: string,
    options?: { color?: string; pinned?: boolean; archived?: boolean; labelIds?: string[]; memberIds?: string[] }
  ) => void;
  labelIds?: string[]
}

const NoteInput = ({ onAddNote, labelIds }: NoteInputProps) => {
  const [expanded, setExpanded] = useState(false);
  const [color, setColor] = useState("default");
  const [pinned, setPinned] = useState(false);
  const [localMemberIds, setLocalMemberIds] = useState<string[]>([]);
  const [localLabelIds, setLocalLabelIds] = useState<string[]>(labelIds || []);
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { labels: allLabels } = useLabels();
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch collaborator info for display
  const { collaborators: collaboratorUsers } = useCollaborators(localMemberIds);
  const filteredCollaborators = useMemo(() =>
    collaboratorUsers.filter(u => u.uid !== user?.uid),
    [collaboratorUsers, user]
  );

  const editor = useNoteEditor({ containerRef: containerRef as React.RefObject<HTMLElement> });

  const resetState = useCallback(() => {
    editorRef.current.resetEditor();
    setColor("default");
    setPinned(false);
    setLocalMemberIds([]);
    if (!labelIds) setLocalLabelIds([]);
    setShowLabelPopover(false);
    setShowCollaborators(false);
    setExpanded(false);
  }, [labelIds]);

  const editorRef = useRef(editor);

  useEffect(() => {
    //eslint-disable-next-line react-hooks/exhaustive-deps
    editorRef.current = editor;
  }, [editor]);

  const handleClose = useCallback(() => {
    const finalContent = editorRef.current.getContent();
    if (editorRef.current.title.trim() || finalContent.trim()) {
      onAddNote(editorRef.current.title, finalContent, {
        color,
        pinned,
        archived: false,
        labelIds: localLabelIds,
        memberIds: localMemberIds
      });
    }
    resetState();
  }, [onAddNote, color, pinned, localLabelIds, localMemberIds, resetState]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (expanded && !showLabelPopover && !showCollaborators) handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, showLabelPopover, showCollaborators, handleClose]);

  const handleArchive = useCallback(() => {
    const finalContent = editorRef.current.getContent();
    if (editorRef.current.title.trim() || finalContent.trim()) {
      onAddNote(editorRef.current.title, finalContent, {
        color,
        pinned: false,
        archived: true,
        labelIds: localLabelIds,
        memberIds: localMemberIds,
      });
    }
    resetState();
  }, [onAddNote, color, localLabelIds, localMemberIds, resetState]);

  const colorClass = getColorClass(color);

  if (!expanded) {
    return (
      <div className="max-w-70 md:max-w-80 lg:max-w-100 mx-auto mb-8">
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
    <div className="max-w-150 mx-auto mb-8" ref={containerRef}>
      <div className={`keep-shadow h-auto rounded-lg relative transition-colors ${colorClass}`}>
        {/* Pin */}
        <button
          onClick={() => setPinned(!pinned)}
          className="absolute cursor-pointer top-2 right-2 p-2 rounded-full hover:bg-secondary/50 transition-colors z-10"
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
          className="w-full px-4 pt-3 pb-1 bg-transparent text-lg outline-none text-foreground font-medium placeholder:font-semibold placeholder:text-lg placeholder:text-muted-foreground pr-12"
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

        {/* Collaborators */}
        {filteredCollaborators.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-t border-border/10">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Cộng tác viên:</span>
            {filteredCollaborators.map((collab) => (
              <div
                key={collab.uid}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors group"
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={collab.photoURL || undefined} />
                  <AvatarFallback className="text-xs">
                    {(collab.displayName || collab.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">
                  {collab.displayName || collab.email?.split("@")[0] || "Unknown"}
                </span>
                <button
                  onClick={() => setLocalMemberIds(prev => prev.filter(id => id !== collab.uid))}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa cộng tác viên"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
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
          onCollaboratorsClick={() => setShowCollaborators(true)}
          onLabelPopoverOpenChange={setShowLabelPopover}
        />
      </div>

      <CollaboratorDialog
        open={showCollaborators}
        collaborators={localMemberIds}
        ownerId={user?.uid || ""}
        onClose={() => setShowCollaborators(false)}
        onAddCollaborator={(uid) => {
          setLocalMemberIds(prev => [...prev, uid]);
        }}
        onRemoveCollaborator={(uid) => {
          setLocalMemberIds(prev => prev.filter(id => id !== uid));
        }}
      />
    </div>
  );
};

export default NoteInput;
