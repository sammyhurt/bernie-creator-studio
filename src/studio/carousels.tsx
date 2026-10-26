import "@fontsource/dm-serif-display/400.css";
import "@fontsource-variable/plus-jakarta-sans";

import AddCircle from "@iconify-react/solar/add-circle-linear";
import AltArrowDown from "@iconify-react/solar/alt-arrow-down-linear";
import AltArrowUp from "@iconify-react/solar/alt-arrow-up-linear";
import ArrowLeft from "@iconify-react/solar/arrow-left-linear";
import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import CalendarAdd from "@iconify-react/solar/calendar-add-linear";
import CheckCircle from "@iconify-react/solar/check-circle-linear";
import Danger from "@iconify-react/solar/danger-triangle-linear";
import DocumentAdd from "@iconify-react/solar/document-add-linear";
import Download from "@iconify-react/solar/download-minimalistic-linear";
import GalleryAdd from "@iconify-react/solar/gallery-add-linear";
import GalleryWide from "@iconify-react/solar/gallery-wide-linear";
import Magic from "@iconify-react/solar/magic-stick-3-linear";
import Refresh from "@iconify-react/solar/refresh-linear";
import Trash from "@iconify-react/solar/trash-bin-minimalistic-linear";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { CopyButton, Field, Modal, NativeSelect, Pill, Spinner, Working, dayLabel, nyDay, timeLabel, useAction, useToast } from "./bits";
import type { Carousel, CarouselSlide, Look, Platform } from "./data";
import StudioHero from "./hero";
import { TIMES } from "./ideas";
import { shortDate } from "./insights";
import { LOOKS, SIZES, drawSlide, ensureFonts, importPhoto, photoBitmap, slideBlob, type SizeKey } from "./slides";
import { useStudio } from "./store";
import { Empty, Grid, Panel, Skeleton } from "./ui";

/* ---------- choices ---------- */
const KINDS = ["List or ranking", "Story or recap", "Tips or how-to", "Outfit breakdown", "Before and after", "Day in the life"];
const FEELS = ["Cozy", "Funny", "Aesthetic"];
const COUNTS = [5, 6, 7, 8];
const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "both", label: "Both" },
];
const PLATFORM_LABEL: Record<Platform, string> = { tiktok: "TikTok", instagram: "Instagram", both: "TikTok + Instagram" };
const STATUS_LABEL: Record<Carousel["status"], string> = { draft: "Draft", planned: "Planned", posted: "Posted", removed: "Removed" };
const REDO = ["Stronger hook", "Shorter", "Funnier", "More specific", "Warmer, more personal"];
const POPAI_URL = "https://www.popai.pro/en/ai-presentation";

export const SEED_KEY = "mts-carousel-seed";
export const OPEN_KEY = "mts-carousel-open";
type Seed = { topic: string; facts?: string; label: string; text?: string };

const take = (key: string) => {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) localStorage.removeItem(key);
    return v;
  } catch {
    return null;
  }
};
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "carousel";
const sizeFor = (p: Platform): SizeKey => (p === "instagram" ? "instagram" : "tiktok");
const tagLine = (tags: string[]) => tags.map((t) => (t.startsWith("#") ? t : "#" + t)).join(" ");

