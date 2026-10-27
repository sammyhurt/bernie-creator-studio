import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import ChatRoundDots from "@iconify-react/solar/chat-round-dots-linear";
import CheckCircle from "@iconify-react/solar/check-circle-linear";
import PenNew from "@iconify-react/solar/pen-new-square-linear";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { Pill, Spinner, Working, useAction, useToast } from "./bits";
import { engine, useEngine, type CommentInsight, type CommentKind, type GroupStat, type ScoredPost } from "./engine";
import StudioHero from "./hero";
import { compact, n, shortDate, signed } from "./insights";
import { useStudio } from "./store";
import { Empty, Grid, Panel, Skeleton, Stat } from "./ui";

export const x = (v: number) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + "×";
const scoreOf = (p: ScoredPost) => p.s7 || p.s24;
const ageH = (iso: string) => (Date.now() - Date.parse(iso)) / 36e5;

/** One line of the playbook: what it is, how it scores, how many posts back it up. */
function GroupRow({ g, tone }: { g: GroupStat; tone: "ok" | "warn" | "accent" }) {
  return (
    <li className="bg-background/70 border-border flex items-center justify-between gap-3 rounded-lg border p-3">
      <span className="min-w-0">
        <span className="block truncate font-medium first-letter:uppercase">{g.value}</span>
        <span className="text-muted-foreground text-xs">
          {g.dim} · {g.n} post{g.n === 1 ? "" : "s"}
        </span>
      </span>
      <Pill tone={tone} className="text-sm">{x(g.score)}</Pill>
    </li>
  );
}

export function VerdictPill({ p }: { p: ScoredPost }) {
  const sc = scoreOf(p);
  if (!sc) return <Pill>{ageH(p.posted_at) < 20 ? "Scoring at 24 h" : "Not enough history"}</Pill>;
  if (p.verdict === "win") return <Pill tone="ok">Win · {x(sc)}</Pill>;
  if (p.verdict === "miss") return <Pill tone="warn">Miss · {x(sc)}</Pill>;
  return <Pill tone="accent">Normal · {x(sc)}</Pill>;
}

