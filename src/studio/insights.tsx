import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import Fire from "@iconify-react/solar/fire-linear";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { StudioData, VideoStat } from "./data";
import StudioHero from "./hero";
import { CheckinList, CheckinModal, WinnersTable } from "./learn";
import { CarouselButton } from "./carousel-button";
import { LinkClicksPanels } from "./links";
import { Empty, Grid, Panel, Skeleton, Stat } from "./ui";

const nf = new Intl.NumberFormat("en-US");
const cf = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
export const n = (v?: number | null) => nf.format(Math.round(v || 0));
export const compact = (v?: number | null) => cf.format(Math.round(v || 0));
const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
const whenFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" });
const okDate = (iso?: string) => !!iso && Number.isFinite(Date.parse(iso));
export const shortDate = (iso?: string) => (okDate(iso) ? dayFmt.format(new Date(iso!)) : "");
export const updatedLabel = (iso?: string) => (okDate(iso) ? `Updated ${whenFmt.format(new Date(iso!))}` : "");

/** Caption without hashtags and @mentions, so the hook reads clearly. */
export const cleanTitle = (t: string) => t.replace(/#\S+/g, "").replace(/@\S+/g, "").replace(/\s+/g, " ").trim() || "Untitled video";

export const signed = (v: number) => (v > 0 ? `+${n(v)}` : v < 0 ? `−${n(Math.abs(v))}` : "0");

function Cover({ v, className }: { v: VideoStat; className?: string }) {
  const [ok, setOk] = useState(!!v.cover);
  return (
    <span className={cn("bg-muted relative block shrink-0 overflow-hidden rounded-md", className)}>
      {ok ? <img src={v.cover} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setOk(false)} className="size-full object-cover" /> : null}
    </span>
  );
}

function VideoRow({ v, rank }: { v: VideoStat; rank?: number }) {
  return (
    <a href={v.url} target="_blank" rel="noopener noreferrer" className="group/row hover:bg-muted/60 grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg p-2 transition-colors">
      <Cover v={v} className="h-16 w-12" />
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm leading-snug font-medium">
          {rank ? <span className="text-muted-foreground mr-1.5 tabular-nums">{rank}.</span> : null}
          {cleanTitle(v.title)}
        </span>
        <span className="text-muted-foreground mt-0.5 block text-xs">
          {shortDate(v.posted_at)} · {n(v.likes)} likes · {n(v.comments)} comments · {n(v.shares)} shares
        </span>
      </span>
      <span className="text-right">
        <span className="font-display block text-lg leading-none font-semibold tabular-nums">{compact(v.views)}</span>
        <span className="text-muted-foreground text-[11px]">views</span>
      </span>
    </a>
  );
}

