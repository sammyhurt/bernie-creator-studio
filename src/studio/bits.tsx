import CloseCircle from "@iconify-react/solar/close-circle-linear";
import Copy from "@iconify-react/solar/copy-linear";
import CheckRead from "@iconify-react/solar/check-read-linear";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------- toast ---------- */
type ToastFn = (text: string, kind?: "ok" | "err") => void;
const ToastCtx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string; kind: "ok" | "err" }[]>([]);
  const push = useCallback<ToastFn>((text, kind = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, text, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === "err" ? 6500 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={cn(
                "pointer-events-auto max-w-md rounded-full px-4 py-2.5 text-sm font-medium shadow-lg",
                t.kind === "err" ? "bg-rose-600 text-white" : "bg-primary text-primary-foreground",
              )}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- modal ---------- */
// Open modals, newest last: Escape and the scroll lock belong to the top one only.
const stack: number[] = [];
let seq = 0;

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = ++seq;
    stack.push(id);
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === "Tab" && box.current) {
        const f = [...box.current.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const el = box.current?.querySelector<HTMLElement>("[data-modal-body] textarea, [data-modal-body] input, [data-modal-body] select, [data-modal-body] button") || box.current?.querySelector<HTMLElement>("button");
      el?.focus();
    }, 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      if (!stack.length) document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open]);
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#2f4156]/45 backdrop-blur-[2px]" onClick={() => closeRef.current()} aria-hidden />
          <motion.div
            ref={box}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={cn(
              "bg-card text-card-foreground relative flex max-h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl",
              wide ? "sm:max-w-3xl" : "sm:max-w-lg",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <button type="button" onClick={() => closeRef.current()} className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-full" aria-label="Close">
                <CloseCircle className="size-5.5" />
              </button>
            </div>
            <div data-modal-body className="overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- copy ---------- */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const t = document.createElement("textarea");
      t.value = text;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text, label = "Copy", className, size = "sm", variant = "outline" }: { text: string | (() => string); label?: string; className?: string; size?: "sm" | "default" | "xs"; variant?: "outline" | "default" | "ghost" | "secondary" }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("rounded-full px-3", className)}
      onClick={async () => {
        const ok = await copyText(typeof text === "function" ? text() : text);
        if (ok) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } else toast("Could not copy. Press and hold the text to copy it instead.", "err");
      }}
    >
      {done ? <CheckRead className="size-4" /> : <Copy className="size-4" />}
      {done ? "Copied" : label}
    </Button>
  );
}

/* ---------- small form bits ---------- */
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </label>
  );
}

export function NativeSelect({ value, onChange, options, className, ariaLabel }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string; ariaLabel?: string }) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-2.5 text-base shadow-xs outline-none focus-visible:ring-3 md:text-sm",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Pill({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "accent" | "warn" | "ok"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap",
        tone === "accent" && "bg-chart-1/15 text-foreground",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "warn" && "bg-amber-500/15 text-amber-800 dark:text-amber-300",
        tone === "ok" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} aria-hidden />;
}

/** Friendly "working" block for slow AI calls. */
export function Working({ text }: { text: string }) {
  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-4 text-sm" role="status">
      <Spinner className="text-chart-1" />
      <span>{text}</span>
    </div>
  );
}

/** Run an async action with a busy flag and a toast on error. */
export function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const run = useCallback(
    async <T,>(key: string, fn: () => Promise<T>, okText?: string): Promise<T | null> => {
      setBusy(key);
      try {
        const r = await fn();
        if (okText) toast(okText);
        return r;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Something went wrong.", "err");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );
  return { busy, run };
}

export const PILLARS = ["Fashion and fits", "NYC and Brooklyn living", "Couple life with Meredith", "Fitness and routines", "Just for fun"];

const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
/** Today in New York as YYYY-MM-DD, plus an offset in calendar days (safe across daylight-saving changes). */
export const nyDay = (offset = 0) => {
  const today = isoDay.format(new Date());
  if (!offset) return today;
  const d = new Date(today + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + "T12:00:00Z"));
const longDay = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" });
const shortDay = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
export const dayLabel = (ymd: string, short = false) => {
  if (!isYmd(ymd)) return ymd || "";
  if (ymd === nyDay()) return "Today";
  if (ymd === nyDay(1)) return "Tomorrow";
  return (short ? shortDay : longDay).format(new Date(ymd + "T12:00:00Z"));
};
export const timeLabel = (hm: string) => {
  if (!/^\d{2}:\d{2}$/.test(hm)) return "";
  const [h, m] = hm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
