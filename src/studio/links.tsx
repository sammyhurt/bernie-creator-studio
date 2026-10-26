import AddCircle from "@iconify-react/solar/add-circle-linear";
import AltArrowDown from "@iconify-react/solar/alt-arrow-down-linear";
import AltArrowUp from "@iconify-react/solar/alt-arrow-up-linear";
import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import Eye from "@iconify-react/solar/eye-linear";
import EyeClosed from "@iconify-react/solar/eye-closed-linear";
import LinkIcon from "@iconify-react/solar/link-linear";
import PenNew from "@iconify-react/solar/pen-new-square-linear";
import Trash from "@iconify-react/solar/trash-bin-minimalistic-linear";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { CopyButton, Field, Modal, Pill, Spinner, useAction, useToast } from "./bits";
import { LINK_PAGE_URL, type Deal, type LinkItem, type LinkKind, type LinksData } from "./data";
import { PALETTES } from "./palette";
import { useStudio } from "./store";
import { Empty, Panel, Stat } from "./ui";

const nf = new Intl.NumberFormat("en-US");
const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
const when = (iso: string) => (Number.isFinite(Date.parse(iso)) ? dayFmt.format(new Date(iso)) : "");
const host = (u: string) => {
  if (u.startsWith("mailto:")) return u.slice(7).split("?")[0];
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};
const KIND_LABEL: Record<LinkKind, string> = { link: "Link", social: "Social button", email: "Email button", featured: "Latest video spot", deal: "Brand deal" };
const APP_LABEL: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", pinterest: "Pinterest", snapchat: "Snapchat", google: "Google", other: "Other or direct" };
const DEVICE_LABEL: Record<string, string> = { phone: "Phone", computer: "Computer", tablet: "Tablet" };

/** A tracked address for one link: taps on it count even when it's shared outside the link page. */
export const trackedUrl = (page: string, id: number, src: string) => `${page}?go=${id}&s=${encodeURIComponent(src)}`;

/* ---------- add / edit one link ---------- */
type Draft = Partial<LinkItem> & { title: string; url: string };
export function LinkModal({ link, groups, onClose, deal }: { link: Draft | null; groups: string[]; onClose: () => void; deal?: Deal }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [f, setF] = useState<Draft>(link || { title: "", url: "" });
  if (!link) return null;
  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) => setF((x) => ({ ...x, [k]: v }));
  const kind = f.kind || "link";
  const fixed = kind === "social" || kind === "email";
  return (
    <Modal open onClose={onClose} title={deal ? `Tracked link for ${deal.brand}` : link.id ? "Edit link" : "Add a link"}>
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run("save", () => s.saveLink({ ...f, kind }), link.id ? "Link saved" : "Link added");
          if (ok) onClose();
        }}
      >
        <Field label="Name on the button">
          <Input value={f.title} onChange={(e) => set("title")(e.target.value)} maxLength={80} required placeholder={deal ? `${deal.brand} fall picks` : "e.g. My camel coat"} />
        </Field>
        <Field label={kind === "email" ? "Email address" : "Web address"} hint={kind === "email" ? undefined : "Paste the full link, for example your ShopMy product link."}>
          <Input value={f.url.replace(/^mailto:/, "")} onChange={(e) => set("url")(e.target.value)} maxLength={600} required inputMode={kind === "email" ? "email" : "url"} placeholder={kind === "email" ? "you@example.com" : "https://"} />
        </Field>
        {!fixed && kind !== "featured" ? (
          <Field label="Small line under the name (optional)">
            <Input value={f.note || ""} onChange={(e) => set("note")(e.target.value)} maxLength={120} placeholder="e.g. Everything I wore this fall" />
          </Field>
        ) : null}
        {kind === "link" || kind === "deal" ? (
          <Field label="Section (optional)" hint="Links with the same section sit together, like “Shop my faves” or “NYC spots”.">
            <Input value={f.grp || ""} onChange={(e) => set("grp")(e.target.value)} maxLength={40} list="mts-link-groups" placeholder="Shop my faves" />
            <datalist id="mts-link-groups">
              {groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
        ) : null}
        {kind === "link" || kind === "featured" || kind === "deal" ? (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 size-4 accent-[var(--chart-1)]" checked={!!f.sponsored || kind === "deal"} disabled={kind === "deal"} onChange={(e) => set("sponsored")(e.target.checked)} />
            <span>
              <span className="font-medium">Paid partnership</span>
              <span className="text-muted-foreground block text-xs">Shows an “Ad” label on the button. Always on for brand deals.</span>
            </span>
          </label>
        ) : null}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4 accent-[var(--chart-1)]" checked={f.active !== false} onChange={(e) => set("active")(e.target.checked)} />
          <span>
            <span className="font-medium">Show on my link page</span>
            <span className="text-muted-foreground block text-xs">Hidden links stay saved, and their tracked link still works.</span>
          </span>
        </label>
        <Button type="submit" className="h-11 rounded-full" disabled={busy === "save"}>
          {busy === "save" ? <Spinner /> : null} Save
        </Button>
      </form>
    </Modal>
  );
}

