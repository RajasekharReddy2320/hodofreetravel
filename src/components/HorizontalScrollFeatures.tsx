import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Camera, Ticket, Bot, Smartphone, ArrowRight, Check } from "lucide-react";

const features = [
  {
    Icon: Users,
    emoji: "👥",
    title: "Social Travel Network",
    subtitle: "Connect & Explore Together",
    description:
      "Connect with fellow travelers, share experiences, and discover trips through our vibrant community.",
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
    description:
      "Post photos, stories, and experiences from your travels. Turn memories into inspiring stories.",
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
    description:
      "Book flights, trains, and buses from multiple providers. Compare prices and manage all tickets.",
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
    description:
      "Manage bookings, connect with travelers, and plan trips all in one dashboard with real-time sync.",
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
  const [progress, setProgress] = useState(0); // 0..(features.length-1)
  const [locked, setLocked] = useState(false);

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

  // Lock only when the section fully occupies the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.intersectionRatio >= 0.98) {
          lock();
        } else {
          unlock();
        }
      },
      { threshold: [0, 0.5, 0.75, 0.98, 1] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [lock, unlock]);

  // Wheel -> horizontal progress (no vertical movement while locked)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!locked) return;

      const delta = e.deltaY;
      const next = clamp(progress + delta * 0.0025, 0, maxProgress);

      // If we can move horizontally, consume the wheel.
      if (next !== progress) {
        e.preventDefault();
        setProgress(next);
        setActiveIndex(Math.round(next));
        return;
      }

      // At the ends: unlock AND nudge scroll so we actually exit the section
      // (prevents the observer from immediately re-locking at the same spot).
      const leavingDown = progress >= maxProgress && delta > 0;
      const leavingUp = progress <= 0 && delta < 0;
      if (leavingDown || leavingUp) {
        unlock();
        requestAnimationFrame(() => {
          window.scrollBy({ top: leavingDown ? 2 : -2, left: 0, behavior: "auto" });
        });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel as any);
  }, [locked, progress, maxProgress, unlock]);

  // Keyboard support (optional but improves “site-like” feel)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!locked) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = clamp(progress + dir * 0.25, 0, maxProgress);
      setProgress(next);
      setActiveIndex(Math.round(next));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locked, progress, maxProgress]);

  const translateX = -progress * 100;

  return (
    <section
      id="features"
      ref={containerRef as any}
      className="relative h-screen -mb-px"
      aria-label="Travexa features"
    >
      {/* Progress Indicator */}
      <div
        className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4 transition-opacity duration-500"
        style={{ opacity: locked ? 1 : 0, pointerEvents: locked ? "auto" : "none" }}
      >
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border">
          {features.map((feature, idx) => (
            <button
              key={idx}
              onClick={() => {
                setProgress(idx);
                setActiveIndex(idx);
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
                    : "bg-muted text-muted-foreground"}
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

        <div className="h-1 bg-muted rounded-full overflow-hidden mx-4">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
            style={{ width: `${(progress / maxProgress) * 100}%` }}
          />
        </div>
      </div>

      {/* Mobile Progress Dots */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex lg:hidden gap-2 p-2 bg-card/80 backdrop-blur-xl rounded-full shadow-xl border transition-opacity duration-500"
        style={{ opacity: locked ? 1 : 0, pointerEvents: locked ? "auto" : "none" }}
      >
        {features.map((feature, idx) => (
          <button
            key={idx}
            onClick={() => {
              setProgress(idx);
              setActiveIndex(idx);
            }}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${activeIndex === idx ? `bg-gradient-to-r ${feature.gradient} scale-125` : "bg-muted hover:bg-muted-foreground/50"}
            `}
            aria-label={`Go to ${feature.title}`}
          />
        ))}
      </div>

      {/* Track */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${translateX}%)`, width: `${features.length * 100}%` }}
        >
          {features.map((feature, idx) => (
            <article
              key={idx}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              style={{ width: `${100 / features.length}%` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} dark:opacity-100 opacity-0`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.lightBg} dark:opacity-0 opacity-50`} />

              <div
                className={`absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-r ${feature.gradient} rounded-full blur-[100px] opacity-20`}
                style={{ transform: `translate(${(progress - idx) * -50}px, ${(progress - idx) * 30}px)` }}
              />
              <div
                className={`absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r ${feature.gradient} rounded-full blur-[120px] opacity-15`}
                style={{ transform: `translate(${(progress - idx) * -40}px, ${(progress - idx) * -20}px)` }}
              />

              <div className="container mx-auto px-6 md:px-12 lg:px-20 py-20 max-w-7xl relative z-10">
                <div
                  className={`flex flex-col ${
                    idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  } items-center gap-12 lg:gap-20`}
                >
                  <div
                    className="flex-1 flex justify-center transition-transform duration-200"
                    style={{ transform: `translateX(${(progress - idx) * 40}px)` }}
                  >
                    <div className="relative">
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-3xl blur-3xl opacity-40 scale-125`}
                      />

                      <div className="relative bg-card/80 backdrop-blur-xl border rounded-3xl p-8 md:p-12 shadow-2xl">
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
                          className="absolute -top-6 -right-6 text-5xl md:text-6xl"
                          style={{ animation: "float 4s ease-in-out infinite" }}
                        >
                          {feature.emoji}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex-1 text-center lg:text-left transition-transform duration-200"
                    style={{ transform: `translateX(${(progress - idx) * 25}px)` }}
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
