import { cn } from "@/lib/utils";

interface FluxLinesPatternProps {
  className?: string;
  /** Spacing between lines in px (default 8) */
  spacing?: number;
  /** Line thickness in px (default 0.5) */
  thickness?: number;
  /** 'horizontal' | 'vertical' (default horizontal) */
  direction?: "horizontal" | "vertical";
}

export function FluxLinesPattern({
  className,
  spacing = 8,
  thickness = 0.5,
  direction = "horizontal",
}: FluxLinesPatternProps) {
  const bgImage =
    direction === "horizontal"
      ? `repeating-linear-gradient(to bottom, currentColor 0px, currentColor ${thickness}px, transparent ${thickness}px, transparent ${spacing}px)`
      : `repeating-linear-gradient(to right, currentColor 0px, currentColor ${thickness}px, transparent ${thickness}px, transparent ${spacing}px)`;

  return (
    <div
      aria-hidden
      className={cn(
        "text-foreground pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)] opacity-[0.04] dark:opacity-[0.06]",
        className,
      )}
      style={{ backgroundImage: bgImage }}
    />
  );
}
