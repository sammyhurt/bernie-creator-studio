import { useId } from "react";

import { cn } from "@/lib/utils";

interface FluxContourPatternProps {
  className?: string;
  /** Number of concentric rings (default 6) */
  rings?: number;
}

export function FluxContourPattern({ className, rings = 6 }: FluxContourPatternProps) {
  const id = useId().replace(/:/g, "");
  const maskId = `contour-mask-${id}`;

  const cx = 200;
  const cy = 150;
  const gap = 32;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06] dark:opacity-[0.05]",
        "[mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_10%,transparent_70%)]",
        "[-webkit-mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_10%,transparent_70%)]",
        className,
      )}
    >
      <svg
        className="text-foreground h-full w-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
          </mask>
        </defs>
        {Array.from({ length: rings }, (_, i) => {
          const rx = (i + 1) * gap + 20;
          const ry = (i + 1) * gap * 0.65 + 12;
          const skew = Math.sin(i * 0.9) * 12;
          return (
            <ellipse
              key={i}
              cx={cx + skew}
              cy={cy + Math.cos(i * 0.7) * 8}
              rx={rx}
              ry={ry}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              mask={`url(#${maskId})`}
            />
          );
        })}
      </svg>
    </div>
  );
}
