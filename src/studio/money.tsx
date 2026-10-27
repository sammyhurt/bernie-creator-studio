import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import DocumentText from "@iconify-react/solar/document-text-linear";
import HandMoney from "@iconify-react/solar/hand-money-linear";
import TrashBin from "@iconify-react/solar/trash-bin-trash-linear";
import Upload from "@iconify-react/solar/upload-linear";
import UsersGroup from "@iconify-react/solar/users-group-rounded-linear";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { CopyButton, Field, NativeSelect, Pill, Spinner, useAction, useToast } from "./bits";
import { engine, useEngine, type BrandLead, type EarnKind, type Earning } from "./engine";
import { compact, n, shortDate } from "./insights";
import { useStudio } from "./store";
import { Empty, Panel, Skeleton, Stat } from "./ui";

const usd = (v: number, cents = false) => (v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
const r5 = (v: number) => Math.round(v / 5) * 5;
const KIND_LABEL: Record<EarnKind, string> = { deal: "Brand deal", affiliate: "Affiliate", creator_rewards: "Creator Rewards", gift: "Gifted (value)", other: "Other" };
const KINDS = Object.keys(KIND_LABEL) as EarnKind[];

/* ---------- rate card ---------- */
export function RateCardPanel() {
  const e = useEngine();
  const { busy, run } = useAction();
  const r = e.data?.rate;
  const [low, setLow] = useState<string | null>(null);
  const [high, setHigh] = useState<string | null>(null);
  const [min, setMin] = useState<string | null>(null);
  const L = Number(low ?? r?.rate_low ?? 8) || 0, H = Number(high ?? r?.rate_high ?? 16) || 0, MIN = Number(min ?? r?.rate_min ?? 50) || 0;
  const views = r?.views || 0;
  const vLow = Math.max(MIN, r5((views / 1000) * L)), vHigh = Math.max(MIN, r5((views / 1000) * H));
  const floored = views && (views / 1000) * H < MIN;
  const changed = low !== null || high !== null || min !== null;
  const line = `My rate for one TikTok is ${vLow === vHigh ? usd(vLow) : `${usd(vLow)}–${usd(vHigh)}`}, based on my typical ${compact(views)} views per video. Usage rights, whitelisting and bundles are priced separately.`;
  return (
    <Panel eyebrow="Your rate card" pattern="dots" className="lg:col-span-3" action={<HandMoney className="text-chart-1 size-5" />}>
      {!e.data ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          <div className="bg-primary text-primary-foreground rounded-xl p-4">
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase opacity-80">One TikTok, today</div>
            <div className="font-display mt-1 text-4xl font-semibold tracking-tighter tabular-nums">{vLow === vHigh ? usd(vLow) : `${usd(vLow)}–${usd(vHigh)}`}</div>
            <div className="mt-1 text-sm opacity-85">
              {views ? `From your typical ${n(views)} views (last 30 days, one-off viral posts left out).` : "Fills in once a few recent posts are scored."}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Low $ / 1K views">
              <Input inputMode="decimal" value={low ?? String(r?.rate_low ?? 8)} onChange={(ev) => setLow(ev.target.value.replace(/[^0-9.]/g, ""))} />
            </Field>
            <Field label="High $ / 1K views">
              <Input inputMode="decimal" value={high ?? String(r?.rate_high ?? 16)} onChange={(ev) => setHigh(ev.target.value.replace(/[^0-9.]/g, ""))} />
            </Field>
            <Field label="Minimum $">
              <Input inputMode="decimal" value={min ?? String(r?.rate_min ?? 50)} onChange={(ev) => setMin(ev.target.value.replace(/[^0-9.]/g, ""))} />
            </Field>
          </div>
          {floored ? <p className="text-muted-foreground text-sm">Your minimum sets the price right now. As your typical views grow, the range moves up on its own.</p> : null}
          <div className="flex flex-wrap gap-2">
            {changed ? (
              <Button
                size="sm"
                className="rounded-full"
                disabled={!!busy || !L || !H || H < L}
                onClick={() =>
                  void run("rate", async () => {
                    await engine.rate(L, H, MIN);
                    setLow(null);
                    setHigh(null);
                    setMin(null);
                  }, "Rate card saved")
                }
              >
                {busy ? <Spinner /> : null} Save rates
              </Button>
            ) : null}
            <CopyButton text={line} label="Copy rate line for a pitch" />
          </div>
          <p className="text-muted-foreground text-xs">
            A starting point, not a promise. Ask for more when a brand wants to use your video in their ads, wants exclusivity, or wants several posts. Gifted-only offers are fine to turn down.
          </p>
        </>
      )}
    </Panel>
  );
}

