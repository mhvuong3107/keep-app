'use client';
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import {
    addLabel as addLabelAction,
    removeLabel as removeLabelAction,
    updateLabel as updateLabelAction,
    mergeLabel as mergeLabelAction,
    setLabels,
    fetchLabelsFromFirestore,
    addLabelToFirestore,
    updateLabelInFirestore,
    deleteLabelFromFirestore,
    subscribeToUserLabels,
} from "@/lib/features/labelsSlice";
import { mergeLabelReferences, updateNoteInFirestore } from "@/lib/features/notesSlice";

export const useLabels = () => {
    const dispatch = useDispatch<AppDispatch>();
    const labels = useSelector((state: RootState) => state.labels.labels);
    const notes = useSelector((state: RootState) => state.notes.notes);
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (!user?.uid) {
            return;
        }

        dispatch(fetchLabelsFromFirestore(user.uid));
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

        if (user?.uid) {
            dispatch(addLabelToFirestore({ userId: user.uid, name: name.trim() }));
        } else {
            dispatch(addLabelAction({ name: name.trim() }));
        }
        return { success: true };
    };

    const removeLabel = (id: string) => {
        if (user?.uid) {
            dispatch(deleteLabelFromFirestore({ userId: user.uid, labelId: id }));
        } else {
            dispatch(removeLabelAction(id));
        }
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

        if (user?.uid) {
            dispatch(updateLabelInFirestore({ userId: user.uid, labelId: id, newName: newName.trim() }));
        } else {
            dispatch(updateLabelAction({ id, newName: newName.trim() }));
        }

        return { success: true };
    };

    const mergeLabel = (sourceId: string, targetId: string) => {
        dispatch(mergeLabelReferences({ sourceId, targetId }));

        if (user?.uid) {
            notes
                .filter((note) => note.labelIds?.includes(sourceId))
                .forEach((note) => {
                    const mergedLabelIds = [...(note.labelIds?.filter((id) => id !== sourceId) ?? [])];
                    if (!mergedLabelIds.includes(targetId)) mergedLabelIds.push(targetId);
                    dispatch(updateNoteInFirestore({ userId: user.uid, noteId: note.id, updatedFields: { labelIds: mergedLabelIds } }));
                });
            dispatch(deleteLabelFromFirestore({ userId: user.uid, labelId: sourceId }));
            dispatch(mergeLabelAction({ sourceId, targetId }));
        } else {
            dispatch(mergeLabelAction({ sourceId, targetId }));
            dispatch(removeLabelAction(sourceId));
        }
            
        return { success: true };
    };

    const sortedLabels = useMemo(() => [...labels].sort((a, b) => a.name.localeCompare(b.name)), [labels]);

    return {
        labels: sortedLabels,
        addLabel,
        removeLabel,
        updateLabel,
        mergeLabel,
    };
};