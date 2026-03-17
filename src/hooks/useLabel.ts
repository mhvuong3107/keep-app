import { useState, useEffect } from "react";
import Label from "@/types/label";
import { loadNotes, saveNotes } from "./useNotes";

const LabelKey = "keep_labels";

export const loadLabels = (): Label[] => {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(LabelKey);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Error loading labels from localStorage:", error);
    }
    return [];
};
export const saveLabels = (labels: Label[]) => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(LabelKey, JSON.stringify(labels));
        window.dispatchEvent(new Event("labelsUpdated"));
    } catch (error) {
        console.error("Error saving labels to localStorage:", error);
    }
};

export const useLabels = () => {
    const [labels, setLabels] = useState<Label[]>([]);

    useEffect(() => {
        setLabels(loadLabels());
        //eslint-disable-next-line react-hooks/exhaustive-deps
        const syncLabels = () => {
            setLabels(loadLabels());
        };
        window.addEventListener("labelsUpdated", syncLabels);
        return () => {
            window.removeEventListener("labelsUpdated", syncLabels);
        }
    }, []);
    const addLabel = (name: string) => {
        const normalized = name.trim().toLowerCase();

        if (labels.some((l) => l.name.toLowerCase() === normalized)) {
            return { success: false, message: "Nhãn đã tồn tại" };
        }

        const newLabel: Label = {
            id: Date.now().toString(),
            name: name.trim(),
        };

        const updated = [...labels, newLabel];

        setLabels(updated);
        saveLabels(updated);

        return { success: true, label: newLabel };
    };
    const removeLabel = (id: string) => {
        const updated = labels.filter((l) => l.id !== id);
        setLabels(updated);
        saveLabels(updated);
    }
    const updateLabel = (id: string, newName: string) => {
        const current = labels.find((l) => l.id === id);
        const normalized = newName.trim().toLowerCase();

        const duplicate = labels.find(
            (l) => l.name.toLowerCase() === normalized && l.id !== id
        );

        if (duplicate) {
            return {
                success: false,
                message: `Bạn có muốn hợp nhất các ghi chú của nhãn "${current?.name}" với nhãn "${duplicate.name}" và xoá nhãn "${current?.name}"?`,
                mergeTargetId: duplicate.id
            };
        }

        const updated = labels.map((l) =>
            l.id === id ? { ...l, name: newName.trim() } : l
        );

        setLabels(updated);
        saveLabels(updated);

        return { success: true };
    };
    const mergeLabel = (sourceId: string, targetId: string) => {
        const notes = loadNotes()

        const updatedNotes = notes.map(note => {
            if (!note.labelIds?.includes(sourceId)) return note

            const ids = note.labelIds
                .filter(id => id !== sourceId)

            if (!ids.includes(targetId)) {
                ids.push(targetId)
            }

            return {
                ...note,
                labelIds: ids
            }
        })

        saveNotes(updatedNotes)

        const updatedLabels = labels.filter(l => l.id !== sourceId)

        setLabels(updatedLabels)
        saveLabels(updatedLabels)

        return { success: true }
    }

    return { labels, addLabel, removeLabel, updateLabel, mergeLabel };
}