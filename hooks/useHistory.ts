import { useState, useRef, useCallback } from "react";

export interface HistoryEntry {
  title: string;
  content: string;
}

export function useHistory(initialTitle = "", initialContent = "") {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { title: initialTitle, content: initialContent },
  ]);

  const [historyIndex, setHistoryIndex] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushHistory = useCallback(
    (title: string, content: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setHistory(prev => {
          const next = prev.slice(0, historyIndex + 1);
          next.push({ title, content });
          return next;
        });

        setHistoryIndex(prev => prev + 1);
      }, 400);
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex === 0) return;

    const next = historyIndex - 1;
    setHistoryIndex(next);

    return history[next];
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const next = historyIndex + 1;
    setHistoryIndex(next);

    return history[next];
  }, [historyIndex, history]);

  return {
    history,
    historyIndex,
    pushHistory,
    undo,
    redo,
  };
}