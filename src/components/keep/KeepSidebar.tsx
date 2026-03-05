import { useState } from "react";
import { Archive, Bell, Pencil, Lightbulb, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface KeepSidebarProps {
  expanded: boolean;
}

const navItems = [
  { id: "notes", label: "Ghi chú", icon: Lightbulb, path: "/home" },
  { id: "reminders", label: "Lời nhắc", icon: Bell, path: "/reminders" },
  { id: "edit-labels", label: "Chỉnh sửa nhãn", icon: Pencil, path: "/labels" },
  { id: "archive", label: "Lưu trữ", icon: Archive, path: "/archive" },
  { id: "trash", label: "Thùng rác", icon: Trash2, path: "/trash" },
];

export default function KeepSidebar({ expanded }: KeepSidebarProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  const isExpanded = expanded || hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`sticky top-16 h-[calc(100vh-4rem)] bg-keep-sidebar transition-all duration-200 ease-in-out flex-shrink-0 z-20 ${
        isExpanded ? "w-[280px]" : "w-[72px]"
      }`}
    >
      <nav className="flex flex-col items-center pt-2">
        {navItems.map((item) => {
          const isActive =
            item.path === "/home"
              ? pathname === "/home"
              : pathname.startsWith(item.path);

          return (
            <Link
              key={item.id}
              href={item.path}
              title={!isExpanded ? item.label : undefined}
              className={`flex items-center w-full h-12 transition-colors ${
                isExpanded ? "px-3" : "px-3 justify-center w-12! rounded-full"
              } ${
                isActive
                  ? "bg-keep-sidebar-active rounded-r-full"
                  : "hover:bg-keep-sidebar-hover rounded-r-full"
              }`}
            >
              <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                <item.icon
                  className={`w-5 h-5 ${
                    isActive ? "text-foreground" : "text-keep-icon"
                  }`}
                />
              </div>

              {isExpanded && (
                <span
                  className={`ml-3 text-sm font-medium whitespace-nowrap ${
                    isActive ? "text-foreground" : "text-keep-icon"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
