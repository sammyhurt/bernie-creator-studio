import CalendarMark from "@iconify-react/solar/calendar-mark-linear";
import CheckCircle from "@iconify-react/solar/check-circle-linear";
import DocumentText from "@iconify-react/solar/document-text-linear";
import GalleryWide from "@iconify-react/solar/gallery-wide-linear";
import PlayCircle from "@iconify-react/solar/play-circle-linear";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CopyButton, Pill, Spinner, dayLabel, nyDay, timeLabel, useAction } from "./bits";
import { useScriptFlow } from "./create";
import type { Carousel, Idea } from "./data";
import StudioHero from "./hero";
import { GrowthPlanView } from "./growth";
import { PlanModal } from "./ideas";
import { useStudio } from "./store";
import { Empty, Grid, LinkButton, Panel, Skeleton, Stat } from "./ui";

const byTime = (a: Idea, b: Idea) => (a.plan_date + a.plan_time).localeCompare(b.plan_date + b.plan_time);

/** Plain-text plan for the next 7 days, for Notes or a text to Bill. */
export function weekPlanText(ideas: Idea[], carousels: Carousel[] = []) {
  const end = nyDay(6);
  const inWeek = (x: { status: string; plan_date: string }) => x.status === "planned" && x.plan_date >= nyDay() && x.plan_date <= end;
  const week = [
    ...ideas.filter(inWeek).map((x) => ({ at: x.plan_date + x.plan_time, text: [`${dayLabel(x.plan_date)}${x.plan_time ? " · " + timeLabel(x.plan_time) : ""}: ${x.title}`, x.hook ? `   Hook: ${x.hook}` : "", x.series ? `   Series: ${x.series}` : "", x.script ? "   Script ready in the Studio" : ""].filter(Boolean).join("\n") })),
    ...carousels.filter(inWeek).map((x) => ({ at: x.plan_date + x.plan_time, text: `${dayLabel(x.plan_date)}${x.plan_time ? " · " + timeLabel(x.plan_time) : ""}: Carousel · ${x.title} (${x.body.slides.length} slides${x.platform === "both" ? ", TikTok + Instagram" : x.platform === "instagram" ? ", Instagram" : ""})` })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  if (!week.length) return "Nothing planned for the next 7 days yet.";
  return [`My TikTok plan · ${dayLabel(nyDay())} to ${dayLabel(end)}`, "", ...week.map((x) => x.text)].join("\n");
}

function CarouselRow({ c, overdue }: { c: Carousel; overdue?: boolean }) {
  const s = useStudio();
  const { busy, run } = useAction();
  return (
    <div className={cn("bg-background/70 grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center", overdue ? "border-amber-500/40" : "border-border")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {c.plan_time ? <span className="text-sm font-semibold tabular-nums">{timeLabel(c.plan_time)}</span> : null}
          <Pill tone="accent">
            <GalleryWide className="size-3.5" /> Carousel
          </Pill>
          {c.platform !== "tiktok" ? <Pill>{c.platform === "both" ? "TikTok + Instagram" : "Instagram"}</Pill> : null}
          {c.body.slides.some((x) => x.check) ? <Pill tone="warn">To check</Pill> : null}
        </div>
        <div className="mt-1 font-medium">{c.title}</div>
        {c.body.slides[0]?.title ? <div className="text-muted-foreground line-clamp-1 text-sm">“{c.body.slides[0].title}”</div> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="xs" variant="outline" className="rounded-full px-2.5" onClick={() => s.openCarousel(c.id)}>
          Open
        </Button>
        <Button size="xs" className="rounded-full px-2.5" disabled={!!busy} onClick={() => run("p", () => s.saveCarousel({ ...c, status: "posted" }), "Nice. Marked posted")}>
          {busy === "p" ? <Spinner className="size-3" /> : <CheckCircle className="size-3.5" />} Posted
        </Button>
      </div>
    </div>
  );
}

function PlannedRow({ idea, onScript, overdue }: { idea: Idea; onScript: (i: Idea) => void; overdue?: boolean }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [move, setMove] = useState(false);
  return (
    <div className={cn("bg-background/70 grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center", overdue ? "border-amber-500/40" : "border-border")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {idea.plan_time ? <span className="text-sm font-semibold tabular-nums">{timeLabel(idea.plan_time)}</span> : null}
          {idea.series ? <Pill>{idea.series}</Pill> : null}
          {idea.status === "filmed" ? <Pill tone="ok">Filmed</Pill> : null}
          {idea.script ? <Pill tone="accent">Script ready</Pill> : null}
        </div>
        <div className="mt-1 font-medium">{idea.title}</div>
        {idea.hook ? <div className="text-muted-foreground line-clamp-1 text-sm">“{idea.hook}”</div> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="xs" variant="outline" className="rounded-full px-2.5" onClick={() => onScript(idea)}>
          <DocumentText className="size-3.5" /> {idea.script ? "Script" : "Write script"}
        </Button>
        {idea.status !== "filmed" ? (
          <Button size="xs" variant="outline" className="rounded-full px-2.5" disabled={!!busy} onClick={() => run("f", () => s.updateIdea(idea, { status: "filmed" }), "Marked filmed")}>
            {busy === "f" ? <Spinner className="size-3" /> : <PlayCircle className="size-3.5" />} Filmed
          </Button>
        ) : null}
        <Button size="xs" className="rounded-full px-2.5" disabled={!!busy} onClick={() => run("p", () => s.updateIdea(idea, { status: "posted" }), "Nice. Marked posted")}>
          {busy === "p" ? <Spinner className="size-3" /> : <CheckCircle className="size-3.5" />} Posted
        </Button>
        <Button size="xs" variant="ghost" className="rounded-full px-2.5" onClick={() => setMove(true)}>
          Move
        </Button>
      </div>
      {move ? <PlanModal key={idea.id} idea={idea} onClose={() => setMove(false)} /> : null}
    </div>
  );
}

export const PLAN_VIEW_KEY = "mts-plan-view";
const readView = (): "calendar" | "growth" => {
  try {
    return localStorage.getItem(PLAN_VIEW_KEY) === "growth" ? "growth" : "calendar";
  } catch {
    return "calendar";
  }
};

export function PlanPanel() {
  const s = useStudio();
  const [view, setViewState] = useState<"calendar" | "growth">(readView);
  const setView = (v: "calendar" | "growth") => {
    setViewState(v);
    try {
      localStorage.setItem(PLAN_VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };
  const d = s.d;
  const flow = useScriptFlow();
  const [pick, setPick] = useState<Idea | null>(null);
  const today = nyDay();
  const days = Array.from({ length: 14 }, (_, i) => nyDay(i));
  const planned = s.ideas.filter((x) => (x.status === "planned" || x.status === "filmed") && x.plan_date).sort(byTime);
  const overdue = planned.filter((x) => x.plan_date < today);
  const upcoming = planned.filter((x) => x.plan_date >= today && x.plan_date <= days[13]);
  const cars = (d?.carousels || []).filter((x) => x.status === "planned" && x.plan_date).sort((a, b) => (a.plan_date + a.plan_time).localeCompare(b.plan_date + b.plan_time));
  const carsOverdue = cars.filter((x) => x.plan_date < today);
  const carsUpcoming = cars.filter((x) => x.plan_date >= today && x.plan_date <= days[13]);
  const next7 = upcoming.filter((x) => x.plan_date <= days[6]).length + carsUpcoming.filter((x) => x.plan_date <= days[6]).length;
  const ready = s.ideas.filter((x) => x.status === "saved" || x.status === "scripted" || (x.status === "planned" && !x.plan_date));
  const goal = Number(String(d?.profile.posts_per_week || "4-5").match(/\d+/g)?.pop() || 5);
  const series = useMemo(() => {
    const m: Record<string, number> = {};
    s.ideas.forEach((x) => {
      if (x.series) m[x.series] = (m[x.series] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [s.ideas]);
  const st = d?.stats;
  const bestDay = st ? [...st.weekdays].filter((w) => w.posts >= 3).sort((a, b) => b.median_views - a.median_views)[0] : null;
  const bestSlot = st ? [...st.slots].filter((w) => w.posts >= 5).sort((a, b) => b.median_views - a.median_views)[0] : null;
  const longDay = (ymd: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(ymd + "T12:00:00Z"));

  return (
    <>
      <StudioHero
        eyebrow="Plan"
        title={view === "growth" ? "Your road to 10,000" : "Your next two weeks"}
        lead={view === "growth" ? "A step-by-step plan built from your own videos. Tick things off as you go; a fresh plan arrives every Monday." : d ? `${next7} of ${goal} videos planned for the next 7 days. Plan them here, film when it suits you, and post yourself in TikTok.` : "What to film and when to post."}
      />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          <div className="mb-5 inline-flex rounded-full border p-1" role="tablist" aria-label="Plan view">
            {([
              ["calendar", "Next two weeks"],
              ["growth", "Road to 10K"],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {label}
              </button>
            ))}
          </div>
          {!d ? (
            <Skeleton className="h-72" />
          ) : view === "growth" ? (
            <Grid>
              <GrowthPlanView />
            </Grid>
          ) : (
            <Grid>
              {overdue.length || carsOverdue.length ? (
                <Panel eyebrow="Did you post these?" pattern="dots" className="lg:col-span-6">
                  <div className="grid gap-2">
                    {overdue.map((i) => (
                      <PlannedRow key={i.id} idea={i} overdue onScript={(x) => void flow.write({ idea: x })} />
                    ))}
                    {carsOverdue.map((c) => (
                      <CarouselRow key={"c" + c.id} c={c} overdue />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">Tap Posted, or Move it to a new day. Marking posts helps the Studio learn which ideas turn into your best videos.</p>
                </Panel>
              ) : null}

              <Panel eyebrow="Next 14 days" pattern="lines" className="lg:col-span-4" action={<CopyButton text={() => weekPlanText(s.ideas, d?.carousels)} label="Copy this week" size="xs" />}>
                <ol className="grid gap-1.5">
                  {days.map((day, i) => {
                    const items = upcoming.filter((x) => x.plan_date === day);
                    const carItems = carsUpcoming.filter((x) => x.plan_date === day);
                    const isBest = bestDay && longDay(day) === bestDay.day;
                    return (
                      <li key={day} className={cn("grid gap-2 rounded-lg p-2 sm:grid-cols-[132px_minmax(0,1fr)]", i === 7 && "border-border mt-2 border-t pt-4", items.length || carItems.length ? "" : "py-1.5")}>
                        <div className="flex items-center gap-2 sm:block">
                          <div className={cn("text-sm", day === today ? "font-semibold" : "text-muted-foreground")}>{dayLabel(day)}</div>
                          {isBest ? <span className="text-chart-1 dark:text-chart-1 text-[11px] font-semibold">Your best day</span> : null}
                        </div>
                        {items.length || carItems.length ? (
                          <div className="grid gap-2">
                            {items.map((x) => (
                              <PlannedRow key={x.id} idea={x} onScript={(y) => void flow.write({ idea: y })} />
                            ))}
                            {carItems.map((c) => (
                              <CarouselRow key={"c" + c.id} c={c} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground/70 text-sm">Open</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </Panel>

              <Panel eyebrow="This week" pattern="dots" className="lg:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Planned · 7 days" value={`${next7}/${goal}`} />
                  <Stat label="Ready to plan" value={ready.length} />
                </div>
                <div className="bg-muted h-2.5 overflow-hidden rounded-full" role="progressbar" aria-label="Videos planned this week" aria-valuenow={next7} aria-valuemin={0} aria-valuemax={goal}>
                  <div className="bg-chart-1 h-full rounded-full" style={{ width: `${Math.min(100, (next7 / goal) * 100)}%` }} />
                </div>
                <div className="grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Best day so far: </span>
                    <span className="font-medium">{bestDay ? bestDay.day : "not enough data yet"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Best time: </span>
                    <span className="font-medium">{bestSlot ? bestSlot.slot.toLowerCase() : "not enough data yet"}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">From your last {st?.sample || 0} videos. Posting steadily matters more than the exact hour.</p>
                </div>
                <CopyButton text={() => weekPlanText(s.ideas, d?.carousels)} label="Copy this week's plan" variant="default" className="h-10" size="default" />
              </Panel>

              <Panel eyebrow={`Ready to plan · ${ready.length}`} pattern="wave" className="lg:col-span-3">
                {ready.length ? (
                  <ul className="grid gap-2">
                    {ready.slice(0, 12).map((x) => (
                      <li key={x.id} className="border-border flex items-center justify-between gap-3 rounded-lg border p-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{x.title}</span>
                          <span className="text-muted-foreground text-xs">
                            {x.pillar}
                            {x.script ? " · script ready" : ""}
                          </span>
                        </span>
                        <Button size="xs" className="shrink-0 rounded-full px-2.5" onClick={() => setPick(x)}>
                          <CalendarMark className="size-3.5" /> Plan
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>Save or script ideas in Create and they wait here.</Empty>
                )}
                <LinkButton onClick={() => s.goto("create")}>Get more ideas →</LinkButton>
              </Panel>

              <Panel eyebrow="Series" pattern="lines" className="lg:col-span-3">
                {series.length ? (
                  <ul className="grid gap-2">
                    {series.map(([name, count]) => (
                      <li key={name} className="bg-secondary/60 dark:bg-secondary/40 flex items-center justify-between rounded-lg p-3">
                        <span className="font-serif text-lg">{name}</span>
                        <span className="text-muted-foreground text-sm tabular-nums">{count} {count === 1 ? "idea" : "ideas"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>No series yet. Add a series name when you plan a video.</Empty>
                )}
                <p className="text-muted-foreground text-sm">A series is a format you repeat on the same day each week, like “Married in NYC, part 3”. Viewers follow to catch the next one, which is the fastest way to turn views into followers.</p>
              </Panel>
            </Grid>
          )}
        </div>
      </section>
      {pick ? <PlanModal key={pick.id} idea={pick} onClose={() => setPick(null)} /> : null}
      {flow.ui}
    </>
  );
}
