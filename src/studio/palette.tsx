import { useSyncExternalStore } from "react";

/** Bernie Creator Studio uses one palette: dark green, light sea green, moonstone, straw and white. */
export const PALETTE = { id: "sea", label: "Bernie colors", swatches: ["#042A2B", "#0DABAB", "#5EB1BF", "#F6E879", "#FCFCFC"] } as const;

const subscribe = (cb: () => void) => {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => o.disconnect();
};
/** Light or dark, so canvas and shader colors redraw when the mode changes. */
export function usePaletteKey() {
  return useSyncExternalStore(subscribe, () => (document.documentElement.classList.contains("dark") ? "dark" : "light"), () => "light");
}
export const cssVar = (name: string, fallback: string) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
};
