import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useReducedMotion } from "@/contexts/ReducedMotionContext";

interface ReduceMotionToggleProps {
  className?: string;
  compact?: boolean;
}

const ReduceMotionToggle = ({ className = "", compact = false }: ReduceMotionToggleProps) => {
  const { prefersReducedMotion, toggleReducedMotion } = useReducedMotion();

  if (compact) {
    return (
      <button
        onClick={toggleReducedMotion}
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-muted ${className}`}
        title={prefersReducedMotion ? "Enable animations" : "Reduce motion"}
      >
        <Sparkles 
          className={`h-4 w-4 transition-opacity ${prefersReducedMotion ? "opacity-40" : "opacity-100"}`} 
        />
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Switch
        id="reduce-motion"
        checked={prefersReducedMotion}
        onCheckedChange={toggleReducedMotion}
      />
      <Label htmlFor="reduce-motion" className="text-sm cursor-pointer">
        Reduce motion
      </Label>
    </div>
  );
};

export default ReduceMotionToggle;
