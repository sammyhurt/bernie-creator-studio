import { createContext, useContext, type ReactNode } from "react";

import { ACTION_URL, CAROUSEL_URL, LINKS_MANAGE_URL, toLink, type LinkItem, CLEARED, toCarousel, type Carousel, type CarouselSlide, type Platform, GROWTH_URL, SAVED_URL, SEARCH_URL, studioPost, toSaved, type SavedVideo, toDeal, toGrowthPlan, toIdea, type Deal, type Hook, type Idea, type Script, type StudioData } from "./data";
import type { TabId } from "./tabs";

interface Ctx {
  d: StudioData | null;
  mutate: (fn: (d: StudioData) => StudioData) => void;
  refresh: () => Promise<boolean>;
  goto: (t: TabId) => void;
  openRequest: (resume?: { key: string; question: string }) => void;
}
const StudioCtx = createContext<Ctx | null>(null);

export function StudioProvider({ value, children }: { value: Ctx; children: ReactNode }) {
  return <StudioCtx.Provider value={value}>{children}</StudioCtx.Provider>;
}

/** Studio state plus every action the screens can take. Each action saves to n8n first, then updates the screen. */
export function useStudio() {
  const c = useContext(StudioCtx);
  if (!c) throw new Error("useStudio outside provider");
  const { mutate } = c;

  const putIdeas = (rows: Idea[], front = true) =>
    mutate((d) => {
      const ids = new Set(rows.map((r) => r.id));
      const rest = (d.ideas || []).filter((x) => !ids.has(x.id));
      return { ...d, ideas: front ? [...rows, ...rest] : [...rest, ...rows] };
    });

  return {
    ...c,
    ideas: (c.d?.ideas || []) as Idea[],

    async getIdeas(pillar: string, idea: string) {
      const r = await studioPost<{ rows: Record<string, unknown>[] }>(ACTION_URL, { action: "ideas", pillar, idea });
      const rows = (r.rows || []).map(toIdea).filter((x) => x.id);
      if (!rows.length) throw new Error("No ideas came back. Please try again.");
      putIdeas(rows);
      return rows;
    },

    async hooks(input: { topic?: string; idea_id?: number }) {
      const r = await studioPost<{ hooks: Hook[] }>(ACTION_URL, { action: "hooks", ...input });
      const h = (r.hooks || []).filter((x) => x && (x.say || x.on_screen));
      if (!h.length) throw new Error("No hooks came back. Please try again.");
      return h.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    },

    async script(input: { idea_id?: number; topic?: string; hook?: string }) {
      const r = await studioPost<{ rows: Record<string, unknown>[]; script: Script | null }>(ACTION_URL, { action: "script", ...input });
      const row = (r.rows || []).map(toIdea)[0];
      const script = r.script || row?.script || null;
      if (!script || !Array.isArray(script.shots)) throw new Error("The script did not come back complete. Please try again.");
      const idea = row ? { ...row, script, has_script: true } : null;
      if (idea && idea.id) putIdeas([idea]);
      return { idea, script };
    },

    async updateIdea(idea: Idea, patch: Partial<Pick<Idea, "status" | "plan_date" | "plan_time" | "series">>) {
      const next = { ...idea, ...patch };
      await studioPost(ACTION_URL, { action: "idea_update", idea_id: idea.id, status: next.status, plan_date: next.plan_date, plan_time: next.plan_time, series: next.series });
      mutate((d) => ({
        ...d,
        ideas: next.status === "skipped" ? (d.ideas || []).filter((x) => x.id !== idea.id) : (d.ideas || []).map((x) => (x.id === idea.id ? next : x)),
      }));
      return next;
    },

    async saveDeal(deal: Partial<Deal> & { brand: string }) {
      // The backend keeps the old value when a field arrives empty, so a cleared field on an existing deal is sent as a marker.
      const v = (x?: string) => (x && x.trim() ? x.trim() : deal.id ? CLEARED : "");
      const r = await studioPost<{ rows: Record<string, unknown>[] }>(ACTION_URL, {
        action: "deal_save",
        deal_id: deal.id || 0,
        brand: deal.brand,
        contact: v(deal.contact),
        deal_status: deal.status || "Idea",
        value: v(deal.value),
        deliverables: v(deal.deliverables),
        due: deal.due && /^\d{4}-\d{2}-\d{2}$/.test(deal.due) ? deal.due : deal.id ? CLEARED : "",
        notes: v(deal.notes),
      });
      const row = (r.rows || []).map(toDeal)[0];
      if (!row || !row.id) throw new Error("The deal did not save. Please try again.");
      mutate((d) => ({ ...d, deals: [row, ...(d.deals || []).filter((x) => x.id !== row.id)] }));
      return row;
    },

    async pitch(input: { brand?: string; deal_id?: number; angle?: string }) {
      const r = await studioPost<{ rows: Record<string, unknown>[] }>(ACTION_URL, { action: "pitch", ...input });
      const row = (r.rows || []).map(toDeal)[0];
      if (!row || !row.pitch) throw new Error("The pitch did not come back. Please try again.");
      mutate((d) => ({ ...d, deals: [row, ...(d.deals || []).filter((x) => x.id !== row.id)] }));
      return row;
    },

    /** Writes a new carousel from his words, his facts and his Studio data (30–45 seconds). */
    async draftCarousel(input: { topic: string; facts: string; kind: string; feel: string; count: number; platform: Platform; seed_label?: string; seed_text?: string }) {
      const r = await studioPost<{ carousel: Record<string, unknown> }>(CAROUSEL_URL, { action: "draft", ...input });
      const c = toCarousel(r.carousel || {});
      if (!c.id || c.body.slides.length < 3) throw new Error("The carousel did not come back complete. Please try again.");
      mutate((d) => ({ ...d, carousels: [c, ...(d.carousels || [])] }));
      return c;
    },

    async redoSlide(c: Carousel, index: number, instruction: string) {
      const r = await studioPost<{ slide: CarouselSlide }>(CAROUSEL_URL, { action: "redo", slides: c.body.slides, index, instruction, facts: c.facts });
      if (!r.slide || (!r.slide.title && !r.slide.body)) throw new Error("That slide did not come back. Please try again.");
      return { ...r.slide, photo_key: c.body.slides[index]?.photo_key || "" } as CarouselSlide;
    },

    /** Saves the whole carousel (text, order, look, status and plan date). */
    async saveCarousel(c: Carousel) {
      mutate((d) => ({ ...d, carousels: c.status === "removed" ? (d.carousels || []).filter((x) => x.id !== c.id) : (d.carousels || []).map((x) => (x.id === c.id ? c : x)) }));
      await studioPost(CAROUSEL_URL, { action: "save", id: c.id, title: c.title, platform: c.platform, status: c.status, plan_date: c.plan_date, plan_time: c.plan_time, body: c.body });
    },

    /** Opens the Carousels tab with an idea already filled in. */
    startCarousel(seed: { topic: string; facts?: string; label: string; text?: string }) {
      try {
        localStorage.setItem("mts-carousel-seed", JSON.stringify(seed));
      } catch {
        /* ignore */
      }
      c.goto("carousels");
    },

    openCarousel(id: number) {
      try {
        localStorage.setItem("mts-carousel-open", String(id));
      } catch {
        /* ignore */
      }
      c.goto("carousels");
    },

    /** Adds or edits one link on his link page. Keeps its tap counts on screen. */
    async saveLink(link: Partial<LinkItem> & { title: string; url: string }) {
      const r = await studioPost<{ rows: Record<string, unknown>[] }>(LINKS_MANAGE_URL, { action: "save", id: link.id || 0, title: link.title, url: link.url, grp: link.grp || "", kind: link.kind || "link", note: link.note || "", deal_id: link.deal_id || 0, video_id: link.video_id || "", sponsored: !!link.sponsored, active: link.active !== false });
      const row = (r.rows || []).map(toLink).find((x) => x.id);
      if (!row) throw new Error("The link did not save. Please try again.");
      mutate((d) => {
        if (!d.links) return d;
        const old = d.links.items.find((x) => x.id === row.id);
        const next = { ...row, taps_30d: old?.taps_30d || 0, taps_90d: old?.taps_90d || 0 };
        const items = old ? d.links.items.map((x) => (x.id === row.id ? next : x)) : [...d.links.items, next];
        return { ...d, links: { ...d.links, items } };
      });
      return row;
    },

    async removeLink(id: number) {
      await studioPost(LINKS_MANAGE_URL, { action: "remove", id });
      mutate((d) => (d.links ? { ...d, links: { ...d.links, items: d.links.items.filter((x) => x.id !== id) } } : d));
    },

    /** New order for the links; the screen updates first so moving feels instant. */
    async reorderLinks(ids: number[]) {
      mutate((d) => {
        if (!d.links) return d;
        const pos = new Map(ids.map((id, i) => [id, (i + 1) * 10]));
        return { ...d, links: { ...d.links, items: d.links.items.map((x) => (pos.has(x.id) ? { ...x, sort: pos.get(x.id)! } : x)).sort((a, b) => a.sort - b.sort) } };
      });
      await studioPost(LINKS_MANAGE_URL, { action: "reorder", ids });
    },

    async saveLinkSettings(patch: { link_bio?: string; kit_show_links?: boolean }) {
      await studioPost(LINKS_MANAGE_URL, { action: "settings", ...patch });
      mutate((d) => (d.links ? { ...d, links: { ...d.links, bio: patch.link_bio ?? d.links.bio, kit_show: patch.kit_show_links ?? d.links.kit_show } } : d));
    },

    /** Pulls in TikTok links he pasted (up to 10 at a time). */
    async addSaved(text: string, collection: string, note: string) {
      const r = await studioPost<{ rows: Record<string, unknown>[]; skipped: number; failed: number }>(SAVED_URL, { action: "add", text, collection, note });
      const rows = (r.rows || []).map(toSaved).filter((x) => x.id);
      if (rows.length) mutate((d) => ({ ...d, saved: [...rows, ...(d.saved || [])] }));
      return { added: rows.length, skipped: Number(r.skipped) || 0, failed: Number(r.failed) || 0 };
    },

    async updateSaved(v: SavedVideo, patch: Partial<Pick<SavedVideo, "note" | "collection" | "used">> & { remove?: boolean }) {
      const next = { ...v, ...patch };
      await studioPost(SAVED_URL, { action: "update", id: v.id, note: next.note, collection: next.collection, used: next.used, status: patch.remove ? "removed" : "active" });
      mutate((d) => ({ ...d, saved: patch.remove ? (d.saved || []).filter((x) => x.id !== v.id) : (d.saved || []).map((x) => (x.id === v.id ? next : x)) }));
    },

    /** Runs a fresh TikTok search check (about a minute), then reloads the Studio. */
    async refreshSearch() {
      await studioPost(SEARCH_URL, {});
      await c.refresh();
    },

    async makeGrowthPlan() {
      const r = await studioPost<{ plan: Record<string, unknown> }>(GROWTH_URL, { action: "make" });
      const plan = toGrowthPlan(r.plan);
      if (!plan || !plan.plan.this_week.length) throw new Error("The plan did not come back complete. Please try again.");
      mutate((d) => ({ ...d, growth: { latest: plan, history: [{ id: plan.id, created_at: plan.created_at, followers: plan.followers, headline: plan.plan.headline }, ...(d.growth?.history || [])] } }));
      return plan;
    },

    /** Saves which checklist items are ticked. Updates the screen first so ticking feels instant. */
    async tickGrowth(planId: number, done: string[]) {
      mutate((d) => (d.growth?.latest && d.growth.latest.id === planId ? { ...d, growth: { ...d.growth, latest: { ...d.growth.latest, done } } } : d));
      await studioPost(GROWTH_URL, { action: "check", plan_id: planId, done });
    },

    async checkin(video_id: string, video_title: string, metrics: Record<string, string | number>) {
      await studioPost(ACTION_URL, { action: "checkin", video_id, video_title, metrics });
      void c.refresh();
    },
  };
}