/** The last 12 posts as bars against a 1× line, so a run of misses or wins is easy to see. */
function RecentBars() {
  const e = useEngine();
  const list = (e.data?.posts || []).filter((p) => scoreOf(p)).slice(0, 12).reverse();
  if (list.length < 3) return null;
  const CAP = 3;
  return (
    <div className="mt-auto grid gap-2">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">Your last {list.length} posts vs your normal</span>
      <div className="relative h-36" role="img" aria-label={list.map((p) => `${p.title.slice(0, 30)}: ${x(scoreOf(p))}`).join("; ")}>
        <div className="border-foreground/30 absolute inset-x-0 border-t border-dashed" style={{ bottom: `${(1 / CAP) * 100}%` }}>
          <span className="text-muted-foreground bg-card absolute -top-2.5 right-0 px-1 text-[10px]">1× normal</span>
        </div>
        <div className="absolute inset-0 flex items-end gap-1.5">
          {list.map((p) => {
            const sc = scoreOf(p);
            return (
              <div key={p.video_id} className="group/bar relative flex h-full flex-1 flex-col justify-end" title={`${p.title} · ${x(sc)}`}>
                <span className="text-muted-foreground mb-0.5 text-center text-[10px] tabular-nums">{sc > CAP ? x(sc) : ""}</span>
                <div className={cn("w-full rounded-t-md", p.verdict === "win" ? "bg-chart-1" : p.verdict === "miss" ? "bg-amber-500/70" : "bg-foreground/25")} style={{ height: `${Math.max(3, (Math.min(sc, CAP) / CAP) * 100)}%` }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-muted-foreground flex justify-between text-[10px]">
        <span>{shortDate(list[0].posted_at)}</span>
        <span>{shortDate(list[list.length - 1].posted_at)}</span>
      </div>
    </div>
  );
}

function Decisions() {
  const s = useStudio();
  const e = useEngine();
  const toast = useToast();
  const [added, setAdded] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const list = e.data?.playbook?.decisions || [];
  if (!list.length) return <Empty>Your 3 decisions for the week appear here every Monday morning.</Empty>;
  return (
    <ol className="grid gap-2.5">
      {list.map((d, i) => {
        const done = added.includes(d.text);
        return (
          <li key={i} className="bg-background/70 border-border grid gap-2 rounded-xl border p-3.5">
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold">{i + 1}</span>
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">{d.text}</span>
                {d.why ? <span className="text-muted-foreground mt-0.5 block text-sm">{d.why}</span> : null}
              </span>
            </div>
            <Button
              size="sm"
              variant={done ? "secondary" : "outline"}
              className="justify-self-start rounded-full"
              disabled={done || busy === d.text}
              onClick={async () => {
                setBusy(d.text);
                try {
                  const idea = await engine.decision(d.text, d.why || "From your Monday playbook");
                  if (idea) s.mutate((st) => ({ ...st, ideas: [idea, ...(st.ideas || [])] }));
                  setAdded((a) => [...a, d.text]);
                  toast("Added to Create");
                } catch (err) {
                  toast(err instanceof Error ? err.message : "That did not save.", "err");
                } finally {
                  setBusy("");
                }
              }}
            >
              {busy === d.text ? <Spinner /> : done ? <CheckCircle className="size-4" /> : null}
              {done ? "In Create" : "Do it: add to Create"}
            </Button>
          </li>
        );
      })}
    </ol>
  );
}

const KIND: Record<CommentKind, { label: string; tone: "ok" | "warn" | "accent" | "muted"; order: number }> = {
  buying: { label: "Where's it from?", tone: "ok", order: 0 },
  part2: { label: "Part 2, please", tone: "accent", order: 1 },
  question: { label: "Questions", tone: "accent", order: 2 },
  negative: { label: "Criticism", tone: "warn", order: 3 },
  praise: { label: "Praise", tone: "muted", order: 4 },
};

function CommentCard({ c }: { c: CommentInsight }) {
  const s = useStudio();
  const toast = useToast();
  const { busy, run } = useAction();
  const k = KIND[c.kind];
  return (
    <div className="bg-background/70 border-border grid content-start gap-2.5 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={k.tone}>{k.label}</Pill>
        <span className="text-muted-foreground text-xs">
          {c.count} comment{c.count === 1 ? "" : "s"}
          {c.likes ? ` · ${compact(c.likes)} likes` : ""}
        </span>
      </div>
      <p className="font-medium leading-snug">{c.text}</p>
      <p className="text-muted-foreground truncate text-xs">On “{c.video_title}”</p>
      {c.examples.length ? (
        <ul className="grid gap-1">
          {c.examples.slice(0, 3).map((t, i) => (
            <li key={i} className="bg-muted/60 rounded-lg px-3 py-2 text-sm">“{t}”</li>
          ))}
        </ul>
      ) : null}
      {c.idea ? (
        <div className="bg-chart-1/10 rounded-lg p-3 text-sm">
          <span className="text-muted-foreground mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">Next step</span>
          {c.idea}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {c.idea ? (
          <Button
            size="sm"
            className="rounded-full"
            disabled={!!busy}
            onClick={() =>
              void run("idea", async () => {
                const idea = await engine.decision(c.idea.slice(0, 200), `${c.count} people on “${c.video_title.slice(0, 60)}”: ${c.text}`.slice(0, 300));
                if (idea) s.mutate((st) => ({ ...st, ideas: [idea, ...(st.ideas || [])] }));
                await engine.commentDone(c.id);
                toast("Added to Create");
              })
            }
          >
            {busy === "idea" ? <Spinner /> : null} Make it an idea
          </Button>
        ) : null}
        <Button size="sm" variant="outline" className="rounded-full" disabled={!!busy} onClick={() => void run("done", () => engine.commentDone(c.id), "Marked done")}>
          {busy === "done" ? <Spinner /> : null} Done
        </Button>
      </div>
    </div>
  );
}

export function CommentsPanel({ className }: { className?: string }) {
  const e = useEngine();
  const list = [...(e.data?.comments || [])].sort((a, b) => KIND[a.kind].order - KIND[b.kind].order || b.count - a.count);
  return (
    <Panel eyebrow={`What your comments are asking${list.length ? ` · ${list.length}` : ""}`} pattern="dots" className={className} action={<ChatRoundDots className="text-chart-1 size-5" />}>
      {!e.data ? (
        <Skeleton className="h-40" />
      ) : list.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.slice(0, 9).map((c) => (
            <CommentCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <Empty>Comments on new posts are read about 2 days after you post. Questions, “where's it from?” and part-2 requests show up here with a next step, and on your phone when 3 or more people ask.</Empty>
      )}
      <p className="text-muted-foreground text-xs">Only comment text is read, never usernames. Nothing is ever replied to for you.</p>
    </Panel>
  );
}

function PostRow({ p }: { p: ScoredPost }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(p.note);
  const { busy, run } = useAction();
  const tags = [p.tags.hook, p.tags.format, p.tags.pillar].filter(Boolean);
  const young = ageH(p.posted_at) < 40;
  return (
    <li className="border-border border-b last:border-0">
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-3 md:grid-cols-[44px_minmax(0,1fr)_90px_90px_150px_auto]">
        <a href={p.url || undefined} target="_blank" rel="noopener noreferrer" className="bg-muted block aspect-[3/4] w-11 overflow-hidden rounded-md" aria-label={`Open “${p.title || "post"}” on TikTok`}>
          {p.cover ? <img src={p.cover} alt="" loading="lazy" className="size-full object-cover" onError={(ev) => ((ev.target as HTMLImageElement).style.display = "none")} /> : null}
        </a>
        <div className="min-w-0">
          <p className="truncate font-medium">{p.title || "Untitled post"}</p>
          <p className="text-muted-foreground truncate text-xs">
            {shortDate(p.posted_at)}
            {tags.length ? " · " + tags.join(" · ") : ""}
          </p>
          <div className="mt-1 md:hidden">
            <VerdictPill p={p} /> <span className="text-muted-foreground ml-1 text-xs tabular-nums">{compact(p.views)} views</span>
          </div>
        </div>
        <span className="hidden text-right text-sm tabular-nums md:block">{compact(p.views)}</span>
        <span className="text-muted-foreground hidden text-right text-xs tabular-nums md:block">{p.lifetime ? "older post" : p.v24 ? compact(p.v24) + " in 24 h" : "—"}</span>
        <span className="hidden md:block">
          <VerdictPill p={p} />
        </span>
        <Button size="icon-sm" variant={p.note ? "secondary" : "ghost"} onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Notes for “${p.title || "post"}”`}>
          <PenNew className="size-4" />
        </Button>
      </div>
      {open ? (
        <div className="bg-muted/40 mb-3 grid gap-3 rounded-xl p-3 md:ml-14">
          <p className="text-muted-foreground text-xs">
            {p.lifetime
              ? "This post is from before the Studio tracked it, so it is scored on its total views."
              : `Your normal when this went up: ${p.base24 ? compact(p.base24) + " views at 24 h" : "not enough posts yet"}${p.base7 ? `, ${compact(p.base7)} at 7 days` : ""}.`}
            {p.share_rate ? ` ${p.share_rate} shares and ${p.comment_rate} comments per 1,000 views.` : ""}
          </p>
          <label className="grid gap-1.5 text-sm font-medium">
            What were you testing? (a hook, a sound, a time…)
            <Textarea value={note} onChange={(ev) => setNote(ev.target.value)} maxLength={300} rows={2} placeholder="Tried a bold claim hook and posted at 7 PM" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full" disabled={!!busy || note === p.note} onClick={() => void run("note", () => engine.note(p.video_id, note.trim()), "Note saved")}>
              {busy === "note" ? <Spinner /> : null} Save note
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={!!busy || young}
              title={young ? "Comments are read once a post is about 2 days old" : undefined}
              onClick={() =>
                void run("comments", async () => {
                  const added = await engine.readComments(p.video_id);
                  toast(added ? `Found ${added} thing${added === 1 ? "" : "s"} your comments are asking` : "Read. Nothing stood out this time.");
                })
              }
            >
              {busy === "comments" ? <Spinner /> : <ChatRoundDots className="size-4" />} {busy === "comments" ? "Reading comments (up to 2 min)…" : "Read comments now"}
            </Button>
            {p.url ? (
              <Button size="sm" variant="ghost" className="rounded-full" asChild>
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  Open on TikTok <ArrowRightUp className="size-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

type Filter = "all" | "win" | "miss" | "new";
function PostsPanel() {
  const e = useEngine();
  const [f, setF] = useState<Filter>("all");
  const posts = e.data?.posts || [];
  const shown = posts.filter((p) => (f === "all" ? true : f === "new" ? ageH(p.posted_at) < 14 * 24 : p.verdict === f));
  const counts = { all: posts.length, win: posts.filter((p) => p.verdict === "win").length, miss: posts.filter((p) => p.verdict === "miss").length, new: posts.filter((p) => ageH(p.posted_at) < 14 * 24).length };
  const labels: Record<Filter, string> = { all: "All", new: "Last 14 days", win: "Wins", miss: "Misses" };
  return (
    <Panel eyebrow="Every post, scored against your normal" pattern="lines" className="lg:col-span-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts">
        {(["all", "new", "win", "miss"] as Filter[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setF(k)}
            aria-pressed={f === k}
            className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition-colors", f === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}
          >
            {labels[k]} <span className="opacity-70">{counts[k]}</span>
          </button>
        ))}
      </div>
      {!e.data ? (
        <Skeleton className="h-64" />
      ) : shown.length ? (
        <>
          <div className="text-muted-foreground hidden grid-cols-[44px_minmax(0,1fr)_90px_90px_150px_auto] gap-3 border-b pb-2 text-[11px] font-semibold tracking-[0.12em] uppercase md:grid">
            <span />
            <span>Post</span>
            <span className="text-right">Views</span>
            <span className="text-right">First day</span>
            <span>Result</span>
            <span className="w-8" />
          </div>
          <ul>
            {shown.map((p) => (
              <PostRow key={p.video_id} p={p} />
            ))}
          </ul>
        </>
      ) : (
        <Empty>No posts in this view yet.</Empty>
      )}
      <p className="text-muted-foreground text-xs">
        “Your normal” is the typical views of your 20 posts before each one. 1.5× or more is a win, 0.6× or less is a miss. Posts update every 3 hours.
      </p>
    </Panel>
  );
}

export function ResultsPanel() {
  const e = useEngine();
  const { busy, run } = useAction();
  const pb = e.data?.playbook;
  const w = pb?.week;
  const nums = pb?.numbers;
  const lead = pb
    ? pb.headline
    : "Every post is scored against your own normal, and each Monday morning you get a short playbook: what to do more of, what to drop, and 3 decisions for the week.";
  return (
    <>
      <StudioHero
        eyebrow="Results"
        title="What's working, in your numbers"
        lead={lead}
        actions={[{ label: busy === "pb" ? "Updating the playbook…" : "Update the playbook now", onClick: () => void run("pb", () => engine.runPlaybook(), "Playbook updated") }]}
      />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          {e.error && !e.data ? (
            <Panel eyebrow="Results" className="lg:col-span-6">
              <Empty>
                {e.error}{" "}
                <button type="button" className="text-primary font-medium underline" onClick={() => void e.refresh()}>
                  Try again
                </button>
              </Empty>
            </Panel>
          ) : (
            <Grid>
              {busy === "pb" ? (
                <div className="lg:col-span-6">
                  <Working text="Reading every post and writing your playbook. About 20 seconds." />
                </div>
              ) : null}
              <Panel eyebrow={pb ? `Last week · playbook from ${shortDate(pb.created_at)}` : "Last week"} pattern="wave" className="lg:col-span-4">
                {!e.data ? (
                  <Skeleton className="h-40" />
                ) : w ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Stat label={`Posts · goal ${w.goal}`} value={w.posts} />
                      <Stat label="New followers" value={signed(w.followers_gained)} />
                      <Stat label="Followers now" value={n(w.followers)} />
                      <Stat label={`Views · normal ${compact(w.normal_week)}`} value={compact(w.views)} />
                    </div>
                    {w.best ? (
                      <p className="text-sm">
                        <span className="font-semibold">Best post:</span> {w.best.title} ({x(w.best.score)} your normal).{" "}
                        <span className="text-muted-foreground">{pb?.best_why}</span>
                      </p>
                    ) : w.only ? (
                      <p className="text-sm">
                        <span className="font-semibold">Only post:</span> {w.only.title} ({n(w.only.views)} views so far).
                      </p>
                    ) : null}
                  </>
                ) : (
                  <Empty>Your first weekly scorecard lands Monday at 7:47 AM. Tap “Update the playbook now” to see it today.</Empty>
                )}
                {e.data ? <RecentBars /> : null}
              </Panel>
              <Panel eyebrow="This week: 3 decisions" pattern="dots" className="lg:col-span-2">
                {!e.data ? <Skeleton className="h-40" /> : <Decisions />}
              </Panel>

              <Panel eyebrow="Do more of" pattern="lines" className="lg:col-span-2">
                {!e.data ? <Skeleton className="h-32" /> : nums?.more.length ? <ul className="grid gap-2">{nums.more.map((g, i) => <GroupRow key={i} g={g} tone="ok" />)}</ul> : <Empty>Needs a few more posts with the same hook, format or topic.</Empty>}
              </Panel>
              <Panel eyebrow="Do less of" pattern="lines" className="lg:col-span-2">
                {!e.data ? <Skeleton className="h-32" /> : nums?.less.length ? <ul className="grid gap-2">{nums.less.map((g, i) => <GroupRow key={i} g={g} tone="warn" />)}</ul> : <Empty>Nothing is clearly holding you back yet.</Empty>}
              </Panel>
              <Panel eyebrow="Early signs (test again)" pattern="lines" className="lg:col-span-2">
                {!e.data ? <Skeleton className="h-32" /> : nums?.testing.length ? <ul className="grid gap-2">{nums.testing.map((g, i) => <GroupRow key={i} g={g} tone="accent" />)}</ul> : <Empty>New things you try show up here after a post or two.</Empty>}
                {nums?.outliers.length ? (
                  <p className="text-muted-foreground text-xs">
                    Left out as one-offs so they don't skew the averages: {nums.outliers.map((o) => `“${o.title.slice(0, 40)}${o.title.length > 40 ? "…" : ""}” (${x(o.score)})`).join(", ")}.
                  </p>
                ) : null}
              </Panel>

              <CommentsPanel className="lg:col-span-6" />
              <PostsPanel />
            </Grid>
          )}
        </div>
      </section>
    </>
  );
}
