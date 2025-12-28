import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeaturedTrips from "@/components/FeaturedTrips";
import { Plane, Sparkles, MapPin, Users, Ticket, Zap, Shield, Globe } from "lucide-react";
import { motion, useTransform, useScroll } from "framer-motion";

// --- New Component: Horizontal Scroll Section ---
const HorizontalScrollSection = ({ features }: { features: any[] }) => {
  const targetRef = useRef<HTMLDivElement>(null);

  // Track the scroll progress of this specific section (0 to 1)
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Map vertical scroll (0 to 1) to horizontal movement (1% to -95%)
  // We use -95% so the last card doesn't disappear completely off-screen
  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-95%"]);

  return (
    // This section is 300vh tall to allow ample scroll distance
    <section ref={targetRef} className="relative h-[300vh] bg-background/50">
      {/* The sticky container locks the view in place while we scroll "through" the 300vh */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Title pinned to top left */}
        <div className="absolute top-10 left-10 z-20 max-w-md">
          <Badge variant="secondary" className="mb-4 bg-background/60 backdrop-blur-xl border border-border/50">
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose Travexa?</h2>
          <p className="text-muted-foreground text-lg">Scroll down to explore our features</p>
        </div>

        {/* The Horizontal Moving Track */}
        <motion.div style={{ x }} className="flex gap-8 pl-10 md:pl-20">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative h-[400px] w-[350px] md:w-[450px] shrink-0 overflow-hidden bg-card/50 backdrop-blur-xl border-border/50 transition-all duration-500 hover:border-primary/50"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
              </div>

              <CardContent className="flex h-full flex-col justify-between p-8 relative z-10">
                <div>
                  <div className="text-6xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {feature.emoji}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 transition-colors duration-300 group-hover:text-accent">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  Learn more <div className="h-1 w-1 bg-primary rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Progress Bar Synced to Scroll */}
        <div className="absolute bottom-10 left-10 right-10 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ scaleX: scrollYProgress, transformOrigin: "0%" }} />
        </div>
      </div>
    </section>
  );
};

// --- Main Index Component ---
const Index = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Planning",
      description:
        "Get personalized itineraries crafted by advanced AI based on your preferences, budget, and travel style.",
      emoji: "🤖",
    },
    {
      icon: Ticket,
      title: "Unified Booking",
      description: "Book flights, trains, buses, hotels, and cabs all in one place with the best prices guaranteed.",
      emoji: "🎫",
    },
    {
      icon: Shield,
      title: "Best Price Guarantee",
      description: "Our algorithms scan hundreds of options to find you unbeatable deals and exclusive discounts.",
      emoji: "💰",
    },
    {
      icon: Users,
      title: "Social Travel Network",
      description: "Connect with fellow travelers, share experiences, and find travel buddies for your next adventure.",
      emoji: "👥",
    },
    {
      icon: Globe,
      title: "All-in-One Dashboard",
      description: "Manage bookings, itineraries, and documents in one intuitive dashboard with offline access.",
      emoji: "📱",
    },
    {
      icon: Zap,
      title: "Lightning Fast Search",
      description: "Get instant results from thousands of routes and operators in seconds.",
      emoji: "⚡",
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-background relative overflow-x-hidden"
    >
      {/* Animated Background Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-500 ease-out"
        style={{
          background: `
            radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, 
              hsl(210 50% 50% / 0.15), 
              transparent 40%),
            radial-gradient(800px circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, 
              hsl(280 50% 50% / 0.1), 
              transparent 40%),
            radial-gradient(400px circle at ${mousePosition.x + 20}% ${mousePosition.y + 30}%, 
              hsl(150 50% 50% / 0.08), 
              transparent 40%)
          `,
        }}
      />

      {/* Header */}
      <header className="relative z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-6xl">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary/10 backdrop-blur-sm rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-all">
              <Plane className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Trave<span className="text-accent">X</span>a
            </h1>
          </Link>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" className="backdrop-blur-sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" className="shadow-lg shadow-primary/20" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-32 max-w-4xl text-center">
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/30 rounded-full blur-3xl scale-150 animate-pulse"></div>
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-125"></div>
              <div className="relative p-6 bg-background/50 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl">
                <Plane className="h-20 w-20 text-primary animate-[bounce_3s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-2 text-sm bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg"
            >
              <Sparkles className="h-4 w-4 mr-2 text-accent" />
              Welcome to Travexa
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              Your{" "}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-accent animate-gradient">
                  AI-Powered
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent rounded-full opacity-50"></span>
              </span>
              <br />
              Travel Companion
            </h1>
          </div>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Plan trips with AI assistance, connect with fellow travelers, and manage all your bookings in one beautiful
            place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button
              size="lg"
              className="px-10 py-6 text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
              asChild
            >
              <Link to="/signup">
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-10 py-6 text-lg bg-background/50 backdrop-blur-xl border-border/50 hover:bg-background/80"
              asChild
            >
              <Link to="/welcome">Learn More</Link>
            </Button>
          </div>
        </section>

        {/* --- REPLACED: Horizontal Scrolling Features Section --- */}
        <HorizontalScrollSection features={features} />

        {/* Featured Trips */}
        <FeaturedTrips />

        {/* Feedback Section */}
        <section className="container mx-auto px-6 py-24 max-w-4xl">
          <Card className="relative overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-accent/5 via-background to-primary/5 backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <CardHeader className="text-center relative z-10">
              <Badge className="w-fit mx-auto mb-4 bg-accent/20 text-accent border-accent/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Feedback
              </Badge>
              <CardTitle className="text-3xl md:text-4xl mb-4">We'd Love Your Feedback!</CardTitle>
              <CardDescription className="text-base">
                Travexa is currently in development. We're building a fully functional travel planning and booking
                platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 relative z-10">
              <p className="text-xl font-medium text-foreground">Would you use Travexa if it were fully functional?</p>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your feedback helps us understand what travelers need most. We're working hard to bring you the best
                experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40" asChild>
                  <Link to="/signup">Yes, Sign Me Up!</Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 bg-background/50 backdrop-blur-sm" asChild>
                  <Link to="/signup">Maybe, Tell Me More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <p>© {new Date().getFullYear()} Travexa. All rights reserved.</p>
              <p className="text-xs mt-1">Made with ❤️ by Rajasekhar</p>
            </div>
            <div className="flex gap-6">
              <Link to="/login" className="hover:text-foreground transition-colors">
                Login
              </Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
