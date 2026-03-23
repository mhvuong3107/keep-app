import { Menu, Search, X, RefreshCw, LayoutGrid, Settings, User } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";

interface KeepHeaderProps {
  onToggleSidebar: () => void;
}

const KeepHeader = ({ onToggleSidebar }: KeepHeaderProps) => {
  const { searchQuery, setSearchQuery } = useNotes();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 p-2 border-b border-border bg-keep-header keep-header-shadow">
      {/* Left: Logo + Toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSidebar}
          className="p-3 rounded-full hover:bg-secondary transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6 text-keep-icon" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="https://www.gstatic.com/images/branding/product/1x/keep_2020q4_48dp.png"
            alt="Keep"
            className="w-10 h-10"
          />
          <span className="text-[22px] font-display text-keep-header-foreground hidden sm:block">
            Keep
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-[720px] h-12 mx-8 ">
        <div className="flex items-center bg-keep-search text-keep-header-foreground rounded-lg px-4 py-3 gap-3 focus-within:keep-shadow focus-within:bg-keep-header transition-shadow">
          <Search className="w-5 h-5 text-keep-icon flex-shrink-0 cursor-pointer" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-foreground placeholder:text-keep-icon text-base"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className=" rounded-full hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-keep-icon" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button className="p-3 rounded-full hover:bg-secondary transition-colors hidden sm:flex cursor-pointer">
          <RefreshCw className="w-5 h-5 text-keep-icon" />
        </button>
        <button className="p-3 rounded-full hover:bg-secondary transition-colors hidden sm:flex cursor-pointer">
          <LayoutGrid className="w-5 h-5 text-keep-icon" />
        </button>
        <button className="p-3 rounded-full hover:bg-secondary transition-colors cursor-pointer">
          <Settings className="w-5 h-5 text-keep-icon" />
        </button>
        <button className="p-3 rounded-full hover:bg-secondary transition-colors ml-1 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
        </button>
      </div>
    </header>
  );
};

export default KeepHeader;
