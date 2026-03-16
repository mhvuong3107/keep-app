import { useState, useRef } from "react";
import { Tag, Trash, Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import Label from "@/types/label";


interface LabelItemProps {
  label: Label;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string) => void;
}

export default function LabelItem({ label, onDelete, onUpdate }: LabelItemProps) {
  const [isHover, setIsHover] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(label.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleBlur = () => {
    if (value.trim() !== label.name) {
      onUpdate(label.id, value.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className="flex items-center gap-2 py-1"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {/* LEFT ICON */}
      {isHover || isEditing ? (
        <button className="hover:bg-secondary/70 rounded" onClick={() => onDelete(label.id)}>
          <Trash className="w-5 h-5 text-muted-foreground" />
        </button>
      ) : (
        <Tag className="w-5 h-5 text-muted-foreground" />
      )}

      {/* INPUT */}
      <Input
        ref={inputRef}
        value={value}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 border-none shadow-none focus-visible:ring-0"
      />

      {/* RIGHT ICON */}
      {isEditing ? (
        <Check className="w-5 h-5 text-muted-foreground" />
      ) : (
        <button className="hover:bg-secondary/70 rounded" onClick={() => {
          setIsEditing(true);
          inputRef.current?.focus();
        }}>
          <Pencil className="w-5 h-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}