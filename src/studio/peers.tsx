import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import Ranking from "@iconify-react/solar/ranking-linear";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Pill, Spinner, useAction } from "./bits";
import { engine, useEngine, type Peer } from "./engine";
import { compact, shortDate } from "./insights";
import { Empty, Panel, Skeleton } from "./ui";

const pct = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v}%`);
const med = (a: number[]) => {
  const y = a.filter((v) => v > 0).sort((p, q) => p - q);
  return y.length ? y[Math.floor(y.length / 2)] : 0;
};

function Row({ p, me = false }: { p: Pick<Peer, "handle" | "followers" | "growth" | "posts_7d" | "median_views" | "views_per_follower"> & Partial<Peer>; me?: boolean }) {
  return (
    <tr className={cn("border-border border-b last:border-0", me && "bg-chart-1/10 font-semibold")}>
      <th scope="row" className="py-2.5 pr-3 text-left font-medium">
        {me ? "You" : p.best_url ? (
          <a href={`https://www.tiktok.com/@${p.handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
            @{p.handle}
          </a>
        ) : (
          "@" + p.handle
        )}
      </th>
      <td className="py-2.5 pr-3 text-right tabular-nums">{compact(p.followers)}</td>
      <td className="py-2.5 pr-3 text-right tabular-nums">{pct(p.growth ?? null)}</td>
      <td className="py-2.5 pr-3 text-right tabular-nums">{p.posts_7d}</td>
      <td className="py-2.5 pr-3 text-right tabular-nums">{compact(p.median_views)}</td>
      <td className="py-2.5 pr-3 text-right tabular-nums">{p.views_per_follower ? (p.views_per_follower < 0.01 ? "<0.01" : p.views_per_follower.toFixed(2)) : "—"}</td>
      <td className="hidden py-2.5 text-left md:table-cell">
        {me ? (
          <span className="text-muted-foreground text-xs font-normal">goal {p.posts_7d >= 3 ? "met" : "3-4 a week"}</span>
        ) : p.best_url ? (
          <a href={p.best_url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-chart-1 inline-flex items-center gap-1 text-sm hover:underline">
            {p.best_format || "Top post"} · {compact(p.best_views || 0)} <ArrowRightUp className="size-3" />
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

export function PeersPanel() {
  const e = useEngine();
  const { busy, run } = useAction();
  const pe = e.data?.peers;
  const list = pe?.list || [];
  const runAt = pe?.run ? shortDate(pe.run.length === 16 ? pe.run + ":00Z" : pe.run) : "";
  const peerMed = med(list.map((p) => p.median_views));
  const peerPace = med(list.map((p) => p.posts_7d));
  return (
    <Panel
      eyebrow={`Your inspiration creators${runAt ? ` · checked ${runAt}` : ""}`}
      pattern="lines"
      className="lg:col-span-6"
      action={
        <Button size="sm" variant="outline" className="rounded-full" disabled={!!busy} onClick={() => void run("r", () => engine.research(), "Research started. Results in about 7 minutes.")}>
          {busy ? <Spinner /> : <Ranking className="size-4" />} Check now
        </Button>
      }
    >
      {!e.data ? (
        <Skeleton className="h-48" />
      ) : list.length && pe ? (
        <>
          {pe.dip ? (
            <p className="rounded-lg bg-amber-500/10 p-3 text-sm">
              <span className="font-semibold">It's not just you.</span> {pe.falling} of the {pe.compared} inspiration creators you follow saw their typical views drop 20% or more since last week. That can point to a slower week on TikTok, but {pe.compared} creators is a small sample, not proof.
            </p>
          ) : null}
          <p className="text-sm">
            They post about <span className="font-semibold">{peerPace}</span> times a week and get <span className="font-semibold">{compact(peerMed)}</span> views on a typical post. You posted{" "}
            <span className="font-semibold">{pe.me.posts_7d}</span> time{pe.me.posts_7d === 1 ? "" : "s"} this week, typical <span className="font-semibold">{compact(pe.me.median_views)}</span>.
            {pe.me.views_per_follower && list.length ? ` Views per follower: you ${pe.me.views_per_follower.toFixed(2)}, them ${med(list.map((p) => p.views_per_follower * 100)) / 100}.` : ""}
          </p>
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-[11px] font-semibold tracking-[0.12em] uppercase">
                  <th scope="col" className="pb-2 text-left font-semibold">Creator</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-semibold">Followers</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-semibold">Week</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-semibold">Posts / 7 d</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-semibold">Typical views</th>
                  <th scope="col" className="pb-2 pr-3 text-right font-semibold">Views / follower</th>
                  <th scope="col" className="hidden pb-2 text-left font-semibold md:table-cell">Best recent post</th>
                </tr>
              </thead>
              <tbody>
                <Row p={{ handle: "you", ...pe.me }} me />
                {list.map((p) => (
                  <Row key={p.handle} p={p} />
                ))}
              </tbody>
            </table>
          </div>
          {pe.rising.length ? (
            <div className="grid gap-2">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">Formats winning for several of them</span>
              <div className="flex flex-wrap gap-2">
                {pe.rising.map((r) => (
                  <Pill key={r.format} tone={r.tried ? "muted" : "accent"} className="text-[13px] capitalize">
                    {r.format} · {r.creators} creators{r.tried ? "" : " · you haven't tried it"}
                  </Pill>
                ))}
              </div>
            </div>
          ) : null}
          <p className="text-muted-foreground text-xs">Public numbers only, from their latest 15 posts. {pe.compare_run ? `Weekly change compares with ${shortDate(pe.compare_run.length === 16 ? pe.compare_run + ":00Z" : pe.compare_run)}.` : "Weekly change starts once a run from a week ago exists."} They are bigger accounts, so compare views per follower and posting pace, not raw views. Learn from the format, never copy the words.</p>
        </>
      ) : (
        <Empty>The first comparison with the creators you follow for inspiration arrives after Sunday's research run, or tap “Check now” (about 7 minutes).</Empty>
      )}
    </Panel>
  );
}
