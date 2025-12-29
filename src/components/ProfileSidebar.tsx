import { 
  Grid3X3, 
  Globe, 
  Users, 
  Ticket, 
  Bookmark, 
  Heart, 
  ChevronLeft,
  Menu,
  Wallet,
  Settings,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  const tabs = [
    { id: "posts", label: "Posts", icon: Grid3X3 },
    { id: "trips", label: "Trips", icon: Globe },
    { id: "groups", label: "Groups", icon: Users },
    { id: "bookings", label: "Tickets", icon: Ticket },
    ...(isOwnProfile ? [
      { id: "history", label: "Booking History", icon: History },
      { id: "saved", label: "Saved", icon: Bookmark },
      { id: "liked", label: "Liked", icon: Heart },
      { id: "wallet", label: "Wallet", icon: Wallet },
      { id: "settings", label: "Settings", icon: Settings },
    ] : []),
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onToggle(); // Close sidebar on mobile after selection
  };

  const SidebarContent = () => (
    <nav className="px-2 py-4 space-y-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "flex items-center w-full rounded-lg transition-all duration-200 px-4 py-3 gap-3",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-20 left-4 z-40 bg-background/80 backdrop-blur-sm shadow-md">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Profile Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-sm border-r z-40 transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-16"
        )}
      >
        <div className={cn(
          "flex items-center h-14 px-4",
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
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={!isOpen ? tab.label : undefined}
              >
                <Icon className={cn("shrink-0", isOpen ? "h-5 w-5" : "h-6 w-6")} />
                {isOpen && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default ProfileSidebar;