/** Small pill buttons for a single choice. */
function Chips<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="grid content-start gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              o.value === value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/30 bg-background/70",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- live slide preview ---------- */
function SlideCanvas({ slide, index, total, look, size, width, handle, className, onClick }: { slide: CarouselSlide; index: number; total: number; look: Look; size: SizeKey; width: number; handle: string; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [missing, setMissing] = useState(false);
  const S = SIZES[size];
  const height = Math.round((width * S.h) / S.w);
  useEffect(() => {
    let live = true;
    let raf = 0;
    (async () => {
      await ensureFonts();
      const img = slide.photo_key ? await photoBitmap(slide.photo_key) : null;
      if (!live) return;
      setMissing(!!slide.photo_key && !img);
      raf = requestAnimationFrame(() => {
        const c = ref.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
        ctx.setTransform((width * dpr) / S.w, 0, 0, (width * dpr) / S.w, 0, 0);
        drawSlide(ctx, { slide, index, total, look, size, img, handle });
      });
    })();
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [slide, index, total, look, size, width, height, handle, S.w]);
  return (
    <div className={cn("relative shrink-0", className)} style={{ width }}>
      <canvas ref={ref} style={{ width, height }} className="border-border block rounded-lg border shadow-sm" aria-label={`Slide ${index + 1} preview`} />
      {onClick ? <button type="button" onClick={onClick} className="absolute inset-0 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" aria-label={`See slide ${index + 1} bigger`} /> : null}
      {missing ? <span className="absolute inset-x-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-center text-[10px] text-white">Photo is on another device</span> : null}
    </div>
  );
}

/* ---------- new carousel ---------- */
function NewCarousel({ seed, onSeedClear, onMade }: { seed: Seed | null; onSeedClear: () => void; onMade: (c: Carousel) => void }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [topic, setTopic] = useState(seed?.topic || "");
  const [facts, setFacts] = useState(seed?.facts || "");
  const [kind, setKind] = useState(KINDS[0]);
  const [feel, setFeel] = useState(FEELS[0]);
  const [count, setCount] = useState(6);
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [lastSeed, setLastSeed] = useState(seed);
  if (seed !== lastSeed) {
    setLastSeed(seed);
    if (seed) {
      setTopic(seed.topic);
      if (seed.facts) setFacts(seed.facts);
    }
  }
  const starters = (s.d?.search?.picks || []).slice(0, 3).map((p) => p.idea || p.phrase).filter(Boolean);
  const go = async () => {
    const c = await run("draft", () =>
      s.draftCarousel({ topic: topic.trim(), facts: facts.trim(), kind, feel, count, platform, seed_label: seed?.label, seed_text: seed?.text }),
    );
    if (c) {
      onSeedClear();
      setTopic("");
      setFacts("");
      onMade(c);
    }
  };
  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (topic.trim().length >= 3) void go();
      }}
    >
      {seed ? (
        <div className="bg-chart-1/10 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm">
          <span>
            <span className="font-medium">Starting from:</span> {seed.label}
          </span>
          <button type="button" className="text-muted-foreground text-xs underline" onClick={onSeedClear}>
            Clear
          </button>
        </div>
      ) : null}
      <Field label="What do you want to make?" hint="Say it the way you'd tell a friend. The Studio adds your best hook style, what people search and what's trending.">
        <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} maxLength={600} placeholder="e.g. a Saturday in Brooklyn: the coffee spot, the gym, and the fit I wore" />
      </Field>
      {!topic && starters.length ? (
        <div className="-mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs">From what people search:</span>
          {starters.map((t, i) => (
            <button key={i} type="button" onClick={() => setTopic(t)} className="border-border hover:border-foreground/30 rounded-full border px-2.5 py-1 text-xs">
              {t.length > 60 ? t.slice(0, 58) + "…" : t}
            </button>
          ))}
        </div>
      ) : null}
      <Field label="Facts only you know (optional)" hint="Names, places, prices, what you ordered or wore. Specific names and places only ever come from here. Anything else gets a “Check this” flag.">
        <Textarea value={facts} onChange={(e) => setFacts(e.target.value)} rows={3} maxLength={1200} placeholder="e.g. Dinner at a small Italian spot on Bleecker, then hot cider from a street cart. I wore a camel coat and brown boots." />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Chips label="Type" value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k, label: k }))} />
        <div className="grid content-start gap-4">
          <Chips label="Slides" value={count} onChange={setCount} options={COUNTS.map((n) => ({ value: n, label: String(n) }))} />
          <Chips label="Feel" value={feel} onChange={setFeel} options={FEELS.map((k) => ({ value: k, label: k }))} />
          <Chips label="For" value={platform} onChange={setPlatform} options={PLATFORMS} />
        </div>
      </div>
      {busy === "draft" ? <Working text="Reading your top videos, search phrases and trends, then writing your slides. About 30 to 45 seconds." /> : null}
      <Button type="submit" className="h-11 justify-self-start rounded-full px-6" disabled={busy === "draft" || topic.trim().length < 3}>
        {busy === "draft" ? <Spinner /> : <Magic className="size-4" />} Draft my carousel
      </Button>
    </form>
  );
}

/* ---------- plan modal ---------- */
function CarouselPlanModal({ c, onSave, onClose }: { c: Carousel; onSave: (date: string, time: string) => void; onClose: () => void }) {
  const s = useStudio();
  const best = [...(s.d?.stats?.slots || [])].filter((x) => x.posts >= 5).sort((a, b) => b.median_views - a.median_views)[0]?.slot;
  const suggested = best === "Morning" ? "08:00" : best === "Afternoon" ? "13:00" : best === "Late night" ? "21:30" : "19:00";
  const [date, setDate] = useState(c.plan_date && c.plan_date >= nyDay() ? c.plan_date : nyDay(1));
  const [time, setTime] = useState(c.plan_time || suggested);
  return (
    <Modal open onClose={onClose} title="Add to your plan">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(date, time);
          onClose();
        }}
      >
        <p className="text-sm font-medium">{c.title}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Post on">
            <Input type="date" value={date} min={nyDay()} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Time">
            <NativeSelect value={time} onChange={setTime} options={TIMES.some((t) => t.value === time) ? TIMES : [{ value: time, label: timeLabel(time) }, ...TIMES]} ariaLabel="Time" />
          </Field>
        </div>
        {c.body.best_time ? <p className="text-muted-foreground -mt-2 text-xs">Your best time so far: {c.body.best_time}.</p> : null}
        <Button type="submit" className="h-11 rounded-full">
          <CalendarAdd className="size-4" /> Save to plan
        </Button>
      </form>
    </Modal>
  );
}

