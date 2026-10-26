import { motion } from "motion/react";

import { cn } from "@/lib/utils";

interface SectionFrameProps {
  className?: string;
  /** Show crosshair markers at corners (default true) */
  crosshairs?: boolean;
}

const CROSSHAIR_SIZE = 8;

function Crosshair({ className }: { className?: string }) {
  return (
    <svg
      width={CROSSHAIR_SIZE * 2 + 1}
      height={CROSSHAIR_SIZE * 2 + 1}
      viewBox={`0 0 ${CROSSHAIR_SIZE * 2 + 1} ${CROSSHAIR_SIZE * 2 + 1}`}
      className={cn("text-foreground/15 dark:text-foreground/10 absolute", className)}
      aria-hidden
    >
      <line
        x1={CROSSHAIR_SIZE + 0.5}
        y1={0}
        x2={CROSSHAIR_SIZE + 0.5}
        y2={CROSSHAIR_SIZE * 2 + 1}
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1={0}
        y1={CROSSHAIR_SIZE + 0.5}
        x2={CROSSHAIR_SIZE * 2 + 1}
        y2={CROSSHAIR_SIZE + 0.5}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

export function SectionFrame({ className, crosshairs = true }: SectionFrameProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {/* Left vertical rule */}
      <motion.div
        className="bg-foreground/6 dark:bg-foreground/4 absolute top-0 bottom-0 left-0 w-px"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ transformOrigin: "top" }}
      />
      {/* Right vertical rule */}
      <motion.div
        className="bg-foreground/6 dark:bg-foreground/4 absolute top-0 right-0 bottom-0 w-px"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        style={{ transformOrigin: "top" }}
      />
      {crosshairs && (
        <>
          <Crosshair className="-top-2 -left-2" />
          <Crosshair className="-top-2 -right-2" />
          <Crosshair className="-bottom-2 -left-2" />
          <Crosshair className="-right-2 -bottom-2" />
        </>
      )}
    </div>
  );
}
