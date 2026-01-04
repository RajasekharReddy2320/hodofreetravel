import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Plane className="h-6 w-6 text-accent transition-transform group-hover:rotate-12" />
            <span className="text-2xl font-bold tracking-tight">
              Travi<span className="text-accent">Link</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
