import Bookmark from "@iconify-react/solar/bookmark-linear";
import CalendarAdd from "@iconify-react/solar/calendar-add-linear";
import DocumentText from "@iconify-react/solar/document-text-linear";
import LightbulbBolt from "@iconify-react/solar/lightbulb-bolt-linear";
import Trash from "@iconify-react/solar/trash-bin-minimalistic-linear";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { CopyButton, Field, Modal, NativeSelect, Pill, Spinner, Working, dayLabel, nyDay, timeLabel, useAction } from "./bits";
import type { Hook, Idea, Script } from "./data";
import { CarouselButton } from "./carousel-button";
import { useStudio } from "./store";

export const STATUS_LABEL: Record<string, string> = { idea: "New", saved: "Saved", scripted: "Scripted", planned: "Planned", filmed: "Filmed", posted: "Posted", skipped: "Skipped" };
const SOURCE_LABEL: Record<string, string> = { studio: "Get Ideas", brief: "Sunday brief", comments: "From your comments", radar: "Trend radar" };

/** Plain text of a script, ready to paste into Notes. */
export function scriptText(s: Script) {
  const lines = [
    s.title,
    "",
    `HOOK (say): ${s.hook}`,
    s.on_screen_hook ? `HOOK (on screen): ${s.on_screen_hook}` : "",
    s.length_sec ? `Length: about ${s.length_sec}s` : "",
    "",
    "SHOTS",
    ...(s.shots || []).map((x) => `${x.sec}s · ${x.shot}${x.say ? `\n   Say: ${x.say}` : ""}${x.on_screen ? `\n   Text: ${x.on_screen}` : ""}`),
    "",
    "CAPTION",
    `${s.caption} ${(s.hashtags || []).map((h) => (h.startsWith("#") ? h : "#" + h)).join(" ")}`.trim(),
    s.cta ? `\nCall to action: ${s.cta}` : "",
    s.sound_tip ? `Sound: ${s.sound_tip}` : "",
    (s.filming_tips || []).length ? `\nFilming tips:\n${s.filming_tips.map((t) => "• " + t).join("\n")}` : "",
  ];
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}
const captionText = (s: Script) => `${s.caption} ${(s.hashtags || []).map((h) => (h.startsWith("#") ? h : "#" + h)).join(" ")}`.trim();

