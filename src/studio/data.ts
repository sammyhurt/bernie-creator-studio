import { useCallback, useEffect, useRef, useState } from "react";

export const STUDIO_DATA_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-studio-data";
export const CONNECT_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-tiktok-connect";
export const ACTION_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-action";
export const REQUEST_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-request";
export const CAROUSEL_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-carousel";
export const SAVED_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-saved";
export const SEARCH_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-search";
export const GROWTH_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-growth";
export const KIT_URL = "https://bernie-creator-studio.netlify.app/kit/";
export const LINKS_MANAGE_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-links-manage";
export const LINK_PAGE_URL = "https://bernie-creator-studio.netlify.app/links/";
export const PASS_HEADER = "X-Studio-Key";
const PASS_KEY = "bcs-passcode";

export interface StudioData {
  storedAt: number;
  profile: { handle?: string; pillars?: string[]; direction?: string; posts_per_week?: string; inspiration?: string[]; dream_brands?: string[]; never_brands?: string[]; shop_links?: string };
  setup: { tiktok_connected: boolean; tiktok_connected_at?: string; telegram_ready: boolean; ideas_email?: string };
  stats?: Stats | null;
  ideas?: Idea[];
  radar?: RadarItem[];
  radar_at?: string;
  deals?: Deal[];
  brief?: Brief | null;
  kit_url?: string;
  growth?: Growth | null;
  search?: SearchInsights | null;
  saved?: SavedVideo[];
  carousels?: Carousel[];
  links?: LinksData | null;
  requests: FeatureRequest[];
}
export type LinkKind = "link" | "social" | "email" | "featured" | "deal";
export interface LinkItem { id: number; title: string; url: string; grp: string; kind: LinkKind; note: string; deal_id: number; video_id: string; sponsored: boolean; active: boolean; sort: number; taps_30d: number; taps_90d: number }
export interface LinkWindow { visits: number; taps: number; tappers: number }
export interface LinkStats {
  w7: LinkWindow; w30: LinkWindow; prev7: LinkWindow;
  top: { id: string; title: string; taps: number }[];
  apps: { name: string; n: number }[]; devices: { name: string; n: number }[]; sources: { name: string; n: number }[];
  daily: { day: string; visits: number; taps: number }[];
  after_post: { id: string; title: string; posted_at: string; url: string; visits: number; taps: number; partial: boolean; ratio: number | null }[];
  base_per_day: number; video_taps_30d: number; kit_taps_30d: number; has_data: boolean;
}
export interface LinksData { page_url: string; bio: string; kit_show: boolean; tracking_since: string; items: LinkItem[]; stats: LinkStats }
export type Platform = "tiktok" | "instagram" | "both";
export type Look = "beige" | "navy" | "photo";
export interface CarouselSlide { kicker: string; title: string; body: string; photo: string; source: string; check: string; photo_key: string }
export interface CarouselBody {
  slides: CarouselSlide[];
  caption_tiktok: string;
  caption_instagram: string;
  hashtags_tiktok: string[];
  hashtags_instagram: string[];
  search_phrase: string;
  best_time: string;
  tip: string;
  look: Look;
  sources: string[];
}
export interface Carousel { id: number; created_at: string; updated_at: string; title: string; platform: Platform; kind: string; topic: string; facts: string; status: "draft" | "planned" | "posted" | "removed"; plan_date: string; plan_time: string; body: CarouselBody }
export interface SavedVideo { id: number; created_at: string; url: string; author: string; caption: string; cover: string; posted_at: string; views: number; likes: number; comments: number; shares: number; saves: number; duration: number; sound: string; collection: string; note: string; why: string; your_version: string; pillar: string; used: boolean }
export type SearchTrend = "" | "new" | "rising" | "steady" | "cooling";
export interface SearchPick { phrase: string; pillar: string; idea: string; hook: string; why: string; hot: boolean; trend: SearchTrend; score: number }
export interface SearchInsights { run: string; at: string; summary: string; picks: SearchPick[]; top: { phrase: string; seed: string; score: number; hot: boolean; trend: SearchTrend }[] }
export interface GrowthPlanBody {
  headline: string;
  where_you_are: string;
  focus: string;
  milestones: { followers: number; title: string; focus: string }[];
  phases: { id: string; name: string; goal: string; why: string; steps: { id: string; text: string }[] }[];
  this_week: { id: string; task: string; day: string; why: string }[];
  rhythm: { day: string; post: string; note: string }[];
  pillar_mix: { pillar: string; share: number; why: string }[];
  series: { name: string; format: string; day: string }[];
  daily: { id: string; text: string }[];
  stop: string[];
  measure: string[];
  limits: string;
}
export interface GrowthPlan { id: number; created_at: string; followers: number; done: string[]; plan: GrowthPlanBody }
export interface Growth { latest: GrowthPlan | null; history: { id: number; created_at: string; followers: number; headline: string }[] }
export type IdeaStatus = "idea" | "saved" | "scripted" | "planned" | "filmed" | "posted" | "skipped";
export interface Shot { sec: string; shot: string; say: string; on_screen: string }
export interface Script {
  title: string;
  hook: string;
  on_screen_hook: string;
  length_sec: number;
  shots: Shot[];
  caption: string;
  hashtags: string[];
  keywords: string[];
  sound_tip: string;
  cta: string;
  filming_tips: string[];
}
export interface Idea {
  id: number;
  created_at: string;
  title: string;
  pillar: string;
  format: string;
  hook: string;
  hook_type: string;
  why: string;
  keywords: string;
  series: string;
  source: string;
  status: IdeaStatus;
  plan_date: string;
  plan_time: string;
  has_script?: boolean;
  script: Script | null;
}
export interface Hook { say: string; on_screen: string; hook_type: string; score: number; why: string }
export interface RadarItem { kind: "inspiration" | "trend" | "comment" | "hot"; source: string; title: string; url: string; views: number; ratio: number; why: string; how_to_use: string; use_by: string; flag: string; at: string }
export type DealStatus = "Idea" | "Pitched" | "Talking" | "Signed" | "Posted" | "Paid" | "Passed";
export interface Deal { id: number; brand: string; contact: string; status: DealStatus; value: string; deliverables: string; due: string; notes: string; pitch_subject: string; pitch: string; updated_at: string }
export interface BriefData { headline?: string; summary?: string; wins?: string[]; learn?: string[]; focus?: string; best_time?: string; ideas?: Partial<Idea>[]; trend?: string }
export interface Brief { week_of: string; headline: string; data: BriefData | null }
export interface FeatureRequest { key: string; submitted_at: string; request: string; title: string; better_version: string; follow_up_q: string; status: string; size: string; built_at: string; updated_at: string }
export interface Checkin { video_id: string; video_title: string; at: string; views?: number; avg_watch_sec?: number; watched_full_pct?: number; new_followers?: number; saves?: number; for_you_pct?: number; search_pct?: number; profile_pct?: number; following_pct?: number; note?: string }
export interface Group { name: string; posts: number; median_views: number; best: number }
export interface VideoStat {
  id: string;
  posted_at: string;
  title: string;
  url: string;
  cover: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  er: number;
  spike: boolean;
  ratio: number | null;
  hook_type?: string;
  pillar?: string;
  format?: string;
  checkin?: Checkin | null;
}
export interface Stats {
  updated_at: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  followers: number;
  following: number;
  likes: number;
  videos: number;
  followers_7d: number | null;
  followers_30d: number | null;
  tracking_since: string;
  followers_since_start: number;
  series: { day: string; followers: number; likes: number }[];
  median_views: number;
  avg_views_30d: number;
  views_30d: number;
  posts_30d: number;
  er_avg: number;
  top: VideoStat[];
  recent: VideoStat[];
  spikes: VideoStat[];
  weekdays: { day: string; posts: number; median_views: number }[];
  slots: { slot: string; posts: number; median_views: number }[];
  sample: number;
  hooks?: Group[];
  pillars?: Group[];
  checkins?: Checkin[];
}
/** Marker for "field cleared" on an existing deal; read back as empty. */
export const CLEARED = "—";
const str = (v: unknown) => (v == null ? "" : String(v));
const ymd = (v: unknown) => {
  const m = str(v).match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : "";
};
const hm = (v: unknown) => (/^\d{2}:\d{2}/.test(str(v)) ? str(v).slice(0, 5) : "");
const parseScript = (v: unknown): Script | null => {
  let x: unknown = v;
  if (typeof v === "string") {
    if (!v.trim()) return null;
    try {
      x = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (!x || typeof x !== "object" || !Array.isArray((x as Script).shots)) return null;
  const s = x as Script;
  return { ...s, hashtags: Array.isArray(s.hashtags) ? s.hashtags.map(str) : [], keywords: Array.isArray(s.keywords) ? s.keywords.map(str) : [], filming_tips: Array.isArray(s.filming_tips) ? s.filming_tips.map(str) : [] };
};
const STATUSES = ["idea", "saved", "scripted", "planned", "filmed", "posted", "skipped"];
export const toIdea = (r: Record<string, unknown>): Idea => ({
  id: Number(r.id) || 0,
  created_at: str(r.created_at),
  title: str(r.title),
  pillar: str(r.pillar),
  format: str(r.format),
  hook: str(r.hook),
  hook_type: str(r.hook_type),
  why: str(r.why),
  keywords: str(r.keywords),
  series: str(r.series),
  source: str(r.source) || "studio",
  status: (STATUSES.includes(str(r.status)) ? str(r.status) : "idea") as IdeaStatus,
  plan_date: ymd(r.plan_date),
  plan_time: hm(r.plan_time),
  has_script: !!r.script,
  script: parseScript(r.script),
});
const DEAL_STATUSES = ["Idea", "Pitched", "Talking", "Signed", "Posted", "Paid", "Passed"];
const clr = (v: unknown) => (str(v) === CLEARED ? "" : str(v));
export const toDeal = (r: Record<string, unknown>): Deal => ({
  id: Number(r.id) || 0,
  brand: str(r.brand) || "Brand",
  contact: clr(r.contact),
  status: (DEAL_STATUSES.includes(str(r.status)) ? str(r.status) : "Idea") as DealStatus,
  value: clr(r.value),
  deliverables: clr(r.deliverables),
  due: ymd(r.due),
  notes: clr(r.notes),
  pitch_subject: str(r.pitch_subject),
  pitch: str(r.pitch),
  updated_at: str(r.updated_at),
});
const arrOf = <T,>(v: unknown, f: (x: Record<string, unknown>) => T): T[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => f(x as Record<string, unknown>)) : []);
export const toSaved = (x: Record<string, unknown>): SavedVideo => ({
  id: Number(x.id) || 0,
  created_at: str(x.created_at),
  url: /^https:\/\//.test(str(x.url)) ? str(x.url) : "",
  author: str(x.author),
  caption: str(x.caption),
  cover: /^https:\/\//.test(str(x.cover)) ? str(x.cover) : "",
  posted_at: str(x.posted_at),
  views: Number(x.views) || 0,
  likes: Number(x.likes) || 0,
  comments: Number(x.comments) || 0,
  shares: Number(x.shares) || 0,
  saves: Number(x.saves) || 0,
  duration: Number(x.duration) || 0,
  sound: str(x.sound),
  collection: str(x.collection),
  note: str(x.note),
  why: str(x.why),
  your_version: str(x.your_version),
  pillar: str(x.pillar),
  used: x.used === true || x.used === "yes",
});
const toSlide = (x: Record<string, unknown>): CarouselSlide => ({ kicker: str(x.kicker), title: str(x.title), body: str(x.body), photo: str(x.photo), source: str(x.source), check: str(x.check), photo_key: str(x.photo_key) });
export const toCarousel = (r: Record<string, unknown>): Carousel => {
  let b: Record<string, unknown> = {};
  if (typeof r.body === "string") {
    try {
      b = JSON.parse(r.body) || {};
    } catch {
      b = {};
    }
  } else if (r.body && typeof r.body === "object") b = r.body as Record<string, unknown>;
  const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
  const plat = str(r.platform);
  const st = str(r.status);
  const look = str(b.look);
  return {
    id: Number(r.id) || 0,
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
    title: str(r.title) || "Untitled carousel",
    platform: (["tiktok", "instagram", "both"].includes(plat) ? plat : "tiktok") as Platform,
    kind: str(r.kind),
    topic: str(r.topic),
    facts: str(r.facts),
    status: (["draft", "planned", "posted", "removed"].includes(st) ? st : "draft") as Carousel["status"],
    plan_date: ymd(r.plan_date),
    plan_time: hm(r.plan_time),
    body: {
      slides: arrOf(b.slides, toSlide),
      caption_tiktok: str(b.caption_tiktok),
      caption_instagram: str(b.caption_instagram),
      hashtags_tiktok: strs(b.hashtags_tiktok),
      hashtags_instagram: strs(b.hashtags_instagram),
      search_phrase: str(b.search_phrase),
      best_time: str(b.best_time),
      tip: str(b.tip),
      look: (["beige", "navy", "photo"].includes(look) ? look : "beige") as Look,
      sources: strs(b.sources),
    },
  };
};
const KINDS: LinkKind[] = ["link", "social", "email", "featured", "deal"];
export const toLink = (x: Record<string, unknown>): LinkItem => ({
  id: Number(x.id) || 0, title: str(x.title), url: str(x.url), grp: str(x.grp), kind: (KINDS.includes(str(x.kind) as LinkKind) ? str(x.kind) : "link") as LinkKind, note: str(x.note),
  deal_id: Number(x.deal_id) || 0, video_id: str(x.video_id), sponsored: x.sponsored === true || x.sponsored === "yes", active: x.active === true || x.active === "yes", sort: Number(x.sort) || 0,
  taps_30d: Number(x.taps_30d) || 0, taps_90d: Number(x.taps_90d) || 0,
});
const win = (v: unknown): LinkWindow => { const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>; return { visits: Number(o.visits) || 0, taps: Number(o.taps) || 0, tappers: Number(o.tappers) || 0 }; };
const counts = (v: unknown) => arrOf(v, (x) => ({ name: str(x.name), n: Number(x.n) || 0 })).filter((x) => x.name);
export const toLinks = (v: unknown): LinksData | null => {
  if (!v || typeof v !== "object") return null;
  const b = v as Record<string, unknown>;
  const st = (b.stats && typeof b.stats === "object" ? b.stats : {}) as Record<string, unknown>;
  return {
    page_url: /^https:\/\//.test(str(b.page_url)) ? str(b.page_url) : LINK_PAGE_URL,
    bio: str(b.bio), kit_show: !!b.kit_show, tracking_since: str(b.tracking_since),
    items: arrOf(b.items, toLink).filter((x) => x.id).sort((a, c) => a.sort - c.sort),
    stats: {
      w7: win(st.w7), w30: win(st.w30), prev7: win(st.prev7),
      top: arrOf(st.top, (x) => ({ id: str(x.id), title: str(x.title), taps: Number(x.taps) || 0 })),
      apps: counts(st.apps), devices: counts(st.devices), sources: counts(st.sources),
      daily: arrOf(st.daily, (x) => ({ day: ymd(x.day), visits: Number(x.visits) || 0, taps: Number(x.taps) || 0 })).filter((x) => x.day),
      after_post: arrOf(st.after_post, (x) => ({ id: str(x.id), title: str(x.title), posted_at: str(x.posted_at), url: /^https:\/\//.test(str(x.url)) ? str(x.url) : "", visits: Number(x.visits) || 0, taps: Number(x.taps) || 0, partial: !!x.partial, ratio: x.ratio == null ? null : Number(x.ratio) })),
      base_per_day: Number(st.base_per_day) || 0, video_taps_30d: Number(st.video_taps_30d) || 0, kit_taps_30d: Number(st.kit_taps_30d) || 0, has_data: !!st.has_data,
    },
  };
};
export const toGrowthPlan = (r: Record<string, unknown> | null | undefined): GrowthPlan | null => {
  if (!r || typeof r !== "object" || !r.plan || typeof r.plan !== "object") return null;
  const p = r.plan as Record<string, unknown>;
  const plan: GrowthPlanBody = {
    headline: str(p.headline),
    where_you_are: str(p.where_you_are),
    focus: str(p.focus),
    milestones: arrOf(p.milestones, (m) => ({ followers: Number(m.followers) || 0, title: str(m.title), focus: str(m.focus) })).filter((m) => m.followers > 0),
    phases: arrOf(p.phases, (x) => ({ id: str(x.id), name: str(x.name), goal: str(x.goal), why: str(x.why), steps: arrOf(x.steps, (y) => ({ id: str(y.id), text: str(y.text) })) })),
    this_week: arrOf(p.this_week, (x) => ({ id: str(x.id), task: str(x.task), day: str(x.day), why: str(x.why) })),
    rhythm: arrOf(p.rhythm, (x) => ({ day: str(x.day), post: str(x.post), note: str(x.note) })),
    pillar_mix: arrOf(p.pillar_mix, (x) => ({ pillar: str(x.pillar), share: Number(x.share) || 0, why: str(x.why) })),
    series: arrOf(p.series, (x) => ({ name: str(x.name), format: str(x.format), day: str(x.day) })),
    daily: arrOf(p.daily, (x) => ({ id: str(x.id), text: str(x.text) })),
    stop: Array.isArray(p.stop) ? p.stop.map(str) : [],
    measure: Array.isArray(p.measure) ? p.measure.map(str) : [],
    limits: str(p.limits),
  };
  return { id: Number(r.id) || 0, created_at: str(r.created_at), followers: Number(r.followers) || 0, done: Array.isArray(r.done) ? r.done.map(str) : [], plan };
};

/** Every list the screens read comes through here, so one odd row can't break a screen. */
function normalize(b: StudioData): StudioData {
  const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  return {
    ...b,
    profile: b.profile || {},
    setup: b.setup || { tiktok_connected: false, telegram_ready: false },
    ideas: arr<Record<string, unknown>>(b.ideas).map(toIdea).filter((x) => x.id && x.status !== "skipped"),
    deals: arr<Record<string, unknown>>(b.deals).map(toDeal).filter((x) => x.id),
    radar: arr<RadarItem>(b.radar).map((r) => ({ ...r, title: str(r.title), why: str(r.why), how_to_use: str(r.how_to_use), use_by: ymd(r.use_by), source: str(r.source), url: /^https:\/\//.test(str(r.url)) ? str(r.url) : "" })),
    brief: b.brief ? { ...b.brief, week_of: ymd(b.brief.week_of), headline: str(b.brief.headline) } : null,
    growth: b.growth ? { latest: toGrowthPlan(b.growth.latest as unknown as Record<string, unknown>), history: arr<Growth["history"][number]>(b.growth.history).map((h) => ({ id: Number(h.id) || 0, created_at: str(h.created_at), followers: Number(h.followers) || 0, headline: str(h.headline) })) } : null,
    search: b.search && typeof b.search === "object"
      ? {
          run: str(b.search.run),
          at: str(b.search.at),
          summary: str(b.search.summary),
          picks: arrOf(b.search.picks, (x) => ({ phrase: str(x.phrase), pillar: str(x.pillar), idea: str(x.idea), hook: str(x.hook), why: str(x.why), hot: !!x.hot, trend: str(x.trend) as SearchTrend, score: Number(x.score) || 0 })).filter((x) => x.phrase),
          top: arrOf(b.search.top, (x) => ({ phrase: str(x.phrase), seed: str(x.seed), score: Number(x.score) || 0, hot: !!x.hot, trend: str(x.trend) as SearchTrend })).filter((x) => x.phrase),
        }
      : null,
    saved: arrOf(b.saved, toSaved).filter((x) => x.id),
    carousels: arrOf(b.carousels, toCarousel).filter((x) => x.id && x.status !== "removed"),
    links: toLinks(b.links),
    requests: arr<FeatureRequest>(b.requests).map((r) => ({ ...r, key: str(r.key), title: str(r.title), request: str(r.request), status: str(r.status) || "Sent", follow_up_q: str(r.follow_up_q) })),
  };
}

export interface Notice { kind: "warn" | "err"; text: string; button?: string; onClick?: () => void }

let currentPass: string | null = null;

/** POST to a passcode-protected Studio webhook. Throws a friendly message on failure. */
export async function studioPost<T = Record<string, unknown>>(url: string, body: Record<string, unknown>): Promise<T> {
  const pass = currentPass || readPass();
  if (!pass) throw new Error("The Studio is locked. Unlock it and try again.");
  let r: Response;
  try {
    r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", [PASS_HEADER]: pass }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Could not reach the Studio. Check your connection and try again.");
  }
  if (r.status === 401 || r.status === 403) throw new Error("Your passcode was not accepted. Lock and unlock the Studio, then try again.");
  let j: (T & { ok?: boolean; error?: string }) | null = null;
  try {
    j = (await r.json()) as T & { ok?: boolean; error?: string };
  } catch {
    j = null;
  }
  if (!r.ok || !j || j.ok === false) throw new Error((j && j.error) || "Something went wrong. Please try again.");
  return j;
}

function readPass(): string | null {
  try {
    return sessionStorage.getItem(PASS_KEY) || localStorage.getItem(PASS_KEY);
  } catch {
    return null;
  }
}
function savePass(p: string | null, remember: boolean) {
  try {
    sessionStorage.removeItem(PASS_KEY);
    localStorage.removeItem(PASS_KEY);
    if (p) (remember ? localStorage : sessionStorage).setItem(PASS_KEY, p);
  } catch {
    /* storage blocked: the passcode lives in memory for this visit only */
  }
}

/** Reads Bernie's Studio data from a read-only n8n webhook, unlocked with his passcode. */
export function useStudioData() {
  const [data, setData] = useState<StudioData | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [locked, setLocked] = useState<boolean>(() => !readPass());
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);
  const passRef = useRef<string | null>(readPass());

  const fetchData = useCallback(async (manual?: boolean): Promise<boolean> => {
    const pass = passRef.current;
    currentPass = pass;
    if (!pass) {
      setLocked(true);
      return false;
    }
    try {
      const r = await fetch(STUDIO_DATA_URL, { headers: { [PASS_HEADER]: pass }, cache: "no-store" });
      if (r.status === 401 || r.status === 403) {
        passRef.current = null;
        savePass(null, false);
        setLocked(true);
        setAuthError("That passcode did not work. Try again.");
        return false;
      }
      if (!r.ok) throw new Error("HTTP " + r.status);
      setData(normalize((await r.json()) as StudioData));
      setNotice(null);
      setLocked(false);
      setAuthError("");
      return true;
    } catch {
      setNotice({ kind: "warn", text: manual ? "Could not reach the Studio just now. Your last loaded info stays on screen." : "Could not reach the Studio. Check your connection, then refresh.", button: "Try again", onClick: () => void fetchData(true) });
      return false;
    }
  }, []);

  useEffect(() => {
    if (passRef.current) void fetchData();
    const i = setInterval(() => {
      if (passRef.current && document.visibilityState === "visible") void fetchData();
    }, 120000);
    return () => clearInterval(i);
  }, [fetchData]);

  const unlock = async (pass: string, remember: boolean) => {
    setChecking(true);
    setAuthError("");
    passRef.current = pass.trim();
    const ok = await fetchData(true);
    if (ok) savePass(passRef.current, remember);
    setChecking(false);
  };
  const lock = () => {
    passRef.current = null;
    currentPass = null;
    savePass(null, false);
    setData(null);
    setLocked(true);
  };

  /** Change the loaded data right away (before the next refresh confirms it). */
  const mutate = useCallback((fn: (d: StudioData) => StudioData) => setData((d) => (d ? fn(d) : d)), []);

  return { data, notice, refresh: () => fetchData(true), mutate, locked, unlock, lock, authError, checking };
}
