'use client';
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import {
    addLabel as addLabelAction,
    removeLabel as removeLabelAction,
    updateLabel as updateLabelAction,
    mergeLabel as mergeLabelAction,
} from "@/lib/features/labelsSlice";
import { mergeLabelReferences } from "@/lib/features/notesSlice";

export const useLabels = () => {
    const dispatch = useDispatch<AppDispatch>();
    const labels = useSelector((state: RootState) => state.labels.labels);

    const addLabel = (name: string) => {
        const normalized = name.trim().toLowerCase();
        if (!name.trim()) {
            return { success: false, message: "Tên nhãn không được trống" };
        }
        if (labels.some((l) => l.name.toLowerCase() === normalized)) {
            return { success: false, message: "Nhãn đã tồn tại" };
        }
        dispatch(addLabelAction({ name }));
        return { success: true };
    };

    const removeLabel = (id: string) => {
        dispatch(removeLabelAction(id));
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

        dispatch(updateLabelAction({ id, newName }));
        return { success: true };
    };

    const mergeLabel = (sourceId: string, targetId: string) => {
        dispatch(mergeLabelReferences({ sourceId, targetId }));
        dispatch(mergeLabelAction({ sourceId, targetId }));
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