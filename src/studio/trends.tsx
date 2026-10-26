import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import Danger from "@iconify-react/solar/danger-triangle-linear";
import Fire from "@iconify-react/solar/fire-linear";

import { Button } from "@/components/ui/button";

import { Pill, nyDay } from "./bits";
import { useScriptFlow } from "./create";
import type { RadarItem } from "./data";
import StudioHero from "./hero";
import { SavedIdeasPanel } from "./saved";
import { SearchInsightsPanels } from "./search";
import { compact, shortDate } from "./insights";
import { CarouselButton } from "./carousel-button";
import { useStudio } from "./store";
import { Empty, Grid, Panel, Skeleton } from "./ui";

const daysLeft = (ymd: string) => Math.round((Date.parse(ymd + "T12:00:00Z") - Date.parse(nyDay() + "T12:00:00Z")) / 864e5);
const runLabel = (run?: string) => {
  if (!run) return "";
  const t = Date.parse(run.length === 16 ? run + ":00Z" : run);
  return Number.isFinite(t) ? `Checked ${shortDate(new Date(t).toISOString())}` : "";
};

function UseBy({ ymd }: { ymd: string }) {
  if (!ymd) return null;
  const n = daysLeft(ymd);
  if (n < 0) return <Pill>Passed</Pill>;
  return <Pill tone={n <= 3 ? "warn" : "accent"}>{n === 0 ? "Use today" : n === 1 ? "1 day left" : `${n} days left`}</Pill>;
}

