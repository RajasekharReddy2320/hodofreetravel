import { useEffect, Suspense, lazy } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeaturedTrips from "@/components/FeaturedTrips";
import FloatingParticles from "@/components/FloatingParticles";
// Import the new component
import HorizontalScrollFeatures from "@/components/HorizontalScrollFeatures";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Plane, Sparkles, Globe, ChevronDown, Shield, Users, Zap, Ticket } from "lucide-react";

const RealisticGlobe = lazy(() => import("@/components/RealisticGlobe"));

const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-transform ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0,0,0)" : "translate3d(64px,0,0)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const scrollToFeatures = () => {
    const element = document.getElementById("features-start");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
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
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <FloatingParticles />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <header className="relative z-50 bg-background/60 backdrop-blur-xl border-b border-border/50 sticky top-0">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-6xl">
          <Link to="/welcome" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary/10 backdrop-blur-sm rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-all">
              <Plane className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Trave<span className="text-primary">X</span>a
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

      <main className="relative z-10">
        <section className="min-h-[90vh] flex items-center justify-center relative">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <AnimatedSection className="flex-1 text-center lg:text-left">
                <Badge
                  variant="secondary"
                  className="mb-6 px-4 py-2 bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg"
                >
                  <Sparkles className="h-4 w-4 mr-2 text-accent" />
                  Welcome to Travexa
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                  Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient">
                    Social Travel
                  </span>
                  <br />
                  Network
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8">
                  Connect with fellow travelers, share experiences, and find travel companions for your next adventure
                  around the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    asChild
                    className="px-10 py-6 text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
                  >
                    <Link to="/signup">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Join the Community
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" onClick={scrollToFeatures} className="px-10 py-6 text-lg">
                    Explore Features
                    <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
                  </Button>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={300} className="flex-1 flex justify-center">
                <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/40 via-blue-500/30 to-purple-500/40 blur-3xl animate-pulse" />
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 animate-pulse flex items-center justify-center">
                          <Globe className="h-20 w-20 text-white/50 animate-spin" style={{ animationDuration: "3s" }} />
                        </div>
                      }
                    >
                      <RealisticGlobe />
                    </Suspense>
                  </div>
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                      Travel the World with TraveXa
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-muted-foreground" />
          </div>
        </section>

        {/* --- HORIZONTAL SCROLL FEATURES SECTION --- */}
        {/* We use id="features-start" for the scroll button */}
        <div id="features-start">
          <HorizontalScrollFeatures features={features} />
        </div>

        {/* Featured Trips */}
        <FeaturedTrips />

        {/* Feedback Section */}
        <AnimatedSection className="container mx-auto px-6 py-20 max-w-4xl">
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
                platform with social networking features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 relative z-10">
              <p className="text-xl font-medium text-foreground">Would you use Travexa if it were fully functional?</p>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your feedback helps us understand what travelers need most.
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
        </AnimatedSection>
      </main>

      <footer className="relative z-10 border-t border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <p>© {new Date().getFullYear()} Travexa. All rights reserved.</p>
              <p className="text-xs mt-1">Made with ❤️ by Team TraveXa</p>
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

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
