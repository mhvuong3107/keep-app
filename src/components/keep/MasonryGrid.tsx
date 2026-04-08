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

    const updateColumnCount = () => {
      const width = container.getBoundingClientRect().width || 800;
      if (width < 500) {
        setColumnCount(1);
        return;
      }
      const cols = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
      setColumnCount(cols);
    };

    // Initial measurement
    updateColumnCount();

    const observer = new ResizeObserver(() => {
      updateColumnCount();
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
      style={{ display: "flex", flexWrap: "wrap", gap: `${gap}px`, overflow: "visible" }}
    >
      {columns.map((col, colIdx) => (
        <div
          key={colIdx}
          style={{
            flex:1, display: "flex", flexDirection: "column", gap: `${gap}px`, minWidth: 0
          }}
        >
          {col}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
