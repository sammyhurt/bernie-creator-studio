import { motion } from "motion/react";

import { cn } from "@/lib/utils";

interface HairlineDividerProps {
  className?: string;
  /** Optional center label text */
  label?: string;
  /** Show tick marks at ends (default true) */
  ticks?: boolean;
}

export function HairlineDivider({ className, label, ticks = true }: HairlineDividerProps) {
  return (
    <div aria-hidden className={cn("relative flex items-center", className)}>
      <motion.div
        className="bg-foreground/8 dark:bg-foreground/6 h-px flex-1"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
      />
      {label && (
        <span className="text-muted-foreground/60 mx-4 shrink-0 text-[10px] font-medium tracking-[0.2em] uppercase">
          {label}
        </span>
      )}
      {!label && ticks && <div className="bg-foreground/12 dark:bg-foreground/8 mx-0 h-2 w-px" />}
      <motion.div
        className="bg-foreground/8 dark:bg-foreground/6 h-px flex-1"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        style={{ transformOrigin: "right" }}
      />
    </div>
  );
}