export function TrendsPanel() {
  const s = useStudio();
  const d = s.d;
  const flow = useScriptFlow();
  const radar = d?.radar || [];
  const hot = radar.filter((r) => r.kind === "hot" && r.why).pop();
  const trends = radar.filter((r) => r.kind === "trend").sort((a, b) => (a.use_by || "9").localeCompare(b.use_by || "9"));
  const live = trends.filter((t) => !t.use_by || daysLeft(t.use_by) >= 0);
  const insp = radar.filter((r) => r.kind === "inspiration").sort((a, b) => b.ratio - a.ratio);
  const comments = radar.filter((r) => r.kind === "comment");
  const scriptTrend = (t: RadarItem) => void flow.write({ topic: `His own take on the trend "${t.title}". How to use it: ${t.how_to_use}` });
  const scriptInsp = (t: RadarItem) => void flow.write({ topic: `His own original version of a format that worked for ${t.source} ("${t.title}"), made from his life, not copied. Why it worked: ${t.why} How she can use it: ${t.how_to_use}` });

  return (
    <>
      <StudioHero
        eyebrow="Trends"
        title="What's rising and what people search"
        lead={radar.length ? `${runLabel(d?.radar_at)}. Trend radar checks fashion, coffee, couple and NYC TikTok every Sunday and Wednesday morning.` : "Trend radar checks fashion, coffee, couple and NYC TikTok every Sunday and Wednesday morning."}
      />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          {!d ? (
            <Skeleton className="h-72" />
          ) : !radar.length ? (
            <Grid>
              <Panel eyebrow="First run coming" pattern="dots" className="lg:col-span-6">
                <Empty>The first trend report lands after the next Sunday or Wednesday run, around 7:45 AM.</Empty>
              </Panel>
              <SavedIdeasPanel writing={flow.writing} onScript={(topic) => void flow.write({ topic })} />
              <SearchInsightsPanels writing={flow.writing} onScript={(topic, hook) => void flow.write({ topic, hook: hook || undefined })} />
            </Grid>
          ) : (
            <Grid>
              {hot ? (
                <Panel eyebrow="Hot this week" pattern="wave" className="lg:col-span-6" action={<Fire className="text-chart-1 size-5" />}>
                  <p className="max-w-[70ch] text-lg leading-relaxed font-medium whitespace-pre-line md:text-xl">{hot.why}</p>
                  <p className="text-muted-foreground text-xs">This also goes to your phone on Wednesdays once Telegram is connected.</p>
                </Panel>
              ) : null}

              <SavedIdeasPanel writing={flow.writing} onScript={(topic) => void flow.write({ topic })} />
              <SearchInsightsPanels writing={flow.writing} onScript={(topic, hook) => void flow.write({ topic, hook: hook || undefined })} />

              <Panel eyebrow={`Trends for your niche · ${live.length}`} pattern="lines" className="lg:col-span-3">
                {live.length ? (
                  <ul className="grid gap-3">
                    {live.map((t, i) => (
                      <li key={i} className="bg-background/70 border-border grid gap-2 rounded-xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold">{t.title}</h3>
                          <UseBy ymd={t.use_by} />
                        </div>
                        <p className="text-sm">{t.how_to_use}</p>
                        {t.flag ? (
                          <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                            <Danger className="mt-px size-4 shrink-0" /> {t.flag}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="rounded-full px-3" disabled={flow.writing} onClick={() => scriptTrend(t)}>
                            Script my version
                          </Button>
                          <CarouselButton topic={`My own take on the trend "${t.title}"`} label={`Trend: ${t.title}`} text={t.how_to_use} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>All of this run's trends have passed their use-by date. New ones arrive on the next run.</Empty>
                )}
                <a
                  href="https://ads.tiktok.com/business/creativecenter/inspiration/popular/music/pc/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary dark:text-chart-1 inline-flex items-center gap-1 self-start text-sm font-medium hover:underline"
                >
                  See TikTok's trending sounds <ArrowRightUp className="size-4" />
                </a>
              </Panel>

              <Panel eyebrow="Beating their own average" pattern="dots" className="lg:col-span-3">
                {insp.length ? (
                  <ul className="grid gap-3">
                    {insp.map((t, i) => (
                      <li key={i} className="bg-background/70 border-border grid gap-2 rounded-xl border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{t.source}</span>
                          <Pill tone="accent">{t.ratio}× their usual</Pill>
                          {t.views ? <span className="text-muted-foreground text-xs">{compact(t.views)} views</span> : null}
                        </div>
                        {t.url ? (
                          <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium hover:underline">
                            “{t.title}” <ArrowRightUp className="size-3.5" />
                          </a>
                        ) : (
                          <span className="font-medium">“{t.title}”</span>
                        )}
                        <p className="text-muted-foreground text-sm">
                          <span className="text-foreground font-medium">Why it worked: </span>
                          {t.why}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Your version: </span>
                          {t.how_to_use}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="rounded-full px-3" disabled={flow.writing} onClick={() => scriptInsp(t)}>
                            Script my version
                          </Button>
                          <CarouselButton topic={t.how_to_use || `My own version of "${t.title}"`} label={`Inspired by ${t.source} (not copied)`} text={`Format that worked for ${t.source}: "${t.title}". Why it worked: ${t.why}. Make it from her own life, never copy their words.`} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>No standout videos from the creators you follow this run.</Empty>
                )}
                <p className="text-muted-foreground text-xs">Inspired by the pattern, never copied: the Studio rewrites every idea around your own life.</p>
              </Panel>

              {comments.length ? (
                <Panel eyebrow="What your viewers are saying" pattern="wave" className="lg:col-span-6">
                  <ul className="grid gap-2 md:grid-cols-2">
                    {comments.map((q, i) => (
                      <li key={i} className="border-border flex flex-col gap-2 rounded-lg border p-3">
                        <span className="text-sm font-medium">“{q.title}”</span>
                        {q.why ? <span className="text-muted-foreground text-xs">Video idea: {q.why}</span> : null}
                        <span className="flex flex-wrap gap-1.5">
                          <Button size="xs" variant="outline" className="rounded-full px-2.5" disabled={flow.writing} onClick={() => void flow.write({ topic: `Reply-to-comment video answering a viewer who wrote: "${q.title}". ${q.why}`, hook: q.how_to_use || undefined })}>
                            Script a reply
                          </Button>
                          <CarouselButton size="xs" topic={`Answer my viewer's question: "${q.title}"`} label="A viewer's comment" text={`A viewer commented: "${q.title}". ${q.why}`}>
                            Answer as a carousel
                          </CarouselButton>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
            </Grid>
          )}
        </div>
      </section>
      {flow.ui}
    </>
  );
}
