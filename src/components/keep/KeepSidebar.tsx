import { Archive, Bell, Pencil, Lightbulb, Trash2 } from "lucide-react";
import { useState } from "react";

interface KeepSidebarProps {
  expanded: boolean;
}
const navItems = [
  { id: "notes", label: "Ghi chú", icon: Lightbulb, path: "/" },  
  { id: "reminders", label: "Lời nhắc", icon: Bell, path: "/reminders" },
  { id: "edit-labels", label: "Chỉnh sửa nhãn", icon: Pencil, path: "/labels" },
  { id: "archive", label: "Lưu trữ", icon: Archive, path: "/archive" },
  { id: "trash", label: "Thùng rác", icon: Trash2, path: "/trash" },
];
export default function KeepSidebar({ expanded }: KeepSidebarProps ) {
  const [activeItem, setActiveItem] = useState("notes");

  return (
    <div className="bg-blue-600 text-white p-4">
      <h1 className="text-2xl font-bold">This is Sidebar</h1>
    </div>
  );
}