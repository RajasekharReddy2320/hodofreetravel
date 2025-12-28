import { useRef } from "react";
import { motion, useTransform, useScroll } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: any;
  title: string;
  description: string;
  emoji: string;
}

interface Props {
  features: Feature[];
}

const HorizontalScrollFeatures = ({ features }: Props) => {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Map vertical scroll to horizontal movement.
  // We start at 5% padding and move left until the last card is visible.
  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-75%"]);

  return (
    // Height 400vh ensures the user has to scroll "through" this section for a while
    <section ref={targetRef} className="relative h-[400vh] bg-transparent">
      {/* The Sticky Container - This "Locks" the screen */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Title Section (Fixed Position) */}
        <div className="absolute top-12 left-6 md:left-20 z-20 max-w-lg pointer-events-none">
          <Badge variant="secondary" className="mb-4 bg-background/60 backdrop-blur-xl border border-border/50">
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose Travexa?</h2>
          <p className="text-muted-foreground text-lg">
            Your all-in-one travel companion.
            <br />
            <span className="text-sm opacity-70">(Scroll down to explore)</span>
          </p>
        </div>

        {/* The Horizontal Moving Track */}
        <motion.div style={{ x }} className="flex gap-8 pl-[10vw] md:pl-[35vw] items-center">
          {features.map((feature, index) => (
            // YOUR ORIGINAL CARD DESIGN PRESERVED BELOW
            <Card
              key={index}
              className="group relative h-[400px] w-[350px] shrink-0 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-card/50 backdrop-blur-xl border-border/50"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
              </div>

              <CardContent className="p-8 relative z-10 flex flex-col h-full justify-center">
                <div className="text-5xl mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {feature.emoji}
                </div>
                <h3 className="text-xl font-semibold mb-3 transition-colors duration-300 group-hover:text-accent">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Synced Progress Bar */}
        <div className="absolute bottom-12 left-10 right-10 md:left-20 md:right-20 h-1.5 bg-secondary/30 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div className="h-full bg-primary" style={{ scaleX: scrollYProgress, transformOrigin: "0%" }} />
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollFeatures;
