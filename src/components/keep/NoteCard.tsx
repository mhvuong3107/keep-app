import { useState, useRef, useEffect, useMemo, memo } from "react";
import {
  Pin, Palette, Bell, UserPlus, Image as ImageIcon,
  Archive, MoreVertical, Trash2, RotateCw, X
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Note } from "../../types/note";
import NoteLabelSelector from "./NoteLabelSelector";
import CollaboratorDialog from "./CollaboratorDialog";
import { noteColors, getColorClass } from "./noteColors";
import { useNotes } from "@/hooks/useNotes";
import { useLabels } from "@/hooks/useLabel";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useCollaborators } from "@/hooks/useCollaborators";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChecklistPreview, isChecklistContent } from "./ChecklistPreview";

interface NoteCardProps {
  note: Note;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onCollaboratorsAdd?: (id: string, email: string) => void;
  onCollaboratorsRemove?: (id: string, email: string) => void;
  onLeaveNote?: (id: string) => void;
  onClick?: (rect: DOMRect) => void;
  onUpdate?: (id: string, updates: Partial<Note>) => void;
  hidden?: boolean;
  onBlockingStateChange?: (isBlocking: boolean) => void;
}

const NoteCard = ({
  note, onPin, onDelete, onColorChange, onArchive,
  onRestore, onPermanentDelete, onCollaboratorsAdd, onCollaboratorsRemove, onLeaveNote, onClick, onUpdate, hidden, onBlockingStateChange
}: NoteCardProps) => {
  const [showMore, setShowMore] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [openRight, setOpenRight] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const user = useSelector((state: RootState) => (state as RootState).auth.user);



  const handleCalculatePosition = (ref: React.RefObject<HTMLDivElement | HTMLButtonElement | null>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const availableSpace = window.innerWidth - rect.right;
    const availableSpaceBottom = window.innerHeight - rect.bottom;

    // If less than 200px available on the right, open to the left
    setOpenRight(availableSpace < 200);

    // If less than 180px available on the bottom, open to the top
    // 180px is approximate height of dropdown menu + some buffer
    setOpenUp(availableSpaceBottom < 180);
  };
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const { removeLabel } = useNotes();
  const { labels: allLabels } = useLabels();
  const collaboratorIds = useMemo(() => [note.ownerId, ...(note.memberIds || [])], [note.ownerId, note.memberIds]);
  const { collaborators: collaboratorUsers } = useCollaborators(collaboratorIds);
  const filteredCollaborators = collaboratorUsers.filter(u => u.uid !== user?.uid);

  const isOwner = note.ownerId === user?.uid;

  // Compute blocking UI state - prevents drag & interaction when dialog is open
  const isBlockingUI = showCollaborators || showLabels || showColors || showMore || showDeleteDialog || showLeaveDialog || showPermanentDeleteDialog;

  // Notify parent when blocking state changes
  useEffect(() => {
    onBlockingStateChange?.(isBlockingUI);
  }, [isBlockingUI, onBlockingStateChange]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;

      // Close more menu if click outside
      if (showMore && moreRef.current && !moreRef.current.contains(target)) {
        setShowMore(false);
      }

      // Close labels menu if click outside
      if (showLabels && labelRef.current && !labelRef.current.contains(target)) {
        setShowLabels(false);
      }

      // Close colors if click outside
      if (showColors && colorRef.current && !colorRef.current.contains(target)) {
        setShowColors(false);
      }

      // Close collaborators if click outside
      if (showCollaborators && cardRef.current && !cardRef.current.contains(target)) {
        setShowCollaborators(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMore, showLabels, showColors, showCollaborators]);

  return (
    <div
      className={`group relative rounded-lg keep-border hover:keep-shadow-hover transition-shadow cursor-pointer break-inside-avoid ${getColorClass(note.color)} ${hidden ? "invisible" : ""}`}

      ref={cardRef}
      onClick={() => {
        // Prevent opening NoteEditDialog when a dialog is open
        if (isBlockingUI) {
          return;
        }
        if (onClick && cardRef.current) {
          onClick(cardRef.current.getBoundingClientRect());
        }
      }}
    >
      {/* Pin */}
      <button
        hidden={note.deleted}
        onClick={(e) => {
          e.stopPropagation();
          onPin(note.id);
        }}
        className={`absolute cursor-pointer top-2 right-2 p-2 rounded-full transition-opacity ${note.pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"} hover:bg-secondary/50`}
      >
        <Pin className={`w-4 h-4 ${note.pinned ? "text-foreground fill-foreground" : "text-keep-icon"}`} />
      </button>

      {/* Content */}
      <div className="px-4 pt-4 pb-5 lg:pb-1 pr-10">
        {note.title && (
          <h3 className="text-lg font-medium text-foreground mb-1 pr-8">{note.title}</h3>
        )}

        <div className="leading-relaxed note-content note-preview">
          {note.contentPreview ? (
            isChecklistContent(note.contentPreview) ? (
              <ChecklistPreview
                content={note.contentPreview}
                maxItems={4}
                onToggleItem={(index, newContent) => {
                  onUpdate?.(note.id, { contentPreview: newContent });
                }}
              />
            ) : (
              <div
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  whiteSpace: "normal",
                }}
                className="line-clamp-5"
              >
                <div dangerouslySetInnerHTML={{ __html: note.contentPreview }} />
              </div>
            )
          ) : (
            <span className="text-muted-foreground">(Chưa có nội dung)</span>
          )}
        </div>

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
        {(note.memberIds && note.memberIds.length > 0) && (
          <div className=" flex items-center gap-1 mt-2">
            {filteredCollaborators.slice(0, 3).map((user) => (
              <Avatar key={user.uid} className="h-6 w-6" title={user.displayName || user.email || "Unknown"}>
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="text-xs">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ))}
            {filteredCollaborators.length > 3 && (
              <span className="text-xs text-muted-foreground ml-1">+{filteredCollaborators.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {note.deleted ? (
        <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore?.(note.id);
            }}
            className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors"
            title="Khôi phục"
          >
            <RotateCw className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowPermanentDeleteDialog(true); }}
            className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors"
            title="Xoá vĩnh viễn"
          >
            <Trash2 className="w-4 h-4 text-keep-toolbar" />
          </button>
        </div>
      ) : (
        <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-1 transition-opacity opacity-0 group-hover:opacity-100">
          {/* Color picker */}
          <div ref={colorRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();

                setShowColors(!showColors);
                setShowMore(false);
              }}
              className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors"
              title="Màu nền"
            >
              <Palette className="w-4 h-4 text-keep-toolbar" />
            </button>
            {showColors && (
              <div className={`absolute ${openUp ? "bottom-full mb-1" : "top-full mt-1"} ${openRight ? "right-0" : "left-0"} p-2 bg-card rounded-lg keep-shadow z-10 flex gap-1 flex-wrap w-39`}>
                {noteColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onColorChange(note.id, c.value);
                    }}
                    className={`w-6 h-6 cursor-pointer rounded-full border-2 ${note.color === c.value ? "border-primary" : "border-transparent hover:border-keep-icon"} ${c.class}`}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors" title="Nhắc tôi"
            onClick={(e) => e.stopPropagation()}
          >
            <Bell className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowCollaborators(true); }}
            className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors"
            title="Cộng tác viên"
          >
            <UserPlus className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button
            className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors" title="Thêm hình ảnh"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageIcon className="w-4 h-4 text-keep-toolbar" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.(note.id);
            }}
            className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors"
            title={note.archived ? "Bỏ lưu trữ" : "Lưu trữ"}
          >
            <Archive className="w-4 h-4 text-keep-toolbar" />
          </button>

          {/* More options */}
          <div ref={moreRef} className="relative">
            <button
              ref={moreButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                if (!showMore) handleCalculatePosition(moreButtonRef);
                setShowMore(!showMore);
                setShowColors(false);
              }}
              className="p-2 cursor-pointer rounded-full hover:bg-secondary/50 transition-colors"
              title="Tuỳ chọn khác"
            >
              <MoreVertical className="w-4 h-4 text-keep-toolbar" />
            </button>

            {showMore && (
              <div className={`absolute ${openUp ? "bottom-full mb-1" : "top-full mt-1"} ${openRight ? "right-0" : "left-0"} bg-card rounded-lg keep-shadow z-10 py-1 min-w-40`}>
                {isOwner ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); setShowMore(false); }}
                    className="flex cursor-pointer items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
                  >
                    Xoá ghi chú
                  </button>
                ) : (
                  (note.memberIds?.includes(user?.uid || "")) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowLeaveDialog(true); setShowMore(false); }}
                      className="flex cursor-pointer items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
                    >
                      Huỷ cộng tác
                    </button>
                  )
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMore(false); setShowLabels(true); }}
                  className="flex cursor-pointer items-center gap-3 w-full px-4 py-2 text-sm text-card-foreground hover:bg-secondary transition-colors"
                >
                  Thêm nhãn
                </button>
              </div>
            )}
            {showLabels && (
              <div
                ref={labelRef}
                className={`absolute ${openUp ? "bottom-full mb-1" : "top-full mt-1"} ${openRight ? "right-0" : "left-0"} bg-card rounded-lg keep-shadow z-10 p-3 w-64`}
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
      <CollaboratorDialog
        open={showCollaborators}
        collaborators={note.memberIds ?? []}
        ownerId={note.ownerId}
        onClose={() => setShowCollaborators(false)}
        onAddCollaborator={(email) => {
          onCollaboratorsAdd?.(note.id, email);
        }}
        onRemoveCollaborator={(email) => {
          onCollaboratorsRemove?.(note.id, email);
        }}
      />

      {/* Delete note dialog - for owner */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá ghi chú?</AlertDialogTitle>
            <AlertDialogDescription>
              Ghi chú bị xoá sẽ không hiển thị với những người bạn đã chia sẻ ghi chú đó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end items-baseline gap-2">
            <AlertDialogCancel className="cursor-pointer hover:bg-secondary" onClick={e => e.stopPropagation()}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(false);
                onDelete(note.id);
              }}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave note dialog - for collaborators */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Huỷ cộng tác?</AlertDialogTitle>
            <AlertDialogDescription>
              Ghi chú này sẽ không còn được chia sẻ với bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end items-baseline gap-2">
            <AlertDialogCancel className="cursor-pointer hover:bg-secondary">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLeaveDialog(false);
                onLeaveNote?.(note.id);
              }}
            >
              Huỷ cộng tác
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent delete dialog */}
      <AlertDialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Ghi chú này sẽ được xoá hoàn toàn và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end items-baseline gap-2">
            <AlertDialogCancel className="cursor-pointer hover:bg-secondary" onClick={e => e.stopPropagation()}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                setShowPermanentDeleteDialog(false);
                onPermanentDelete?.(note.id);
              }}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá vĩnh viễn
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default memo(NoteCard);
