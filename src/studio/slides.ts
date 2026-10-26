import type { CarouselSlide, Look } from "./data";

/** Pixel sizes for each platform. Safe areas keep text clear of TikTok's and Instagram's buttons and captions. */
export const SIZES = {
  tiktok: { w: 1080, h: 1920, top: 250, bottom: 470, x: 96, label: "TikTok 9:16" },
  instagram: { w: 1080, h: 1350, top: 110, bottom: 130, x: 96, label: "Instagram 4:5" },
} as const;
export type SizeKey = keyof typeof SIZES;

export const LOOKS: Record<Look, { label: string; bg: string; fg: string; accent: string; sub: string }> = {
  beige: { label: "Beige", bg: "#F5EFEB", fg: "#2F4156", accent: "#567C8D", sub: "#3D5168" },
  navy: { label: "Navy", bg: "#2F4156", fg: "#FFFFFF", accent: "#C8D9E6", sub: "rgba(255,255,255,0.85)" },
  photo: { label: "Photo", bg: "#2F4156", fg: "#FFFFFF", accent: "#C8D9E6", sub: "rgba(255,255,255,0.9)" },
};

const SERIF = '"DM Serif Display", Georgia, serif';
const SANS = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif';

let fontsReady: Promise<void> | null = null;
/** Canvas only uses a web font once it has loaded, so wait for both before drawing. */
export function ensureFonts() {
  if (!fontsReady) {
    fontsReady = (async () => {
      try {
        await Promise.all([document.fonts.load(`400 100px ${SERIF}`), document.fonts.load(`600 40px ${SANS}`), document.fonts.load(`500 40px ${SANS}`)]);
      } catch {
        /* fall back to system fonts */
      }
    })();
  }
  return fontsReady;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width <= max || !line) line = t;
      else {
        out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/** Largest font size (stepping down) whose wrapped lines fit the box. */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, max: number, from: number, to: number, maxH: number, lh: number) {
  for (let px = from; px >= to; px -= 4) {
    ctx.font = font(px);
    const lines = wrap(ctx, text, max);
    if (lines.length * px * lh <= maxH) return { px, lines };
  }
  ctx.font = font(to);
  return { px: to, lines: wrap(ctx, text, max) };
}

function cover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / img.width, h / img.height);
  const iw = img.width * r, ih = img.height * r;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface DrawOpts {
  slide: CarouselSlide;
  index: number;
  total: number;
  look: Look;
  size: SizeKey;
  img?: ImageBitmap | HTMLImageElement | null;
  handle?: string;
}

