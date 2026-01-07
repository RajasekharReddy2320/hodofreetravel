import { Home, MessageCircle, MapPin, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MobileBottomNav = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread message count
  useEffect(() => {
    const loadUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("read", false);

      setUnreadCount(count || 0);
    };

    loadUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("mobile-nav-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => loadUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { path: "/explore", icon: Home, label: "Feed" },
    { path: "/explore/messages", icon: MessageCircle, label: "Messages", badge: unreadCount },
    { path: "/plan-trip", icon: MapPin, label: "Planner" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/explore") {
      return location.pathname === "/explore" || location.pathname === "/explore/feed";
    }
    return location.pathname.startsWith(path);
  };

  // Calculate height with safe area
  const navHeight = "calc(4rem + env(safe-area-inset-bottom, 0px))";

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border"
      style={{ height: navHeight }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer */}
      <div className="safe-area-inset-bottom" />
    </nav>
  );
};

export default MobileBottomNav;
