import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ChecklistItem {
    checked: boolean;
    text: string;
}

interface ChecklistPreviewProps {
    content: string;
    maxItems?: number; // Max unchecked items to show before truncating
    onToggleItem?: (index: number, content: string) => void; // Callback when item is toggled
}

const parseChecklistContent = (content: string): ChecklistItem[] => {
    return content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
            const checked = line.startsWith("☑");
            const text = line.replace(/^[☑☐]\s*/, "").trim();
            return { checked, text };
        });
};

const generateChecklistContent = (items: ChecklistItem[]): string => {
    return items
        .map((item) => `${item.checked ? "☑" : "☐"} ${item.text}`)
        .join("\n");
};

export const ChecklistPreview = ({
    content,
    maxItems = 4,
    onToggleItem,
}: ChecklistPreviewProps) => {
    const [isExpandedCompleted, setIsExpandedCompleted] = useState(false);
    const [items, setItems] = useState(() => parseChecklistContent(content));

    // Update items when content prop changes (e.g., after dialog closes and Redux updates)
    useEffect(() => {
        setItems(parseChecklistContent(content));
    }, [content]);

    const uncheckedItems = useMemo(() => items.filter((item) => !item.checked), [items]);
    const completedItems = useMemo(() => items.filter((item) => item.checked), [items]);

    const hasMore = uncheckedItems.length > maxItems;
    const visibleUnchecked = hasMore
        ? uncheckedItems.slice(0, maxItems - 1)
        : uncheckedItems;

    const handleToggleItem = useCallback(
        (itemIndex: number) => {
            const newItems = [...items];
            newItems[itemIndex].checked = !newItems[itemIndex].checked;
            setItems(newItems);

            // Generate new content and notify parent
            const newContent = generateChecklistContent(newItems);
            onToggleItem?.(itemIndex, newContent);
        },
        [items, onToggleItem]
    );

    if (items.length === 0) return null;

    return (
        <div className="space-y-1 text-sm">
            {/* Unchecked items */}
            {visibleUnchecked.map((item, visibleIndex) => {
                const actualIndex = items.findIndex(
                    (i) => i.text === item.text && i.checked === item.checked
                );
                return (
                    <div key={actualIndex} className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleItem(actualIndex)}
                            className="w-4 h-4 rounded border-muted-foreground/50 cursor-pointer mt-0.5 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-foreground break-words flex-1">{item.text}</span>
                    </div>
                );
            })}

            {/* Show more unchecked */}
            {hasMore && (
                <div className="text-sm text-muted-foreground py-1">
                    +{uncheckedItems.length - maxItems + 1} mục còn lại
                </div>
            )}

            {/* Completed items section */}
            {completedItems.length > 0 && (
                <div className="pt-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpandedCompleted(!isExpandedCompleted);
                        }}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                        {isExpandedCompleted ? (
                            <ChevronUp className="w-3 h-3" />
                        ) : (
                            <ChevronDown className="w-3 h-3" />
                        )}
                        <span>
                            {completedItems.length}{" "}
                            {completedItems.length === 1 ? "mục" : "mục"} đã hoàn tất
                        </span>
                    </button>

                    {/* Completed items list */}
                    {isExpandedCompleted && (
                        <div className="space-y-1 pl-4 pt-1">
                            {completedItems.map((item) => {
                                const actualIndex = items.findIndex(
                                    (i) => i.text === item.text && i.checked === true
                                );
                                return (
                                    <div key={actualIndex} className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => handleToggleItem(actualIndex)}
                                            className="w-4 h-4 rounded border-muted-foreground/50 cursor-pointer accent-primary mt-0.5 flex-shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-muted-foreground line-through break-words flex-1 text-sm">
                                            {item.text}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const isChecklistContent = (content: string): boolean => {
    return content.trim().startsWith("☑") || content.trim().startsWith("☐");
};