/** Draws one slide at full size onto ctx (callers scale the context for small previews). */
export function drawSlide(ctx: CanvasRenderingContext2D, o: DrawOpts) {
  const S = SIZES[o.size];
  const L = LOOKS[o.look];
  const { w, h } = S;
  const hook = o.index === 0;
  const fullPhoto = o.look === "photo" && !!o.img;
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = L.bg;
  ctx.fillRect(0, 0, w, h);

  const innerW = w - S.x * 2;
  let textTop = S.top;
  const textBottom = h - S.bottom;

  if (fullPhoto && o.img) {
    cover(ctx, o.img as ImageBitmap, 0, 0, w, h);
    const g = ctx.createLinearGradient(0, h * 0.25, 0, h);
    g.addColorStop(0, "rgba(22,31,43,0)");
    g.addColorStop(0.55, "rgba(22,31,43,0.55)");
    g.addColorStop(1, "rgba(22,31,43,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (o.img) {
    // Photo card at the top, text underneath.
    const ph = Math.round((textBottom - S.top) * (hook ? 0.5 : 0.46));
    ctx.save();
    roundRect(ctx, S.x, S.top, innerW, ph, 36);
    ctx.clip();
    cover(ctx, o.img as ImageBitmap, S.x, S.top, innerW, ph);
    ctx.restore();
    textTop = S.top + ph + 64;
  }

  // Measure text blocks.
  const kicker = (o.slide.kicker || "").toUpperCase();
  const title = o.slide.title || "";
  const body = o.slide.body || "";
  const room = textBottom - textTop;
  const titleMax = hook ? Math.min(room * 0.7, 900) : Math.min(room * 0.5, 620);
  const T = fit(ctx, title, (px) => `400 ${px}px ${SERIF}`, innerW, hook ? (o.size === "tiktok" ? 150 : 128) : 96, hook ? 64 : 52, titleMax, 1.08);
  const B = body ? fit(ctx, body, (px) => `500 ${px}px ${SANS}`, innerW, hook ? 46 : 50, 30, room - T.lines.length * T.px * 1.08 - 140, 1.38) : { px: 0, lines: [] as string[] };
  const kH = kicker ? 34 + 34 : 0;
  const blockH = kH + T.lines.length * T.px * 1.08 + (B.lines.length ? 36 + B.lines.length * B.px * 1.38 : 0);

  // Photo look: text sits at the bottom. Others: centered in the free area (hook slightly higher).
  let y = fullPhoto ? textBottom - blockH : o.img ? textTop : textTop + Math.max(0, (room - blockH) * (hook ? 0.42 : 0.38));
  const startY = y;

  if (kicker) {
    ctx.font = `700 30px ${SANS}`;
    ctx.fillStyle = L.accent;
    try {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "5px";
    } catch {
      /* older browsers */
    }
    ctx.fillText(kicker, S.x, y + 30);
    try {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
    } catch {
      /* ignore */
    }
    y += kH;
  }
  ctx.font = `400 ${T.px}px ${SERIF}`;
  ctx.fillStyle = L.fg;
  T.lines.forEach((ln, i) => ctx.fillText(ln, S.x, y + T.px * (i + 0.86) * 1.08));
  y += T.lines.length * T.px * 1.08;
  if (B.lines.length) {
    y += 36;
    ctx.font = `500 ${B.px}px ${SANS}`;
    ctx.fillStyle = L.sub;
    B.lines.forEach((ln, i) => ctx.fillText(ln, S.x, y + B.px * (i + 0.82) * 1.38));
  }

  // Accent rule above the text on plain looks.
  if (!fullPhoto && !o.img) {
    ctx.fillStyle = L.accent;
    ctx.fillRect(S.x, Math.max(S.top - 20, startY - 64), 88, 8);
  }

  // Footer: handle and page number, inside the safe area.
  const fy = textBottom + 72;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillStyle = fullPhoto ? "rgba(255,255,255,0.85)" : L.accent;
  ctx.fillText(o.handle || "@LLiLBiLL", S.x, fy);
  const page = `${o.index + 1}/${o.total}`;
  ctx.textAlign = "right";
  ctx.fillText(hook && o.total > 1 ? `swipe  →` : page, w - S.x, fy);
  ctx.textAlign = "left";
  ctx.restore();
}

/** Full-size PNG of one slide. */
export async function slideBlob(o: DrawOpts): Promise<Blob> {
  await ensureFonts();
  const S = SIZES[o.size];
  const c = document.createElement("canvas");
  c.width = S.w;
  c.height = S.h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("This browser can't draw slides.");
  drawSlide(ctx, o);
  return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not create the image."))), "image/png"));
}

/* ---------- photos: kept on this device only (IndexedDB), never uploaded ---------- */
const mem = new Map<string, Blob>();
function db(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      const r = indexedDB.open("mts-photos", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("photos");
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
}
export async function putPhoto(key: string, blob: Blob) {
  mem.set(key, blob);
  const d = await db();
  if (!d) return;
  await new Promise<void>((res) => {
    try {
      const t = d.transaction("photos", "readwrite");
      t.objectStore("photos").put(blob, key);
      t.oncomplete = () => res();
      t.onerror = () => res();
    } catch {
      res();
    }
  });
}
export async function getPhoto(key: string): Promise<Blob | null> {
  if (!key) return null;
  if (mem.has(key)) return mem.get(key)!;
  const d = await db();
  if (!d) return null;
  return await new Promise((res) => {
    try {
      const q = d.transaction("photos", "readonly").objectStore("photos").get(key);
      q.onsuccess = () => {
        const b = (q.result as Blob) || null;
        if (b) mem.set(key, b);
        res(b);
      };
      q.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
}
const bitmaps = new Map<string, Promise<ImageBitmap | null>>();
export function photoBitmap(key: string): Promise<ImageBitmap | null> {
  if (!key) return Promise.resolve(null);
  if (!bitmaps.has(key)) {
    bitmaps.set(
      key,
      getPhoto(key).then(async (b) => {
        if (!b) return null;
        try {
          return await createImageBitmap(b);
        } catch {
          return null;
        }
      }),
    );
  }
  return bitmaps.get(key)!;
}
export function forgetBitmap(key: string) {
  bitmaps.delete(key);
}

/** Shrinks a phone photo (often 4000px+) so slides stay quick to draw. */
export async function importPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error("That file isn't a photo the browser can read. Try a JPG or PNG.");
  const k = Math.min(1, 2160 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not read the photo."))), "image/jpeg", 0.9));
  const key = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  await putPhoto(key, blob);
  return key;
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Could not read the photo."));
    r.readAsDataURL(b);
  });
