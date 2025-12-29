import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Plane, Compass, Ticket, ShoppingCart, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";

const DashboardNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { itemCount } = useCart();

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY < 50) {
      setIsVisible(true);
    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down
      setIsVisible(false);
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up
      setIsVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav 
      className={`sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{
        boxShadow: isVisible ? "0 4px 30px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      <div className="container flex h-16 items-center gap-2 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl group shrink-0">
          <div className="p-1.5 bg-primary rounded-lg">
            <Plane className="h-5 w-5 text-primary-foreground transition-transform group-hover:rotate-12" />
          </div>
          <span className="hidden sm:inline-block">
            Trave<span className="text-accent">X</span>a
          </span>
        </Link>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search profiles, posts, places..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Navigation Tabs */}
        {isNavExpanded && (
          <div className="flex items-center gap-0.5 overflow-hidden text-[11px] lg:text-xs xl:text-sm">
            <Link
              to="/"
              className={`flex items-center gap-1 px-1.5 lg:px-2 py-2 rounded-md transition-colors whitespace-nowrap ${
                isActive("/")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Compass className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
              <span className="hidden lg:inline-block">Explore</span>
            </Link>

            <Link
              to="/plan-trip"
              className={`flex items-center gap-1 px-1.5 lg:px-2 py-2 rounded-md transition-colors whitespace-nowrap ${
                isActive("/plan-trip")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Plane className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
              <span className="hidden lg:inline-block">Trip Planner</span>
            </Link>

            <Link
              to="/book-transport"
              className={`flex items-center gap-1 px-1.5 lg:px-2 py-2 rounded-md transition-colors whitespace-nowrap ${
                isActive("/book-transport") || isActive("/my-tickets")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Ticket className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
              <span className="hidden lg:inline-block">Book Tickets</span>
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-1 px-1.5 lg:px-2 py-2 rounded-md transition-colors hover:bg-muted whitespace-nowrap"
            >
              <ShoppingCart className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground">
                  {itemCount}
                </Badge>
              )}
              <span className="hidden lg:inline-block">Cart</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1 px-1.5 lg:px-2 py-2 rounded-md transition-colors whitespace-nowrap ${
                isActive("/profile")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
              <span className="hidden lg:inline-block">Profile</span>
            </Link>
          </div>
        )}

        {/* Toggle Button - always at far right */}
        <div className="ml-auto shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNavExpanded(!isNavExpanded)}
          >
            {isNavExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