/* ---------- brand radar ---------- */
function LeadCard({ b }: { b: BrandLead }) {
  const s = useStudio();
  const { busy, run } = useAction();
  return (
    <div className="bg-background/70 border-border grid content-start gap-2 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{b.brand}</h3>
          <p className="text-muted-foreground truncate text-xs">
            {b.handle ? `@${b.handle} · ` : ""}
            {b.posts} sponsored post{b.posts === 1 ? "" : "s"} in the last 6 weeks
          </p>
        </div>
        {b.category ? <Pill tone="accent" className="capitalize">{b.category}</Pill> : null}
      </div>
      {b.seen_with.length ? <p className="text-sm">Working with {b.seen_with.slice(0, 4).join(", ")}</p> : null}
      {b.fit ? <p className="text-muted-foreground text-sm">{b.fit}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {b.status === "added" ? (
          <Pill tone="ok">In your deal tracker</Pill>
        ) : (
          <>
            <Button
              size="sm"
              className="rounded-full"
              disabled={!!busy}
              onClick={() =>
                void run("add", async () => {
                  const deal = await s.saveDeal({ brand: b.brand, status: "Idea", notes: `Found on brand radar: working with ${b.seen_with.slice(0, 4).join(", ") || "creators like you"}.${b.example_url ? " Example: " + b.example_url : ""}` });
                  await engine.lead(b.id, "added", deal.id);
                }, "Added to your deal tracker")
              }
            >
              {busy === "add" ? <Spinner /> : null} Add to deals
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" disabled={!!busy} onClick={() => void run("skip", () => engine.lead(b.id, "skip"), "Hidden")}>
              Not a fit
            </Button>
          </>
        )}
        {b.example_url ? (
          <a href={b.example_url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-chart-1 inline-flex items-center gap-1 text-sm font-medium hover:underline">
            See the post <ArrowRightUp className="size-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function BrandRadarPanel() {
  const e = useEngine();
  const [all, setAll] = useState(false);
  const leads = (e.data?.brands || []).filter((b) => b.status !== "skip");
  const fresh = leads.filter((b) => b.status === "new");
  const shown = all ? leads : fresh.slice(0, 6);
  return (
    <Panel eyebrow={`Brand radar${fresh.length ? ` · ${fresh.length} new` : ""}`} pattern="wave" className="lg:col-span-6" action={<UsersGroup className="text-chart-1 size-5" />}>
      <p className="text-muted-foreground max-w-[75ch] text-sm">
        Brands seen in sponsored, gifted or partner posts by your inspiration creators and NYC menswear creators, from their public posts. That shows a collaboration, not what was paid. Checked every Sunday. Contact details are never collected: use the brand's own partnerships page or email, then the Pitch writer above.
      </p>
      {!e.data ? (
        <Skeleton className="h-40" />
      ) : shown.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((b) => (
            <LeadCard key={b.id} b={b} />
          ))}
        </div>
      ) : (
        <Empty>{leads.length ? "You've gone through every new brand. More arrive Sunday." : "The first brand radar arrives after Sunday's research run."}</Empty>
      )}
      {leads.length > shown.length || all ? (
        <button type="button" className="text-muted-foreground justify-self-start text-sm hover:underline" onClick={() => setAll(!all)}>
          {all ? "Show only new" : `Show all ${leads.length}`}
        </button>
      ) : null}
    </Panel>
  );
}

/* ---------- earnings ---------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toYmd = (raw: string): string => {
  const t = raw.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  const d = Date.parse(t);
  return Number.isFinite(d) ? new Date(d).toISOString().slice(0, 10) : "";
};
const money = (raw: string) => {
  const neg = /^\(.*\)$/.test(raw.trim()) || /^-/.test(raw.trim());
  const v = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) ? (neg ? -v : v) : 0;
};
/** Splits a CSV line, honoring quotes. */
const cells = (line: string, sep: string) => {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === sep && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
};
export function parseEarningsCsv(text: string): { rows: Partial<Earning>[]; cols: { date: string; amount: string; source: string; note: string; ref: string } | null } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], cols: null };
  const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ";" : lines[0].includes("\t") ? "\t" : ",";
  const head = cells(lines[0], sep).map((h) => h.toLowerCase());
  const find = (re: RegExp, not?: RegExp) => head.findIndex((h) => re.test(h) && !(not && not.test(h)));
  const di = find(/date|day|paid|time|period/);
  const ai = find(/amount|earning|revenue|payout|commission|total|income|net|usd|\$/, /rate|count|clicks|orders|items|qty/);
  const si = find(/brand|source|merchant|program|platform|store|advertiser|retailer/);
  const ni = find(/note|description|product|item|title|name/);
  const ri = find(/transaction|reference|\bref\b|order id|order_id|order number|payment id|payout id|invoice|\bid\b/, /video|product|item|sku/);
  if (di < 0 || ai < 0) return { rows: [], cols: null };
  const rows = lines.slice(1, 501).map((l) => cells(l, sep)).map((c) => ({ date: toYmd(c[di] || ""), amount: money(c[ai] || ""), source: si >= 0 ? (c[si] || "").slice(0, 60) : "", note: ni >= 0 ? (c[ni] || "").slice(0, 200) : "", ref: ri >= 0 ? (c[ri] || "").slice(0, 80) : "" })).filter((r) => r.date && r.amount);
  return { rows, cols: { date: head[di], amount: head[ai], source: si >= 0 ? head[si] : "", note: ni >= 0 ? head[ni] : "", ref: ri >= 0 ? head[ri] : "" } };
}

