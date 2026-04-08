import { useState } from "react";
import { X } from "lucide-react";
import { useCollaborators } from "@/hooks/useCollaborators";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useToasts } from "@/components/ToastProvider";

interface CollaboratorDialogProps {
  open: boolean;
  collaborators: string[];
  ownerId: string;
  onClose: () => void;
  onAddCollaborator: (uid: string) => void;
  onRemoveCollaborator: (uid: string) => void;
}

const CollaboratorDialog = ({
  open,
  collaborators,
  ownerId,
  onClose,
  onAddCollaborator,
  onRemoveCollaborator,
}: CollaboratorDialogProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{ uid: string; name: string } | null>(null);
  const { collaborators: collaboratorUsers, loading } = useCollaborators(collaborators);
  const { collaborators: ownerUsers } = useCollaborators([ownerId]);
  const { addToast } = useToasts();

  if (!open) return null;

  const owner = ownerUsers[0];
  const ownerDisplay = owner?.displayName || owner?.email || "Unknown";

  // Filter out owner from collaborators list
  const filteredCollaborators = collaboratorUsers.filter(user => user.uid !== ownerId);

  const handleAdd = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Vui lòng nhập email");
      return;
    }

    setIsAdding(true);
    setError("");

    try {
      // Lookup user từ email
      const usersQuery = query(collection(db, "users"), where("email", "==", trimmed));
      const snapshot = await getDocs(usersQuery);

      if (snapshot.empty) {
        setError("Không tìm thấy người dùng với email này");
        setIsAdding(false);
        return;
      }

      const foundUser = snapshot.docs[0].data();

      // Check if already added
      if (collaborators.includes(foundUser.uid)) {
        setError("Người dùng này đã được thêm");
        setIsAdding(false);
        return;
      }

      onAddCollaborator(foundUser.uid);
      addToast({
        title: "Thêm cộng tác viên thành công",
        description: `${foundUser.displayName || foundUser.email} đã được thêm.`,
        variant: "default",
      });
      setEmail("");
    } catch (err) {
      setError("Lỗi khi tìm người dùng");
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card rounded-lg w-full max-w-md p-4 shadow-xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cộng tác viên</h3>
          <button
            className="p-1 hover:bg-secondary/30 rounded cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3 text-sm text-muted-foreground">
          Người sở hữu: {ownerDisplay}
        </div>

        <label className="text-xs uppercase tracking-wide text-muted-foreground">Email cộng tác</label>
        <div className="mt-1 flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="email@example.com"
            className="flex-1 rounded border p-2 text-sm bg-background"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleAdd();
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
            disabled={isAdding}
            className="rounded bg-primary px-3 text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAdding ? "Đang xử lý..." : "Thêm"}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : filteredCollaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có cộng tác viên nào.</p>
          ) : (
            filteredCollaborators.map((user) => (
              <div key={user.uid} className="flex items-center justify-between rounded border p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.displayName || user.email}</span>
                </div>
                <button
                  className="p-1 hover:bg-secondary/30 rounded cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRemoveConfirm({
                      uid: user.uid,
                      name: user.displayName || user.email || "Unknown",
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={!!removeConfirm} onOpenChange={(open) => !open && setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá cộng tác viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá <span className="font-semibold text-foreground">{removeConfirm?.name}</span> khỏi cộng tác viên không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end items-baseline gap-2">
            <AlertDialogCancel className="hover:bg-secondary">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeConfirm) {
                  onRemoveCollaborator(removeConfirm.uid);
                  setRemoveConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollaboratorDialog;
