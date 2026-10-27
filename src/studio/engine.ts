import { useCallback, useEffect, useSyncExternalStore } from "react";

import { studioPost, toIdea, type Idea } from "./data";

/** One endpoint behind Results, Creators like you, Brand radar, rate card and earnings. */
export const ENGINE_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-engine";
export const RESULTS_RUN_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-results-run";
export const COMMENTS_RUN_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-comments-run";
export const RESEARCH_RUN_URL = "https://subletlyco.app.n8n.cloud/webhook/bcs-research-run";
export const REPORT_PAGE = "https://bernie-creator-studio.netlify.app/report/";

export type Verdict = "win" | "normal" | "miss" | "";
export interface ScoredPost {
  video_id: string;
  posted_at: string;
  title: string;
  url: string;
  cover: string;
  tags: { hook: string; format: string; pillar: string; length: string; slot: string; day: string; meredith: boolean; search: string };
  views: number;
  v24: number;
  v7: number;
  s24: number;
  s7: number;
  base24: number;
  base7: number;
  share_rate: number;
  comment_rate: number;
  verdict: Verdict;
  lifetime: boolean;
  note: string;
}
export interface GroupStat { dim: string; value: string; n: number; score: number }
export interface Playbook {
  headline: string;
  do_more: string[];
  do_less: string[];
  testing: string[];
  best_why: string;
  worst_why: string;
  decisions: { text: string; why: string }[];
  numbers: { more: GroupStat[]; less: GroupStat[]; testing: GroupStat[]; outliers: { title: string; score: number; views: number }[]; groups: GroupStat[]; posts_scored: number };
  week: { posts: number; goal: string; followers: number; followers_gained: number; views: number; normal_week: number; best: { title: string; score: number } | null; only: { title: string; views: number } | null };
  created_at: string;
  week_of: string;
}
export type CommentKind = "question" | "buying" | "part2" | "praise" | "negative";
export interface CommentInsight { id: number; video_id: string; video_title: string; kind: CommentKind; text: string; count: number; likes: number; examples: string[]; idea: string; created_at: string }
export interface Peer { handle: string; followers: number; growth: number | null; posts_7d: number; median_views: number; views_per_follower: number; best_format: string; best_url: string; best_views: number; views_change: number | null; top: { url: string; views: number; text: string; format: string }[] }
export interface Peers { list: Peer[]; me: { followers: number; growth: number | null; posts_7d: number; median_views: number; views_per_follower: number; goal: string }; run: string; dip: boolean; falling: number; rising: { format: string; creators: number; tried: boolean }[] }
export type LeadStatus = "new" | "added" | "skip";
export interface BrandLead { id: number; brand: string; handle: string; website: string; category: string; seen_with: string[]; posts: number; example_url: string; fit: string; last_seen: string; status: LeadStatus; deal_id: number }
export interface RateCard { rate_low: number; rate_high: number; rate_min: number; views: number; video_low: number; video_high: number; followers: number; posts_30d: number }
export type EarnKind = "deal" | "affiliate" | "creator_rewards" | "gift" | "other";
export interface Earning { id: number; date: string; source: string; kind: EarnKind; amount: number; video_id: string; deal_id: number; note: string; import_id: string }
export interface Earnings { rows: Earning[]; by_month: Record<string, number>; videos: { video_id: string; title: string; amount: number; views: number; per_1k: number }[]; total: number }
export interface ReportLink { deal_id: number; brand: string; video_id: string; url: string }
export interface EngineData { posts: ScoredPost[]; scored: number; playbook: Playbook | null; comments: CommentInsight[]; peers: Peers; brands: BrandLead[]; rate: RateCard; earnings: Earnings; reports: ReportLink[]; deals: { id: number; brand: string; status: string; video_id: string }[] }

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const arr = <T,>(v: unknown, f: (x: Record<string, unknown>) => T): T[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => f(x as Record<string, unknown>)) : []);
const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const https = (v: unknown) => (/^https:\/\//.test(str(v)) ? str(v) : "");
const nullable = (v: unknown) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const group = (x: Record<string, unknown>): GroupStat => ({ dim: str(x.dim), value: str(x.value), n: num(x.n), score: num(x.score) });

const toPlaybook = (v: unknown): Playbook | null => {
  const p = obj(v);
  if (!Object.keys(p).length) return null;
  const n = obj(p.numbers), w = obj(p.week), best = obj(w.best), only = obj(w.only);
  return {
    headline: str(p.headline), do_more: strs(p.do_more), do_less: strs(p.do_less), testing: strs(p.testing), best_why: str(p.best_why), worst_why: str(p.worst_why),
    decisions: arr(p.decisions, (d) => ({ text: str(d.text), why: str(d.why) })).filter((d) => d.text),
    numbers: { more: arr(n.more, group), less: arr(n.less, group), testing: arr(n.testing, group), groups: arr(n.groups, group), outliers: arr(n.outliers, (o) => ({ title: str(o.title), score: num(o.score), views: num(o.views) })), posts_scored: num(n.posts_scored) },
    week: { posts: num(w.posts), goal: str(w.goal) || "3-4", followers: num(w.followers), followers_gained: num(w.followers_gained), views: num(w.views), normal_week: num(w.normal_week), best: best.title ? { title: str(best.title), score: num(best.score) } : null, only: only.title ? { title: str(only.title), views: num(only.views) } : null },
    created_at: str(p.created_at), week_of: str(p.week_of),
  };
};
const KINDS: CommentKind[] = ["question", "buying", "part2", "praise", "negative"];
const EARN: EarnKind[] = ["deal", "affiliate", "creator_rewards", "gift", "other"];

export function toEngine(v: unknown): EngineData {
  const b = obj(v), pe = obj(b.peers), me = obj(pe.me), r = obj(b.rate), e = obj(b.earnings);
  return {
    posts: arr(b.posts, (x) => {
      const t = obj(x.tags);
      const vd = str(x.verdict);
      return {
        video_id: str(x.video_id), posted_at: str(x.posted_at), title: str(x.title), url: https(x.url), cover: https(x.cover),
        tags: { hook: str(t.hook), format: str(t.format), pillar: str(t.pillar), length: str(t.length), slot: str(t.slot), day: str(t.day), meredith: !!t.meredith, search: str(t.search) },
        views: num(x.views), v24: num(x.v24), v7: num(x.v7), s24: num(x.s24), s7: num(x.s7), base24: num(x.base24), base7: num(x.base7), share_rate: num(x.share_rate), comment_rate: num(x.comment_rate),
        verdict: (["win", "normal", "miss"].includes(vd) ? vd : "") as Verdict, lifetime: !!x.lifetime, note: str(x.note),
      };
    }).filter((x) => x.video_id),
    scored: num(b.scored),
    playbook: toPlaybook(b.playbook),
    comments: arr(b.comments, (c) => ({ id: num(c.id), video_id: str(c.video_id), video_title: str(c.video_title), kind: (KINDS.includes(str(c.kind) as CommentKind) ? str(c.kind) : "question") as CommentKind, text: str(c.text), count: num(c.count), likes: num(c.likes), examples: strs(c.examples), idea: str(c.idea), created_at: str(c.created_at) })).filter((c) => c.id),
    peers: {
      list: arr(pe.list, (x) => ({ handle: str(x.handle), followers: num(x.followers), growth: nullable(x.growth), posts_7d: num(x.posts_7d), median_views: num(x.median_views), views_per_follower: num(x.views_per_follower), best_format: str(x.best_format), best_url: https(x.best_url), best_views: num(x.best_views), views_change: nullable(x.views_change), top: arr(x.top, (t) => ({ url: https(t.url), views: num(t.views), text: str(t.text), format: str(t.format) })) })).filter((x) => x.handle),
      me: { followers: num(me.followers), growth: nullable(me.growth), posts_7d: num(me.posts_7d), median_views: num(me.median_views), views_per_follower: num(me.views_per_follower), goal: str(me.goal) || "3-4" },
      run: str(pe.run), dip: !!pe.dip, falling: num(pe.falling),
      rising: arr(pe.rising, (x) => ({ format: str(x.format), creators: num(x.creators), tried: !!x.tried })).filter((x) => x.format),
    },
    brands: arr(b.brands, (x) => ({ id: num(x.id), brand: str(x.brand), handle: str(x.handle), website: https(x.website), category: str(x.category), seen_with: strs(x.seen_with), posts: num(x.posts), example_url: https(x.example_url), fit: str(x.fit), last_seen: str(x.last_seen), status: (["new", "added", "skip"].includes(str(x.status)) ? str(x.status) : "new") as LeadStatus, deal_id: num(x.deal_id) })).filter((x) => x.id && x.brand),
    rate: { rate_low: num(r.rate_low) || 8, rate_high: num(r.rate_high) || 16, rate_min: num(r.rate_min) || 50, views: num(r.views), video_low: num(r.video_low), video_high: num(r.video_high), followers: num(r.followers), posts_30d: num(r.posts_30d) },
    earnings: {
      rows: arr(e.rows, (x) => ({ id: num(x.id), date: str(x.date).slice(0, 10), source: str(x.source), kind: (EARN.includes(str(x.kind) as EarnKind) ? str(x.kind) : "other") as EarnKind, amount: num(x.amount), video_id: str(x.video_id), deal_id: num(x.deal_id), note: str(x.note), import_id: str(x.import_id) })),
      by_month: Object.fromEntries(Object.entries(obj(e.by_month)).map(([k, x]) => [k, num(x)]).filter(([k]) => /^\d{4}-\d{2}$/.test(String(k)))),
      videos: arr(e.videos, (x) => ({ video_id: str(x.video_id), title: str(x.title), amount: num(x.amount), views: num(x.views), per_1k: num(x.per_1k) })),
      total: num(e.total),
    },
    reports: arr(b.reports, (x) => ({ deal_id: num(x.deal_id), brand: str(x.brand), video_id: str(x.video_id), url: https(x.url) })).filter((x) => x.url),
    deals: arr(b.deals, (x) => ({ id: num(x.id), brand: str(x.brand), status: str(x.status), video_id: str(x.video_id) })),
  };
}

/* ---------- a tiny shared store so every tab sees the same engine data ---------- */
type State = { data: EngineData | null; loading: boolean; error: string; at: number };
let state: State = { data: null, loading: false, error: "", at: 0 };
const subs = new Set<() => void>();
const set = (p: Partial<State>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};
let inflight: Promise<void> | null = null;
export function loadEngine(force = false): Promise<void> {
  if (inflight) return inflight;
  if (!force && state.data && Date.now() - state.at < 120000) return Promise.resolve();
  set({ loading: true, error: "" });
  inflight = studioPost<Record<string, unknown>>(ENGINE_URL, { action: "data" })
    .then((r) => set({ data: toEngine(r), at: Date.now(), loading: false }))
    .catch((e: unknown) => set({ loading: false, error: e instanceof Error ? e.message : "Could not load your results." }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
export const patchEngine = (fn: (d: EngineData) => EngineData) => {
  if (state.data) set({ data: fn(state.data) });
};

export function useEngine() {
  const s = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
  useEffect(() => {
    void loadEngine();
  }, []);
  const refresh = useCallback(() => loadEngine(true), []);
  return { ...s, refresh };
}

/* ---------- saves ---------- */
export const engine = {
  async note(video_id: string, note: string) {
    await studioPost(ENGINE_URL, { action: "note", video_id, note });
    patchEngine((d) => ({ ...d, posts: d.posts.map((p) => (p.video_id === video_id ? { ...p, note } : p)) }));
  },
  /** Turns a playbook decision or a comment idea into an idea in Create. */
  async decision(text: string, why: string): Promise<Idea | null> {
    const r = await studioPost<{ id?: number }>(ENGINE_URL, { action: "decision", text, why });
    const id = Number(r.id) || 0;
    return id ? toIdea({ id, title: text, why, source: "playbook", status: "idea", created_at: new Date().toISOString() }) : null;
  },
  async commentDone(id: number) {
    await studioPost(ENGINE_URL, { action: "comment_done", id });
    patchEngine((d) => ({ ...d, comments: d.comments.filter((c) => c.id !== id) }));
  },
  async lead(id: number, status: LeadStatus, deal_id = 0) {
    await studioPost(ENGINE_URL, { action: "lead", id, status, deal_id });
    patchEngine((d) => ({ ...d, brands: d.brands.map((b) => (b.id === id ? { ...b, status, deal_id: deal_id || b.deal_id } : b)) }));
  },
  async rate(rate_low: number, rate_high: number, rate_min: number) {
    await studioPost(ENGINE_URL, { action: "rate", rate_low, rate_high, rate_min });
    await loadEngine(true);
  },
  async addEarnings(rows: Partial<Earning>[], import_id = "") {
    const r = await studioPost<{ added?: number; skipped?: number }>(ENGINE_URL, { action: "earning_add", rows, import_id });
    await loadEngine(true);
    return { added: Number(r.added) || 0, skipped: Number(r.skipped) || 0 };
  },
  async removeEarning(id: number) {
    await studioPost(ENGINE_URL, { action: "earning_remove", id });
    await loadEngine(true);
  },
  async report(deal_id: number, video_id: string) {
    const r = await studioPost<{ url?: string }>(ENGINE_URL, { action: "report", deal_id, video_id });
    await loadEngine(true);
    return String(r.url || "");
  },
  async reportOff(deal_id: number) {
    await studioPost(ENGINE_URL, { action: "report_off", deal_id });
    patchEngine((d) => ({ ...d, reports: d.reports.filter((r) => r.deal_id !== deal_id) }));
  },
  async runPlaybook() {
    await studioPost(RESULTS_RUN_URL, { action: "playbook" });
    await loadEngine(true);
  },
  async readComments(video_id: string) {
    const r = await studioPost<{ added?: number }>(COMMENTS_RUN_URL, { video_id });
    await loadEngine(true);
    return Number(r.added) || 0;
  },
  async research() {
    await studioPost(RESEARCH_RUN_URL, {});
  },
};
