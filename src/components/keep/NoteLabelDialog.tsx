import { useState, useRef } from "react";
import { Plus, X, Check } from "lucide-react";
import { useLabels } from "@/hooks/useLabel";
import { Input } from "@/components/ui/input";
import LabelItem from "./LabelItem";
import { AlertDialog } from "radix-ui";


interface NoteLabelDialogProps {
    onClose?: () => void;
}

export default function NoteLabelDialog({ onClose }: NoteLabelDialogProps) {
    const { labels, addLabel, removeLabel, updateLabel, mergeLabel } = useLabels();
    const [error, setError] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [mergeSourceId, setMergeSourceId] = useState<string | undefined>(undefined);
    const [mergeTargetId, setMergeTargetId] = useState<string | undefined>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLabelId, setDeleteLabelId] = useState<string | undefined>(undefined);

    const handleAddLabel = () => {
        const result = addLabel(newLabel);

        if (!result.success) {
            setError(result.message as string);
            return;
        }

        setNewLabel("");
        setError("");
    };

    const handleDeleteLabel = (labelId: string) => {
        setDeleteLabelId(labelId);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteLabel = () => {
        if (!deleteLabelId) {
            return;
        }

        removeLabel(deleteLabelId);
        setDeleteDialogOpen(false);
        setDeleteLabelId(undefined);
    };

    const handleUpdateLabel = (id: string, name: string) => {
        const result = updateLabel(id, name);

        if (!result.success) {
            setAlertMessage(result.message as string);

            setMergeSourceId(id);
            setMergeTargetId(result.mergeTargetId);

            setAlertOpen(true);
            return;
        }
    };
    const handleConfirmMerge = () => {
        if (mergeSourceId && mergeTargetId) {
            mergeLabel(mergeSourceId, mergeTargetId);
        }

        setAlertOpen(false);
        setMergeSourceId(undefined);
        setMergeTargetId(undefined);
    };

    const deleteLabel = labels.find((label) => label.id === deleteLabelId);

    return (
        <div className=" p-4 rounded-none">
            <h3 className="text-lg text-center font-semibold mb-4">Chỉnh sửa nhãn</h3>
            {/* Add New Label */}
            <div className="flex items-center gap-2 mb-4">
                {isAdding ?
                    <button onClick={() => { setIsAdding(false); setNewLabel(""); }}>
                        <X className="cursor-pointer w-5 h-5 hover:text-gray-900 hover:bg-secondary/70 text-muted-foreground" />
                    </button> :
                    <button onClick={() => {
                        setIsAdding(true);
                        inputRef.current?.focus();
                    }} disabled={isAdding} >
                        <Plus className="cursor-pointer w-5 h-5 hover:text-gray-900 hover:bg-secondary/70 text-muted-foreground" />
                    </button>}
                <Input
                    ref={inputRef}
                    placeholder="Thêm nhãn mới"
                    className="border-0 border-b rounded-none focus-visible:border-b-black focus-visible:ring-0 focus-visible:outline-none"
                    value={newLabel}
                    onFocus={() => setIsAdding(true)}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddLabel();
                        }
                    }}
                />
                {isAdding && (
                    <button onClick={handleAddLabel} >
                        <Check className="cursor-pointer w-5 h-5 hover:text-gray-900 hover:bg-secondary/70 text-muted-foreground" />
                    </button>
                )}

            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {/* Labels List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {labels.map((label) => (
                    <LabelItem
                        key={label.id}
                        label={label}
                        onDelete={() => handleDeleteLabel(label.id)}
                        onUpdate={handleUpdateLabel}
                    />
                ))}
            </div>
            {/* Close Button */}
            {onClose && (
                <div className="flex font-medium text-sm justify-end gap-2 mt-4 pt-3">
                    <button onClick={onClose} className="cursor-pointer">
                        Xong
                    </button>
                </div>
            )}
            {/* Delete confirmation dialog */}
            <AlertDialog.Root open={deleteDialogOpen} onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setDeleteLabelId(undefined);
            }}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />

                    <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-96 z-50">
                        <AlertDialog.Title className="text-lg font-semibold">
                            {deleteLabel?.name ? `Xoá nhãn "${deleteLabel.name}"?` : "Xoá nhãn này?"}
                        </AlertDialog.Title>

                        <AlertDialog.Description className="text-sm mt-2">
                            Xoá nhãn này và gỡ khỏi tất cả các note có gắn nhãn?
                        </AlertDialog.Description>

                        <div className="flex justify-end gap-2 mt-4">
                            <AlertDialog.Cancel asChild>
                                <button className="cursor-pointer px-2 py-1 border text-sm ">
                                    Hủy
                                </button>
                            </AlertDialog.Cancel>

                            <button
                                onClick={confirmDeleteLabel}
                                className="cursor-pointer px-2 py-1 bg-destructive text-white text-sm"
                            >
                                Xoá
                            </button>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>

            {/* Merge label alert dialog */}
            <AlertDialog.Root open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />

                    <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 w-96 z-50">
                        <AlertDialog.Title className="text-lg font-semibold">
                            Hợp nhất nhãn
                        </AlertDialog.Title>

                        <AlertDialog.Description className="text-sm mt-2">
                            {alertMessage}
                        </AlertDialog.Description>

                        <div className="flex justify-end gap-2 mt-4">
                            <AlertDialog.Cancel asChild>
                                <button className="cursor-pointer px-2 py-1 border text-sm ">
                                    Hủy
                                </button>
                            </AlertDialog.Cancel>

                            <button
                                onClick={handleConfirmMerge}
                                className="cursor-pointer px-2 py-1 bg-primary text-white text-sm"
                            >
                                Hợp nhất
                            </button>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </div>
    );
}
