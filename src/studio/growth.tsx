import CheckCircle from "@iconify-react/solar/check-circle-linear";
import Refresh from "@iconify-react/solar/refresh-linear";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Pill, Spinner, Working, useAction, useToast } from "./bits";
import type { GrowthPlan } from "./data";
import { compact, n, shortDate } from "./insights";
import { CarouselButton } from "./carousel-button";
import { useStudio } from "./store";
import { Empty, Panel } from "./ui";

const GOAL = 10000;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHADES = ["bg-chart-1", "bg-chart-1/70", "bg-chart-1/45", "bg-chart-1/25", "bg-muted-foreground/30", "bg-muted-foreground/15"];

/** Followers gained per week, only once there is a week of real tracking. */
function pace(series: { day: string; followers: number }[] | undefined) {
  if (!series || series.length < 2) return null;
  const a = series[0], b = series[series.length - 1];
  const days = (Date.parse(b.day + "T12:00:00Z") - Date.parse(a.day + "T12:00:00Z")) / 864e5;
  if (days < 7) return null;
  return ((b.followers - a.followers) / days) * 7;
}

function Check({ checked, onToggle, children, sub }: { checked: boolean; onToggle: () => void; children: ReactNode; sub?: ReactNode }) {
  return (
    <label className={cn("border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors", checked ? "bg-chart-1/5" : "bg-background/70 hover:bg-muted/40")}>
      <input type="checkbox" checked={checked} onChange={onToggle} className="accent-[var(--chart-1)] mt-0.5 size-5 shrink-0" />
      <span className="min-w-0">
        <span className={cn("block text-sm font-medium", checked && "text-muted-foreground line-through")}>{children}</span>
        {sub ? <span className="text-muted-foreground mt-0.5 block text-xs">{sub}</span> : null}
      </span>
    </label>
  );
}

/** Followers to 10K, with each milestone marked on the bar. */
function Road({ followers, milestones }: { followers: number; milestones: { followers: number; title: string }[] }) {
  const pct = (v: number) => Math.min(100, (v / GOAL) * 100);
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-3xl font-semibold tracking-tighter tabular-nums">{n(followers)}</span>
        <span className="text-muted-foreground text-sm tabular-nums">{n(Math.max(0, GOAL - followers))} to 10K</span>
      </div>
      <div className="relative pt-1 pb-6">
        <div className="bg-muted h-3 overflow-hidden rounded-full" role="progressbar" aria-label="Followers toward 10,000" aria-valuenow={followers} aria-valuemin={0} aria-valuemax={GOAL}>
          <div className="bg-chart-1 h-full rounded-full" style={{ width: `${pct(followers)}%` }} />
        </div>
        {milestones
          .filter((m) => m.followers <= GOAL)
          .map((m) => (
            <span key={m.followers} className="absolute top-0 -translate-x-1/2" style={{ left: `${pct(m.followers)}%` }}>
              <span className={cn("mx-auto block h-5 w-0.5", followers >= m.followers ? "bg-chart-1" : "bg-foreground/30")} />
              <span className={cn("text-muted-foreground mt-0.5 block text-[10.5px] font-semibold whitespace-nowrap tabular-nums", m.followers === GOAL && "-translate-x-1/3")}>{compact(m.followers)}</span>
            </span>
          ))}
      </div>
    </div>
  );
}