function CsvImport() {
  const toast = useToast();
  const { busy, run } = useAction();
  const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseEarningsCsv> | null>(null);
  const [source, setSource] = useState("");
  const [kind, setKind] = useState<EarnKind>("affiliate");
  const total = parsed ? parsed.rows.reduce((a, r) => a + (r.amount || 0), 0) : 0;
  return (
    <div className="grid gap-3">
      <input
        ref={file}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Choose a CSV file"
        onChange={async (ev) => {
          const f = ev.target.files?.[0];
          if (!f) return;
          if (f.size > 2_000_000) {
            toast("That file is over 2 MB. Export a shorter date range.", "err");
            return;
          }
          const p = parseEarningsCsv(await f.text());
          setName(f.name);
          setParsed(p);
          if (!p.cols) toast("Couldn't find a date and an amount column in that file.", "err");
          ev.target.value = "";
        }}
      />
      <Button variant="outline" className="justify-self-start rounded-full" onClick={() => file.current?.click()}>
        <Upload className="size-4" /> Upload a CSV
      </Button>
      <p className="text-muted-foreground text-xs">Works with exports from ShopMy, Amazon Associates, LTK, TikTok Creator Rewards or a simple sheet with a date and an amount column. Nothing leaves your Studio.</p>
      {parsed && parsed.cols ? (
        <div className="border-chart-1/30 bg-chart-1/5 grid gap-3 rounded-xl border p-4">
          <p className="text-sm">
            <span className="font-semibold">{name}:</span> {parsed.rows.length} rows, {usd(total, true)} total. Using “{parsed.cols.date}” for the date and “{parsed.cols.amount}” for the amount
            {parsed.cols.source ? `, “${parsed.cols.source}” for the source` : ""}
            {parsed.cols.ref ? `, “${parsed.cols.ref}” to spot payments already added` : ""}.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Where it came from" hint={parsed.cols.source ? "Only used where the file has no source." : undefined}>
              <Input value={source} onChange={(ev) => setSource(ev.target.value)} placeholder="ShopMy" maxLength={60} />
            </Field>
            <Field label="Type">
              <NativeSelect value={kind} onChange={(v) => setKind(v as EarnKind)} options={KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))} ariaLabel="Type of earning" />
            </Field>
          </div>
          <ul className="text-muted-foreground grid gap-1 text-xs">
            {parsed.rows.slice(0, 4).map((r, i) => (
              <li key={i} className="tabular-nums">
                {r.date} · {usd(r.amount || 0, true)} {r.source ? `· ${r.source}` : ""} {r.note ? `· ${r.note.slice(0, 50)}` : ""}
              </li>
            ))}
            {parsed.rows.length > 4 ? <li>…and {parsed.rows.length - 4} more</li> : null}
          </ul>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={!!busy || !parsed.rows.length}
              onClick={() =>
                void run("import", async () => {
                  const { added, skipped } = await engine.addEarnings(parsed.rows.map((r) => ({ ...r, source: r.source || source.trim() || "Import", kind })), (name.replace(/[^a-z0-9]/gi, "").slice(0, 24) || "csv") + Date.now().toString(36));
                  toast(added ? `${added} added${skipped ? `, ${skipped} already there` : ""}` : `All ${skipped} rows were already in your earnings`);
                  setParsed(null);
                })
              }
            >
              {busy === "import" ? <Spinner /> : null} Add {parsed.rows.length} rows
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setParsed(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AddEarning() {
  const e = useEngine();
  const toast = useToast();
  const { busy, run } = useAction();
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, source: "", amount: "", kind: "deal" as EarnKind, video_id: "", note: "" });
  const posts = e.data?.posts || [];
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!money(f.amount)) return;
        void run("add", async () => {
          const row = { ...f, amount: money(f.amount), source: f.source.trim() || "Manual" };
          let r = await engine.addEarnings([row]);
          if (!r.added && window.confirm("You already have a payment with the same date, amount and source. Add this one as a separate payment?")) r = await engine.addEarnings([row], "", true);
          setF({ ...f, source: "", amount: "", note: "", video_id: "" });
          toast(r.added ? "Added" : "Not added, it was already in your earnings");
        });
      }}
    >
      <Field label="Amount">
        <Input inputMode="decimal" value={f.amount} onChange={(ev) => setF({ ...f, amount: ev.target.value })} placeholder="$250" required />
      </Field>
      <Field label="Date">
        <Input type="date" value={f.date} onChange={(ev) => setF({ ...f, date: ev.target.value })} required />
      </Field>
      <Field label="From">
        <Input value={f.source} onChange={(ev) => setF({ ...f, source: ev.target.value })} placeholder="Brand or program" maxLength={60} />
      </Field>
      <Field label="Type">
        <NativeSelect value={f.kind} onChange={(v) => setF({ ...f, kind: v as EarnKind })} options={KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))} ariaLabel="Type" />
      </Field>
      <Field label="Which video (optional)" className="sm:col-span-2" hint="Link money to a video to see which videos actually earn.">
        <NativeSelect value={f.video_id} onChange={(v) => setF({ ...f, video_id: v })} options={[{ value: "", label: "Not tied to one video" }, ...posts.slice(0, 40).map((p) => ({ value: p.video_id, label: `${shortDate(p.posted_at)} · ${(p.title || "Untitled").slice(0, 60)}` }))]} ariaLabel="Video" />
      </Field>
      <Button type="submit" className="rounded-full sm:col-span-2" disabled={!!busy || !money(f.amount)}>
        {busy ? <Spinner /> : null} Add earning
      </Button>
    </form>
  );
}

