export type ChartColorIndex = 1 | 2 | 3 | 4 | 5;

export type ChartColors = {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

/** SSR-safe fallbacks matching the default chart theme colors as rgb(). */
export const CHART_COLOR_FALLBACKS: ChartColors = {
  chart1: "rgb(86, 124, 141)",
  chart2: "rgb(200, 217, 230)",
  chart3: "rgb(143, 176, 196)",
  chart4: "rgb(246, 158, 0)",
  chart5: "rgb(254, 243, 242)",
};

const CHART_VAR_NAMES: Record<ChartColorIndex, keyof ChartColors> = {
  1: "chart1",
  2: "chart2",
  3: "chart3",
  4: "chart4",
  5: "chart5",
};

// Reused offscreen canvas for color normalization.
let normalizeCanvas: HTMLCanvasElement | null = null;

/**
 * Normalizes any CSS color (including CSS Color 4 spaces like `lab()` /
 * `oklch()` that Tailwind v4 resolves variables to) into a plain sRGB
 * `rgb()` string. Consumers such as `THREE.Color` cannot parse `lab()`.
 */
function normalizeToRgb(color: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }

  normalizeCanvas ??= document.createElement("canvas");
  const ctx = normalizeCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return fallback;
  }

  ctx.clearRect(0, 0, 1, 1);
  // Seed with the fallback so an unparseable `color` leaves a known value.
  ctx.fillStyle = fallback;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export function readCssVariableColor(variable: `--${string}`, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  const probe = document.createElement("span");
  probe.style.setProperty("color", `var(${variable})`);
  probe.style.display = "none";
  document.documentElement.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.documentElement.removeChild(probe);

  if (!resolved || resolved === "rgba(0, 0, 0, 0)") {
    return fallback;
  }

  return normalizeToRgb(resolved, fallback);
}

export function readChartColors(fallbacks: ChartColors = CHART_COLOR_FALLBACKS): ChartColors {
  return {
    chart1: readCssVariableColor("--chart-1", fallbacks.chart1),
    chart2: readCssVariableColor("--chart-2", fallbacks.chart2),
    chart3: readCssVariableColor("--chart-3", fallbacks.chart3),
    chart4: readCssVariableColor("--chart-4", fallbacks.chart4),
    chart5: readCssVariableColor("--chart-5", fallbacks.chart5),
  };
}

export function resolveChartColor(colors: ChartColors, index: ChartColorIndex): string {
  return colors[CHART_VAR_NAMES[index]];
}

export function chartConicGradient(colors: ChartColors, includeChart4 = false): string {
  if (includeChart4) {
    return `conic-gradient(from 0deg, ${colors.chart1}, ${colors.chart2}, ${colors.chart3}, ${colors.chart4}, ${colors.chart1})`;
  }

  return `conic-gradient(from 0deg, ${colors.chart1}, ${colors.chart2}, ${colors.chart3}, ${colors.chart1})`;
}
