import CheckCircle from "@iconify-react/solar/check-circle-linear";
import ClockCircle from "@iconify-react/solar/clock-circle-linear";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/config";
import { cn } from "@/lib/utils";

import { CopyButton, dayLabel, nyDay, timeLabel } from "./bits";
import { CONNECT_URL } from "./data";
import StudioHero from "./hero";
import { cleanTitle, compact, n, signed, updatedLabel } from "./insights";
import { GrowthTeaser } from "./growth";
import { PLAN_VIEW_KEY } from "./plan";
import { RequestList } from "./request";
import { useStudio } from "./store";
import { Empty, Grid, LinkButton, Panel, Skeleton, Stat } from "./ui";

const greeting = () => {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(new Date())) % 24;
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

function Check({ done, title, sub, action }: { done: boolean; title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="bg-background/70 border-border grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 rounded-lg border p-3.5 sm:grid-cols-[28px_minmax(0,1fr)_auto] sm:items-center">
      <span className={cn("mt-0.5 grid size-7 place-items-center rounded-full", done ? "bg-chart-1/15 text-chart-1" : "bg-muted text-muted-foreground")}>
        {done ? <CheckCircle className="size-4.5" /> : <ClockCircle className="size-4.5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="text-muted-foreground block text-[13px]">{sub}</span>
      </span>
      {action ? <span className="col-start-2 sm:col-start-auto">{action}</span> : null}
    </div>
  );
}

const TIKTOK_ONE = "https://ads.tiktok.com/resources/help/article/how-creators-can-sign-up-for-tiktok-one?lang=en";

export function HomePanel() {
  const s = useStudio();
  const { d, goto } = s;
  const p = d?.profile || {};
  const setup = d?.setup;
  const today = nyDay();
  const next = s.ideas.filter((x) => x.status === "planned" && x.plan_date >= today).sort((a, b) => (a.plan_date + a.plan_time).localeCompare(b.plan_date + b.plan_time));
  const planned7 = next.filter((x) => x.plan_date <= nyDay(6)).length;
  const fresh = s.ideas.filter((x) => x.status === "idea").length;
  const brief = d?.brief?.data;
  const lead = !d
    ? "Loading your Studio…"
    : next.length
      ? `Next up: ${next[0].title}, ${dayLabel(next[0].plan_date).toLowerCase()}. ${planned7} ${planned7 === 1 ? "video" : "videos"} planned this week.`
      : fresh
        ? `You have ${fresh} fresh ${fresh === 1 ? "idea" : "ideas"} waiting. Pick two and plan your week.`
        : "Get a few ideas, plan your week, and film when it suits you.";
  return (
    <>
      <StudioHero
        big
        eyebrow={`Bernie Creator Studio · ${p.handle || siteConfig.handle}`}
        title={`${greeting()}, Bernie`}
        lead={lead}
        actions={[
          { label: next.length ? "Open my plan" : "Get ideas", onClick: () => goto(next.length ? "plan" : "create") },
          { label: "Open TikTok", href: siteConfig.tiktok, variant: "outline" },
        ]}
      />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          <Grid>
            <Panel eyebrow="Coming up" pattern="lines" className="lg:col-span-3">
              {!d ? (
                <Skeleton className="h-40" />
              ) : next.length ? (
                <ul className="grid gap-2">
                  {next.slice(0, 4).map((x) => (
                    <li key={x.id} className="bg-background/70 border-border grid grid-cols-[104px_minmax(0,1fr)] gap-3 rounded-lg border p-3">
                      <span className="text-sm">
                        <span className="block font-semibold">{dayLabel(x.plan_date, true)}</span>
                        <span className="text-muted-foreground text-xs">{timeLabel(x.plan_time)}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{x.title}</span>
                        <span className="text-muted-foreground text-xs">{x.script ? "Script ready" : "No script yet"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Nothing planned yet. Pick ideas in Create and tap Plan.</Empty>
              )}
              <LinkButton onClick={() => goto("plan")}>Open the plan →</LinkButton>
            </Panel>

            <Panel eyebrow={d?.brief ? `Sunday brief · ${dayLabel(d.brief.week_of)}` : "Sunday brief"} pattern="wave" className="lg:col-span-3">
              {!d ? (
                <Skeleton className="h-48" />
              ) : brief ? (
                <>
                  <h3 className="font-serif text-2xl leading-tight">{brief.headline || d.brief?.headline}</h3>
                  {brief.summary ? <p className="text-sm">{brief.summary}</p> : null}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {brief.focus ? (
                      <div className="bg-secondary/60 dark:bg-secondary/40 rounded-lg p-3 text-sm">
                        <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.12em] uppercase">Focus this week</div>
                        {brief.focus}
                      </div>
                    ) : null}
                    {brief.best_time ? (
                      <div className="bg-secondary/60 dark:bg-secondary/40 rounded-lg p-3 text-sm">
                        <div className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-[0.12em] uppercase">Best time to post</div>
                        {brief.best_time}
                      </div>
                    ) : null}
                  </div>
                  <LinkButton onClick={() => goto("create")}>See this week's 5 ideas →</LinkButton>
                </>
              ) : (
                <Empty>Every Sunday at 9:15 AM you get a short brief by email: how the week went, one focus, and 5 ideas for the week ahead. The first one lands this Sunday.</Empty>
              )}
            </Panel>

            <Panel eyebrow="Road to 10K" pattern="wave" className="lg:col-span-6">
              {d ? <GrowthTeaser /> : <Skeleton className="h-24" />}
              <LinkButton
                onClick={() => {
                  try {
                    localStorage.setItem(PLAN_VIEW_KEY, "growth");
                  } catch {
                    /* ignore */
                  }
                  goto("plan");
                }}
              >
                {d?.growth?.latest ? "Open my growth plan →" : "Make my growth plan →"}
              </LinkButton>
            </Panel>

            <Panel eyebrow="Your numbers" pattern="lines" className="lg:col-span-6" action={d?.stats ? <span className="text-muted-foreground text-xs">{updatedLabel(d.stats.updated_at)}</span> : undefined}>
              {d?.stats ? (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat label={d.stats.followers_7d != null ? `Followers · ${signed(d.stats.followers_7d)} this week` : "Followers"} value={n(d.stats.followers)} />
                    <Stat label="Total likes" value={compact(d.stats.likes)} />
                    <Stat label="Videos" value={n(d.stats.videos)} />
                    <Stat label="Avg views · 30 days" value={compact(d.stats.avg_views_30d)} />
                  </div>
                  {d.stats.spikes.length ? (
                    <p className="bg-chart-1/10 border-chart-1/30 rounded-lg border p-3 text-sm">
                      <span className="font-semibold">Taking off:</span> "{cleanTitle(d.stats.spikes[0].title)}" is at {d.stats.spikes[0].ratio}× your typical views. Reply to comments and film a part 2.
                    </p>
                  ) : null}
                </>
              ) : (
                <Empty>{setup?.tiktok_connected ? "TikTok is connected. Your first numbers arrive within 3 hours." : "Connect TikTok above and your followers, likes and video stats appear here."}</Empty>
              )}
              <LinkButton onClick={() => goto("insights")}>{d?.stats ? "See what's working →" : "What Insights will show →"}</LinkButton>
            </Panel>

            <Panel eyebrow="Setup checklist" pattern="dots" className="lg:col-span-3">
              {!d ? (
                <Skeleton className="h-48" />
              ) : (
                <div className="grid gap-2.5">
                  <Check done title="Studio unlocked" sub="Your passcode works on this device." />
                  <Check
                    done={!!setup?.tiktok_connected}
                    title="TikTok connected"
                    sub={setup?.tiktok_connected ? "Your followers and video stats can load." : "Log in once so the Studio can read your stats. It cannot post or message."}
                    action={
                      setup?.tiktok_connected ? undefined : (
                        <Button size="sm" className="rounded-full px-4" asChild>
                          <a href={CONNECT_URL} target="_blank" rel="noopener noreferrer">Connect TikTok</a>
                        </Button>
                      )
                    }
                  />
                  <Check done={!!setup?.telegram_ready} title="Phone alerts" sub={setup?.telegram_ready ? "Spike alerts, hot trends and check-ins work on your phone." : "In Telegram, open @BriceStudiobot and send: bcs"}
                    action={
                      setup?.telegram_ready ? undefined : (
                        <Button size="sm" variant="outline" className="rounded-full px-4" asChild>
                          <a href="https://t.me/BriceStudiobot?start=bcs" target="_blank" rel="noopener noreferrer">Open bot</a>
                        </Button>
                      )
                    } />
                  <Check
                    done={false}
                    title="Join TikTok One"
                    sub="So brands can find and pay you. In TikTok: Profile → TikTok Studio → Creator Marketplace. You already pass the 1,000-follower minimum."
                    action={
                      <Button size="sm" variant="outline" className="rounded-full px-4" asChild>
                        <a href={TIKTOK_ONE} target="_blank" rel="noopener noreferrer">How to join</a>
                      </Button>
                    }
                  />
                  <Check
                    done={!!d.links?.stats.has_data}
                    title="Link page in your TikTok bio"
                    sub={d.links?.stats.has_data ? "Visits and taps are counting. See them in Insights." : "Swap your Linktree for your own link page so the Studio can count taps. In TikTok: Edit profile → Website."}
                    action={d.links?.stats.has_data ? undefined : <CopyButton text={`${d.links?.page_url || "https://bernie-creator-studio.netlify.app/links/"}?s=tiktok`} label="Copy bio link" />}
                  />
                  <Check done={!!setup?.ideas_email} title="Ideas by email" sub={setup?.ideas_email ? `Ideas and drafts go to ${setup.ideas_email}.` : "Add an email for ideas and drafts."} />
                </div>
              )}
            </Panel>

            <Panel
              eyebrow="Your ideas for the Studio"
              pattern="dots"
              className="lg:col-span-3"
              action={
                <Button size="sm" className="rounded-full px-3" onClick={() => s.openRequest()}>
                  Suggest a feature
                </Button>
              }
            >
              {d ? <RequestList items={d.requests || []} /> : <Skeleton className="h-24" />}
            </Panel>



          </Grid>
        </div>
      </section>
    </>
  );
}
