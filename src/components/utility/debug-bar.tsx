import { useEffect, useState } from "react";

import { getTailwindBreakpoint, type TailwindBreakpointName, tailwindBreakpoints } from "@/lib/tailwind-breakpoints";
import { cn } from "@/lib/utils";

const breakpointLabels: { name: TailwindBreakpointName; label: string }[] = [
  { name: "default", label: "< sm" },
  ...tailwindBreakpoints
    .slice()
    .reverse()
    .map((breakpoint) => ({
      name: breakpoint.name,
      label: breakpoint.name,
    })),
];

export function DebugBar() {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [breakpoint, setBreakpoint] = useState<TailwindBreakpointName>("default");

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setViewportWidth(width);
      setBreakpoint(getTailwindBreakpoint(width));
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] border-t border-white/10 bg-black/85 font-mono text-[11px] text-white backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 px-3 py-1.5">
        <div className="flex items-center gap-1">
          {breakpointLabels.map(({ name, label }) => (
            <span
              key={name}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors",
                breakpoint === name ? "bg-white text-black" : "text-white/50",
              )}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="text-white/70 tabular-nums">
          {breakpoint}
          <span className="text-white/40"> · </span>
          {viewportWidth}px
        </div>
      </div>
    </div>
  );
}
