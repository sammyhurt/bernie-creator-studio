import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export type PaletteId = "pop" | "sea" | "classic";
export const PALETTES: { id: PaletteId; label: string; swatches: string[] }[] = [
  { id: "pop", label: "Pop", swatches: ["#FF1D58", "#F75990", "#FFF685", "#00DDFF", "#0049B7"] },
  { id: "sea", label: "Sea glass", swatches: ["#042A2B", "#0DABAB", "#5EB1BF", "#F6E879", "#FCFCFC"] },
  { id: "classic", label: "Navy and beige", swatches: ["#2F4156", "#567C8D", "#C8D9E6", "#F5EFEB", "#FFFFFF"] },
];
const KEY = "bcs-palette";

export function getPalette(): PaletteId {
  const v = document.documentElement.getAttribute("data-palette");
  return v === "sea" || v === "classic" ? v : "pop";
}
export function setPalette(id: PaletteId) {
  document.documentElement.setAttribute("data-palette", id);
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}
const subscribe = (cb: () => void) => {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "class"] });
  return () => o.disconnect();
};
/** Current palette plus light/dark, so canvas and shader colors redraw when either changes. */
export function usePaletteKey() {
  return useSyncExternalStore(subscribe, () => getPalette() + (document.documentElement.classList.contains("dark") ? ":dark" : ":light"), () => "pop:light");
}
export const cssVar = (name: string, fallback: string) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
};

/** Small color picker for the top bar: three palettes, saved on this device. */
export function PaletteSwitch({ className, wide = false }: { className?: string; wide?: boolean }) {
  usePaletteKey();
  const cur = getPalette();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  const p = PALETTES.find((x) => x.id === cur) || PALETTES[0];
  const dots = (sw: string[]) => (
    <span className="flex -space-x-1">
      {sw.slice(0, 4).map((c) => (
        <span key={c} className="ring-background size-3.5 rounded-full ring-2" style={{ background: c }} />
      ))}
    </span>
  );
  if (wide) {
    return (
      <div className={cn("grid gap-2", className)} role="radiogroup" aria-label="Studio colors">
        {PALETTES.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={x.id === cur} onClick={() => setPalette(x.id)} className={cn("flex items-center justify-between rounded-full border px-4 py-2.5 text-sm font-medium", x.id === cur ? "border-primary" : "border-border")}>
            {x.label} {dots(x.swatches)}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div ref={box} className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Studio colors: ${p.label}`} className="hover:bg-muted grid h-9 place-items-center rounded-full px-2.5">
        {dots(p.swatches)}
      </button>
      {open ? (
        <div className="bg-popover text-popover-foreground absolute top-11 right-0 z-[60] grid w-56 gap-1 rounded-xl border p-2 shadow-xl" role="radiogroup" aria-label="Studio colors">
          {PALETTES.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={x.id === cur}
              onClick={() => { setPalette(x.id); setOpen(false); }}
              className={cn("hover:bg-muted flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm", x.id === cur && "bg-muted font-semibold")}
            >
              {x.label} {dots(x.swatches)}
            </button>
          ))}
          <p className="text-muted-foreground px-3 pt-1 pb-1 text-[11px]">Saved on this device. Slides you make use these colors too.</p>
        </div>
      ) : null}
    </div>
  );
}
