import { Link, useLocation } from "react-router-dom";
import { Plane, Compass, UserCheck, Ticket, ShoppingCart, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

const items = [
  { title: "Home", url: "/dashboard", icon: Plane },
  { title: "Wanderlust", url: "/wanderlust", icon: Compass },
  { title: "Connections", url: "/connections", icon: UserCheck },
  { title: "Book Tickets", url: "/book-transport", icon: Ticket },
  { title: "My Tickets", url: "/my-tickets", icon: Ticket },
  { title: "Cart", url: "/cart", icon: ShoppingCart },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { itemCount } = useCart();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="relative">
      {/* X-shaped decoration with white borders */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-0 w-[2px] h-[20%] bg-white/20 origin-top-left rotate-[30deg] transition-all duration-300 group-data-[state=expanded]/sidebar-wrapper:h-[40%]" />
          <div className="absolute top-0 right-0 w-[2px] h-[20%] bg-white/20 origin-top-right -rotate-[30deg] transition-all duration-300 group-data-[state=expanded]/sidebar-wrapper:h-[40%]" />
          <div className="absolute bottom-0 left-0 w-[2px] h-[20%] bg-white/20 origin-bottom-left -rotate-[30deg] transition-all duration-300 group-data-[state=expanded]/sidebar-wrapper:h-[40%]" />
          <div className="absolute bottom-0 right-0 w-[2px] h-[20%] bg-white/20 origin-bottom-right rotate-[30deg] transition-all duration-300 group-data-[state=expanded]/sidebar-wrapper:h-[40%]" />
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 px-2 text-lg font-bold">
            <Plane className="h-5 w-5 text-accent" />
            {!collapsed && (
              <span>Travi<span className="text-accent">Link</span></span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="relative">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.url === "/cart" && itemCount > 0 && !collapsed && (
                        <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {itemCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
