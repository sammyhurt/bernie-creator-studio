import { cn } from "@/lib/utils";

interface FluxDotGridProps {
  className?: string;
  /** Spacing between dots in px (default 14) */
  spacing?: number;
  /** Dot size in px (default 1) */
  dotSize?: number;
}

export function FluxDotGrid({ className, spacing = 14, dotSize = 1 }: FluxDotGridProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "text-foreground pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)] opacity-[0.05] dark:opacity-[0.08]",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(currentColor ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
      }}
    />
  );
}
