import { Bold, Italic, Underline, Strikethrough, Type } from "lucide-react";

interface NoteFormattingToolbarProps {
  activeFormats: Set<string>;
  onApplyFormat: (command: string, value?: string) => void;
  onApplyHeading: (tag: string) => void;
}

const NoteFormattingToolbar = ({ activeFormats, onApplyFormat, onApplyHeading }: NoteFormattingToolbarProps) => {
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-t border-border/30">
      {/* Heading types */}
      <button
        onMouseDown={(e) => { e.preventDefault(); onApplyHeading("h1"); }}
        className={`px-2.5 py-1.5 rounded text-sm font-semibold transition-colors ${activeFormats.has("h1") ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-keep-toolbar"}`}
        title="Tiêu đề 1"
      >
        H1
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onApplyHeading("h2"); }}
        className={`px-2.5 py-1.5 rounded text-sm font-semibold transition-colors ${activeFormats.has("h2") ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-keep-toolbar"}`}
        title="Tiêu đề 2"
      >
        H2
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onApplyHeading("div"); }}
        className={`p-1.5 rounded transition-colors ${!activeFormats.has("h1") && !activeFormats.has("h2") ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-keep-toolbar"}`}
        title="Văn bản thường"
      >
        <Type className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border/50 mx-2" />

      {/* Text styles */}
      <button
        onMouseDown={(e) => { e.preventDefault(); onApplyFormat("bold"); }}
        className={`p-1.5 rounded transition-colors ${activeFormats.has("bold") ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-keep-toolbar"}`}
        title="Đậm"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onApplyFormat("italic"); }}
        className={`p-1.5 rounded transition-colors ${activeFormats.has("italic") ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-keep-toolbar"}`}
        title="Nghiêng"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onApplyFormat("underline"); }}
        className={`p-1.5 rounded transition-colors ${activeFormats.has("underline") ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-keep-toolbar"}`}
        title="Gạch chân"
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onApplyFormat("strikeThrough"); }}
        className={`p-1.5 rounded transition-colors ${activeFormats.has("strikeThrough") ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-keep-toolbar"}`}
        title="Gạch ngang"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NoteFormattingToolbar;
