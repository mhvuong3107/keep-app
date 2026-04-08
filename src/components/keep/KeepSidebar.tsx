'use client'
import { useState, useEffect, useMemo, memo } from "react";
import { Archive, Bell, Pencil, Lightbulb, Trash2, Tag } from "lucide-react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLabels } from "@/hooks/useLabel";
import NoteLabelDialog from "./NoteLabelDialog";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";

interface KeepSidebarProps {
  expanded: boolean;
  onNavigate?: () => void;
}

type SidebarLinkItem = {
  type: "link";
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
};

type SidebarActionItem = {
  type: "action";
  id: "edit-labels";
  label: string;
  icon: LucideIcon;
};

export type SidebarNavItem = SidebarLinkItem | SidebarActionItem;

const STATIC_TOP: SidebarNavItem[] = [
  { type: "link", id: "notes", label: "Ghi chú", icon: Lightbulb, path: "/home" },
  { type: "link", id: "reminders", label: "Lời nhắc", icon: Bell, path: "/reminders" }
];

const STATIC_BOTTOM: SidebarNavItem[] = [
  { type: "action", id: "edit-labels", label: "Chỉnh sửa nhãn", icon: Pencil },
  { type: "link", id: "archive", label: "Lưu trữ", icon: Archive, path: "/archive" },
  { type: "link", id: "trash", label: "Thùng rác", icon: Trash2, path: "/trash" }
];

export default function KeepSidebar({ expanded, onNavigate }: KeepSidebarProps) {
  const pathname = usePathname();
  const { labels } = useLabels();
  const [isMobile, setIsMobile] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isExpanded = isMobile ? expanded : (!expanded || hovered);
  const labelItems = useMemo<SidebarNavItem[]>(
    () => labels.map((label) => ({
      type: "link" as const,
      id: `label-${label.id}`,
      label: label.name,
      icon: Tag,
      path: `/label/${label.id}`,
    })),
    [labels]
  );

  const navItems: SidebarNavItem[] = useMemo(() => {
    return [...STATIC_TOP, ...labelItems, ...STATIC_BOTTOM];
  }, [labelItems]);

  const handleEditLabelsClick = () => {
    setLabelDialogOpen(true);
  };

  return (
    <>
      <aside
        onMouseEnter={() => !isMobile && setHovered(true)}
        onMouseLeave={() => !isMobile && setHovered(false)}
        className={`
        fixed h-full bg-keep-sidebar z-40 w-[200px]
        transition-transform duration-300
        
        ${isExpanded ? "translate-x-0" : "-translate-x-full"}

        md:sticky md:top-16 md:h-[calc(100vh-4rem)]
        md:translate-x-0
        ${isExpanded ? "md:w-[250px]" : "md:w-[72px]"}
        `}
      >
        <nav className="flex flex-col items-center pt-2">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              pathname={pathname}
              isExpanded={isExpanded}
              isMobile={isMobile}
              onEditLabels={handleEditLabelsClick}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </aside>
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="w-75 !rounded-none p-2">
          <DialogTitle className="sr-only">Chỉnh sửa nhãn</DialogTitle>
          <NoteLabelDialog onClose={() => setLabelDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SidebarItemProps {
  item: SidebarNavItem;
  pathname: string;
  isExpanded: boolean;
  isMobile: boolean;
  onEditLabels: () => void;
  onNavigate?: () => void;
}

const SidebarItem = memo(function SidebarItem({
  item,
  pathname,
  isExpanded,
  isMobile,
  onEditLabels,
  onNavigate
}: SidebarItemProps) {
  const Icon = item.icon;

  const isActive =
    item.type === "link" &&
    (item.path === "/home"
      ? pathname === "/home"
      : pathname.startsWith(item.path));

  const baseClass = `flex items-center w-full h-12 transition-colors ${isExpanded ? "px-3" : "px-3 justify-center w-12! rounded-full"
    }`;

  if (item.id === "edit-labels") {
    return (
      <button
        onClick={onEditLabels}
        title={!isExpanded ? item.label : undefined}
        className={`${baseClass} cursor-pointer hover:bg-keep-sidebar-hover rounded-r-full`}
      >
        <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
          <Icon className="w-5 h-5 text-keep-icon" />
        </div>

        {isExpanded && (
          <span className="ml-3 text-sm font-medium whitespace-nowrap text-keep-icon">
            {item.label}
          </span>
        )}
      </button>
    );
  }
  if (item.type !== "link") return null;

  const handleLinkClick = () => {
    if (isMobile && onNavigate) {
      onNavigate();
    }
  };

  return (
    <Link
      href={item.path}
      onClick={handleLinkClick}
      title={!isExpanded ? item.label : undefined}
      className={`${baseClass} ${isActive
        ? "bg-keep-sidebar-active rounded-r-full"
        : "hover:bg-keep-sidebar-hover rounded-r-full"
        }`}
    >
      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
        <Icon
          className={`w-5 h-5 ${isActive ? "text-foreground" : "text-keep-icon"
            }`}
        />
      </div>

      {isExpanded && (
        <span
          className={`ml-3 text-sm font-medium whitespace-nowrap ${isActive ? "text-foreground" : "text-keep-icon"
            }`}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
});
