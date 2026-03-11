import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

interface UseNoteEditorOptions {
  initialTitle?: string;
  initialContent?: string;
  containerRef: React.RefObject<HTMLElement>;
}

export function useNoteEditor({ initialTitle = "", initialContent = "", containerRef }: UseNoteEditorOptions) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [showMore, setShowMore] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());


  const moreRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const normalized = html === "<p></p>" ? "" : html;
      setContent(normalized);
    },
    onSelectionUpdate: ({ editor }) => {
      updateFormatsFromEditor(editor);
    },
    onTransaction: ({ editor }) => {
      updateFormatsFromEditor(editor);
    },
  });

  const updateFormatsFromEditor = useCallback((ed: Editor) => {
    const formats = new Set<string>();
    if (ed.isActive("bold")) formats.add("bold");
    if (ed.isActive("italic")) formats.add("italic");
    if (ed.isActive("underline")) formats.add("underline");
    if (ed.isActive("strike")) formats.add("strikeThrough");
    if (ed.isActive("heading", { level: 1 })) formats.add("h1");
    if (ed.isActive("heading", { level: 2 })) formats.add("h2");
    setActiveFormats(formats);
  }, []);

  const undo = useCallback(() => {
    editor?.commands.undo();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.commands.redo();
  }, [editor]);

  const canUndo = useMemo(() => editor?.can().undo() ?? false, [editor]);
  const canRedo = useMemo(() => editor?.can().redo() ?? false, [editor]);

  // Outside click -> Close dropdowns
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColors(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleTitleChange = useCallback((val: string) => {
    setTitle(val);
  }, []);

  const toggleChecklist = useCallback(() => {
    if (!isChecklist) {
      // Strip HTML and split into lines
      const text = editor?.getText() || content.replace(/<[^>]*>/g, '');
      const lines = text.split("\n").filter(l => l.trim());
      setChecklistItems(lines.length > 0 ? lines.map(l => ({ text: l, checked: false })) : [{ text: "", checked: false }]);
      setIsChecklist(true);
    } else {
      setContent(checklistItems.filter(i => i.text.trim()).map(i => i.text).join("\n"));
      editor?.commands.setContent(checklistItems.filter(i => i.text.trim()).map(i => `<p>${i.text}</p>`).join(""));
      setIsChecklist(false);
    }
  }, [isChecklist, content, checklistItems, editor]);

  const updateChecklistItem = useCallback((index: number, text: string) => {
    setChecklistItems(prev => prev.map((item, i) => i === index ? { ...item, text } : item));
  }, []);

  const toggleChecklistItem = useCallback((index: number) => {
    setChecklistItems(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  }, []);

  const handleChecklistKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setChecklistItems(prev => {
        const newItems = [...prev];
        newItems.splice(index + 1, 0, { text: "", checked: false });
        return newItems;
      });
      setTimeout(() => {
        containerRef.current?.querySelectorAll<HTMLInputElement>(".checklist-input")?.[index + 1]?.focus();
      }, 0);
    }
    if (e.key === "Backspace" && checklistItems[index]?.text === "" && checklistItems.length > 1) {
      e.preventDefault();
      setChecklistItems(prev => prev.filter((_, i) => i !== index));
      setTimeout(() => {
        containerRef.current?.querySelectorAll<HTMLInputElement>(".checklist-input")?.[Math.max(0, index - 1)]?.focus();
      }, 0);
    }
  }, [checklistItems, containerRef]);

  const removeChecklistItem = useCallback((index: number) => {
    if (checklistItems.length > 1) setChecklistItems(prev => prev.filter((_, i) => i !== index));
  }, [checklistItems.length]);

  const applyFormat = useCallback((command: string) => {
    if (!editor) return;
    editor.chain().focus();
    switch (command) {
      case "bold": editor.chain().focus().toggleBold().run(); break;
      case "italic": editor.chain().focus().toggleItalic().run(); break;
      case "underline": editor.chain().focus().toggleUnderline().run(); break;
      case "strikeThrough": editor.chain().focus().toggleStrike().run(); break;
    }
  }, [editor]);

  const applyHeading = useCallback((tag: string) => {
    if (!editor) return;
    if (tag === "h1") {
      if (editor.isActive("heading", { level: 1 })) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
    } else if (tag === "h2") {
      if (editor.isActive("heading", { level: 2 })) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      }
    } else {
      editor.chain().focus().setParagraph().run();
    }
  }, [editor]);

  const getContent = useCallback(() => {
    if (isChecklist) {
      return checklistItems
        .filter(item => item.text.trim())
        .map(item => `${item.checked ? "☑" : "☐"} ${item.text}`)
        .join("\n");
    }
    const html = editor?.getHTML() || content;
    return html === "<p></p>" ? "" : html;
  }, [isChecklist, checklistItems, content, editor]);

  const resetEditor = useCallback((newTitle = "", newContent = "") => {
    setTitle(newTitle);
    setContent(newContent);
    editor?.commands.setContent(newContent);
    setShowMore(false);
    setShowColors(false);
    setShowFormatting(false);
    setIsChecklist(false);
    setChecklistItems([]);
    setShowCompleted(true);
  }, [editor]);

  const initFromContent = useCallback((noteTitle: string, noteContent: string) => {
    setTitle(noteTitle);
    setContent(noteContent);
    editor?.commands.setContent(noteContent);
    setShowMore(false);
    setShowColors(false);
    setShowFormatting(false);

    // Detect checklist
    const lines = noteContent.split("\n");
    const isChecklistContent = lines.some(l => l.startsWith("☐ ") || l.startsWith("☑ "));
    if (isChecklistContent) {
      setIsChecklist(true);
      setChecklistItems(
        lines.filter(l => l.trim()).map(l => {
          if (l.startsWith("☑ ")) return { text: l.slice(2), checked: true };
          if (l.startsWith("☐ ")) return { text: l.slice(2), checked: false };
          return { text: l, checked: false };
        })
      );
    } else {
      setIsChecklist(false);
      setChecklistItems([]);
    }
  }, [editor]);

  return {
    // State
    title, content, showMore, showColors, showFormatting, isChecklist,
    checklistItems, showCompleted, activeFormats, canUndo, canRedo,
    // Refs
    moreRef, colorRef,
    // Tiptap editor instance
    editor,
    // Setters
    setTitle, setContent, setShowMore, setShowColors, setShowFormatting,
    setChecklistItems, setShowCompleted,
    // Actions
    handleTitleChange, toggleChecklist,
    updateChecklistItem, toggleChecklistItem, handleChecklistKeyDown,
    removeChecklistItem, applyFormat, applyHeading,
    undo, redo, getContent, resetEditor, initFromContent,
  };
}
