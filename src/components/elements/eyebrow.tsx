import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  /** Show a leading tick mark (default true) */
  tick?: boolean;
}

export function Eyebrow({ children, className, tick = true }: EyebrowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {tick && <span aria-hidden className="bg-chart-1 inline-block h-3 w-px rounded-full" />}
      <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">{children}</span>
    </div>
  );
}
