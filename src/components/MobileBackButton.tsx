import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileBackButtonProps {
  className?: string;
}

const MobileBackButton = ({ className }: MobileBackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on main pages (home, explore root, profile root)
  const mainPages = ["/", "/explore", "/profile", "/plan-trip"];
  const isMainPage = mainPages.includes(location.pathname);

  if (isMainPage) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(-1)}
      className={cn(
        "md:hidden fixed top-20 left-4 z-40 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md border border-border/50",
        className
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
};

export default MobileBackButton;