export function ScriptView({ s }: { s: Script }) {
  return (
    <div className="grid gap-5">
      <div className="bg-chart-1/10 border-chart-1/30 rounded-xl border p-4">
        <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">Hook · first 2 seconds</div>
        <p className="mt-1.5 font-serif text-xl leading-snug">“{s.hook}”</p>
        {s.on_screen_hook ? (
          <p className="text-muted-foreground mt-2 text-sm">
            On screen: <span className="text-foreground font-medium">{s.on_screen_hook}</span>
          </p>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="font-semibold">Shot list</h3>
          {s.length_sec ? <span className="text-muted-foreground text-sm">about {s.length_sec} seconds</span> : null}
        </div>
        <ol className="grid gap-2">
          {(s.shots || []).map((x, i) => (
            <li key={i} className="border-border grid grid-cols-[56px_minmax(0,1fr)] gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground font-mono text-xs tabular-nums">{x.sec}s</span>
              <span className="grid gap-1 text-sm">
                <span className="font-medium">{x.shot}</span>
                {x.say ? (
                  <span>
                    <span className="text-muted-foreground">Say: </span>
                    {x.say}
                  </span>
                ) : null}
                {x.on_screen ? (
                  <span>
                    <span className="text-muted-foreground">Text: </span>
                    {x.on_screen}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Caption and hashtags</h3>
          <CopyButton text={captionText(s)} label="Copy caption" size="xs" />
        </div>
        <p className="bg-muted/60 rounded-lg p-3 text-sm">
          {s.caption} <span className="text-chart-1 dark:text-chart-1">{(s.hashtags || []).map((h) => (h.startsWith("#") ? h : "#" + h)).join(" ")}</span>
        </p>
      </div>

      {(s.keywords || []).length ? (
        <div className="grid gap-2">
          <h3 className="font-semibold">Search words to say and show</h3>
          <div className="flex flex-wrap gap-1.5">
            {s.keywords.map((k) => (
              <Pill key={k}>{k}</Pill>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">Say the main one out loud in the first 5 seconds and put it in your on-screen text. TikTok search reads both.</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {s.sound_tip ? (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">Sound</div>
            {s.sound_tip}
          </div>
        ) : null}
        {s.cta ? (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">Ending</div>
            {s.cta}
          </div>
        ) : null}
      </div>
      {(s.filming_tips || []).length ? (
        <ul className="grid gap-1.5 text-sm">
          {s.filming_tips.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="bg-chart-1 mt-2 size-1.5 shrink-0 rounded-full" />
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ScriptModal({ idea, script, onClose }: { idea: Idea | null; script: Script | null; onClose: () => void }) {
  const [plan, setPlan] = useState(false);
  return (
    <>
      <Modal open={!!script} onClose={onClose} title={script?.title || idea?.title || "Script"} wide>
        {script ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap gap-2">
              <CopyButton text={() => scriptText(script)} label="Copy whole script" variant="default" />
              {idea && idea.id && idea.status !== "planned" ? (
                <Button variant="outline" size="sm" className="rounded-full px-3" onClick={() => setPlan(true)}>
                  <CalendarAdd className="size-4" /> Add to plan
                </Button>
              ) : null}
            </div>
            <ScriptView s={script} />
          </div>
        ) : null}
      </Modal>
      {idea && plan ? <PlanModal key={idea.id} idea={idea} onClose={() => setPlan(false)} /> : null}
    </>
  );
}

export const TIMES = [
  { value: "08:00", label: "8:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:30", label: "8:30 PM" },
  { value: "21:30", label: "9:30 PM" },
];

/** Pick a posting day and time; the suggested time comes from her own best slot. */
export function PlanModal({ idea, onClose }: { idea: Idea | null; onClose: () => void }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const best = [...(s.d?.stats?.slots || [])].filter((x) => x.posts >= 5).sort((a, b) => b.median_views - a.median_views)[0]?.slot;
  const suggested = best === "Morning" ? "08:00" : best === "Afternoon" ? "13:00" : best === "Late night" ? "21:30" : "19:00";
  const [date, setDate] = useState(idea?.plan_date && idea.plan_date >= nyDay() ? idea.plan_date : nyDay(1));
  const [time, setTime] = useState(idea?.plan_time || suggested);
  const [series, setSeries] = useState(idea?.series || "");
  if (!idea) return null;
  return (
    <Modal open={!!idea} onClose={onClose} title="Add to your plan">
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run("plan", () => s.updateIdea(idea, { status: idea.status === "filmed" ? "filmed" : "planned", plan_date: date, plan_time: time, series: series.trim() }), `Planned for ${dayLabel(date)}`);
          if (ok) onClose();
        }}
      >
        <p className="text-sm">
          <span className="font-medium">{idea.title}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Post on">
            <Input type="date" value={date} min={nyDay()} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Time">
            <NativeSelect value={time} onChange={setTime} options={TIMES.some((t) => t.value === time) ? TIMES : [{ value: time, label: timeLabel(time) }, ...TIMES]} ariaLabel="Time" />
          </Field>
        </div>
        {best ? <p className="text-muted-foreground -mt-2 text-xs">Your {best.toLowerCase()} posts do best so far{time === suggested ? ", so that time is picked for you" : ""}.</p> : null}
        <Field label="Series (optional)" hint="A name you reuse, like “Married in NYC”. Series give people a reason to follow.">
          <Input value={series} onChange={(e) => setSeries(e.target.value)} placeholder="e.g. Married in NYC" maxLength={60} />
        </Field>
        <Button type="submit" className="h-11 rounded-full" disabled={busy === "plan"}>
          {busy === "plan" ? <Spinner /> : <CalendarAdd className="size-4" />} Save to plan
        </Button>
      </form>
    </Modal>
  );
}

/** One idea, with every next step one tap away. */
export function IdeaCard({ idea, onScript, onHooks, compact = false }: { idea: Idea; onScript: (i: Idea) => void; onHooks: (i: Idea) => void; compact?: boolean }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [plan, setPlan] = useState(false);
  return (
    <article className="bg-background/70 border-border flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {idea.pillar ? <Pill>{idea.pillar}</Pill> : null}
        {idea.status !== "idea" ? <Pill tone={idea.status === "planned" ? "accent" : idea.status === "posted" ? "ok" : "muted"}>{STATUS_LABEL[idea.status]}</Pill> : null}
        {idea.status === "planned" && idea.plan_date ? (
          <Pill tone="accent">
            {dayLabel(idea.plan_date)}
            {idea.plan_time ? ` · ${timeLabel(idea.plan_time)}` : ""}
          </Pill>
        ) : null}
        {idea.series ? <Pill>Series: {idea.series}</Pill> : null}
        {idea.source && idea.source !== "studio" ? <Pill>{SOURCE_LABEL[idea.source] || idea.source}</Pill> : null}
      </div>
      <h3 className="text-lg leading-snug font-semibold tracking-tight">{idea.title}</h3>
      {idea.hook ? (
        <p className="text-[15px] leading-snug font-medium">
          <span className="text-muted-foreground mr-1 text-[11px] font-semibold tracking-[0.12em] uppercase">Hook</span>“{idea.hook}”
        </p>
      ) : null}
      {!compact && idea.format ? <p className="text-muted-foreground text-sm">{idea.format}</p> : null}
      {!compact && idea.why ? <p className="text-sm">{idea.why}</p> : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button size="sm" className="rounded-full px-3" onClick={() => onScript(idea)} disabled={!!busy}>
          <DocumentText className="size-4" /> {idea.script ? "Open script" : "Write script"}
        </Button>
        <Button size="sm" variant="outline" className="rounded-full px-3" onClick={() => onHooks(idea)} disabled={!!busy}>
          <LightbulbBolt className="size-4" /> Hooks
        </Button>
        <Button size="sm" variant="outline" className="rounded-full px-3" onClick={() => setPlan(true)} disabled={!!busy}>
          <CalendarAdd className="size-4" /> {idea.status === "planned" ? "Move" : "Plan"}
        </Button>
        <CarouselButton topic={idea.title} label={`Idea: ${idea.title}`} text={[idea.hook ? `Hook: ${idea.hook}` : "", idea.why || "", idea.format || ""].filter(Boolean).join(" ")}>
          Carousel
        </CarouselButton>
        {idea.status === "idea" ? (
          <Button size="sm" variant="ghost" className="rounded-full px-3" disabled={!!busy} onClick={() => run("save", () => s.updateIdea(idea, { status: "saved" }), "Saved")}>
            {busy === "save" ? <Spinner /> : <Bookmark className="size-4" />} Save
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground rounded-full px-3"
          disabled={!!busy}
          onClick={() => run("skip", () => s.updateIdea(idea, { status: "skipped" }), "Removed")}
          aria-label="Not for me"
        >
          {busy === "skip" ? <Spinner /> : <Trash className="size-4" />}
          <span className="sr-only sm:not-sr-only">Not for me</span>
        </Button>
      </div>
      {plan ? <PlanModal key={idea.id} idea={idea} onClose={() => setPlan(false)} /> : null}
    </article>
  );
}

/** Hook Lab: 10 openings for one topic, scored for her audience. */
export function HookLab({ seed, onUse }: { seed: { topic: string; idea?: Idea } | null; onUse: (hook: Hook, topic: string, idea?: Idea) => void }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [topic, setTopic] = useState(seed?.topic || "");
  const [hooks, setHooks] = useState<Hook[] | null>(null);
  const [forIdea, setForIdea] = useState<Idea | undefined>(seed?.idea);
  const [lastSeed, setLastSeed] = useState(seed);
  if (seed !== lastSeed) {
    setLastSeed(seed);
    setTopic(seed?.topic || "");
    setForIdea(seed?.idea);
    setHooks(null);
  }
  const go = async () => {
    const t = topic.trim();
    if (t.length < 3) return;
    const h = await run("hooks", () => s.hooks(forIdea && forIdea.title === t ? { idea_id: forIdea.id } : { topic: t }));
    if (h) setHooks(h);
  };
  return (
    <div className="grid gap-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void go();
        }}
      >
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What is the video about? e.g. my Sunday reset in Brooklyn" className="h-11" maxLength={300} aria-label="Video topic" />
        <Button type="submit" className="h-11 rounded-full px-5" disabled={busy === "hooks" || topic.trim().length < 3}>
          {busy === "hooks" ? <Spinner /> : <LightbulbBolt className="size-4" />} Get 10 hooks
        </Button>
      </form>
      {busy === "hooks" ? <Working text="Writing 10 hooks and scoring them for your audience. About 20 seconds." /> : null}
      {hooks && !busy ? (
        <ol className="grid gap-2">
          {hooks.map((h, i) => (
            <li key={i} className="border-border grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-lg border p-3 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center">
              <span className={cn("grid size-9 place-items-center rounded-full text-sm font-bold tabular-nums", Number(h.score) >= 8 ? "bg-chart-1 text-white" : "bg-muted")}>{h.score}</span>
              <span className="grid min-w-0 gap-0.5">
                <span className="font-medium">“{h.say || h.on_screen}”</span>
                {h.on_screen && h.say ? <span className="text-muted-foreground text-sm">On screen: {h.on_screen}</span> : null}
                <span className="text-muted-foreground text-xs">
                  {h.hook_type}
                  {h.why ? ` · ${h.why}` : ""}
                </span>
              </span>
              <span className="col-start-2 flex gap-2 sm:col-start-auto">
                <CopyButton text={h.say || h.on_screen} size="xs" />
                <Button size="xs" className="rounded-full px-2.5" onClick={() => onUse(h, topic.trim(), forIdea && forIdea.title === topic.trim() ? forIdea : undefined)}>
                  Script it
                </Button>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {!hooks && busy !== "hooks" ? <p className="text-muted-foreground text-sm">Scores lean toward the hook types that already work on your account. 8 and up are the ones to film.</p> : null}
    </div>
  );
}
