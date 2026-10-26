import { motion, type MotionStyle, type Transition } from "motion/react";

import { type ChartColorIndex } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  /** Length of the beam along the border path, in pixels */
  size?: number;
  /** Thickness of the beam line in pixels */
  thickness?: number;
  /** Duration of one full lap around the border in seconds */
  duration?: number;
  /** Delay before the animation starts in seconds */
  delay?: number;
  /** Theme chart color index for gradient start (overridden by colorFrom) */
  fromChart?: ChartColorIndex;
  /** Theme chart color index for gradient end (overridden by colorTo) */
  toChart?: ChartColorIndex;
  /** Gradient start color */
  colorFrom?: string;
  /** Gradient end color */
  colorTo?: string;
  /** Reverse the travel direction */
  reverse?: boolean;
  /** Starting offset along the path (0–100) */
  initialOffset?: number;
  /** Optional override transition */
  transition?: Transition;
  /** Class applied to the moving beam element */
  className?: string;
  /** Uniform border radius (px) */
  borderRadius?: number;
  /** Per-corner radii (px): top-left, top-right, bottom-right, bottom-left */
  borderRadii?: [number, number, number, number];
}

function buildOffsetPath(inset: number, borderRadius: number, borderRadii?: [number, number, number, number]) {
  const [topLeft, topRight, bottomRight, bottomLeft] = borderRadii ?? [
    borderRadius,
    borderRadius,
    borderRadius,
    borderRadius,
  ];

  const tl = topLeft > 0 ? Math.max(topLeft - inset, 0) : 0;
  const tr = topRight > 0 ? Math.max(topRight - inset, 0) : 0;
  const br = bottomRight > 0 ? Math.max(bottomRight - inset, 0) : 0;
  const bl = bottomLeft > 0 ? Math.max(bottomLeft - inset, 0) : 0;

  if (tl === tr && tr === br && br === bl) {
    return tl > 0 ? `inset(${inset}px round ${tl}px)` : `inset(${inset}px)`;
  }

  return `inset(${inset}px round ${tl}px ${tr}px ${br}px ${bl}px)`;
}

export const BorderBeam = ({
  size = 64,
  thickness = 2,
  duration = 6,
  delay = 0,
  fromChart = 1,
  toChart = 2,
  colorFrom,
  colorTo,
  reverse = false,
  initialOffset = 0,
  transition,
  className,
  borderRadius = 6,
  borderRadii,
}: BorderBeamProps) => {
  const resolvedColorFrom = colorFrom ?? `var(--chart-${fromChart})`;
  const resolvedColorTo = colorTo ?? `var(--chart-${toChart})`;
  const inset = thickness / 2;
  const offsetPath = buildOffsetPath(inset, borderRadius, borderRadii);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <motion.div
        className={cn("absolute", className)}
        style={
          {
            width: size,
            height: thickness,
            offsetPath,
            offsetRotate: "auto",
            backgroundImage: `linear-gradient(to right, transparent 0%, ${resolvedColorFrom} 35%, ${resolvedColorTo} 65%, transparent 100%)`,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
};

export default BorderBeam;