/* ---------- Brands tab: manage the page ---------- */
function Row({ x, first, last, onMove, onEdit, page }: { x: LinkItem; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onEdit: () => void; page: string }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  return (
    <li className={cn("bg-background/70 border-border grid gap-2 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center", !x.active && "opacity-70")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{x.title}</span>
          {x.kind !== "link" ? <Pill>{KIND_LABEL[x.kind]}</Pill> : null}
          {x.grp ? <Pill>{x.grp}</Pill> : null}
          {x.sponsored ? <Pill tone="warn">Ad</Pill> : null}
          {!x.active ? <Pill>Hidden</Pill> : null}
        </div>
        <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-xs">
          <span className="truncate">{host(x.url)}</span>
          <span className="tabular-nums">{nf.format(x.taps_30d)} taps · 30 days</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-0.5">
        <Button size="icon-xs" variant="ghost" disabled={first} onClick={() => onMove(-1)} aria-label={`Move ${x.title} up`}>
          <AltArrowUp className="size-4" />
        </Button>
        <Button size="icon-xs" variant="ghost" disabled={last} onClick={() => onMove(1)} aria-label={`Move ${x.title} down`}>
          <AltArrowDown className="size-4" />
        </Button>
        <Button size="icon-xs" variant="ghost" onClick={onEdit} aria-label={`Edit ${x.title}`}>
          <PenNew className="size-4" />
        </Button>
        <Button size="icon-xs" variant="ghost" disabled={!!busy} onClick={() => void run("vis", () => s.saveLink({ ...x, active: !x.active }), x.active ? "Hidden from your page" : "Back on your page")} aria-label={x.active ? `Hide ${x.title}` : `Show ${x.title}`}>
          {busy === "vis" ? <Spinner className="size-3" /> : x.active ? <Eye className="size-4" /> : <EyeClosed className="size-4" />}
        </Button>
        {x.kind === "link" || x.kind === "deal" || x.kind === "featured" ? <CopyButton text={trackedUrl(page, x.id, "share")} label="Tracked link" size="xs" variant="ghost" /> : null}
        {confirm ? (
          <>
            <Button size="xs" variant="destructive" className="rounded-full px-2.5" disabled={!!busy} onClick={() => void run("rm", () => s.removeLink(x.id), "Link removed")}>
              Remove
            </Button>
            <Button size="xs" variant="ghost" className="rounded-full px-2" onClick={() => setConfirm(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button size="icon-xs" variant="ghost" onClick={() => setConfirm(true)} aria-label={`Remove ${x.title}`}>
            <Trash className="size-4" />
          </Button>
        )}
      </div>
    </li>
  );
}

export function LinkPagePanel() {
  const s = useStudio();
  const toast = useToast();
  const { busy, run } = useAction();
  const L: LinksData | null | undefined = s.d?.links;
  const page = L?.page_url || LINK_PAGE_URL;
  const [edit, setEdit] = useState<Draft | null>(null);
  const [bio, setBio] = useState(L?.bio || "");
  const latest = s.d?.stats?.recent?.[0];
  if (!L) {
    return (
      <Panel eyebrow="My link page" pattern="lines" className="lg:col-span-6" action={<LinkIcon className="text-chart-1 size-5" />}>
        <Empty>Your link page is loading. Refresh in a moment.</Empty>
      </Panel>
    );
  }
  const featured = L.items.filter((x) => x.kind === "featured");
  const main = L.items.filter((x) => x.kind !== "featured" && x.kind !== "deal");
  const groups = [...new Set(L.items.map((x) => x.grp).filter(Boolean))];
  const move = (list: LinkItem[], i: number, d: -1 | 1) => {
    const ids = L.items.map((x) => x.id);
    const a = list[i], b = list[i + d];
    if (!a || !b) return;
    const ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
    [ids[ia], ids[ib]] = [ids[ib], ids[ia]];
    void s.reorderLinks(ids).catch(() => toast("Could not save the new order. Refresh and try again.", "err"));
  };

  return (
    <Panel eyebrow="My link page" pattern="lines" className="lg:col-span-6" action={<LinkIcon className="text-chart-1 size-5" />}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div className="grid content-start gap-3">
          <p className="text-sm">
            The page for your TikTok bio. Every visit and tap is counted here in the Studio. No cookies, no names, nothing personal.
          </p>
          <div className="bg-muted/50 flex flex-wrap items-center gap-2 rounded-lg p-3">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{page.replace(/^https:\/\//, "")}</span>
            <CopyButton text={`${page}?s=tiktok`} label="Copy bio link" size="xs" variant="default" />
            <Button size="xs" variant="outline" className="rounded-full px-2.5" asChild>
              <a href={page} target="_blank" rel="noopener noreferrer">
                Open <ArrowRightUp className="size-3.5" />
              </a>
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">In TikTok: Profile → Edit profile → Website, paste the bio link. For Instagram, use {page.replace(/^https:\/\//, "")}?s=instagram so taps are split by app.</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void run("bio", () => s.saveLinkSettings({ link_bio: bio.trim() }), "Bio saved");
            }}
          >
            <Field label="Bio line on the page" className="flex-1">
              <Input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={120} placeholder="Brooklyn · NYC · Fashion and fun" />
            </Field>
            <Button type="submit" size="sm" variant="outline" className="self-end rounded-full px-3" disabled={busy === "bio" || bio.trim() === L.bio}>
              {busy === "bio" ? <Spinner /> : null} Save
            </Button>
          </form>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Link page colors</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Link page colors">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={(L.theme || "pop") === p.id}
                  disabled={busy === "theme"}
                  onClick={() => void run("theme", () => s.saveLinkSettings({ link_theme: p.id }), `Link page set to ${p.label}`)}
                  className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm", (L.theme || "pop") === p.id ? "border-primary font-semibold" : "border-border")}
                >
                  <span className="flex -space-x-1">
                    {p.swatches.slice(0, 4).map((c) => (
                      <span key={c} className="ring-background size-3 rounded-full ring-2" style={{ background: c }} />
                    ))}
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--chart-1)]"
              checked={L.kit_show}
              disabled={busy === "kit"}
              onChange={(e) => void run("kit", () => s.saveLinkSettings({ kit_show_links: e.target.checked }), e.target.checked ? "Link taps will show on your media kit" : "Link taps hidden from your media kit")}
            />
            <span>
              <span className="font-medium">Show link taps on my media kit</span>
              <span className="text-muted-foreground block text-xs">Appears once your page has 20 or more visits in 30 days.</span>
            </span>
          </label>
        </div>

        <div className="grid content-start gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">From my latest video</h3>
              <Button size="xs" variant="outline" className="rounded-full px-2.5" onClick={() => setEdit({ title: "", url: "", kind: "featured", video_id: latest?.id || "" })}>
                <AddCircle className="size-3.5" /> Add
              </Button>
            </div>
            {featured.length ? (
              <ul className="grid gap-2">
                {featured.map((x, i) => (
                  <Row key={x.id} x={x} page={page} first={i === 0} last={i === featured.length - 1} onMove={(d) => move(featured, i, d)} onEdit={() => setEdit(x)} />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Add what's in your newest video (the outfit, the café, the product). The page shows it right under your video, and those taps count for that video.</p>
            )}
            {featured.some((x) => x.video_id && latest && x.video_id !== latest.id) ? (
              <p className="text-xs text-amber-800 dark:text-amber-300">
                You've posted since. These links still show with your older video; edit or hide them when your newest video needs its own.
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Links and buttons</h3>
              <Button size="xs" className="rounded-full px-2.5" onClick={() => setEdit({ title: "", url: "", kind: "link", grp: groups[0] || "" })}>
                <AddCircle className="size-3.5" /> Add link
              </Button>
            </div>
            {main.length ? (
              <ul className="grid gap-2">
                {main.map((x, i) => (
                  <Row key={x.id} x={x} page={page} first={i === 0} last={i === main.length - 1} onMove={(d) => move(main, i, d)} onEdit={() => setEdit(x)} />
                ))}
              </ul>
            ) : (
              <Empty>No links yet. Add your ShopMy link first.</Empty>
            )}
          </div>
        </div>
      </div>
      {edit ? <LinkModal key={edit.id || "new"} link={edit} groups={groups} onClose={() => setEdit(null)} /> : null}
    </Panel>
  );
}

/* ---------- Brands tab: tracked links on a deal card ---------- */
export function DealLinks({ deal }: { deal: Deal }) {
  const s = useStudio();
  const L = s.d?.links;
  const [edit, setEdit] = useState<Draft | null>(null);
  if (!L) return null;
  const mine = L.items.filter((x) => x.kind === "deal" && x.deal_id === deal.id);
  const groups = [...new Set(L.items.map((x) => x.grp).filter(Boolean))];
  return (
    <div className="grid gap-1.5">
      {mine.map((x) => (
        <div key={x.id} className="bg-muted/50 flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs">
          <span className="w-full min-w-0 truncate font-medium sm:w-auto sm:flex-1">{x.title}</span>
          <span className="tabular-nums">{nf.format(x.taps_90d)} taps</span>
          {!x.active ? <Pill>Hidden</Pill> : null}
          <CopyButton text={trackedUrl(L.page_url, x.id, "deal")} label="Copy" size="xs" variant="ghost" />
          <button type="button" className="underline" onClick={() => setEdit(x)}>
            Edit
          </button>
        </div>
      ))}
      <button type="button" className="text-primary dark:text-chart-1 justify-self-start text-sm font-medium hover:underline" onClick={() => setEdit({ title: `${deal.brand}`, url: "", kind: "deal", deal_id: deal.id, sponsored: true, grp: "Partnerships" })}>
        {mine.length ? "+ Another tracked link" : "Make a tracked link"}
      </button>
      {edit ? <LinkModal key={edit.id || "new"} link={edit} groups={groups} deal={deal} onClose={() => setEdit(null)} /> : null}
    </div>
  );
}

/* ---------- Insights tab: link clicks ---------- */
function DailyBars({ rows }: { rows: { day: string; visits: number; taps: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]" role="img" aria-label={`Visits per day for the last ${rows.length} days`}>
        {rows.map((r) => (
          <div key={r.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${dayFmt.format(new Date(r.day + "T12:00:00Z"))}: ${r.visits} visits, ${r.taps} taps`}>
            <div className="bg-chart-1/25 flex flex-col justify-end overflow-hidden rounded-t-sm" style={{ height: `${(r.visits / max) * 100}%`, minHeight: r.visits ? 3 : 0 }}>
              <div className="bg-chart-1 w-full" style={{ height: r.visits ? `${Math.min(100, (r.taps / Math.max(1, r.visits)) * 100)}%` : 0 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="text-muted-foreground mt-1.5 flex justify-between text-[11px]">
        <span>{rows[0] ? dayFmt.format(new Date(rows[0].day + "T12:00:00Z")) : ""}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="bg-chart-1/25 inline-block size-2.5 rounded-sm" /> Visits
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-chart-1 inline-block size-2.5 rounded-sm" /> Share that tapped
          </span>
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}

function Split({ title, rows, labels }: { title: string; rows: { name: string; n: number }[]; labels: Record<string, string> }) {
  const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  return (
    <div className="grid gap-1.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length ? (
        rows.slice(0, 5).map((r) => (
          <div key={r.name} className="grid grid-cols-[116px_minmax(0,1fr)_40px] items-center gap-2 text-sm">
            <span className="truncate">{labels[r.name] || r.name}</span>
            <span className="bg-muted block h-2 overflow-hidden rounded-full">
              <span className="bg-chart-1/70 block h-full rounded-full" style={{ width: `${(r.n / total) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{Math.round((r.n / total) * 100)}%</span>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-sm">No visits yet.</p>
      )}
    </div>
  );
}

export function LinkClicksPanels() {
  const s = useStudio();
  const L = s.d?.links;
  if (!L) return null;
  const st = L.stats;
  const page = L.page_url;
  if (!st.has_data) {
    return (
      <Panel eyebrow="Link clicks" pattern="lines" className="lg:col-span-6" action={<LinkIcon className="text-chart-1 size-5" />}>
        <p className="max-w-[65ch] text-sm">Counting starts as soon as your link page is in your TikTok bio. Then you'll see visits, taps, which links win, and how many people each video sends to your links.</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={`${page}?s=tiktok`} label="Copy bio link" />
          <Button size="sm" variant="outline" className="rounded-full px-3" onClick={() => s.goto("brands")}>
            Set up my links
          </Button>
        </div>
      </Panel>
    );
  }
  const rate = st.w30.visits ? Math.round((st.w30.tappers / st.w30.visits) * 100) : 0;
  const diff = st.w7.visits - st.prev7.visits;
  const maxTop = Math.max(1, ...st.top.map((t) => t.taps));
  const posts = st.after_post;
  return (
    <>
      <Panel eyebrow="Link clicks" pattern="lines" className="lg:col-span-4" action={<LinkIcon className="text-chart-1 size-5" />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Visits · 7 days" value={nf.format(st.w7.visits)} />
          <Stat label="Taps · 7 days" value={nf.format(st.w7.taps)} />
          <Stat label="Visits · 30 days" value={nf.format(st.w30.visits)} />
          <Stat label="Tapped a link" value={`${rate}%`} />
        </div>
        {st.prev7.visits || st.w7.visits ? (
          <p className="text-muted-foreground text-sm">
            {diff === 0 ? "Same visits as the week before." : `${diff > 0 ? "+" : "−"}${nf.format(Math.abs(diff))} visits vs. the week before.`}
            {L.tracking_since ? ` Counting since ${when(L.tracking_since)}.` : ""}
          </p>
        ) : null}
        <DailyBars rows={st.daily} />
      </Panel>

      <Panel eyebrow="Top links · 30 days" pattern="dots" className="lg:col-span-2">
        {st.top.length ? (
          <ul className="grid gap-2">
            {st.top.map((t) => (
              <li key={t.id} className="grid gap-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium">{t.title}</span>
                  <span className="tabular-nums">{nf.format(t.taps)}</span>
                </div>
                <span className="bg-muted block h-1.5 overflow-hidden rounded-full">
                  <span className="bg-chart-1/70 block h-full rounded-full" style={{ width: `${(t.taps / maxTop) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Visits but no taps yet.</Empty>
        )}
      </Panel>

      <Panel eyebrow="Taps after each post" pattern="wave" className="lg:col-span-4">
        {posts.length ? (
          <>
            <ul className="grid gap-1.5">
              {posts.map((p) => (
                <li key={p.id} className="border-border grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-2.5">
                  <span className="min-w-0">
                    <span className="line-clamp-1 text-sm font-medium">{p.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {when(p.posted_at)} · {nf.format(p.visits)} visits
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold tabular-nums">{nf.format(p.taps)}</span>
                    {p.partial ? <Pill>Still counting</Pill> : p.ratio != null ? <Pill tone={p.ratio >= 2 ? "ok" : p.ratio >= 1 ? "accent" : "muted"}>{p.ratio}× usual</Pill> : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">Taps on your page in the 24 hours after each post, compared with a normal day ({st.base_per_day} taps). TikTok doesn't say which video someone came from, so this is an estimate from timing. Links in the latest video spot are counted exactly.</p>
          </>
        ) : (
          <Empty>Your next post will show here with the taps it brought in.</Empty>
        )}
      </Panel>

      <Panel eyebrow="Who's visiting · 30 days" pattern="dots" className="lg:col-span-2">
        <Split title="Came from" rows={st.apps} labels={APP_LABEL} />
        <Split title="Device" rows={st.devices} labels={DEVICE_LABEL} />
        <p className="text-muted-foreground text-xs">From the browser each visit used. No names or personal details are kept.</p>
      </Panel>
    </>
  );
}
