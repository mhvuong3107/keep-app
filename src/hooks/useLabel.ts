'use client';
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import {
    setLabels,
    addLabelToFirestore,
    updateLabelInFirestore,
    deleteLabelFromFirestore,
    subscribeToUserLabels,
} from "@/lib/features/labelsSlice";
import { mergeLabelReferences, updateNoteInFirestore } from "@/lib/features/notesSlice";

export const useLabels = () => {
    const dispatch = useDispatch<AppDispatch>();
    const labels = useSelector((state: RootState) => state.labels.labels);
    const loaded = useSelector((state: RootState) => state.labels.loaded);
    const notes = useSelector((state: RootState) => state.notes.notes);
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (!user?.uid) {
            return;
        }

        const unsubscribe = subscribeToUserLabels(user.uid, (labels) => {
            dispatch(setLabels(labels));
        });

        return () => unsubscribe();
    }, [user?.uid, dispatch]);

    const addLabel = (name: string) => {
        const normalized = name.trim().toLowerCase();
        if (!name.trim()) {
            return { success: false, message: "Tên nhãn không được trống" };
        }
        if (labels.some((l) => l.name.toLowerCase() === normalized)) {
            return { success: false, message: "Nhãn đã tồn tại" };
        }

        if (!user?.uid) {
            return { success: false, message: "Vui lòng đăng nhập để thực hiện hành động này" };
        }

        dispatch(addLabelToFirestore({ userId: user.uid, name: name.trim() }));
        return { success: true };
    };

    const removeLabel = (id: string) => {
        if (!user?.uid) {
          return { success: false, message: "Vui lòng đăng nhập để thực hiện hành động này" };
        }

        notes
            .filter((note) => note.labelIds?.includes(id))
            .forEach((note) => {
                const updatedLabelIds = note.labelIds?.filter((labelId) => labelId !== id) ?? [];
                dispatch(updateNoteInFirestore({ userId: user.uid, noteId: note.id, updatedFields: { labelIds: updatedLabelIds } }));
            });

        dispatch(deleteLabelFromFirestore({ userId: user.uid, labelId: id }));
    };

    const updateLabel = (id: string, newName: string) => {
        const current = labels.find((l) => l.id === id);
        const normalized = newName.trim().toLowerCase();

        const duplicate = labels.find((l) => l.name.toLowerCase() === normalized && l.id !== id);
        if (duplicate) {
            return {
                success: false,
                message: `Bạn có muốn hợp nhất các ghi chú của nhãn "${current?.name}" với nhãn "${duplicate.name}" và xoá nhãn "${current?.name}"?`,
                mergeTargetId: duplicate.id,
            };
        }

        if (!user?.uid) {
            return { success: false, message: "Vui lòng đăng nhập để thực hiện hành động này" };
        }

        dispatch(updateLabelInFirestore({ userId: user.uid, labelId: id, newName: newName.trim() }));

        return { success: true };
    };

    const mergeLabel = (sourceId: string, targetId: string) => {
        if (!user?.uid) {
            return { success: false, message: "Vui lòng đăng nhập để thực hiện hành động này" };
        }

        dispatch(mergeLabelReferences({ sourceId, targetId }));

        notes
            .filter((note) => note.labelIds?.includes(sourceId))
            .forEach((note) => {
                const mergedLabelIds = [...(note.labelIds?.filter((id) => id !== sourceId) ?? [])];
                if (!mergedLabelIds.includes(targetId)) mergedLabelIds.push(targetId);
                dispatch(updateNoteInFirestore({ userId: user.uid, noteId: note.id, updatedFields: { labelIds: mergedLabelIds } }));
            });
        dispatch(deleteLabelFromFirestore({ userId: user.uid, labelId: sourceId }));

        return { success: true };
    };

    const sortedLabels = useMemo(() => [...labels].sort((a, b) => a.name.localeCompare(b.name)), [labels]);

    return {
        labels: sortedLabels,
        loaded,
        addLabel,
        removeLabel,
        updateLabel,
        mergeLabel,
    };
};