/** Single-series line with a crosshair tooltip. */
function FollowerLine({ series }: { series: { day: string; followers: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 180, padL = 8, padR = 8, padT = 12, padB = 24;
  const vals = series.map((p) => p.followers);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = Math.max(hi - lo, 10);
  const x = (i: number) => padL + (series.length === 1 ? (w - padL - padR) / 2 : (i / (series.length - 1)) * (w - padL - padR));
  const y = (v: number) => padT + (1 - (v - (lo - span * 0.15)) / (span * 1.3)) * (H - padT - padB);
  const d = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.followers).toFixed(1)}`).join("");
  const onMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const rel = (e.clientX - r.left - padL) / Math.max(1, w - padL - padR);
    setHover(Math.max(0, Math.min(series.length - 1, Math.round(rel * (series.length - 1)))));
  };
  const hp = hover != null ? series[hover] : null;
  return (
    <div ref={ref} className="relative w-full select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg width={w} height={H} className="block" role="img" aria-label={`Followers by day, from ${n(series[0]?.followers)} to ${n(series[series.length - 1]?.followers)}`}>
        <line x1={padL} x2={w - padR} y1={H - padB} y2={H - padB} className="stroke-border" strokeWidth={1} />
        <path d={d} fill="none" className="stroke-chart-1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(series.length - 1)} cy={y(vals[vals.length - 1])} r={4} className="fill-chart-1 stroke-card" strokeWidth={2} />
        {hp ? (
          <>
            <line x1={x(hover!)} x2={x(hover!)} y1={padT} y2={H - padB} className="stroke-muted-foreground/40" strokeWidth={1} />
            <circle cx={x(hover!)} cy={y(hp.followers)} r={5} className="fill-chart-1 stroke-card" strokeWidth={2} />
          </>
        ) : null}
        <text x={padL} y={H - 6} className="fill-muted-foreground text-[11px]">{shortDate(series[0]?.day + "T12:00:00Z")}</text>
        <text x={w - padR} y={H - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">{shortDate(series[series.length - 1]?.day + "T12:00:00Z")}</text>
      </svg>
      {hp ? (
        <div className="bg-popover text-popover-foreground pointer-events-none absolute top-0 rounded-md border px-2.5 py-1.5 text-xs shadow-md" style={{ left: Math.min(Math.max(x(hover!) - 60, 0), w - 120) }}>
          <div className="text-muted-foreground">{shortDate(hp.day + "T12:00:00Z")}</div>
          <div className="font-semibold tabular-nums">{n(hp.followers)} followers</div>
        </div>
      ) : null}
    </div>
  );
}

/** Median views by weekday; the best day carries the accent, the rest stay quiet. */
function WeekdayBars({ rows }: { rows: { day: string; posts: number; median_views: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.median_views));
  const best = rows.reduce((a, r) => (r.posts >= 3 && r.median_views > a.median_views ? r : a), { day: "", posts: 0, median_views: 0 });
  return (
    <div className="grid grid-cols-7 items-end gap-1.5" style={{ height: 150 }}>
      {rows.map((r) => (
        <div key={r.day} className="group/bar relative flex h-full flex-col items-center justify-end gap-1.5" title={`${r.day}: typical ${n(r.median_views)} views across ${r.posts} videos`}>
          <span className="text-muted-foreground text-[11px] tabular-nums opacity-0 transition-opacity group-hover/bar:opacity-100">{compact(r.median_views)}</span>
          <div
            className={cn("w-full max-w-10 rounded-t-[4px]", r.day === best.day ? "bg-chart-1" : "bg-chart-1/35")}
            style={{ height: `${Math.max(3, (r.median_views / max) * 100)}px` }}
          />
          <span className={cn("text-xs", r.day === best.day ? "font-semibold" : "text-muted-foreground")}>{r.day}</span>
        </div>
      ))}
    </div>
  );
}

function Progress({ label, value, goal, note }: { label: string; value: number; goal: number; note: string }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {n(value)} / {compact(goal)}
        </span>
      </div>
      <div className="bg-muted h-2.5 overflow-hidden rounded-full" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="bg-chart-1 h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted-foreground text-xs">{note}</span>
    </div>
  );
}

export function InsightsPanel({ d }: { d: StudioData | null }) {
  const st = d?.stats;
  const [ck, setCk] = useState(false);
  const lead = st
    ? `${updatedLabel(st.updated_at)}. Last 30 days: ${n(st.posts_30d)} videos and ${n(st.views_30d)} views.`
    : "Followers, views and engagement from your TikTok, refreshed every 3 hours.";
  return (
    <>
      <StudioHero eyebrow="Insights" title="What's working" lead={lead} />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          {!d ? (
            <Skeleton className="h-72" />
          ) : !st ? (
            <Grid>
              <Panel eyebrow="Not connected yet" pattern="dots" className="lg:col-span-6">
                <Empty>{d.setup.tiktok_connected ? "Your TikTok is connected. The first numbers arrive within 3 hours." : "Connect TikTok on the Home tab and your numbers appear here."}</Empty>
              </Panel>
            </Grid>
          ) : (
            <Grid>
              <Panel eyebrow="At a glance" pattern="lines" className="lg:col-span-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <Stat label={st.followers_7d != null ? `Followers · ${signed(st.followers_7d)} this week` : "Followers"} value={n(st.followers)} />
                  <Stat label="Avg views · 30 days" value={compact(st.avg_views_30d)} />
                  <Stat label="Typical video" value={compact(st.median_views)} />
                  <Stat label="Engagement rate" value={`${st.er_avg}%`} />
                  <Stat label="Videos · 30 days" value={n(st.posts_30d)} />
                </div>
                <p className="text-muted-foreground text-sm">
                  "Typical video" is the middle of your last 20 videos, so one viral hit doesn't skew it. Average views are higher because your big hits pull them up. Engagement rate is likes, comments and shares divided by views.
                </p>
              </Panel>

              <Panel
                eyebrow="Taking off right now"
                pattern="dots"
                className="lg:col-span-3"
                action={<Fire className="text-chart-1 size-5" />}
              >
                {st.spikes.length ? (
                  <>
                    <div className="grid gap-1">
                      {st.spikes.map((v) => (
                        <div key={v.id} className="grid gap-1">
                          <VideoRow v={v} />
                          <span className="ml-[68px] -mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-chart-1 dark:text-chart-1 text-xs font-semibold">{v.ratio}× your typical video</span>
                            <CarouselButton size="xs" variant="ghost" topic={`Part 2 of my video "${cleanTitle(v.title)}"`} label={`Part 2 of your video (${compact(v.views)} views)`} text={`His video "${cleanTitle(v.title)}" got ${n(v.views)} views, ${v.ratio}× his typical video. Part 2 should continue it, answer what viewers wanted next.`}>
                              Part 2 carousel
                            </CarouselButton>
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm">While a video is hot: reply to comments, pin it, and film a part 2 within a day.</p>
                  </>
                ) : (
                  <Empty>No video from the last 7 days is above 2× your typical views right now. You'll get a phone alert when one is.</Empty>
                )}
              </Panel>

              <Panel eyebrow="Top videos · last 30 days" pattern="wave" className="lg:col-span-3">
                <div className="grid gap-1">
                  {st.top.map((v, i) => (
                    <VideoRow key={v.id} v={v} rank={i + 1} />
                  ))}
                </div>
                {st.top[0] ? (
                  <CarouselButton size="xs" variant="ghost" className="self-start" topic={`Part 2 of my video "${cleanTitle(st.top[0].title)}"`} label={`Part 2 of your top video (${compact(st.top[0].views)} views)`} text={`His top video this month: "${cleanTitle(st.top[0].title)}" with ${n(st.top[0].views)} views. Part 2 should continue it.`}>
                    Part 2 of your top video, as a carousel
                  </CarouselButton>
                ) : null}
              </Panel>

              <LinkClicksPanels />

              <Panel eyebrow="Followers over time" pattern="lines" className="lg:col-span-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-display text-3xl font-semibold tracking-tighter tabular-nums">{n(st.followers)}</span>
                  {st.followers_30d != null ? <span className="text-muted-foreground text-sm">{signed(st.followers_30d)} in 30 days</span> : null}
                </div>
                {st.series.length >= 2 ? (
                  <FollowerLine series={st.series} />
                ) : (
                  <Empty>Tracking started {shortDate(st.tracking_since)}. One point is saved per day, so the line starts tomorrow.</Empty>
                )}
              </Panel>

              <Panel eyebrow="Road to monetization" pattern="dots" className="lg:col-span-2">
                <Progress label="Followers" value={st.followers} goal={10000} note={`${n(Math.max(0, 10000 - st.followers))} to go for Creator Rewards.`} />
                <Progress label="Views · last 30 days" value={st.views_30d} goal={100000} note={st.views_30d >= 100000 ? "Already past the 100K views requirement." : `${n(100000 - st.views_30d)} more views needed.`} />
                <p className="text-muted-foreground text-xs">Creator Rewards also needs videos over 1 minute.</p>
              </Panel>

              <Panel eyebrow="Best day to post · early read" pattern="wave" className="lg:col-span-3">
                <WeekdayBars rows={st.weekdays} />
                <p className="text-muted-foreground text-sm">
                  Typical views by the day each of your last {st.sample} videos went up. Best time of day so far:{" "}
                  <span className="text-foreground font-medium">{[...st.slots].filter((s) => s.posts >= 5).sort((a, b) => b.median_views - a.median_views)[0]?.slot.toLowerCase() || "not enough data yet"}</span>. This is a pattern, not a guarantee. The video itself matters most.
                </p>
              </Panel>

              <Panel eyebrow="What wins for you" pattern="lines" className="lg:col-span-3">
                <div className="grid gap-5">
                  <div className="grid gap-2">
                    <h3 className="text-sm font-semibold">Hook types</h3>
                    <WinnersTable rows={st.hooks || []} label="Typical views by hook type" />
                  </div>
                  <div className="grid gap-2">
                    <h3 className="text-sm font-semibold">Pillars</h3>
                    <WinnersTable rows={st.pillars || []} label="Typical views by pillar" />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">From your last 120 days. New ideas and Hook Lab scores lean toward the top rows.</p>
              </Panel>

              <Panel
                eyebrow="Watch time and reach"
                pattern="dots"
                className="lg:col-span-6"
                action={
                  <Button size="sm" variant="outline" className="rounded-full px-3" onClick={() => setCk(true)}>
                    Add check-in
                  </Button>
                }
              >
                <CheckinList items={st.checkins || []} />
                <p className="text-muted-foreground text-sm">
                  TikTok keeps watch time, new followers per video and traffic sources inside its own app. Two days after posting, send one TikTok Studio screenshot to the Studio bot on Telegram, or type the numbers in with Add check-in. Over time this shows which hooks keep people watching.
                </p>
                <CheckinModal stats={st} open={ck} onClose={() => setCk(false)} />
              </Panel>

              <Panel eyebrow="Recent videos" pattern="dots" className="lg:col-span-6" bodyClassName="px-0 sm:px-0 md:px-0">
                <div className="grid gap-1 px-2 sm:px-4 md:hidden">
                  {st.recent.map((v) => (
                    <div key={v.id} className="grid">
                      <VideoRow v={v} />
                      {v.ratio != null && v.ratio >= 2 ? <span className="text-foreground -mt-1 mb-1 ml-[68px] text-xs font-semibold">{v.ratio}× your typical video</span> : null}
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto px-4 sm:px-6 md:block md:px-7">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-border border-b text-left text-[11px] font-semibold tracking-[0.1em] uppercase">
                        <th className="py-2 pr-3 font-semibold">Video</th>
                        <th className="py-2 pr-3 text-right font-semibold">Views</th>
                        <th className="py-2 pr-3 text-right font-semibold">Likes</th>
                        <th className="py-2 pr-3 text-right font-semibold">Comments</th>
                        <th className="py-2 pr-3 text-right font-semibold">Shares</th>
                        <th className="py-2 pr-3 text-right font-semibold">Eng.</th>
                        <th className="py-2 text-right font-semibold">vs typical</th>
                      </tr>
                    </thead>
                    <tbody>
                      {st.recent.map((v) => (
                        <tr key={v.id} className="border-border/60 hover:bg-muted/50 border-b last:border-0">
                          <td className="max-w-[320px] py-2 pr-3">
                            <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:underline">
                              <Cover v={v} className="h-10 w-8" />
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{cleanTitle(v.title)}</span>
                                <span className="text-muted-foreground text-xs">{shortDate(v.posted_at)}</span>
                              </span>
                            </a>
                          </td>
                          <td className="py-2 pr-3 text-right font-semibold tabular-nums">{n(v.views)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{n(v.likes)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{n(v.comments)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{n(v.shares)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{v.er}%</td>
                          <td className="py-2 text-right tabular-nums">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs", v.ratio != null && v.ratio >= 2 ? "bg-chart-1/15 text-foreground font-semibold" : "text-muted-foreground")}>
                              {v.ratio != null ? `${v.ratio}×` : "–"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <a href={`https://www.tiktok.com/${d.profile.handle || "@LLiLBiLL"}`} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-chart-1 inline-flex items-center gap-1 self-start px-4 text-sm font-medium hover:underline sm:px-6 md:px-7">
                  Open TikTok profile <ArrowRightUp className="size-4" />
                </a>
              </Panel>
            </Grid>
          )}
        </div>
      </section>
    </>
  );
}
