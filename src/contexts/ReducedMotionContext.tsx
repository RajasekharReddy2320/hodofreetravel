import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
  toggleReducedMotion: () => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextType | undefined>(undefined);

export const ReducedMotionProvider = ({ children }: { children: ReactNode }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    const saved = localStorage.getItem("reduceMotion");
    if (saved !== null) return saved === "true";
    // Check system preference
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    localStorage.setItem("reduceMotion", String(prefersReducedMotion));
    
    // Apply to document for CSS-based animations
    if (prefersReducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [prefersReducedMotion]);

  const toggleReducedMotion = () => setPrefersReducedMotion((prev) => !prev);

  return (
    <ReducedMotionContext.Provider value={{ prefersReducedMotion, toggleReducedMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  );
};

export const useReducedMotion = () => {
  const context = useContext(ReducedMotionContext);
  if (!context) {
    throw new Error("useReducedMotion must be used within a ReducedMotionProvider");
  }
  return context;
};
