"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode[];
  minColumnWidth?: number;
  gap?: number;
}

const MasonryGrid = ({ children, minColumnWidth = 240, gap = 8 }: MasonryGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const cols = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
      setColumnCount(cols);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [minColumnWidth, gap]);

  const columns: ReactNode[][] = Array.from({ length: columnCount }, () => []);
  (children as ReactNode[]).forEach((child, i) => {
    columns[i % columnCount].push(child);
  });

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", gap: `${gap}px`, alignItems: "flex-start" }}
    >
      {columns.map((col, colIdx) => (
        <div
          key={colIdx}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: `${gap}px`, minWidth: 0 }}
        >
          {col}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;