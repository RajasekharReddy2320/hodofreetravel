import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Globe, Camera, Ticket, Bot, Smartphone } from "lucide-react";

const features = [
  {
    Icon: Users,
    emoji: "👥",
    title: "Social Travel Network",
    subtitle: "Connect & Explore Together",
    description: "Connect with fellow travelers, share experiences, and discover trips through our vibrant community.",
    longDescription: "Join thousands of passionate travelers who share their stories, tips, and adventures.",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    bgGradient: "from-pink-900/30 via-rose-900/20 to-red-900/30",
  },
  {
    Icon: Globe,
    emoji: "🌍",
    title: "Find Travel Companions",
    subtitle: "Never Travel Alone",
    description: "Create or join travel groups for your upcoming trips. Connect with people traveling to the same destination.",
    longDescription: "Our smart matching system connects you with compatible travelers. Share costs and experiences.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    bgGradient: "from-blue-900/30 via-cyan-900/20 to-teal-900/30",
  },
  {
    Icon: Camera,
    emoji: "📸",
    title: "Share Your Adventures",
    subtitle: "Inspire & Be Inspired",
    description: "Post photos, stories, and experiences from your travels. Like, comment, and save posts.",
    longDescription: "Turn your travel memories into inspiring stories. Get featured and become a travel influencer.",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    bgGradient: "from-violet-900/30 via-purple-900/20 to-fuchsia-900/30",
  },
  {
    Icon: Ticket,
    emoji: "🎫",
    title: "Unified Booking",
    subtitle: "All Tickets, One Place",
    description: "Book flights, trains, and buses from multiple providers in one place.",
    longDescription: "Compare prices across providers, book seamlessly, and manage all your tickets.",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    bgGradient: "from-amber-900/30 via-orange-900/20 to-red-900/30",
  },
  {
    Icon: Bot,
    emoji: "🤖",
    title: "AI Trip Planning",
    subtitle: "Smart Itineraries",
    description: "Get personalized itineraries tailored to your preferences with our AI-powered planner.",
    longDescription: "From must-see attractions to hidden gems, get recommendations that match your style.",
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    bgGradient: "from-emerald-900/30 via-green-900/20 to-lime-900/30",
  },
  {
    Icon: Smartphone,
    emoji: "📱",
    title: "All-in-One Platform",
    subtitle: "Your Travel Companion",
    description: "Manage bookings, connect with travelers, and plan trips all in one dashboard.",
    longDescription: "Real-time updates, offline access, and seamless synchronization across devices.",
    gradient: "from-indigo-500 via-blue-500 to-sky-500",
    bgGradient: "from-indigo-900/30 via-blue-900/20 to-sky-900/30",
  },
];

const HorizontalScrollFeatures = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !stickyRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const containerTop = rect.top;
    const containerHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Calculate how far we've scrolled through the container
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
    <section id="features" ref={containerRef} className="relative" style={{ height: `${features.length * 100}vh` }}>
      {/* Progress Indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 transition-opacity duration-300"
        style={{ opacity: scrollProgress > 0 && scrollProgress < 1 ? 1 : 0 }}
      >
        {features.map((feature, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!containerRef.current) return;
              const targetScroll = containerRef.current.offsetTop + (idx / features.length) * (containerRef.current.offsetHeight - window.innerHeight);
              window.scrollTo({ top: targetScroll, behavior: "smooth" });
            }}
            className="group relative flex items-center justify-end"
          >
            {/* Label on hover */}
            <span className={`
              absolute right-8 whitespace-nowrap text-sm font-medium px-3 py-1 rounded-full
              transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0
              bg-gradient-to-r ${feature.gradient} text-primary-foreground
            `}>
              {feature.title}
            </span>
            {/* Dot */}
            <div
              className={`
                w-3 h-3 rounded-full transition-all duration-300 border-2
                ${activeIndex === idx
                  ? `scale-125 bg-gradient-to-r ${feature.gradient} border-transparent shadow-lg`
                  : "bg-background border-muted-foreground/40 hover:scale-110"
                }
              `}
            />
          </button>
        ))}
      </div>

      {/* Sticky Container */}
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Horizontal Track */}
        <div
          className="flex h-full transition-transform duration-100 ease-out"
          style={{ transform: `translateX(${translateX}%)`, width: `${features.length * 100}%` }}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              style={{ width: `${100 / features.length}%` }}
            >
              {/* Parallax Background - moves slower */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-60 transition-transform duration-700`}
                style={{
                  transform: `translateX(${(scrollProgress * features.length - idx) * -15}%)`,
                }}
              />

              {/* Decorative blurs - parallax slower */}
              <div
                className={`absolute top-20 right-20 w-64 h-64 bg-gradient-to-r ${feature.gradient} rounded-full blur-3xl opacity-20`}
                style={{
                  transform: `translateX(${(scrollProgress * features.length - idx) * -25}px)`,
                }}
              />
              <div
                className={`absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r ${feature.gradient} rounded-full blur-3xl opacity-15`}
                style={{
                  transform: `translateX(${(scrollProgress * features.length - idx) * -35}px)`,
                }}
              />

              {/* Content */}
              <div className="container mx-auto px-6 py-20 max-w-5xl relative z-10">
                <div className={`flex flex-col ${idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-16`}>
                  {/* Icon Side - parallax faster (foreground) */}
                  <div
                    className="flex-1 flex justify-center transition-transform duration-300"
                    style={{
                      transform: `translateX(${(scrollProgress * features.length - idx) * 30}px)`,
                    }}
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-full blur-3xl opacity-30 scale-150`} />
                      <div
                        className={`
                          relative w-40 h-40 md:w-56 md:h-56 rounded-full
                          bg-gradient-to-br ${feature.gradient}
                          flex items-center justify-center shadow-2xl
                        `}
                        style={{ animation: "float 6s ease-in-out infinite" }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-background/40 via-background/10 to-transparent" />
                        <feature.Icon className="h-16 w-16 md:h-24 md:w-24 text-primary-foreground drop-shadow-2xl relative z-10" strokeWidth={1.5} />
                        <div className="absolute -top-3 -right-3 text-4xl md:text-5xl animate-bounce">{feature.emoji}</div>
                      </div>
                    </div>
                  </div>

                  {/* Text Side */}
                  <div
                    className="flex-1 text-center lg:text-left transition-transform duration-300"
                    style={{
                      transform: `translateX(${(scrollProgress * features.length - idx) * 20}px)`,
                    }}
                  >
                    <Badge className={`mb-4 bg-gradient-to-r ${feature.gradient} text-primary-foreground border-0 text-sm px-4 py-1`}>
                      {feature.subtitle}
                    </Badge>
                    <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient}`}>
                      {feature.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-4 leading-relaxed">{feature.description}</p>
                    <p className="text-base text-muted-foreground/80 mb-6 leading-relaxed">{feature.longDescription}</p>
                    <Button
                      size="lg"
                      asChild
                      className={`px-8 py-5 text-base bg-gradient-to-r ${feature.gradient} border-0 hover:opacity-90 transition-all hover:scale-105 shadow-xl`}
                    >
                      <Link to="/signup">
                        Get Started
                        <Sparkles className="ml-2 h-5 w-5" />
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
