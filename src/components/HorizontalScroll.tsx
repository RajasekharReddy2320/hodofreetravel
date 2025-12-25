import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const cards = [
  {
    title: "Find Travel Buddies",
    description: "Don't travel alone. Connect with students from BIT Mesra going to the same destination.",
    color: "bg-orange-500",
    id: 1,
  },
  {
    title: "WanderLust Feed",
    description: "Share your travel moments and discover hidden gems posted by other travelers.",
    color: "bg-blue-500",
    id: 2,
  },
  {
    title: "AI Trip Planner",
    description: "Budget, Time, or Comfort? Let our AI build the perfect itinerary in seconds.",
    color: "bg-green-500",
    id: 3,
  },
  {
    title: "Split Payments",
    description: "One cart, multiple travelers. Book flights and hotels in a single shared transaction.",
    color: "bg-purple-500",
    id: 4,
  },
];

const HorizontalScroll = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-95%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-neutral-900">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`group relative h-[450px] w-[450px] overflow-hidden rounded-2xl ${card.color} p-8 shadow-xl transition-transform hover:scale-105`}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 flex h-full flex-col justify-between p-4">
                <h3 className="text-4xl font-black text-white uppercase leading-tight">
                  {card.title}
                </h3>
                <p className="text-lg font-medium text-white/90">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HorizontalScroll;
