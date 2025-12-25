import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Globe, Camera, Ticket, Bot, Smartphone, ArrowRight, Check } from "lucide-react";

const features = [
  {
    Icon: Users,
    emoji: "👥",
    title: "Social Travel Network",
    subtitle: "Connect & Explore Together",
    description: "Connect with fellow travelers, share experiences, and discover trips through our vibrant community.",
    highlights: ["Find travel buddies", "Share trip photos", "Join communities"],
    gradient: "from-pink-500 via-rose-500 to-red-500",
    bgGradient: "from-pink-950/50 via-rose-950/30 to-red-950/50",
    lightBg: "from-pink-100 via-rose-50 to-red-100",
  },
  {
    Icon: Globe,
    emoji: "🌍",
    title: "Find Travel Companions",
    subtitle: "Never Travel Alone",
    description: "Create or join travel groups for your upcoming trips. Smart matching connects you with compatible travelers.",
    highlights: ["Smart matching", "Share costs", "Group planning"],
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    bgGradient: "from-blue-950/50 via-cyan-950/30 to-teal-950/50",
    lightBg: "from-blue-100 via-cyan-50 to-teal-100",
  },
  {
    Icon: Camera,
    emoji: "📸",
    title: "Share Your Adventures",
    subtitle: "Inspire & Be Inspired",
    description: "Post photos, stories, and experiences from your travels. Turn memories into inspiring stories.",
    highlights: ["Photo journals", "Travel stories", "Get featured"],
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    bgGradient: "from-violet-950/50 via-purple-950/30 to-fuchsia-950/50",
    lightBg: "from-violet-100 via-purple-50 to-fuchsia-100",
  },
  {
    Icon: Ticket,
    emoji: "🎫",
    title: "Unified Booking",
    subtitle: "All Tickets, One Place",
    description: "Book flights, trains, and buses from multiple providers. Compare prices and manage all tickets.",
    highlights: ["Price comparison", "Multi-modal", "E-tickets"],
    gradient: "from-amber-500 via-orange-500 to-red-500",
    bgGradient: "from-amber-950/50 via-orange-950/30 to-red-950/50",
    lightBg: "from-amber-100 via-orange-50 to-red-100",
  },
  {
    Icon: Bot,
    emoji: "🤖",
    title: "AI Trip Planning",
    subtitle: "Smart Itineraries",
    description: "Get personalized itineraries with our AI planner. From attractions to hidden gems, matched to your style.",
    highlights: ["Personalized AI", "Budget optimize", "Local tips"],
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    bgGradient: "from-emerald-950/50 via-green-950/30 to-lime-950/50",
    lightBg: "from-emerald-100 via-green-50 to-lime-100",
  },
  {
    Icon: Smartphone,
    emoji: "📱",
    title: "All-in-One Platform",
    subtitle: "Your Travel Companion",
    description: "Manage bookings, connect with travelers, and plan trips all in one dashboard with real-time sync.",
    highlights: ["Unified dashboard", "Offline access", "Real-time sync"],
    gradient: "from-indigo-500 via-blue-500 to-sky-500",
    bgGradient: "from-indigo-950/50 via-blue-950/30 to-sky-950/50",
    lightBg: "from-indigo-100 via-blue-50 to-sky-100",
  },
];

