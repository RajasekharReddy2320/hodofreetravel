import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Camera, Ticket, Bot, Smartphone, ArrowRight, Check } from "lucide-react";
import { useReducedMotion } from "@/contexts/ReducedMotionContext";
import ReduceMotionToggle from "@/components/ReduceMotionToggle";

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
    description:
      "Create or join travel groups for your upcoming trips. Smart matching connects you with compatible travelers.",
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
    description:
      "Get personalized itineraries with our AI planner. From attractions to hidden gems, matched to your style.",
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

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const HorizontalScrollFeatures = () => {
  const containerRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [locked, setLocked] = useState(false);
  const { prefersReducedMotion } = useReducedMotion();

  const maxProgress = useMemo(() => Math.max(0, features.length - 1), []);

  const lock = useCallback(() => {
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.overflowY = "hidden";
    setLocked(true);
  }, []);

  const unlock = useCallback(() => {
    document.body.style.overflowY = "";
    setLocked(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        // Increased threshold to ensure we don't lock until fully visible
        if (entry.intersectionRatio >= 0.95) {
          lock();
        } else {
          unlock();
        }
      },
      { threshold: [0, 0.5, 0.95, 1] },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [lock, unlock]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!locked) return;

      const delta = e.deltaY;
      // Adjusted sensitivity for smoother control
      const next = clamp(progress + delta * 0.002, 0, maxProgress);

      if (next !== progress) {
        e.preventDefault();
        setProgress(next);
        setActiveIndex(Math.round(next));
        return;
      }

      const leavingDown = progress >= maxProgress && delta > 0;
      const leavingUp = progress <= 0 && delta < 0;
      if (leavingDown || leavingUp) {
        unlock();
        requestAnimationFrame(() => {
          // Smaller push to avoid "extra space" gap
          window.scrollBy({ top: leavingDown ? 1 : -1, left: 0, behavior: "auto" });
        });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel as any);
  }, [locked, progress, maxProgress, unlock]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!locked) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = clamp(progress + dir * 0.5, 0, maxProgress);
      setProgress(next);
      setActiveIndex(Math.round(next));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locked, progress, maxProgress]);

  // --- THE FIX ---
  // Before: -progress * 100 (Moves 100% of TOTAL width per step) -> WAY too fast
  // Now: -(progress / features.length) * 100 (Moves 100% of VIEWPORT width per step) -> Perfect sync
  const translateX = -(progress / features.length) * 100;

  const progressPercent = (progress / maxProgress) * 100;

  return (
    <section
      id="features"
      ref={containerRef as any}
      className="relative h-screen overflow-hidden" // Removed -mb-px to fix gap
      aria-label="Travexa features"
    >
      {/* Top Progress Bar + Counter */}
      <div
        className="fixed top-24 left-0 right-0 z-50 px-4 transition-all duration-500"
        style={{
          opacity: locked ? 1 : 0,
          pointerEvents: locked ? "auto" : "none",
          transform: locked ? "translateY(0)" : "translateY(-20px)",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 bg-background/80 backdrop-blur-xl rounded-full px-4 py-2 shadow-lg border border-border/50">
            {/* Slide Counter */}
            <div className="flex items-center gap-2 text-sm font-medium min-w-[60px]">
              <span className="text-foreground">{activeIndex + 1}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{features.length}</span>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${features[activeIndex]?.gradient || "from-primary to-accent"} rounded-full`}
                style={{
                  width: `${progressPercent}%`,
                  transition: prefersReducedMotion ? "none" : "width 150ms ease-out",
                }}
              />
            </div>

            {/* Feature Title */}
            <div className="hidden sm:block text-sm font-medium text-foreground min-w-[140px] text-right truncate">
              {features[activeIndex]?.title}
            </div>

            {/* Reduce Motion Toggle */}
            <ReduceMotionToggle compact className="ml-2" />
          </div>
        </div>
      </div>

      {/* Side Navigation (Desktop) */}
      <div
        className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4 transition-opacity duration-500"
        style={{ opacity: locked ? 1 : 0, pointerEvents: locked ? "auto" : "none" }}
      >
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-border/50">
          {features.map((feature, idx) => (
            <button
              key={idx}
              onClick={() => {
                setProgress(idx);
                setActiveIndex(idx);
              }}
              className={`
                flex items-center gap-3 w-full p-2 rounded-xl transition-all
                ${prefersReducedMotion ? "" : "duration-300"}
                ${activeIndex === idx ? "bg-primary/10" : "hover:bg-muted/50"}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                  ${prefersReducedMotion ? "" : "duration-300"}
                  ${
                    activeIndex === idx
                      ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg scale-110`
                      : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {feature.emoji}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  activeIndex === idx ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {feature.title.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Track */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            transform: `translateX(${translateX}%)`,
            width: `${features.length * 100}%`,
            transition: prefersReducedMotion ? "none" : "transform 200ms ease-out",
          }}
        >
          {features.map((feature, idx) => (
            <article
              key={idx}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              style={{ width: `${100 / features.length}%` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} dark:opacity-100 opacity-0`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.lightBg} dark:opacity-0 opacity-50`} />

              {!prefersReducedMotion && (
                <>
                  <div
                    className={`absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-r ${feature.gradient} rounded-full blur-[100px] opacity-20`}
                    style={{ transform: `translate(${(progress - idx) * -50}px, ${(progress - idx) * 30}px)` }}
                  />
                  <div
                    className={`absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r ${feature.gradient} rounded-full blur-[120px] opacity-15`}
                    style={{ transform: `translate(${(progress - idx) * -40}px, ${(progress - idx) * -20}px)` }}
                  />
                </>
              )}

              <div className="container mx-auto px-6 md:px-12 lg:px-20 py-20 max-w-7xl relative z-10">
                <div
                  className={`flex flex-col ${
                    idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  } items-center gap-12 lg:gap-20`}
                >
                  {/* Card Section */}
                  <div
                    className="flex-1 flex justify-center"
                    style={{
                      transform: prefersReducedMotion ? "none" : `translateX(${(progress - idx) * 40}px)`,
                      transition: prefersReducedMotion ? "none" : "transform 200ms ease-out",
                    }}
                  >
                    <div className="relative">
                      {!prefersReducedMotion && (
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-3xl blur-3xl opacity-40 scale-125`}
                        />
                      )}

                      <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl">
                        <div
                          className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-xl mb-6`}
                        >
                          <feature.Icon className="h-12 w-12 md:h-16 md:w-16 text-white" strokeWidth={1.5} />
                        </div>

                        <div className="space-y-3">
                          {feature.highlights.map((highlight, hIdx) => (
                            <div key={hIdx} className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}
                              >
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm font-medium">{highlight}</span>
                            </div>
                          ))}
                        </div>

                        <div
                          className="absolute -top-6 -right-6 text-5xl md:text-6xl transition-transform duration-1000"
                          style={{
                            animation: !prefersReducedMotion ? "float 4s ease-in-out infinite" : "none",
                          }}
                        >
                          {feature.emoji}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Section */}
                  <div
                    className="flex-1 text-center lg:text-left"
                    style={{
                      transform: prefersReducedMotion ? "none" : `translateX(${(progress - idx) * 25}px)`,
                      transition: prefersReducedMotion ? "none" : "transform 200ms ease-out",
                    }}
                  >
                    <Badge
                      className={`mb-6 bg-gradient-to-r ${feature.gradient} text-white border-0 text-sm px-5 py-2 shadow-lg`}
                    >
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
                      className={`px-8 py-6 text-lg bg-gradient-to-r ${feature.gradient} border-0 hover:opacity-90 shadow-xl group ${
                        prefersReducedMotion ? "" : "transition-all hover:scale-105"
                      }`}
                    >
                      <Link to="/signup">
                        Get Started
                        <ArrowRight
                          className={`ml-2 h-5 w-5 ${prefersReducedMotion ? "" : "group-hover:translate-x-1 transition-transform"}`}
                        />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
