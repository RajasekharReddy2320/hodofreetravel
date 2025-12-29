import { Link, useLocation } from "react-router-dom";
import { 
  Grid3X3, 
  Globe, 
  Users, 
  Ticket, 
  Bookmark, 
  Heart, 
  Settings, 
  ChevronLeft,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOwnProfile: boolean;
}

const ProfileSidebar = ({ 
  isOpen, 
  onToggle, 
  activeTab, 
  onTabChange,
  isOwnProfile 
}: ProfileSidebarProps) => {
  const location = useLocation();

  const tabs = [
    { id: "posts", label: "Posts", icon: Grid3X3 },
    { id: "trips", label: "Trips", icon: Globe },
    { id: "groups", label: "Groups", icon: Users },
    { id: "bookings", label: "Tickets", icon: Ticket },
    ...(isOwnProfile ? [
      { id: "saved", label: "Saved", icon: Bookmark },
      { id: "liked", label: "Liked", icon: Heart },
    ] : []),
  ];

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen bg-background/95 backdrop-blur-sm border-r z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-16 md:translate-x-0"
      )}
    >
      <div className={cn(
        "flex items-center h-16 px-4",
        isOpen ? "justify-between" : "justify-center"
      )}>
        {isOpen && <span className="font-semibold text-lg">Profile</span>}
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="px-2 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center w-full rounded-lg transition-all duration-200",
                isOpen ? "px-4 py-3 gap-3" : "p-3 justify-center",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              title={!isOpen ? tab.label : undefined}
            >
              <Icon className={cn("shrink-0", isOpen ? "h-5 w-5" : "h-6 w-6")} />
              {isOpen && <span className="font-medium">{tab.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default ProfileSidebar;
