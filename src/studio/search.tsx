import Magnifer from "@iconify-react/solar/magnifer-linear";
import Refresh from "@iconify-react/solar/refresh-linear";

import { Button } from "@/components/ui/button";

import { CopyButton, Pill, Spinner, Working, useAction } from "./bits";
import type { SearchTrend } from "./data";
import { shortDate } from "./insights";
import { CarouselButton } from "./carousel-button";
import { useStudio } from "./store";
import { Panel } from "./ui";

const TREND: Record<Exclude<SearchTrend, "">, { label: string; tone: "accent" | "ok" | "muted" | "warn" }> = {
  new: { label: "New this week", tone: "ok" },
  rising: { label: "Rising", tone: "accent" },
  steady: { label: "Steady", tone: "muted" },
  cooling: { label: "Cooling", tone: "muted" },
};

function Badges({ hot, trend }: { hot: boolean; trend: SearchTrend }) {
  return (
    <>
      {hot ? <Pill tone="warn">Trending on TikTok</Pill> : null}
      {trend ? <Pill tone={TREND[trend].tone}>{TREND[trend].label}</Pill> : null}
    </>
  );
}

/** Trends tab: what people type into TikTok search in her niche, and the phrases worth owning. */
export function SearchInsightsPanels({ onScript, writing }: { onScript: (topic: string, hook: string) => void; writing: boolean }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const si = s.d?.search;
  const refresh = () => run("search", () => s.refreshSearch(), "Search insights updated");
  const refreshBtn = (
    <Button size="sm" variant="outline" className="rounded-full px-3" disabled={busy === "search"} onClick={refresh}>
      {busy === "search" ? <Spinner /> : <Refresh className="size-4" />} Check now
    </Button>
  );

  if (!si || !si.picks.length) {
    return (
      <Panel eyebrow="What people search" pattern="lines" className="lg:col-span-6" action={<Magnifer className="text-chart-1 size-5" />}>
        <p className="max-w-[65ch] text-sm">Phrases people are typing into TikTok search in your niche right now, and the ones you have the best shot at showing up for. It checks every Sunday morning.</p>
        {busy === "search" ? <Working text="Checking TikTok search suggestions for your niche, then picking the best phrases for you. About a minute." /> : <div>{refreshBtn}</div>}
      </Panel>
    );
  }

  const max = Math.max(1, ...si.top.map((t) => t.score));
  return (
    <>
      <Panel eyebrow="Searches you can win" pattern="lines" className="lg:col-span-4" action={refreshBtn}>
        {si.summary ? <p className="max-w-[70ch] text-base font-medium">{si.summary}</p> : null}
        {busy === "search" ? <Working text="Checking TikTok search again. About a minute." /> : null}
        <ol className="grid gap-3">
          {si.picks.map((p, i) => (
            <li key={p.phrase + i} className="bg-background/70 border-border grid gap-2 rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground mr-1 text-sm font-semibold tabular-nums">{i + 1}.</span>
                <span className="text-base font-semibold">“{p.phrase}”</span>
                <Badges hot={p.hot} trend={p.trend} />
                {p.pillar ? <Pill>{p.pillar.charAt(0).toUpperCase() + p.pillar.slice(1)}</Pill> : null}
              </div>
              <p className="text-sm">{p.idea}</p>
              {p.hook ? (
                <p className="text-sm">
                  <span className="text-muted-foreground mr-1 text-[11px] font-semibold tracking-[0.12em] uppercase">Say</span>“{p.hook}”
                </p>
              ) : null}
              {p.why ? <p className="text-muted-foreground text-xs">{p.why}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full px-3" disabled={writing} onClick={() => onScript(`A video built to show up when people search TikTok for "${p.phrase}". Idea: ${p.idea}`, p.hook)}>
                  Script it
                </Button>
                <CarouselButton topic={p.idea || p.phrase} label={`Search: “${p.phrase}”`} text={`People search TikTok for "${p.phrase}". Idea: ${p.idea}${p.hook ? ` Hook: ${p.hook}` : ""}`} />
                <CopyButton text={p.phrase} label="Copy phrase" size="sm" />
              </div>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground text-xs">Say the phrase in the first 5 seconds, put it in your on-screen text, and use it in the caption. TikTok search reads all three.</p>
      </Panel>

      <Panel eyebrow="Top searches in your niche" pattern="dots" className="lg:col-span-2">
        <ul className="grid gap-1.5">
          {si.top.slice(0, 20).map((t) => (
            <li key={t.phrase} className="grid gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{t.phrase}</span>
                <span className="flex shrink-0 gap-1">
                  {t.hot ? <span className="size-2 rounded-full bg-amber-500" title="Trending on TikTok" aria-label="Trending" /> : null}
                  {t.trend === "new" ? <span className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">NEW</span> : null}
                  {t.trend === "rising" ? <span className="text-chart-1 text-[10.5px] font-semibold">▲</span> : null}
                </span>
              </div>
              <span className="bg-muted block h-1.5 overflow-hidden rounded-full" aria-hidden>
                <span className="bg-chart-1/60 block h-full rounded-full" style={{ width: `${(t.score / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">
          From TikTok's own search suggestions in the US{si.at ? `, checked ${shortDate(si.at)}` : ""}. Bars show how often a phrase came up across related searches, not exact search counts. TikTok doesn't share those outside its app; for your own account, search "Creator Search Insights" in the TikTok app. Updates by itself every Sunday morning.
        </p>
      </Panel>
    </>
  );
}
