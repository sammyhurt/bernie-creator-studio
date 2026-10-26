import { useSyncExternalStore } from "react";

import { CHART_COLOR_FALLBACKS, type ChartColors, readChartColors } from "@/lib/chart-colors";

// Cache the last snapshot so useSyncExternalStore keeps a stable reference
// when the resolved colors haven't actually changed (avoids render loops).
let cachedColors: ChartColors | null = null;

function colorsEqual(a: ChartColors, b: ChartColors): boolean {
  return (Object.keys(a) as (keyof ChartColors)[]).every((key) => a[key] === b[key]);
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): ChartColors {
  const next = readChartColors();
  if (cachedColors && colorsEqual(cachedColors, next)) {
    return cachedColors;
  }
  cachedColors = next;
  return next;
}

function getServerSnapshot(): ChartColors {
  return CHART_COLOR_FALLBACKS;
}

export function useChartColors(): ChartColors {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
