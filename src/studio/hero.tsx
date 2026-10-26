import AltArrowRightLinear from "@iconify-react/solar/alt-arrow-right-linear";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { FluxDotGrid } from "@/components/elements/flux-dot-grid";
import { FluxShader } from "@/components/elements/flux-shader";
import { Button } from "@/components/ui/button";
import { useChartColors } from "@/hooks/use-chart-colors";
import { useMounted } from "@/hooks/use-mounted";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export interface HeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

/** The template's home hero (shader + dot grid + eyebrow pill), sized for an app page header. */
export default function StudioHero({
  eyebrow,
  title,
  lead,
  actions = [],
  big = false,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: HeroAction[];
  big?: boolean;
  children?: ReactNode;
}) {
  const reduce = usePrefersReducedMotion();
  const { resolvedTheme } = useTheme();
  const colors = useChartColors();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
  const item = {
    hidden: { opacity: 0, y: 22, filter: "blur(2px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 110, damping: 24 } },
  };

  return (
    <section
      className={cn(
        "bg-background relative overflow-hidden",
        big ? "pt-12 pb-14 md:pt-16 md:pb-16 lg:pt-44 lg:pb-20" : "pt-10 pb-10 md:pt-14 lg:pt-40 lg:pb-14",
      )}
    >
      <FluxShader
        key={isDark ? "dark" : "light"}
        backgroundColor={isDark ? "#1c2836" : "#f5efeb"}
        objectColor={isDark ? "#f5efeb" : "#2f4156"}
        accentColors={[colors.chart1, colors.chart2, colors.chart3]}
        accentStrength={0.22}
        className="pointer-events-none absolute inset-0 h-full max-h-none min-h-0 opacity-50 dark:opacity-45"
      />
      <FluxDotGrid className="[mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)] opacity-[0.03] dark:opacity-[0.04]" />
      <div className="from-background/40 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent" />
      <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />

      <motion.div className="relative z-10 container" variants={container} initial={reduce ? "visible" : "hidden"} animate="visible">
        <div className={cn("flex flex-col", big ? "items-center text-center" : "items-start text-left")}>
          <motion.div
            variants={item}
            className="border-border/60 bg-card/70 mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm"
          >
            <span className="relative flex size-1.5">
              <span className="bg-chart-2 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-chart-2 relative inline-flex size-1.5 rounded-full" />
            </span>
            <span className="text-muted-foreground">{eyebrow}</span>
          </motion.div>
          <motion.h1
            variants={item}
            className={cn(
              "leading-[1.08] font-semibold tracking-tight text-balance",
              big ? "max-w-4xl text-4xl md:text-5xl lg:text-6xl" : "text-4xl md:text-5xl",
            )}
          >
            {title}
          </motion.h1>
          {lead ? (
            <motion.p
              variants={item}
              className={cn("text-muted-foreground mt-4 max-w-2xl text-base text-pretty md:text-lg", big && "mx-auto md:mt-6")}
            >
              {lead}
            </motion.p>
          ) : null}
          {actions.length ? (
            <motion.div variants={item} className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {actions.map((a) => {
                const v = a.variant ?? "default";
                const inner = (
                  <>
                    {a.label}
                    {v === "default" && (
                      <span className="bg-background/15 border-background/10 grid size-5.5 place-items-center rounded-full border">
                        <AltArrowRightLinear className="size-4" />
                      </span>
                    )}
                  </>
                );
                const cls = cn("h-11 w-full rounded-full px-6 sm:w-auto", v === "default" && "!pl-5.5", v === "outline" && "bg-card/70 backdrop-blur-sm");
                return a.href ? (
                  <Button key={a.label} size="lg" variant={v} className={cls} asChild>
                    <a href={a.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                  </Button>
                ) : (
                  <Button key={a.label} size="lg" variant={v} className={cls} onClick={a.onClick}>
                    {inner}
                  </Button>
                );
              })}
            </motion.div>
          ) : null}
          {children}
        </div>
      </motion.div>
    </section>
  );
}
