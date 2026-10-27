import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Field, Modal, NativeSelect, Spinner, useAction } from "./bits";
import type { Checkin, Group, Stats } from "./data";
import { cleanTitle, compact, n, shortDate } from "./insights";
import { useStudio } from "./store";
import { Empty } from "./ui";

/** Which hook types and pillars get him the most views (typical views, so one hit can't skew it). */
export function WinnersTable({ rows, label }: { rows: Group[]; label: string }) {
  const usable = rows.filter((r) => r.posts >= 2);
  if (!usable.length) return <Empty>Not enough tagged videos yet. Tags are added on each trend radar run.</Empty>;
  const max = Math.max(1, ...usable.map((r) => r.median_views));
  return (
    <div className="grid gap-2" role="table" aria-label={label}>
      {usable.slice(0, 7).map((r, i) => (
        <div key={r.name} role="row" className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <span role="cell" className={i === 0 ? "font-semibold" : ""}>
            {r.name}
          </span>
          <span role="cell" className="bg-muted h-2 overflow-hidden rounded-full">
            <span className={i === 0 ? "bg-chart-1 block h-full rounded-full" : "bg-chart-1/40 block h-full rounded-full"} style={{ width: `${(r.median_views / max) * 100}%` }} />
          </span>
          <span role="cell" className="text-muted-foreground text-right text-xs tabular-nums">
            <span className="text-foreground font-semibold">{compact(r.median_views)}</span> typical · {r.posts} videos
          </span>
        </div>
      ))}
    </div>
  );
}

const pct = (v?: number) => (v == null ? "–" : `${Math.round(v)}%`);
const sec = (v?: number) => (v == null ? "–" : `${Math.round(v * 10) / 10}s`);

export function CheckinList({ items }: { items: Checkin[] }) {
  if (!items.length) return <Empty>No check-ins yet. Add one below, or send a TikTok Studio screenshot to the Studio bot on Telegram.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left text-[11px] font-semibold tracking-[0.1em] uppercase">
            <th className="py-2 pr-3 font-semibold">Video</th>
            <th className="py-2 pr-3 text-right font-semibold">Avg watch</th>
            <th className="py-2 pr-3 text-right font-semibold">Watched full</th>
            <th className="py-2 pr-3 text-right font-semibold">New followers</th>
            <th className="py-2 pr-3 text-right font-semibold">For You</th>
            <th className="py-2 text-right font-semibold">Search</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 12).map((c, i) => (
            <tr key={(c.video_id || c.video_title) + i} className="border-border/60 border-b last:border-0">
              <td className="max-w-[260px] py-2 pr-3">
                <span className="block truncate font-medium">{cleanTitle(c.video_title || "Video")}</span>
                <span className="text-muted-foreground text-xs">Checked {shortDate(c.at)}</span>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{sec(c.avg_watch_sec)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{pct(c.watched_full_pct)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{c.new_followers == null ? "–" : n(c.new_followers)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{pct(c.for_you_pct)}</td>
              <td className="py-2 text-right tabular-nums">{pct(c.search_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FIELDS: { k: string; label: string; hint: string }[] = [
  { k: "avg_watch_sec", label: "Average watch time (sec)", hint: "e.g. 6.4" },
  { k: "watched_full_pct", label: "Watched full video (%)", hint: "e.g. 18" },
  { k: "new_followers", label: "New followers", hint: "e.g. 42" },
  { k: "saves", label: "Saves", hint: "e.g. 120" },
  { k: "for_you_pct", label: "For You (%)", hint: "Traffic source" },
  { k: "search_pct", label: "Search (%)", hint: "Traffic source" },
];

export function CheckinModal({ stats, open, onClose }: { stats: Stats; open: boolean; onClose: () => void }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [vid, setVid] = useState(stats.recent[0]?.id || "");
  const [m, setM] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const v = stats.recent.find((x) => x.id === vid);
  return (
    <Modal open={open} onClose={onClose} title="Add a 30-second check-in">
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!v) return;
          const parse = (x: string) => {
            const t = x.trim().toLowerCase().replace(/[,%s\s]/g, "");
            const mm = t.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
            if (!mm) return NaN;
            return Number(mm[1]) * (mm[2] === "k" ? 1000 : mm[2] === "m" ? 1e6 : 1);
          };
          const entries = Object.entries(m).filter(([, x]) => x.trim() !== "").map(([k, x]) => [k, parse(x)] as const);
          const bad = entries.find(([, x]) => !Number.isFinite(x));
          if (bad) {
            setErr(`“${FIELDS.find((f) => f.k === bad[0])?.label}” needs a plain number, like 6.4 or 1,200.`);
            return;
          }
          setErr("");
          const clean = Object.fromEntries(entries);
          if (!Object.keys(clean).length) return;
          const ok = await run("ck", () => s.checkin(v.id, v.title, clean).then(() => true), "Check-in saved");
          if (ok) {
            setM({});
            onClose();
          }
        }}
      >
        <p className="text-muted-foreground text-sm">In TikTok, open the video, tap the three dots, then Analytics. Copy any of these numbers. Leave the rest blank.</p>
        <Field label="Video">
          <NativeSelect value={vid} onChange={setVid} options={stats.recent.slice(0, 20).map((x) => ({ value: x.id, label: `${shortDate(x.posted_at)} · ${cleanTitle(x.title).slice(0, 48)}` }))} ariaLabel="Video" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <Field key={f.k} label={f.label}>
              <Input inputMode="decimal" value={m[f.k] || ""} placeholder={f.hint} onChange={(e) => setM((x) => ({ ...x, [f.k]: e.target.value }))} />
            </Field>
          ))}
        </div>
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        <Button type="submit" className="h-11 rounded-full" disabled={busy === "ck" || !Object.values(m).some((x) => x.trim())}>
          {busy === "ck" ? <Spinner /> : null} Save check-in
        </Button>
      </form>
    </Modal>
  );
}
