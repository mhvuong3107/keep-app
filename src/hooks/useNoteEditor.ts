import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from "yjs";
import { Collaboration } from "@tiptap/extension-collaboration";
import { HocuspocusProvider } from "@hocuspocus/provider";


export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface UseNoteEditorOptions {
  initialTitle?: string;
  containerRef: React.RefObject<HTMLElement>;
  initialYdoc?: number[];
}

export function useNoteEditor({ initialTitle = "", containerRef, initialYdoc }: UseNoteEditorOptions) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const initialYdocRef = useRef(initialYdoc);
  const contentPreviewRef = useRef<string>("");
  const editorRef = useRef<Editor | null>(null);
  initialYdocRef.current = initialYdoc;
  // Refs cho Y.Text title
  const yTitleRef = useRef<Y.Text | null>(null);
  const yTitleObserverRef = useRef<(() => void) | null>(null);

  // Refs cho Y.Array checklist
  const yChecklistRef = useRef<Y.Array<Y.Map<unknown>> | null>(null);
  const yChecklistObserverRef = useRef<(() => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yChecklistDeepObserverRef = useRef<((events: Y.YEvent<any>[], transaction: Y.Transaction) => void) | null>(null);

  const moreRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  // Tạo Y.Doc từ binary snapshot — chỉ 1 lần khi mount
  const initialYDoc = useMemo(() => {
    const ydoc = new Y.Doc();
    if (initialYdoc && initialYdoc.length > 0) {
      Y.applyUpdate(ydoc, new Uint8Array(initialYdoc));
    }
    return ydoc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialYdoc]);

  useEffect(() => {
    ydocRef.current = initialYDoc;
  }, [initialYDoc]);

  // Helpers đọc Y.Array -> ChecklistItem[] 

  const readChecklistFromYArray = useCallback((yArray: Y.Array<Y.Map<unknown>>): ChecklistItem[] => {
    return yArray.toArray().map((yMap) => ({
      id: yMap.get("id") as string,
      text: yMap.get("text") as string,
      checked: yMap.get("checked") as boolean,
    }));
  }, []);

  //Connect Hocuspocus

  const connectHocuspocus = useCallback((noteId?: string, initialTitleValue?: string) => {
    if (!noteId || !editorRef.current) return;
    try {
      if (!ydocRef.current) ydocRef.current = initialYDoc;
      if (providerRef.current) providerRef.current.disconnect();
      const fragment = ydocRef.current.getXmlFragment("default");
      if (fragment.length === 0 && initialYdoc && initialYdoc.length > 0) {
        Y.applyUpdate(ydocRef.current, new Uint8Array(initialYdoc));
      }

      if (contentPreviewRef.current && fragment.length === 0 && editorRef.current) {
        editorRef.current.commands.setContent(contentPreviewRef.current);
      }

      // Y.Text "title" — setup TRƯỚC khi tạo provider 
      const yTitle = ydocRef.current!.getText("title");
      const onYTitleChange = () => setTitle(yTitle.toString());
      yTitle.observe(onYTitleChange);
      yTitleRef.current = yTitle;
      yTitleObserverRef.current = onYTitleChange;
      setTitle(yTitle.toString() || initialTitleValue || "");

      //  Y.Array "checklist" — setup TRƯỚC khi tạo provider
      const yChecklist = ydocRef.current!.getArray<Y.Map<unknown>>("checklist");

      // Shallow observer: watches Y.Array structural changes (add/remove)
      const onYChecklistChange = () => {
        setChecklistItems(readChecklistFromYArray(yChecklist));
      };

      // Deep observer: watches changes within nested Y.Maps (text, checked properties)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      const onYChecklistRelatedChange = (_events: Y.YEvent<any>[], _transaction: Y.Transaction) => {
        setChecklistItems(readChecklistFromYArray(yChecklist));
      };

      yChecklist.observe(onYChecklistChange);
      yChecklist.observeDeep(onYChecklistRelatedChange);

      yChecklistRef.current = yChecklist;
      yChecklistObserverRef.current = onYChecklistChange;
      yChecklistDeepObserverRef.current = onYChecklistRelatedChange;

      // Nếu đã có checklist data trong ydoc → load lên state + set mode
      if (yChecklist.length > 0) {
        setIsChecklist(true);
        setChecklistItems(readChecklistFromYArray(yChecklist));
      }

      const provider = new HocuspocusProvider({
        url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || "ws://localhost:1234",
        name: noteId,
        document: ydocRef.current!,
        onSynced: () => {
          // Sau khi sync với server xong:
          // Seed title nếu Y.Text vẫn rỗng
          if (yTitle.length === 0 && initialTitleValue) {
            ydocRef.current!.transact(() => {
              yTitle.insert(0, initialTitleValue);
            });
          }
          if (yTitle.length > 0) setTitle(yTitle.toString());

          // Load checklist từ server nếu có
          if (yChecklist.length > 0) {
            setIsChecklist(true);
            setChecklistItems(readChecklistFromYArray(yChecklist));
          }
        },
      });
      providerRef.current = provider;
    } catch (error) {
      console.warn("Hocuspocus provider initialization failed", error);
    }
  }, [initialYDoc, readChecklistFromYArray]);

  // Disconnect Hocuspocus

  const disconnectHocuspocus = useCallback(() => {
    if (yTitleRef.current && yTitleObserverRef.current) {
      yTitleRef.current.unobserve(yTitleObserverRef.current);
      yTitleRef.current = null;
      yTitleObserverRef.current = null;
    }
    if (yChecklistRef.current && yChecklistObserverRef.current) {
      yChecklistRef.current.unobserve(yChecklistObserverRef.current);
    }
    if (yChecklistRef.current && yChecklistDeepObserverRef.current) {
      yChecklistRef.current.unobserveDeep(yChecklistDeepObserverRef.current);
      yChecklistRef.current = null;
      yChecklistDeepObserverRef.current = null;
    }
    if (yChecklistObserverRef.current) {
      yChecklistObserverRef.current = null;
    }
    providerRef.current?.disconnect();
    providerRef.current = null;
  }, []);

  // Tiptap Editor

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Underline,
      Placeholder.configure({
      placeholder: 'Nội dung...', 
    }),
      Collaboration.configure({ document: initialYDoc }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const normalized = html === "<p></p>" ? "" : html;
      setContent(normalized);
    },
    onSelectionUpdate: ({ editor }) => updateFormatsFromEditor(editor),
    onTransaction: ({ editor }) => updateFormatsFromEditor(editor),
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

  const undo = useCallback(() => { editor?.chain().focus().undo().run(); }, [editor]);
  const redo = useCallback(() => { editor?.chain().focus().redo().run(); }, [editor]);
  const canUndo = editor?.can().undo() ?? false;
  const canRedo = editor?.can().redo() ?? false;

  // Update editorRef when editor changes
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColors(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  //  Title 

  const handleTitleChange = useCallback((val: string) => {
    const yTitle = yTitleRef.current;
    if (!yTitle) { setTitle(val); return; }
    const current = yTitle.toString();
    if (current === val) return;
    ydocRef.current?.transact(() => {
      yTitle.delete(0, yTitle.length);
      yTitle.insert(0, val);
    });
  }, []);

  //  Checklist — tất cả mutation đều ghi vào Y.Array 

  // Helper: tạo Y.Map từ ChecklistItem
  const makeYMap = (item: ChecklistItem): Y.Map<unknown> => {
    const m = new Y.Map<unknown>();
    m.set("id", item.id);
    m.set("text", item.text);
    m.set("checked", item.checked);
    return m;
  };

  const toggleChecklist = useCallback(() => {
    const yChecklist = yChecklistRef.current;

    if (!isChecklist) {
      // Chuyển từ text editor sang checklist
      const text = editor?.getText() || content.replace(/<[^>]*>/g, "");
      const lines = text.split("\n").filter(l => l.trim());
      const items: ChecklistItem[] = lines.length > 0
        ? lines.map(l => ({ id: crypto.randomUUID(), text: l, checked: false }))
        : [{ id: crypto.randomUUID(), text: "", checked: false }];

      if (yChecklist) {
        // Ghi vào Y.Array để sync realtime
        ydocRef.current?.transact(() => {
          yChecklist.delete(0, yChecklist.length);
          yChecklist.push(items.map(makeYMap));
        });
        // setChecklistItems sẽ được gọi bởi observer
      } else {
        // Fallback khi chưa connect (NoteInput)
        setChecklistItems(items);
      }
      setIsChecklist(true);
    } else {
      // Chuyển về text editor
      const text = checklistItems.filter(i => i.text.trim()).map(i => i.text).join("\n");
      setContent(text);
      editor?.commands.setContent(
        checklistItems.filter(i => i.text.trim()).map(i => `<p>${i.text}</p>`).join("")
      );

      if (yChecklist) {
        ydocRef.current?.transact(() => {
          yChecklist.delete(0, yChecklist.length);
        });
      }
      setChecklistItems([]);
      setIsChecklist(false);
    }
  }, [isChecklist, content, checklistItems, editor]);

  // Dùng khi chưa có Hocuspocus (NoteInput) — set trực tiếp vào state
  // Khi có Hocuspocus, dùng các hàm Y.Array bên dưới
  const setChecklistItemsFallback = useCallback((items: ChecklistItem[] | ((prev: ChecklistItem[]) => ChecklistItem[])) => {
    const yChecklist = yChecklistRef.current;
    const resolved = typeof items === "function" ? items(checklistItems) : items;

    if (yChecklist) {
      ydocRef.current?.transact(() => {
        yChecklist.delete(0, yChecklist.length);
        yChecklist.push(resolved.map(makeYMap));
      });
      // observer tự gọi setChecklistItems
    } else {
      setChecklistItems(resolved);
    }
  }, [checklistItems]);

  const updateChecklistItem = useCallback((index: number, text: string) => {
    const yChecklist = yChecklistRef.current;
    if (yChecklist && index < yChecklist.length) {
      ydocRef.current?.transact(() => {
        (yChecklist.get(index) as Y.Map<unknown>).set("text", text);
      });
    } else {
      setChecklistItems(prev => prev.map((item, i) => i === index ? { ...item, text } : item));
    }
  }, []);

  const toggleChecklistItem = useCallback((index: number) => {
    const yChecklist = yChecklistRef.current;
    if (yChecklist && index < yChecklist.length) {
      const yMap = yChecklist.get(index) as Y.Map<unknown>;
      ydocRef.current?.transact(() => {
        yMap.set("checked", !yMap.get("checked"));
      });
    } else {
      setChecklistItems(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
    }
  }, []);

  const handleChecklistKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    const yChecklist = yChecklistRef.current;

    if (e.key === "Enter") {
      e.preventDefault();
      const newItem: ChecklistItem = { id: crypto.randomUUID(), text: "", checked: false };
      if (yChecklist) {
        ydocRef.current?.transact(() => {
          yChecklist.insert(index + 1, [makeYMap(newItem)]);
        });
      } else {
        setChecklistItems(prev => {
          const next = [...prev];
          next.splice(index + 1, 0, newItem);
          return next;
        });
      }
      setTimeout(() => {
        containerRef.current?.querySelectorAll<HTMLInputElement>(".checklist-input")?.[index + 1]?.focus();
      }, 0);
    }

    if (e.key === "Backspace" && checklistItems[index]?.text === "" && checklistItems.length > 1) {
      e.preventDefault();
      if (yChecklist && index < yChecklist.length) {
        ydocRef.current?.transact(() => {
          yChecklist.delete(index, 1);
        });
      } else {
        setChecklistItems(prev => prev.filter((_, i) => i !== index));
      }
      setTimeout(() => {
        containerRef.current?.querySelectorAll<HTMLInputElement>(".checklist-input")?.[Math.max(0, index - 1)]?.focus();
      }, 0);
    }
  }, [checklistItems, containerRef]);

  const removeChecklistItem = useCallback((index: number) => {
    const yChecklist = yChecklistRef.current;
    if (checklistItems.length <= 1) return;
    if (yChecklist && index < yChecklist.length) {
      ydocRef.current?.transact(() => {
        yChecklist.delete(index, 1);
      });
    } else {
      setChecklistItems(prev => prev.filter((_, i) => i !== index));
    }
  }, [checklistItems.length]);

  const reorderCheckList = useCallback((activeId: string, overId: string) => {
    const yChecklist = yChecklistRef.current;
    const oldIndex = checklistItems.findIndex(item => item.id === activeId);
    const newIndex = checklistItems.findIndex(item => item.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    if (yChecklist) {
      const movedItem = checklistItems[oldIndex];
      ydocRef.current?.transact(() => {
        yChecklist.delete(oldIndex, 1);
        yChecklist.insert(newIndex, [makeYMap(movedItem)]);
      });
    } else {
      setChecklistItems(prev => {
        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);
        return next;
      });
    }
  }, [checklistItems]);

  // Format 

  const applyFormat = useCallback((command: string) => {
    if (!editor) return;
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

    const html = editor?.getHTML() || "";
    return html === "<p></p>" || html === "" ? "" : html;
  }, [isChecklist, checklistItems, editor]);

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

  // useNoteEditor.ts
  const initFromContent = useCallback((noteTitle: string, noteContent: string = "") => {
    setTitle(noteTitle);
    setShowMore(false);
    setShowColors(false);
    setShowFormatting(false);

    // Save contentPreview to ref for use in connectHocuspocus
    contentPreviewRef.current = noteContent;

    const sanitized = noteContent.replace(/<[^>]*>/g, "").trim();
    const lines = sanitized.split("\n");
    const isChecklistContent = lines.some(l => l.startsWith("☐ ") || l.startsWith("☑ "));

    if (isChecklistContent) {
      setIsChecklist(true);
      setChecklistItems(
        lines.filter(l => l.trim()).map(l => {
          if (l.startsWith("☑ ")) return { id: crypto.randomUUID(), text: l.slice(2), checked: true };
          if (l.startsWith("☐ ")) return { id: crypto.randomUUID(), text: l.slice(2), checked: false };
          return { id: crypto.randomUUID(), text: l, checked: false };
        })
      );
    } else {
      setIsChecklist(false);
      setChecklistItems([]);
      setContent(noteContent);
    }
  }, []);

  const getYDocSnapshot = useCallback(() => {
    if (!ydocRef.current) return [];
    return Array.from(Y.encodeStateAsUpdate(ydocRef.current));
  }, []);

  return {
    // State
    title, content, showMore, showColors, showFormatting, isChecklist,
    checklistItems, showCompleted, activeFormats, canUndo, canRedo,
    // Refs
    moreRef, colorRef,
    // Tiptap editor instance
    editor,
    // Yjs / Collaboration
    connectHocuspocus,
    disconnectHocuspocus,
    getYDocSnapshot,
    // Setters
    setTitle, setContent, setShowMore, setShowColors, setShowFormatting,
    setChecklistItems: setChecklistItemsFallback,
    setShowCompleted,
    // Actions
    handleTitleChange, toggleChecklist,
    updateChecklistItem, toggleChecklistItem, handleChecklistKeyDown,
    removeChecklistItem, applyFormat, applyHeading,
    undo, redo, getContent, resetEditor, initFromContent, reorderCheckList,
  };
}