const HorizontalScrollFeatures = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInSection, setIsInSection] = useState(false);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const containerTop = rect.top;
    const containerHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Check if we're in the section (from when top hits viewport top until section ends)
    const inSection = containerTop <= 0 && containerTop > -(containerHeight - viewportHeight);
    setIsInSection(inSection);

    const scrolled = -containerTop;
    const scrollableDistance = containerHeight - viewportHeight;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

    setScrollProgress(progress);
    setActiveIndex(Math.min(features.length - 1, Math.floor(progress * features.length)));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const translateX = scrollProgress * (features.length - 1) * -100;

  return (
    <section 
      id="features" 
      ref={containerRef} 
      className="relative -mb-px" 
      style={{ height: `${features.length * 100}vh` }}
    >
      {/* Progress Indicator - Redesigned */}
      <div 
        className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4 transition-opacity duration-500"
        style={{ opacity: isInSection ? 1 : 0, pointerEvents: isInSection ? 'auto' : 'none' }}
      >
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border">
          {features.map((feature, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!containerRef.current) return;
                const targetScroll = containerRef.current.offsetTop + (idx / features.length) * (containerRef.current.offsetHeight - window.innerHeight);
                window.scrollTo({ top: targetScroll, behavior: "smooth" });
              }}
              className={`
                flex items-center gap-3 w-full p-2 rounded-xl transition-all duration-300
                ${activeIndex === idx ? "bg-primary/10" : "hover:bg-muted/50"}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300
                  ${activeIndex === idx
                    ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg scale-110`
                    : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {feature.emoji}
              </div>
              <span className={`text-sm font-medium transition-colors ${activeIndex === idx ? "text-foreground" : "text-muted-foreground"}`}>
                {feature.title.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden mx-4">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Mobile Progress Dots */}
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex lg:hidden gap-2 p-2 bg-card/80 backdrop-blur-xl rounded-full shadow-xl border transition-opacity duration-500"
        style={{ opacity: isInSection ? 1 : 0, pointerEvents: isInSection ? 'auto' : 'none' }}
      >
        {features.map((feature, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!containerRef.current) return;
              const targetScroll = containerRef.current.offsetTop + (idx / features.length) * (containerRef.current.offsetHeight - window.innerHeight);
              window.scrollTo({ top: targetScroll, behavior: "smooth" });
            }}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${activeIndex === idx
                ? `bg-gradient-to-r ${feature.gradient} scale-125`
                : "bg-muted hover:bg-muted-foreground/50"
              }
            `}
          />
        ))}
      </div>

      {/* Sticky Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Horizontal Track */}
        <div
          className="flex h-full transition-transform duration-150 ease-out"
          style={{ transform: `translateX(${translateX}%)`, width: `${features.length * 100}%` }}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              style={{ width: `${100 / features.length}%` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} dark:opacity-100 opacity-0`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.lightBg} dark:opacity-0 opacity-50`} />
              
              {/* Animated Orbs - Parallax */}
              <div
                className={`absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-r ${feature.gradient} rounded-full blur-[100px] opacity-20`}
                style={{
                  transform: `translate(${(scrollProgress * features.length - idx) * -50}px, ${(scrollProgress * features.length - idx) * 30}px)`,
                }}
              />
              <div
                className={`absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r ${feature.gradient} rounded-full blur-[120px] opacity-15`}
                style={{
                  transform: `translate(${(scrollProgress * features.length - idx) * -40}px, ${(scrollProgress * features.length - idx) * -20}px)`,
                }}
              />

              {/* Content */}
              <div className="container mx-auto px-6 md:px-12 lg:px-20 py-20 max-w-7xl relative z-10">
                <div className={`flex flex-col ${idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-20`}>
                  {/* Icon/Visual Side - Faster Parallax (Foreground) */}
                  <div
                    className="flex-1 flex justify-center transition-transform duration-200"
                    style={{
                      transform: `translateX(${(scrollProgress * features.length - idx) * 40}px)`,
                    }}
                  >
                    <div className="relative">
                      {/* Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-3xl blur-3xl opacity-40 scale-125`} />
                      
                      {/* Card */}
                      <div className="relative bg-card/80 backdrop-blur-xl border rounded-3xl p-8 md:p-12 shadow-2xl">
                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-xl mb-6`}>
                          <feature.Icon className="h-12 w-12 md:h-16 md:w-16 text-white" strokeWidth={1.5} />
                        </div>
                        
                        {/* Highlights */}
                        <div className="space-y-3">
                          {feature.highlights.map((highlight, hIdx) => (
                            <div key={hIdx} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}>
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm font-medium">{highlight}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Emoji Float */}
                        <div 
                          className="absolute -top-6 -right-6 text-5xl md:text-6xl"
                          style={{ animation: "float 4s ease-in-out infinite" }}
                        >
                          {feature.emoji}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Side - Slower Parallax */}
                  <div
                    className="flex-1 text-center lg:text-left transition-transform duration-200"
                    style={{
                      transform: `translateX(${(scrollProgress * features.length - idx) * 25}px)`,
                    }}
                  >
                    <Badge className={`mb-6 bg-gradient-to-r ${feature.gradient} text-white border-0 text-sm px-5 py-2 shadow-lg`}>
                      {feature.subtitle}
                    </Badge>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                      <span className={`text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient}`}>
                        {feature.title}
                      </span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                      {feature.description}
                    </p>
                    <Button
                      size="lg"
                      asChild
                      className={`px-8 py-6 text-lg bg-gradient-to-r ${feature.gradient} border-0 hover:opacity-90 transition-all hover:scale-105 shadow-xl group`}
                    >
                      <Link to="/signup">
                        Get Started
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
