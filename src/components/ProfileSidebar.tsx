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
  History,
  Lock
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
import { useHoverRevealSidebar } from "@/hooks/useAutoHideNav";

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOwnProfile: boolean;
}

const ProfileSidebar = ({ 
  activeTab, 
  onTabChange,
  isOwnProfile 
}: ProfileSidebarProps) => {
  const { isSidebarVisible, sidebarProps } = useHoverRevealSidebar();

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
      { id: "vault", label: "Secure Vault", icon: Lock },
      { id: "settings", label: "Settings", icon: Settings },
    ] : []),
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
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
        <Sheet>
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

      {/* Desktop Sidebar - Auto-hide with hover reveal */}
      {/* Edge indicator - always visible */}
      <div 
        className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-1.5 z-30 bg-gradient-to-b from-primary/40 via-accent/30 to-primary/40 opacity-60 hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: '2px 0 8px rgba(var(--primary), 0.2)',
        }}
      />
      
      <aside
        {...sidebarProps}
        className={cn(
          "hidden md:flex flex-col fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-sm border-r z-40",
          "transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          isSidebarVisible 
            ? "w-64 translate-x-0 opacity-100 shadow-xl" 
            : "w-16 -translate-x-14 opacity-0 pointer-events-none"
        )}
        style={{
          boxShadow: isSidebarVisible ? '4px 0 24px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div className={cn(
          "flex items-center h-14 px-4 border-b transition-all duration-300",
          isSidebarVisible ? "justify-between" : "justify-center"
        )}>
          {isSidebarVisible && (
            <span className="font-semibold text-lg animate-fade-in">Profile</span>
          )}
          <ChevronLeft className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-500",
            !isSidebarVisible && "rotate-180"
          )} />
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center w-full rounded-lg transition-all duration-300",
                  "transform hover:scale-[1.02]",
                  isSidebarVisible ? "px-4 py-3 gap-3" : "p-3 justify-center",
                  isActive
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                style={{
                  animationDelay: isSidebarVisible ? `${index * 50}ms` : '0ms',
                }}
                title={!isSidebarVisible ? tab.label : undefined}
              >
                <Icon className={cn(
                  "shrink-0 transition-all duration-300",
                  isSidebarVisible ? "h-5 w-5" : "h-6 w-6",
                  isActive && "text-primary"
                )} />
                {isSidebarVisible && (
                  <span className="animate-fade-in whitespace-nowrap">{tab.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default ProfileSidebar;