/* ---------- exports ---------- */
function popaiText(c: Carousel, size: SizeKey) {
  const S = SIZES[size];
  const lines = c.body.slides.map((x, i) => [`Slide ${i + 1}${i === 0 ? " (hook)" : ""}:`, x.kicker ? `  Small line: ${x.kicker}` : "", `  Title: ${x.title}`, x.body ? `  Text: ${x.body}` : "", x.photo ? `  Photo: ${x.photo}` : ""].filter(Boolean).join("\n"));
  return [
    `Design a ${c.body.slides.length}-slide ${size === "instagram" ? "Instagram" : "TikTok photo"} carousel, ${S.w}×${S.h} (${size === "instagram" ? "4:5" : "9:16"}).`,
    "Style: warm and clean, beige (#F5EFEB) and navy (#2F4156) with a soft blue accent (#567C8D), a serif for titles. Big, readable text.",
    "Use exactly this text. Do not add facts, prices, places or statistics.",
    "",
    ...lines,
  ].join("\n");
}

async function makePptx(c: Carousel, size: SizeKey) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  const W = size === "instagram" ? 8 : 7.5;
  const H = size === "instagram" ? 10 : 13.333;
  pptx.defineLayout({ name: "MTS", width: W, height: H });
  pptx.layout = "MTS";
  pptx.title = c.title;
  const L = LOOKS[c.body.look === "navy" ? "navy" : "beige"];
  const hex = (v: string) => (v.startsWith("#") ? v.slice(1) : "FFFFFF");
  c.body.slides.forEach((x, i) => {
    const sl = pptx.addSlide();
    sl.background = { color: hex(L.bg) };
    const top = size === "instagram" ? 1 : 2.2;
    if (x.kicker) sl.addText(x.kicker.toUpperCase(), { x: 0.6, y: top, w: W - 1.2, h: 0.5, fontFace: "Arial", fontSize: 14, bold: true, color: hex(L.accent), charSpacing: 3 });
    sl.addText(x.title, { x: 0.6, y: top + 0.6, w: W - 1.2, h: i === 0 ? 3.2 : 2.4, fontFace: "Georgia", fontSize: i === 0 ? 44 : 34, color: hex(L.fg), valign: "top" });
    if (x.body) sl.addText(x.body, { x: 0.6, y: top + (i === 0 ? 4 : 3.2), w: W - 1.2, h: 2.6, fontFace: "Arial", fontSize: 20, color: hex(L.accent), valign: "top" });
    sl.addText(`${i + 1}/${c.body.slides.length}`, { x: W - 1.6, y: H - (size === "instagram" ? 0.9 : 2.4), w: 1, h: 0.4, fontFace: "Arial", fontSize: 12, color: hex(L.accent), align: "right" });
    sl.addNotes([x.photo ? `Photo: ${x.photo}` : "", x.source ? `Source: ${x.source}` : "", x.check ? `Check: ${x.check}` : ""].filter(Boolean).join("\n"));
  });
  await pptx.writeFile({ fileName: `${slug(c.title)}-outline.pptx` });
}

