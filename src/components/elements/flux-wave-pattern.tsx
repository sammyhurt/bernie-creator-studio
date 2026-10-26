import { useId } from "react";

import { cn } from "@/lib/utils";

type MaskPreset = "radial" | "top" | "bottom" | "band" | "none";

const MASK_PRESETS: Record<MaskPreset, string> = {
  radial: "radial-gradient(ellipse_80%_60%_at_50%_50%,black_20%,transparent_75%)",
  top: "linear-gradient(to_bottom,black_40%,transparent_100%)",
  bottom: "linear-gradient(to_top,black_40%,transparent_100%)",
  band: "linear-gradient(to_bottom,transparent_5%,black_30%,black_70%,transparent_95%)",
  none: "",
};

interface FluxWavePatternProps {
  className?: string;
  /** Mask preset controlling edge fade. Pass `true` for the default radial. */
  masked?: boolean | MaskPreset;
  /** Pattern cell width (default 20) */
  scale?: number;
  /** Stroke weight (default 0.75) */
  strokeWidth?: number;
  /** Rotation angle in degrees (default 45) */
  angle?: number;
  /** Enable a slow CSS drift animation */
  drift?: boolean;
}

export function FluxWavePattern({
  className,
  masked = true,
  scale = 20,
  strokeWidth = 0.75,
  angle = 45,
  drift = false,
}: FluxWavePatternProps) {
  const patternId = `flux-diagonal-wave-${useId().replace(/:/g, "")}`;
  const H = scale / 2;

  const maskKey: MaskPreset = masked === true ? "radial" : masked === false ? "none" : masked;
  const maskValue = MASK_PRESETS[maskKey];
  const maskCss = maskValue ? maskValue.replace(/_/g, " ") : undefined;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-[0.09] dark:opacity-[0.07]",
        drift && "animate-[pattern-drift_25s_linear_infinite]",
        className,
      )}
      style={maskCss ? { maskImage: maskCss, WebkitMaskImage: maskCss } : undefined}
    >
      <svg
        className="text-foreground h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        style={drift ? { width: "200%", height: "200%" } : undefined}
      >
        <defs>
          <pattern
            id={patternId}
            width={scale}
            height={H}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle})`}
          >
            <path
              d={`M0 ${H} L${scale / 2} 0 L${scale} ${H}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
