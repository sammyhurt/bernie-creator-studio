import { cn } from "@/lib/utils";

/** Text wordmark until Bernie picks a logo: serif name + small label, in his navy. */
export function Wordmark({ className, light = false, size = "md" }: { className?: string; light?: boolean; size?: "md" | "lg" }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-serif leading-none tracking-tight",
          size === "lg" ? "text-3xl" : "text-2xl",
          light ? "text-white" : "text-foreground",
        )}
      >
        Bernie
      </span>
      <span
        className={cn(
          "text-[10.5px] font-semibold tracking-[0.18em] uppercase",
          light ? "text-white/70" : "text-chart-1",
        )}
      >
        Creator Studio
      </span>
    </span>
  );
}