function downloadBlob(b: Blob, name: string) {
  const url = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- one slide row in the editor ---------- */
function SlideRow({
  slide,
  index,
  total,
  look,
  size,
  handle,
  busy,
  onChange,
  onMove,
  onDelete,
  onRedo,
  onView,
}: {
  slide: CarouselSlide;
  index: number;
  total: number;
  look: Look;
  size: SizeKey;
  handle: string;
  busy: boolean;
  onChange: (x: CarouselSlide) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onRedo: (instruction: string) => void;
  onView: () => void;
}) {
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [redoOpen, setRedoOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const set = (patch: Partial<CarouselSlide>) => onChange({ ...slide, ...patch });
  return (
    <li className="bg-background/70 border-border grid gap-4 rounded-xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-4">
      <div className="flex flex-col items-center gap-2">
        <SlideCanvas slide={slide} index={index} total={total} look={look} size={size} width={size === "instagram" ? 168 : 150} handle={handle} onClick={onView} />
        <div className="flex gap-1">
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                set({ photo_key: await importPhoto(f) });
              } catch (err) {
                toast(err instanceof Error ? err.message : "Could not add that photo.", "err");
              }
            }}
          />
          <Button type="button" size="xs" variant="outline" className="rounded-full px-2.5" onClick={() => file.current?.click()}>
            <GalleryAdd className="size-3.5" /> {slide.photo_key ? "Change" : "Photo"}
          </Button>
          {slide.photo_key ? (
            <Button type="button" size="xs" variant="ghost" className="rounded-full px-2" onClick={() => set({ photo_key: "" })} aria-label="Remove photo">
              <Trash className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid min-w-0 content-start gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">{index === 0 ? "Slide 1 · Hook" : `Slide ${index + 1}`}</span>
          {slide.source ? <Pill>From: {slide.source}</Pill> : null}
          <span className="ml-auto flex gap-0.5">
            <Button type="button" size="icon-xs" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
              <AltArrowUp className="size-4" />
            </Button>
            <Button type="button" size="icon-xs" variant="ghost" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Move down">
              <AltArrowDown className="size-4" />
            </Button>
            <Button type="button" size="icon-xs" variant="ghost" disabled={total <= 3} onClick={onDelete} aria-label="Delete slide">
              <Trash className="size-4" />
            </Button>
          </span>
        </div>
        {slide.check ? (
          <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            <span className="flex items-start gap-2">
              <Danger className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="font-semibold">Check this: </span>
                {slide.check}
              </span>
            </span>
            <button type="button" className="text-xs font-semibold underline" onClick={() => set({ check: "" })}>
              I checked it
            </button>
          </div>
        ) : null}
        <Input value={slide.kicker} onChange={(e) => set({ kicker: e.target.value })} placeholder="Small line on top (optional)" maxLength={60} aria-label={`Slide ${index + 1} small line`} className="h-9" />
        <Textarea value={slide.title} onChange={(e) => set({ title: e.target.value })} rows={1} maxLength={120} placeholder="Title" aria-label={`Slide ${index + 1} title`} className="min-h-10 text-base font-semibold md:text-base" />
        <Textarea value={slide.body} onChange={(e) => set({ body: e.target.value })} rows={2} maxLength={300} placeholder="A line or two (optional)" aria-label={`Slide ${index + 1} text`} />
        {slide.photo ? (
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium">Photo idea: </span>
            {slide.photo}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          {redoOpen ? (
            <>
              {REDO.map((r) => (
                <Button
                  key={r}
                  type="button"
                  size="xs"
                  variant="outline"
                  className="rounded-full px-2.5"
                  disabled={busy}
                  onClick={() => {
                    setRedoOpen(false);
                    onRedo(r);
                  }}
                >
                  {r}
                </Button>
              ))}
              <form
                className="flex min-w-[220px] flex-1 gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!custom.trim()) return;
                  setRedoOpen(false);
                  onRedo(custom.trim());
                  setCustom("");
                }}
              >
                <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Or say how…" maxLength={200} className="h-7 text-sm" aria-label="How to rewrite this slide" />
                <Button type="submit" size="xs" className="rounded-full px-2.5" disabled={busy || !custom.trim()}>
                  Go
                </Button>
              </form>
              <Button type="button" size="xs" variant="ghost" className="rounded-full px-2" onClick={() => setRedoOpen(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" size="xs" variant="ghost" className="rounded-full px-2.5" disabled={busy} onClick={() => setRedoOpen(true)}>
              {busy ? <Spinner className="size-3" /> : <Refresh className="size-3.5" />} {busy ? "Rewriting…" : "Redo this slide"}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

/* ---------- editor ---------- */
function Editor({ initial, onBack }: { initial: Carousel; onBack: () => void }) {
  const s = useStudio();
  const toast = useToast();
  const { busy, run } = useAction();
  const [c, setC] = useState<Carousel>(initial);
  const [size, setSize] = useState<SizeKey>(sizeFor(initial.platform));
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [redoing, setRedoing] = useState<number | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [view, setView] = useState<number | null>(null);
  const multi = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Carousel | null>(null);
  const saveRef = useRef(s.saveCarousel);
  saveRef.current = s.saveCarousel;
  const handle = s.d?.profile?.handle || "@LLiLBiLL";

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    setSaveState("saving");
    try {
      await saveRef.current(next);
      setSaveState(pending.current ? "saving" : "saved");
    } catch {
      setSaveState("error");
      pending.current = pending.current || next;
    }
  }, []);
  useEffect(
    () => () => {
      if (pending.current) void flush();
    },
    [flush],
  );

  const update = (fn: (x: Carousel) => Carousel, now = false) => {
    setC((prev) => {
      const next = fn(prev);
      pending.current = next;
      return next;
    });
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), now ? 0 : 1200);
  };
  const setSlides = (fn: (x: CarouselSlide[]) => CarouselSlide[]) => update((x) => ({ ...x, body: { ...x.body, slides: fn(x.body.slides) } }));
  const setBody = (patch: Partial<Carousel["body"]>) => update((x) => ({ ...x, body: { ...x.body, ...patch } }));

  const slides = c.body.slides;
  const checks = slides.filter((x) => x.check).length;
  const fileBase = slug(c.title);

  const redo = async (i: number, instruction: string) => {
    setRedoing(i);
    try {
      const sl = await s.redoSlide(c, i, instruction);
      setSlides((xs) => xs.map((x, k) => (k === i ? sl : x)));
      toast(`Slide ${i + 1} rewritten`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not rewrite that slide.", "err");
    } finally {
      setRedoing(null);
    }
  };

  const saveToPhone = async () => {
    setExporting("png");
    try {
      const files: File[] = [];
      for (let i = 0; i < slides.length; i++) {
        const img = slides[i].photo_key ? await photoBitmap(slides[i].photo_key) : null;
        const b = await slideBlob({ slide: slides[i], index: i, total: slides.length, look: c.body.look, size, img, handle });
        files.push(new File([b], `${fileBase}-${String(i + 1).padStart(2, "0")}.png`, { type: "image/png" }));
      }
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        try {
          await navigator.share({ files, title: c.title });
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
      }
      for (const f of files) {
        downloadBlob(f, f.name);
        await new Promise((r) => setTimeout(r, 250));
      }
      toast(`${files.length} slides downloaded`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not make the images.", "err");
    } finally {
      setExporting(null);
    }
  };

  const addPhotos = async (list: FileList | null) => {
    if (!list?.length) return;
    const keys: string[] = [];
    for (const f of Array.from(list).slice(0, 12)) {
      try {
        keys.push(await importPhoto(f));
      } catch {
        /* skip unreadable files */
      }
    }
    if (!keys.length) return toast("Those files aren't photos the browser can read. Try JPG or PNG.", "err");
    setSlides((xs) => {
      const q = [...keys];
      // Fill empty slides first, in order, then replace from the start.
      const out = xs.map((x) => (!x.photo_key && q.length ? { ...x, photo_key: q.shift()! } : x));
      return out.map((x) => (q.length ? { ...x, photo_key: q.shift()! } : x));
    });
    toast(`${keys.length} photo${keys.length === 1 ? "" : "s"} added. They stay on this device.`);
  };

  const captionTT = [c.body.caption_tiktok, tagLine(c.body.hashtags_tiktok)].filter(Boolean).join("\n\n");
  const captionIG = [c.body.caption_instagram, tagLine(c.body.hashtags_instagram)].filter(Boolean).join("\n\n");

  return (
    <Grid>
      <Panel className="lg:col-span-6" bodyClassName="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="ghost" className="rounded-full px-2.5" onClick={() => void flush().then(onBack)}>
            <ArrowLeft className="size-4" /> My carousels
          </Button>
          <span className="text-muted-foreground ml-auto text-xs" aria-live="polite">
            {saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved yet. Will retry on your next change." : "All changes saved"}
          </span>
        </div>
        <Input value={c.title} onChange={(e) => update((x) => ({ ...x, title: e.target.value }))} maxLength={120} aria-label="Carousel name" className="font-display h-12 text-xl font-semibold md:text-2xl" />
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={c.status === "posted" ? "ok" : c.status === "planned" ? "accent" : "muted"}>{STATUS_LABEL[c.status]}</Pill>
          {c.status === "planned" && c.plan_date ? (
            <Pill tone="accent">
              {dayLabel(c.plan_date)}
              {c.plan_time ? ` · ${timeLabel(c.plan_time)}` : ""}
            </Pill>
          ) : null}
          {c.kind ? <Pill>{c.kind}</Pill> : null}
          <Pill>{PLATFORM_LABEL[c.platform]}</Pill>
          {checks ? (
            <Pill tone="warn">
              <Danger className="size-3.5" /> {checks} to check
            </Pill>
          ) : null}
        </div>
        {c.topic ? <p className="text-muted-foreground text-sm">“{c.topic}”</p> : null}
      </Panel>

      <Panel eyebrow={`Your slides · ${slides.length}`} pattern="dots" className="lg:col-span-4">
        <div className="bg-muted/40 grid gap-3 rounded-lg p-3 sm:grid-cols-2">
          <Chips label="Size" value={size} onChange={setSize} options={[{ value: "tiktok" as SizeKey, label: SIZES.tiktok.label }, { value: "instagram" as SizeKey, label: SIZES.instagram.label }]} />
          <Chips label="Look" value={c.body.look} onChange={(v) => setBody({ look: v })} options={(Object.keys(LOOKS) as Look[]).map((k) => ({ value: k, label: LOOKS[k].label }))} />
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <input ref={multi} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addPhotos(e.target.files).finally(() => (e.target.value = ""))} />
            <Button type="button" size="sm" variant="outline" className="rounded-full px-3" onClick={() => multi.current?.click()}>
              <GalleryAdd className="size-4" /> Add photos to all slides
            </Button>
            <span className="text-muted-foreground text-xs">Pick them in slide order. Photos stay on this device and are never uploaded.</span>
          </div>
        </div>
        {c.body.look === "photo" && !slides.some((x) => x.photo_key) ? <p className="text-muted-foreground text-xs">The Photo look puts your picture full-screen behind the text. Add photos to see it.</p> : null}
        <ol className="grid gap-3">
          {slides.map((x, i) => (
            <SlideRow
              key={i}
              slide={x}
              index={i}
              total={slides.length}
              look={c.body.look}
              size={size}
              handle={handle}
              busy={redoing === i}
              onChange={(n) => setSlides((xs) => xs.map((y, k) => (k === i ? n : y)))}
              onMove={(d) =>
                setSlides((xs) => {
                  const a = [...xs];
                  const j = i + d;
                  if (j < 0 || j >= a.length) return xs;
                  [a[i], a[j]] = [a[j], a[i]];
                  return a;
                })
              }
              onDelete={() => setSlides((xs) => xs.filter((_, k) => k !== i))}
              onRedo={(ins) => void redo(i, ins)}
              onView={() => setView(i)}
            />
          ))}
        </ol>
        {slides.length < 10 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="justify-self-start rounded-full px-3"
            onClick={() => setSlides((xs) => [...xs.slice(0, -1), { kicker: "", title: "New slide", body: "", photo: "", source: "Your notes", check: "", photo_key: "" }, ...xs.slice(-1)])}
          >
            <AddCircle className="size-4" /> Add a slide
          </Button>
        ) : null}
      </Panel>

      <div className="grid content-start gap-5 lg:col-span-2 lg:gap-6">
        <Panel eyebrow="Post it" pattern="wave">
          {checks ? (
            <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
              <Danger className="mt-0.5 size-4 shrink-0" /> {checks === 1 ? "One slide has" : `${checks} slides have`} something to check before you post.
            </p>
          ) : null}
          <Button type="button" className="h-11 rounded-full" disabled={!!exporting} onClick={() => void saveToPhone()}>
            {exporting === "png" ? <Spinner /> : <Download className="size-4" />} Save slides to phone
          </Button>
          <p className="text-muted-foreground -mt-1 text-xs">
            {SIZES[size].w}×{SIZES[size].h} images. In TikTok, tap + then pick them as photos; in Instagram, choose them in order for a carousel post.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="rounded-full px-3" onClick={() => setPlanOpen(true)}>
              <CalendarAdd className="size-4" /> {c.status === "planned" ? "Move" : "Add to plan"}
            </Button>
            {c.status !== "posted" ? (
              <Button type="button" size="sm" variant="outline" className="rounded-full px-3" onClick={() => update((x) => ({ ...x, status: "posted" }), true)}>
                <CheckCircle className="size-4" /> Mark posted
              </Button>
            ) : (
              <Button type="button" size="sm" variant="ghost" className="rounded-full px-3" onClick={() => update((x) => ({ ...x, status: x.plan_date ? "planned" : "draft" }), true)}>
                Not posted yet
              </Button>
            )}
          </div>
        </Panel>

        <Panel eyebrow="Captions" pattern="lines">
          {c.platform !== "instagram" ? (
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">TikTok</span>
                <CopyButton text={captionTT} size="xs" />
              </div>
              <Textarea value={c.body.caption_tiktok} onChange={(e) => setBody({ caption_tiktok: e.target.value })} rows={2} maxLength={400} aria-label="TikTok caption" />
              <Input value={c.body.hashtags_tiktok.join(" ")} onChange={(e) => setBody({ hashtags_tiktok: e.target.value.split(/\s+/).filter(Boolean).slice(0, 8) })} aria-label="TikTok hashtags" className="h-8 text-sm" />
            </div>
          ) : null}
          {c.platform !== "tiktok" ? (
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Instagram</span>
                <CopyButton text={captionIG} size="xs" />
              </div>
              <Textarea value={c.body.caption_instagram} onChange={(e) => setBody({ caption_instagram: e.target.value })} rows={4} maxLength={1200} aria-label="Instagram caption" />
              <Input value={c.body.hashtags_instagram.join(" ")} onChange={(e) => setBody({ hashtags_instagram: e.target.value.split(/\s+/).filter(Boolean).slice(0, 8) })} aria-label="Instagram hashtags" className="h-8 text-sm" />
            </div>
          ) : null}
          {c.platform === "tiktok" && c.body.caption_instagram ? (
            <button type="button" className="text-primary dark:text-chart-1 self-start text-xs font-medium hover:underline" onClick={() => update((x) => ({ ...x, platform: "both" }))}>
              Also post it on Instagram
            </button>
          ) : null}
          <dl className="grid gap-2 text-sm">
            {c.body.search_phrase ? (
              <div>
                <dt className="text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase">Search phrase</dt>
                <dd>“{c.body.search_phrase}” · put it on slide 1 or 2 and in the caption</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase">Best time from your posts</dt>
              <dd>{c.body.best_time || "Not enough posts yet to tell"}</dd>
            </div>
            {c.body.tip ? (
              <div>
                <dt className="text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase">Tip</dt>
                <dd>{c.body.tip}</dd>
              </div>
            ) : null}
          </dl>
        </Panel>

        <Panel eyebrow="Design it in PopAi (optional)" pattern="dots">
          <p className="text-muted-foreground text-sm">The Studio already makes finished slides. If you'd like PopAi's templates, take your text there. PopAi only gets what you paste or upload.</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={() => popaiText(c, size)} label="Copy for PopAi" />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-3"
              disabled={!!exporting}
              onClick={async () => {
                setExporting("pptx");
                try {
                  await makePptx(c, size);
                } catch {
                  toast("Could not make the outline file.", "err");
                } finally {
                  setExporting(null);
                }
              }}
            >
              {exporting === "pptx" ? <Spinner /> : <DocumentAdd className="size-4" />} Outline file (.pptx)
            </Button>
            <a href={POPAI_URL} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-chart-1 inline-flex items-center gap-1 self-center text-sm font-medium hover:underline">
              Open PopAi <ArrowRightUp className="size-4" />
            </a>
          </div>
        </Panel>

        {c.body.sources.length ? (
          <Panel eyebrow="Built from" pattern="lines">
            <ul className="grid gap-1 text-sm">
              {c.body.sources.map((x, i) => (
                <li key={i} className="text-muted-foreground">
                  · {x}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 px-1">
          {confirmDelete ? (
            <>
              <span className="text-sm">Delete this carousel?</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-full px-3"
                disabled={busy === "del"}
                onClick={async () => {
                  if (timer.current) clearTimeout(timer.current);
                  pending.current = null;
                  const ok = await run("del", () => s.saveCarousel({ ...c, status: "removed" }), "Carousel deleted");
                  if (ok !== null) onBack();
                }}
              >
                {busy === "del" ? <Spinner /> : null} Delete
              </Button>
              <Button type="button" size="sm" variant="ghost" className="rounded-full px-3" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="ghost" className="text-muted-foreground rounded-full px-3" onClick={() => setConfirmDelete(true)}>
              <Trash className="size-4" /> Delete carousel
            </Button>
          )}
        </div>
      </div>

      {planOpen ? <CarouselPlanModal c={c} onClose={() => setPlanOpen(false)} onSave={(date, time) => update((x) => ({ ...x, status: x.status === "posted" ? "posted" : "planned", plan_date: date, plan_time: time }), true)} /> : null}
      {view !== null && slides[view] ? (
        <Modal open onClose={() => setView(null)} title={`Slide ${view + 1} of ${slides.length}`}>
          <div className="grid justify-items-center gap-3">
            <SlideCanvas slide={slides[view]} index={view} total={slides.length} look={c.body.look} size={size} width={size === "instagram" ? 340 : 300} handle={handle} />
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" className="rounded-full px-4" disabled={view === 0} onClick={() => setView(view - 1)}>
                ← Back
              </Button>
              <Button type="button" size="sm" variant="outline" className="rounded-full px-4" disabled={view >= slides.length - 1} onClick={() => setView(view + 1)}>
                Next →
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
      <div className="bg-card/95 fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <Button type="button" className="h-11 flex-1 rounded-full" disabled={!!exporting} onClick={() => void saveToPhone()}>
          {exporting === "png" ? <Spinner /> : <Download className="size-4" />} Save slides to phone
        </Button>
        <Button type="button" variant="outline" className="h-11 rounded-full px-4" onClick={() => setPlanOpen(true)} aria-label="Add to plan">
          <CalendarAdd className="size-4" />
        </Button>
      </div>
      {redoing !== null ? <span className="sr-only" role="status">Rewriting slide {redoing + 1}</span> : null}
    </Grid>
  );
}

/* ---------- list ---------- */
function CarouselList({ items, onOpen }: { items: Carousel[]; onOpen: (id: number) => void }) {
  const handle = useStudio().d?.profile?.handle || "@LLiLBiLL";
  const groups: { label: string; rows: Carousel[] }[] = [
    { label: "Planned", rows: items.filter((x) => x.status === "planned").sort((a, b) => (a.plan_date + a.plan_time).localeCompare(b.plan_date + b.plan_time)) },
    { label: "Drafts", rows: items.filter((x) => x.status === "draft") },
    { label: "Posted", rows: items.filter((x) => x.status === "posted") },
  ];
  if (!items.length) return <Empty>Your carousels will show up here. Each one saves as you edit.</Empty>;
  return (
    <div className="grid gap-4">
      {groups
        .filter((g) => g.rows.length)
        .map((g) => (
          <div key={g.label} className="grid gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">
              {g.label} · {g.rows.length}
            </span>
            <ul className="grid gap-2">
              {g.rows.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => onOpen(x.id)} className="bg-background/70 border-border hover:border-foreground/25 flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors">
                    {x.body.slides[0] ? <SlideCanvas slide={x.body.slides[0]} index={0} total={x.body.slides.length} look={x.body.look} size={sizeFor(x.platform)} width={48} handle={handle} /> : null}
                    <span className="grid min-w-0 gap-1">
                      <span className="truncate font-medium">{x.title}</span>
                      <span className="flex flex-wrap gap-1">
                        <Pill>{PLATFORM_LABEL[x.platform]}</Pill>
                        <Pill>{x.body.slides.length} slides</Pill>
                        {x.status === "planned" && x.plan_date ? <Pill tone={x.plan_date < nyDay() ? "warn" : "accent"}>{dayLabel(x.plan_date, true)}</Pill> : null}
                        {x.body.slides.some((y) => y.check) ? <Pill tone="warn">To check</Pill> : null}
                      </span>
                      {x.updated_at ? <span className="text-muted-foreground text-xs">Edited {shortDate(x.updated_at)}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

/* ---------- tab ---------- */
export function CarouselsPanel() {
  const s = useStudio();
  const d = s.d;
  const [seed, setSeed] = useState<Seed | null>(() => {
    const v = take(SEED_KEY);
    try {
      return v ? (JSON.parse(v) as Seed) : null;
    } catch {
      return null;
    }
  });
  const [openId, setOpenId] = useState<number | null>(() => Number(take(OPEN_KEY)) || null);
  const items = useMemo(() => d?.carousels || [], [d?.carousels]);
  const open = openId ? items.find((x) => x.id === openId) : undefined;
  const pick = (id: number | null) => {
    setOpenId(id);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <>
      <StudioHero
        eyebrow="Carousels"
        title={open ? "Edit, add photos, save to your phone" : "Photo carousels from your real life"}
        lead={
          open
            ? "Every change saves on its own. Photos you add stay on this device."
            : "Tell the Studio what you want to make. It writes the slides from your facts, your best hooks and what people search, then draws them in your colors, ready for TikTok and Instagram."
        }
      />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          {!d ? (
            <Skeleton className="h-72" />
          ) : open ? (
            <div className="pb-20 lg:pb-0">
              <Editor key={open.id} initial={open} onBack={() => pick(null)} />
            </div>
          ) : (
            <Grid>
              <Panel eyebrow="New carousel" pattern="wave" className="lg:col-span-4" action={<GalleryWide className="text-chart-1 size-5" />}>
                <NewCarousel seed={seed} onSeedClear={() => setSeed(null)} onMade={(c) => pick(c.id)} />
              </Panel>
              <Panel eyebrow={`My carousels · ${items.length}`} pattern="dots" className="lg:col-span-2">
                <CarouselList items={items} onOpen={pick} />
              </Panel>
              <Panel eyebrow="How it stays true" pattern="lines" className="lg:col-span-6">
                <ul className="text-muted-foreground grid gap-2 text-sm md:grid-cols-3">
                  <li>
                    <span className="text-foreground font-medium">Your facts only. </span>Names, places and prices come only from what you type. Anything else is flagged “Check this”.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">Every slide shows its source. </span>Your notes, one of your top videos, a search phrase or a trend.
                  </li>
                  <li>
                    <span className="text-foreground font-medium">Nothing posts by itself. </span>You save the slides and post them yourself, on TikTok, Instagram or both.
                  </li>
                </ul>
              </Panel>
            </Grid>
          )}
          {d && openId && !open ? (
            <p className="text-muted-foreground mt-4 text-sm">
              That carousel isn't here anymore.{" "}
              <button type="button" className="underline" onClick={() => pick(null)}>
                Back to my carousels
              </button>
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