export function EarningsPanel() {
  const e = useEngine();
  const { busy, run } = useAction();
  const [mode, setMode] = useState<"none" | "add" | "csv">("none");
  const [all, setAll] = useState(false);
  const er = e.data?.earnings;
  const months = useMemo(() => {
    const now = new Date();
    return [...Array(6)].map((_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
      const k = d.toISOString().slice(0, 7);
      return { k, label: MONTHS[d.getUTCMonth()], v: er?.by_month[k] || 0 };
    });
  }, [er]);
  const max = Math.max(1, ...months.map((m) => m.v));
  const thisMonth = months[5]?.v || 0, lastMonth = months[4]?.v || 0;
  const rows = er?.rows || [];
  return (
    <Panel eyebrow="Earnings" pattern="lines" className="lg:col-span-3" action={<span className="text-muted-foreground text-xs">Private to you</span>}>
      {!e.data ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="This month" value={usd(thisMonth)} />
            <Stat label="Last month" value={usd(lastMonth)} />
            <Stat label="All time" value={usd(er?.total || 0)} />
          </div>
          <div className="flex h-28 items-end gap-2" role="img" aria-label={`Earnings by month: ${months.map((m) => `${m.label} ${usd(m.v)}`).join(", ")}`}>
            {months.map((m) => (
              <div key={m.k} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-muted-foreground text-[10px] tabular-nums">{m.v ? usd(m.v) : ""}</span>
                <div className={cn("w-full rounded-t-md", m.v ? "bg-chart-1" : "bg-muted")} style={{ height: `${Math.max(4, (m.v / max) * 72)}px` }} />
                <span className="text-muted-foreground text-[11px]">{m.label}</span>
              </div>
            ))}
          </div>
          {er?.videos.length ? (
            <div className="grid gap-1.5">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">Videos that earned</span>
              {er.videos.slice(0, 4).map((v) => (
                <div key={v.video_id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{v.title || "Untitled"}</span>
                  <span className="shrink-0 tabular-nums">
                    {usd(v.amount)} <span className="text-muted-foreground text-xs">{v.per_1k ? `· ${usd(v.per_1k, true)}/1K views` : ""}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={mode === "add" ? "secondary" : "outline"} className="rounded-full" onClick={() => setMode(mode === "add" ? "none" : "add")}>
              Add one
            </Button>
            <Button size="sm" variant={mode === "csv" ? "secondary" : "outline"} className="rounded-full" onClick={() => setMode(mode === "csv" ? "none" : "csv")}>
              Import a CSV
            </Button>
          </div>
          {mode === "add" ? <AddEarning /> : mode === "csv" ? <CsvImport /> : null}
          {rows.length ? (
            <ul className="grid gap-1">
              {(all ? rows : rows.slice(0, 5)).map((r, i) => (
                <li key={r.id || "d" + r.deal_id + i} className="flex items-center justify-between gap-3 border-b py-1.5 text-sm last:border-0">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.source || KIND_LABEL[r.kind]}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.date} · {KIND_LABEL[r.kind]}
                      {r.note ? ` · ${r.note.slice(0, 40)}` : ""}
                      {r.matched_deal ? " · counts as your Paid deal" : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 tabular-nums">
                    {usd(r.amount, true)}
                    {r.id ? (
                      <Button size="icon-xs" variant="ghost" aria-label={`Remove ${r.source} ${usd(r.amount, true)}`} disabled={!!busy} onClick={() => void run("rm" + r.id, () => engine.removeEarning(r.id), "Removed")}>
                        <TrashBin className="size-3.5" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground w-6 text-center text-[10px]" title="From a deal marked Paid">deal</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Add what you earn from deals, affiliate links and Creator Rewards. Deals you mark Paid count here on their own.</Empty>
          )}
          {rows.length > 5 ? (
            <button type="button" className="text-muted-foreground justify-self-start text-sm hover:underline" onClick={() => setAll(!all)}>
              {all ? "Show less" : `Show all ${rows.length}`}
            </button>
          ) : null}
        </>
      )}
    </Panel>
  );
}

/* ---------- report links ---------- */
export function ReportLinksPanel() {
  const s = useStudio();
  const e = useEngine();
  const toast = useToast();
  const { busy, run } = useAction();
  const [pick, setPick] = useState<Record<number, string>>({});
  const deals = (s.d?.deals || []).filter((d) => ["Signed", "Posted", "Paid"].includes(d.status));
  const posts = e.data?.posts || [];
  const reports = e.data?.reports || [];
  return (
    <Panel eyebrow="Brand reports" pattern="dots" className="lg:col-span-3" action={<DocumentText className="text-chart-1 size-5" />}>
      <p className="text-muted-foreground text-sm">A private link for each brand that shows how their video is doing: views, likes, comments, shares and link taps, updated every 3 hours. It never shows your rate, notes or other deals.</p>
      {!e.data ? (
        <Skeleton className="h-32" />
      ) : deals.length ? (
        <ul className="grid gap-3">
          {deals.map((d) => {
            const rep = reports.find((r) => r.deal_id === d.id);
            const vid = pick[d.id] ?? rep?.video_id ?? "";
            return (
              <li key={d.id} className="bg-background/70 border-border grid gap-2 rounded-xl border p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{d.brand}</span>
                  <Pill>{d.status}</Pill>
                </div>
                <NativeSelect
                  value={vid}
                  onChange={(v) => setPick((p) => ({ ...p, [d.id]: v }))}
                  ariaLabel={`Video made for ${d.brand}`}
                  options={[{ value: "", label: "Pick the video you made for them" }, ...posts.slice(0, 40).map((p) => ({ value: p.video_id, label: `${shortDate(p.posted_at)} · ${(p.title || "Untitled").slice(0, 60)}` }))]}
                />
                <div className="flex flex-wrap gap-2">
                  {rep && rep.video_id === vid ? (
                    <>
                      <CopyButton text={rep.url} label="Copy report link" />
                      <Button size="sm" variant="ghost" className="rounded-full" asChild>
                        <a href={rep.url} target="_blank" rel="noopener noreferrer">
                          Preview <ArrowRightUp className="size-3.5" />
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground rounded-full" disabled={!!busy} onClick={() => void run("off" + d.id, () => engine.reportOff(d.id), "Link turned off. The brand can no longer open it.")}>
                        {busy === "off" + d.id ? <Spinner /> : null} Turn off link
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={!vid || !!busy}
                      onClick={() =>
                        void run("rep" + d.id, async () => {
                          const url = await engine.report(d.id, vid);
                          if (url && navigator.clipboard) {
                            try {
                              await navigator.clipboard.writeText(url);
                              toast("Report link copied");
                              return;
                            } catch {
                              /* fall through */
                            }
                          }
                          toast("Report link ready");
                        })
                      }
                    >
                      {busy === "rep" + d.id ? <Spinner /> : null} {rep ? "Update report link" : "Make report link"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>Once a deal is Signed, Posted or Paid, make a report link for the brand here.</Empty>
      )}
    </Panel>
  );
}
