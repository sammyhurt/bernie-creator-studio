import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import { motion } from "motion/react";
import type { ComponentType, ReactNode } from "react";

import { Eyebrow } from "@/components/elements/eyebrow";
import { FluxDotGrid } from "@/components/elements/flux-dot-grid";
import { FluxLinesPattern } from "@/components/elements/flux-lines-pattern";
import { FluxWavePattern } from "@/components/elements/flux-wave-pattern";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Pattern = "dots" | "wave" | "lines";

export function PatternBg({ pattern }: { pattern?: Pattern }) {
  if (pattern === "wave")
    return (
      <FluxWavePattern
        masked={false}
        scale={16}
        strokeWidth={0.5}
        className="inset-4 opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.09] dark:opacity-[0.06]"
      />
    );
  if (pattern === "lines")
    return <FluxLinesPattern className="inset-4 opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.08] dark:opacity-[0.06]" />;
  if (pattern === "dots")
    return <FluxDotGrid className="inset-4 opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.09] dark:opacity-[0.08]" />;
  return null;
}

const reveal = {
  hidden: { opacity: 0, y: 22, filter: "blur(3px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 90, damping: 20 } },
};

/** The template's bento FeatureCard shell: hairline gradient top, optional pattern. */
export function Panel({
  eyebrow,
  action,
  pattern,
  className,
  bodyClassName,
  children,
}: {
  eyebrow?: string;
  action?: ReactNode;
  pattern?: Pattern;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <motion.div variants={reveal} className={cn("min-w-0", className)}>
      <Card className="group hover:border-foreground/15 relative h-full gap-0 overflow-hidden py-0 shadow-none transition-[border-color,box-shadow] duration-300 hover:shadow-md">
        <div aria-hidden className="from-chart-1/40 via-chart-2/20 pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r to-transparent" />
        <div className={cn("relative flex h-full flex-col gap-4 p-4 sm:p-6 md:p-7", bodyClassName)}>
          <PatternBg pattern={pattern} />
          {eyebrow || action ? (
            <div className="relative flex items-center justify-between gap-3">
              {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : <span />}
              {action}
            </div>
          ) : null}
          <div className="relative flex flex-1 flex-col gap-3">{children}</div>
        </div>
      </Card>
    </motion.div>
  );
}

export function Grid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={cn("grid grid-cols-1 gap-5 lg:grid-cols-6 lg:gap-6", className)}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}

/** Action tile: links out to an n8n form. */
export function Tile({
  href,
  title,
  description,
  icon: Icon,
  primary = false,
  pattern = "dots",
  className,
}: {
  href: string;
  title: string;
  description: ReactNode;
  icon: ComponentType<{ className?: string }>;
  primary?: boolean;
  pattern?: Pattern;
  className?: string;
}) {
  return (
    <motion.a variants={reveal} href={href} target="_blank" rel="noopener noreferrer" className={cn("group block min-w-0", className)}>
      <Card
        className={cn(
          "relative h-full gap-0 overflow-hidden py-0 shadow-none transition-[border-color,box-shadow,transform] duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md",
          primary ? "bg-primary text-primary-foreground ring-0" : "hover:border-foreground/15",
        )}
      >
        {primary ? (
          <>
            <BorderBeam duration={8} size={120} thickness={2} borderRadius={12} colorFrom="#ffffff" colorTo="#21C3B4" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_200px_at_100%_0%,rgba(33,195,180,0.35),transparent_70%)]" />
          </>
        ) : (
          <div aria-hidden className="from-chart-1/40 via-chart-2/20 pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r to-transparent" />
        )}
        <div className="relative flex h-full flex-col gap-4 p-6 md:p-7">
          {!primary && <PatternBg pattern={pattern} />}
          <div className="relative flex items-start justify-between gap-3">
            <span
              className={cn(
                "grid size-11 place-items-center rounded-lg",
                primary ? "bg-white/15 text-white" : "bg-chart-1/10 text-chart-1 dark:bg-chart-1/20",
              )}
            >
              <Icon className="size-5.5" />
            </span>
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full border transition-colors",
                primary
                  ? "border-white/30 text-white group-hover:bg-white group-hover:text-[var(--primary)]"
                  : "border-border text-muted-foreground group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground",
              )}
            >
              <ArrowRightUp className="size-4" />
            </span>
          </div>
          <div className="relative mt-auto">
            <h3 className="text-lg leading-tight font-semibold tracking-tight md:text-xl">{title}</h3>
            <p className={cn("mt-1.5 text-sm leading-relaxed", primary ? "text-white/80" : "text-muted-foreground")}>{description}</p>
          </div>
        </div>
      </Card>
    </motion.a>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-muted/60 dark:bg-muted/40 rounded-lg p-4">
      <div className="font-display text-3xl leading-none font-semibold tracking-tighter tabular-nums">{value}</div>
      <div className="text-muted-foreground mt-2 text-[11px] font-semibold tracking-[0.12em] uppercase">{label}</div>
    </div>
  );
}

export function StepHeading({ n, title, text }: { n: number; title: string; text?: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 first:mt-0">
      <span className="text-muted-foreground/40 font-display text-3xl font-medium tracking-tighter">{String(n).padStart(2, "0")}</span>
      <Eyebrow>{title}</Eyebrow>
      {text ? <span className="text-muted-foreground w-full text-sm sm:w-auto">{text}</span> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground border-border rounded-lg border border-dashed p-5 text-center text-sm">{children}</p>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded-lg", className)} />;
}

export function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-primary dark:text-chart-1 inline-flex items-center gap-1 self-start text-sm font-medium hover:underline">
      {children}
    </button>
  );
}