export function GrowthPlanView() {
  const s = useStudio();
  const toast = useToast();
  const { busy, run } = useAction();
  const g = s.d?.growth?.latest || null;
  const history = s.d?.growth?.history || [];
  const followers = s.d?.stats?.followers || g?.followers || 0;
  const perWeek = pace(s.d?.stats?.series);

  // Ticks save after a short pause, so fast tapping sends one request with the final list.
  const [done, setDone] = useState<string[]>(g?.done || []);
  const planId = g?.id || 0;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) setDone(g?.done || []);
  }, [g?.done, planId]);
  const toggle = (id: string) => {
    if (!g) return;
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await s.tickGrowth(g.id, next);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not save that tick.", "err");
      } finally {
        dirty.current = false;
      }
    }, 700);
  };

  const make = () => run("make", () => s.makeGrowthPlan(), "Your new plan is ready");

  if (!s.d) return null;
  if (!g) {
    return (
      <Panel eyebrow="Road to 10K" pattern="wave" className="lg:col-span-6">
        <Road followers={followers} milestones={[{ followers: 5000, title: "5K" }, { followers: 7500, title: "7.5K" }, { followers: GOAL, title: "10K" }]} />
        <p className="max-w-[65ch] text-sm">A step-by-step plan from your own numbers: what to post each day, the series to start, and this week's to-do list. It refreshes every Monday morning, or whenever you tap the button.</p>
        {busy === "make" ? (
          <Working text="Reading your last 90 days of videos and this week's trends, then writing your plan. About a minute." />
        ) : (
          <Button className="h-11 self-start rounded-full px-5" onClick={make}>
            Make my plan
          </Button>
        )}
      </Panel>
    );
  }

  const p = g.plan;
  const weekDone = p.this_week.filter((t) => done.includes(t.id)).length;
  const next = p.milestones.find((m) => m.followers > followers);
  const weeksTo10k = perWeek && perWeek > 0 ? Math.ceil((GOAL - followers) / perWeek) : null;
  const rhythm = DAYS.map((d) => p.rhythm.find((r) => r.day.slice(0, 3).toLowerCase() === d.toLowerCase()) || { day: d, post: "", note: "" });
  const mixTotal = p.pillar_mix.reduce((a, x) => a + x.share, 0) || 1;

  return (
    <>
      <Panel
        eyebrow="Road to 10K"
        pattern="wave"
        className="lg:col-span-6"
        action={
          <Button size="sm" variant="outline" className="rounded-full px-3" disabled={busy === "make"} onClick={make}>
            {busy === "make" ? <Spinner /> : <Refresh className="size-4" />} New plan
          </Button>
        }
      >
        <h2 className="max-w-[40ch] text-2xl leading-tight font-semibold tracking-tight md:text-3xl">{p.headline}</h2>
        <p className="max-w-[70ch] text-sm md:text-base">{p.where_you_are}</p>
        <Road followers={followers} milestones={p.milestones} />
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="bg-chart-1/10 border-chart-1/30 rounded-xl border p-4">
            <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">Your one focus</div>
            <p className="mt-1 font-medium">{p.focus}</p>
          </div>
          <div className="bg-muted/60 rounded-xl p-4 text-sm">
            <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">Pace</div>
            <p className="mt-1">
              {weeksTo10k != null
                ? `About ${n(Math.round(perWeek!))} new followers a week. At that pace, 10K is roughly ${n(weeksTo10k)} weeks away.`
                : perWeek != null
                  ? "Followers have been flat while tracking. The plan below is built to change that."
                  : "Your pace shows here after one week of tracking."}
            </p>
          </div>
        </div>
        {busy === "make" ? <Working text="Writing a fresh plan from your latest numbers. About a minute." /> : null}
        <p className="text-muted-foreground text-xs">
          Made {shortDate(g.created_at)} at {n(g.followers)} followers. A new plan arrives every Monday at 8:15 AM and carries forward anything you didn't finish.
        </p>
      </Panel>

      <Panel eyebrow={`This week · ${weekDone} of ${p.this_week.length} done`} pattern="dots" className="lg:col-span-3">
        <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden>
          <div className="bg-chart-1 h-full rounded-full transition-[width]" style={{ width: `${(weekDone / Math.max(1, p.this_week.length)) * 100}%` }} />
        </div>
        <div className="grid gap-2">
          {p.this_week.map((t) => (
            <Check key={t.id} checked={done.includes(t.id)} onToggle={() => toggle(t.id)} sub={t.why}>
              {t.day && t.day !== "Any" ? <Pill className="mr-1.5 align-middle">{t.day}</Pill> : null}
              {t.task}
            </Check>
          ))}
        </div>
        {weekDone === p.this_week.length && p.this_week.length ? (
          <p className="text-chart-1 dark:text-chart-1 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="size-5" /> Week done. Tap New plan any time for the next step.
          </p>
        ) : null}
      </Panel>

      <Panel eyebrow="Your weekly rhythm" pattern="lines" className="lg:col-span-3">
        <ol className="grid gap-1.5">
          {rhythm.map((r) => (
            <li key={r.day} className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-lg p-2 odd:bg-muted/40">
              <span className="text-sm font-semibold">{r.day.slice(0, 3)}</span>
              <span className="min-w-0 text-sm">
                {r.post || <span className="text-muted-foreground">Rest day</span>}
                {r.note ? <span className="text-muted-foreground block text-xs">{r.note}</span> : null}
              </span>
            </li>
          ))}
        </ol>
        {p.daily.length ? (
          <div className="grid gap-1.5">
            <h3 className="text-sm font-semibold">Every day</h3>
            <ul className="grid gap-1 text-sm">
              {p.daily.map((x) => (
                <li key={x.id} className="flex gap-2">
                  <span className="bg-chart-1 mt-2 size-1.5 shrink-0 rounded-full" />
                  {x.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>

      <Panel eyebrow="Step by step" pattern="dots" className="lg:col-span-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {p.phases.map((ph, i) => {
            const stepsDone = ph.steps.filter((x) => done.includes(x.id)).length;
            return (
              <section key={ph.id || i} className="border-border grid content-start gap-3 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground/50 font-display text-3xl font-medium tracking-tighter">{String(i + 1).padStart(2, "0")}</span>
                  <Pill tone={stepsDone === ph.steps.length && ph.steps.length ? "ok" : "muted"}>
                    {stepsDone}/{ph.steps.length}
                  </Pill>
                </div>
                <h3 className="leading-snug font-semibold">{ph.name.replace(/^Phase \d+:\s*/i, "")}</h3>
                <p className="text-sm">
                  <span className="text-muted-foreground">Goal: </span>
                  {ph.goal}
                </p>
                {ph.why ? <p className="text-muted-foreground text-xs">{ph.why}</p> : null}
                <div className="grid gap-2">
                  {ph.steps.map((x) => (
                    <Check key={x.id} checked={done.includes(x.id)} onToggle={() => toggle(x.id)}>
                      {x.text}
                    </Check>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        {next ? (
          <p className="text-sm">
            <span className="font-semibold">Next milestone, {n(next.followers)}:</span> {next.focus}
          </p>
        ) : null}
      </Panel>

      <Panel eyebrow="What to post" pattern="wave" className="lg:col-span-3">
        {p.pillar_mix.length ? (
          <>
            <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={p.pillar_mix.map((x) => `${x.pillar} ${x.share}%`).join(", ")}>
              {p.pillar_mix.map((x, i) => (
                <span key={x.pillar} className={cn("h-full", SHADES[i % SHADES.length], i && "border-card border-l-2")} style={{ width: `${(x.share / mixTotal) * 100}%` }} />
              ))}
            </div>
            <ul className="grid gap-2 text-sm">
              {p.pillar_mix.map((x, i) => (
                <li key={x.pillar} className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-start gap-2">
                  <span className={cn("mt-1.5 size-2.5 rounded-sm", SHADES[i % SHADES.length])} />
                  <span>
                    <span className="font-medium">{x.pillar}</span>
                    {x.why ? <span className="text-muted-foreground block text-xs">{x.why}</span> : null}
                  </span>
                  <span className="font-semibold tabular-nums">{x.share}%</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {p.series.length ? (
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">Series to start</h3>
            {p.series.map((x) => (
              <div key={x.name} className="bg-secondary/60 dark:bg-secondary/40 rounded-lg p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-lg">{x.name}</span>
                  {x.day ? <span className="text-muted-foreground text-xs">{x.day}</span> : null}
                </div>
                <p className="text-sm">{x.format}</p>
                <CarouselButton size="xs" variant="ghost" className="-ml-2 mt-1" topic={`Part 1 of my new series "${x.name}": ${x.format}`} label={`Series: ${x.name}`} text={x.format}>
                  Start it as a carousel
                </CarouselButton>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel eyebrow="Do less · check weekly" pattern="lines" className="lg:col-span-3">
        {p.stop.length ? (
          <div className="grid gap-1.5">
            <h3 className="text-sm font-semibold">Do less of</h3>
            <ul className="grid gap-1 text-sm">
              {p.stop.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-500/70" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {p.measure.length ? (
          <div className="grid gap-1.5">
            <h3 className="text-sm font-semibold">Check these every week</h3>
            <ul className="grid gap-1 text-sm">
              {p.measure.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="bg-chart-1 mt-2 size-1.5 shrink-0 rounded-full" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {p.limits ? <p className="text-muted-foreground text-xs">{p.limits}</p> : null}
        {history.length > 1 ? (
          <div className="grid gap-1.5">
            <h3 className="text-sm font-semibold">Past plans</h3>
            <ul className="grid gap-1 text-sm">
              {history.slice(0, 6).map((h) => (
                <li key={h.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{shortDate(h.created_at)}</span>
                  <span className="tabular-nums">{n(h.followers)} followers</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!p.stop.length && !p.measure.length ? <Empty>Nothing to cut back on yet.</Empty> : null}
      </Panel>
    </>
  );
}

/** A small Home card that points to the plan. */
export function GrowthTeaser() {
  const s = useStudio();
  const g = s.d?.growth?.latest;
  const followers = s.d?.stats?.followers || g?.followers || 0;
  if (!g) {
    return (
      <>
        <p className="text-sm">Get a step-by-step plan to 10,000 followers, built from your own videos, with this week's to-do list.</p>
        <Road followers={followers} milestones={[{ followers: 5000, title: "5K" }, { followers: GOAL, title: "10K" }]} />
      </>
    );
  }
  const left = g.plan.this_week.filter((t) => !g.done.includes(t.id));
  return (
    <>
      <Road followers={followers} milestones={g.plan.milestones} />
      <p className="text-sm">
        <span className="font-semibold">Focus:</span> {g.plan.focus}
      </p>
      {left.length ? (
        <ul className="grid gap-1 text-sm">
          {left.slice(0, 3).map((t) => (
            <li key={t.id} className="flex gap-2">
              <span className="border-foreground/30 mt-0.5 size-4 shrink-0 rounded border" />
              {t.task}
            </li>
          ))}
          {left.length > 3 ? <li className="text-muted-foreground text-xs">and {left.length - 3} more</li> : null}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">This week's list is done.</p>
      )}
    </>
  );
}
