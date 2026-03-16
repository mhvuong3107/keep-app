import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLabels } from "@/hooks/useLabel";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNotes } from "@/hooks/useNotes";

interface NoteLabelSelectorProps {
  labelIds?: string[];
  noteId?: string;          
  onChange?: (labelIds: string[]) => void;
}

export default function NoteLabelSelector({
  labelIds = [],
  noteId,
  onChange,
}: NoteLabelSelectorProps) {
  const { labels } = useLabels();
  const [query, setQuery] = useState("");
  const { addLabel, removeLabel } = useNotes();

  const normalizedSelected = useMemo(
    () => new Set(labelIds),
    [labelIds]
  );

  const handleToggle = (labelId: string) => {
    const isSelected = normalizedSelected.has(labelId);
    if (noteId) {
      if (isSelected) {
        removeLabel(noteId, labelId);
      } else {
        addLabel(noteId, labelId);
      }
      return;
    }


    if (!onChange) return;

    const updated = isSelected
      ? labelIds.filter((id) => id !== labelId)
      : [...labelIds, labelId];

    onChange(updated);
  };

  const filteredLabels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return labels;
    return labels.filter((label) => label.name.toLowerCase().includes(q));
  }, [labels, query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhãn..."
            className="pl-9 !ring-0 border-0"
          />
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1">
        {filteredLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có nhãn</p>
        ) : (
          filteredLabels.map((label) => (
            <div
              key={label.id}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(label.id);
              }}
            >
              <Checkbox
                checked={normalizedSelected.has(label.id)}
                onCheckedChange={() => handleToggle(label.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm">{label.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}