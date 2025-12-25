import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeaturedTrips from "@/components/FeaturedTrips";
import { Plane, Sparkles } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [globeRotation, setGlobeRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Globe rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setGlobeRotation(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Auto-slide features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      emoji: "👥",
      title: "Social Travel Network",
      description: "Connect with fellow travelers, share experiences, and discover trips through our vibrant community. Find travel buddies and get inspired by real travelers' stories.",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      glow: "shadow-pink-500/50",
      bgGlow: "bg-pink-500/20"
    },
    {
      emoji: "🌍",
      title: "Find Travel Companions",
      description: "Create or join travel groups for your upcoming trips. Connect with people traveling to the same destination and make your journey more memorable.",
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      glow: "shadow-cyan-500/50",
      bgGlow: "bg-cyan-500/20"
    },
    {
      emoji: "📸",
      title: "Share Your Adventures",
      description: "Post photos, stories, and experiences from your travels. Like, comment, and save posts from fellow travelers to inspire your next adventure.",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      glow: "shadow-purple-500/50",
      bgGlow: "bg-purple-500/20"
    },
    {
      emoji: "🎫",
      title: "Unified Booking",
      description: "Book flights, trains, and buses from multiple providers in one place. Get digital and QR code tickets for easy access.",
      gradient: "from-amber-500 via-orange-500 to-red-500",
      glow: "shadow-orange-500/50",
      bgGlow: "bg-orange-500/20"
    },
    {
      emoji: "🤖",
      title: "AI Trip Planning",
      description: "Get personalized itineraries tailored to your preferences with our AI-powered trip planner. Discover destinations, activities, and hidden gems.",
      gradient: "from-emerald-500 via-green-500 to-lime-500",
      glow: "shadow-emerald-500/50",
      bgGlow: "bg-emerald-500/20"
    },
    {
      emoji: "📱",
      title: "All-in-One Platform",
      description: "Manage bookings, connect with travelers, and plan trips all in one intuitive dashboard. Access everything you need for your perfect journey.",
      gradient: "from-indigo-500 via-blue-500 to-sky-500",
      glow: "shadow-blue-500/50",
      bgGlow: "bg-blue-500/20"
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
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
        {/* Hero with Rotating Globe */}
        <section className="container mx-auto px-6 py-16 md:py-24 max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 px-4 py-2 bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg">
                <Sparkles className="h-4 w-4 mr-2 text-accent" />
                Welcome to Travexa
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
                  Social Travel
                </span>
                <br />Network
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                Connect with fellow travelers, share experiences, and find travel companions for your next adventure around the world.
              </p>
              <Button size="lg" asChild className="px-10 py-6 text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105">
                <Link to="/signup">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Join the Community
                </Link>
              </Button>
            </div>

            {/* Rotating Globe */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Globe Glow Effects */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/30 blur-2xl animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-500/20 via-transparent to-pink-500/20 blur-xl" />
                
                {/* Globe */}
                <div 
                  className="relative w-full h-full rounded-full overflow-hidden shadow-2xl shadow-cyan-500/30"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
                      linear-gradient(135deg, 
                        hsl(200 80% 50%) 0%, 
                        hsl(220 70% 40%) 25%,
                        hsl(180 60% 35%) 50%,
                        hsl(160 50% 30%) 75%,
                        hsl(200 80% 50%) 100%
                      )
                    `,
                    transform: `rotateY(${globeRotation}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Continents Pattern */}
                  <div 
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `
                        radial-gradient(ellipse 40% 30% at 20% 40%, hsl(140 50% 35%) 0%, transparent 70%),
                        radial-gradient(ellipse 35% 50% at 60% 35%, hsl(140 50% 35%) 0%, transparent 70%),
                        radial-gradient(ellipse 20% 35% at 75% 60%, hsl(140 50% 35%) 0%, transparent 70%),
                        radial-gradient(ellipse 30% 20% at 40% 70%, hsl(140 50% 35%) 0%, transparent 70%)
                      `,
                      transform: `translateX(${globeRotation * 0.5}px)`,
                    }}
                  />
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-1/2 top-0 w-px h-full bg-white/50 origin-center"
                        style={{ transform: `rotateZ(${i * 22.5}deg)` }}
                      />
                    ))}
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={`h-${i}`}
                        className="absolute left-0 w-full h-px bg-white/50"
                        style={{ top: `${20 + i * 15}%` }}
                      />
                    ))}
                  </div>

                  {/* Glossy Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-full" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Orbiting Planes */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    transform: `rotateZ(${globeRotation * 2}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <Plane className="absolute -top-4 left-1/2 -translate-x-1/2 h-6 w-6 text-accent" style={{ transform: 'rotate(45deg)' }} />
                </div>
                <div 
                  className="absolute inset-0"
                  style={{ 
                    transform: `rotateZ(${-globeRotation * 1.5 + 180}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <Plane className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-5 w-5 text-primary" style={{ transform: 'rotate(-135deg)' }} />
                </div>

                {/* Travel the World Text */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500">
                    Travel the World ✈️
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Feature Cards */}
        <section className="container mx-auto px-6 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-background/60 backdrop-blur-xl border border-border/50">
              <Sparkles className="h-3 w-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                Travexa
              </span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your all-in-one travel companion that revolutionizes how you plan, book, and experience your journeys
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative overflow-hidden py-8">
            <div 
              className="flex transition-transform duration-700 ease-out gap-6"
              style={{ transform: `translateX(calc(-${activeIndex * (100 / 3)}% - ${activeIndex * 24}px))` }}
            >
              {[...features, ...features].map((feature, idx) => {
                const isActive = idx % features.length === activeIndex;
                return (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-full md:w-[calc(33.333%-16px)] transition-all duration-500 ${
                      isActive ? 'scale-105 z-10' : 'scale-95 opacity-70'
                    }`}
                    onClick={() => setActiveIndex(idx % features.length)}
                  >
                    <div 
                      className={`
                        relative p-6 rounded-2xl cursor-pointer
                        backdrop-blur-xl bg-background/40
                        border-2 transition-all duration-500
                        ${isActive 
                          ? `border-transparent shadow-2xl ${feature.glow}` 
                          : 'border-border/30 hover:border-border/50'
                        }
                      `}
                      style={{
                        background: isActive 
                          ? `linear-gradient(135deg, hsl(var(--background) / 0.9), hsl(var(--background) / 0.7))` 
                          : undefined
                      }}
                    >
                      {/* Glossy Overlay */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                        <div className={`absolute inset-0 ${feature.bgGlow} opacity-0 transition-opacity duration-500 ${isActive ? 'opacity-30' : ''}`} />
                      </div>

                      {/* Gradient Border Effect */}
                      {isActive && (
                        <div className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r ${feature.gradient} -z-10 blur-sm opacity-60`} />
                      )}

                      <div className="relative z-10">
                        <div className={`
                          text-5xl mb-4 transition-all duration-500
                          ${isActive ? 'scale-125 animate-bounce' : ''}
                        `}>
                          {feature.emoji}
                        </div>
                        <h3 className={`
                          text-xl font-bold mb-3 transition-all duration-300
                          ${isActive ? `text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient}` : ''}
                        `}>
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {features.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`
                    h-2 rounded-full transition-all duration-300
                    ${idx === activeIndex 
                      ? 'w-8 bg-gradient-to-r from-primary to-accent' 
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Static Grid for Mobile */}
          <div className="hidden md:hidden grid-cols-1 gap-4 mt-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl backdrop-blur-xl bg-background/40 border border-border/30"
              >
                <div className="text-4xl mb-3">{feature.emoji}</div>
                <h3 className={`text-lg font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient}`}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <FeaturedTrips />

        {/* Feedback Section */}
        <section className="container mx-auto px-6 py-20 max-w-4xl">
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
                Travexa is currently in development. We're building a fully functional travel planning and booking platform with social networking features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 relative z-10">
              <p className="text-xl font-medium text-foreground">
                Would you use Travexa if it were fully functional?
              </p>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your feedback helps us understand what travelers need most. We're working hard to bring you features like social connections with fellow travelers, travel companion matching, and seamless booking experiences.
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

      <footer className="relative z-10 border-t border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <p>© {new Date().getFullYear()} Travexa. All rights reserved.</p>
              <p className="text-xs mt-1">Made with ❤️ by Pranay with Rajasekhar</p>
            </div>
            <div className="flex gap-6">
              <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
