import Magic from "@iconify-react/solar/magic-stick-3-linear";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { Field, Modal, NativeSelect, PILLARS, Spinner, Working, useAction } from "./bits";
import type { Hook, Idea, Script } from "./data";
import StudioHero from "./hero";
import { HookLab, IdeaCard, ScriptModal } from "./ideas";
import { useStudio } from "./store";
import { Empty, Grid, Panel, Skeleton } from "./ui";

type Filter = "new" | "saved" | "scripted" | "all";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "new", label: "New" },
  { id: "saved", label: "Saved" },
  { id: "scripted", label: "Scripted" },
  { id: "all", label: "All" },
];

/** Shared script flow: writes a script (30–60s) then opens it. Used by Create, Plan and Trends. */
export function useScriptFlow() {
  const s = useStudio();
  const { busy, run } = useAction();
  const [open, setOpen] = useState<{ idea: Idea | null; script: Script } | null>(null);
  const write = async (input: { idea?: Idea; topic?: string; hook?: string }) => {
    if (input.idea?.script && !input.hook) {
      setOpen({ idea: input.idea, script: input.idea.script });
      return;
    }
    const r = await run("script", () => s.script({ idea_id: input.idea?.id || undefined, topic: input.idea ? undefined : input.topic, hook: input.hook }));
    if (r) setOpen({ idea: r.idea || input.idea || null, script: r.script });
  };
  const ui = (
    <>
      <Modal open={busy === "script"} onClose={() => {}} title="Writing your script">
        <Working text="Writing the hook, shot list, caption and hashtags from what works on your account. This takes about 30–60 seconds." />
      </Modal>
      <ScriptModal idea={open?.idea || null} script={open?.script || null} onClose={() => setOpen(null)} />
    </>
  );
  return { write, ui, writing: busy === "script" };
}

export function CreatePanel() {
  const s = useStudio();
  const d = s.d;
  const { busy, run } = useAction();
  const [pillar, setPillar] = useState("");
  const [own, setOwn] = useState("");
  const [filter, setFilter] = useState<Filter>("new");
  const [seed, setSeed] = useState<{ topic: string; idea?: Idea } | null>(null);
  const [fresh, setFresh] = useState<number[]>([]);
  const lab = useRef<HTMLDivElement>(null);
  const flow = useScriptFlow();

  const active = useMemo(() => s.ideas.filter((x) => !["skipped", "posted", "filmed", "planned"].includes(x.status)), [s.ideas]);
  const shown = useMemo(() => {
    const f = filter === "all" ? active : filter === "new" ? active.filter((x) => x.status === "idea") : active.filter((x) => x.status === filter);
    return [...f].sort((a, b) => (fresh.includes(b.id) ? 1 : 0) - (fresh.includes(a.id) ? 1 : 0) || Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [active, filter, fresh]);
  const questions = (d?.radar || []).filter((r) => r.kind === "comment");

  const hooksFor = (i: Idea) => {
    setSeed({ topic: i.title, idea: i });
    setTimeout(() => lab.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const scriptHook = (h: Hook, topic: string, idea?: Idea) => void flow.write({ idea, topic, hook: h.say || h.on_screen });

  return (
    <>
      <StudioHero eyebrow="Create" title="Ideas, hooks and scripts" lead="Ideas built from your own best videos and this week's trends. Pick one, test hooks, and get a script you can film today." />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          {!d ? (
            <Skeleton className="h-72" />
          ) : (
            <Grid>
              <Panel eyebrow="Get ideas" pattern="dots" className="lg:col-span-6">
                <form
                  className="grid gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_auto] md:items-end"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const rows = await run("ideas", () => s.getIdeas(pillar, own.trim()), "5 new ideas are ready");
                    if (rows) {
                      setFresh(rows.map((r) => r.id));
                      setFilter("new");
                      setOwn("");
                    }
                  }}
                >
                  <Field label="Pillar">
                    <NativeSelect value={pillar} onChange={setPillar} options={[{ value: "", label: "Mix of all five" }, ...PILLARS.map((p) => ({ value: p, label: p }))]} ariaLabel="Pillar" className="h-11" />
                  </Field>
                  <Field label="Your own idea (optional)">
                    <Textarea value={own} onChange={(e) => setOwn(e.target.value)} placeholder="e.g. Meredith rates my outfit before date night" className="min-h-11" rows={1} maxLength={500} />
                  </Field>
                  <Button type="submit" className="h-11 rounded-full px-5" disabled={busy === "ideas"}>
                    {busy === "ideas" ? <Spinner /> : <Magic className="size-4" />} Get 5 ideas
                  </Button>
                </form>
                {busy === "ideas" ? <Working text="Reading your best videos and this week's trends, then writing 5 ideas. About 20–40 seconds." /> : null}
              </Panel>

              <Panel
                eyebrow={`Your ideas · ${active.length}`}
                pattern="wave"
                className="lg:col-span-6"
                action={
                  <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter ideas">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="tab"
                        aria-selected={filter === f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                }
              >
                {shown.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {shown.map((i) => (
                      <IdeaCard key={i.id} idea={i} onScript={(x) => void flow.write({ idea: x })} onHooks={hooksFor} />
                    ))}
                  </div>
                ) : (
                  <Empty>{filter === "new" ? "No new ideas right now. Tap Get 5 ideas above, or wait for Sunday's brief." : "Nothing here yet."}</Empty>
                )}
                <p className="text-muted-foreground text-xs">Planned videos move to the Plan tab. “Not for me” hides an idea and teaches the Studio what you skip.</p>
              </Panel>

              <Panel eyebrow="Hook Lab" pattern="lines" className="lg:col-span-6">
                <div ref={lab} className="scroll-mt-32" aria-hidden />
                <HookLab seed={seed} onUse={scriptHook} />
              </Panel>

              <Panel eyebrow="From your comments" pattern="dots" className="lg:col-span-6">
                {questions.length ? (
                  <>
                    <ul className="grid gap-2">
                        {questions.map((q, i) => (
                          <li key={i} className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">“{q.title}”</span>
                              {q.why ? <span className="text-muted-foreground text-xs">Video idea: {q.why}</span> : null}
                            </span>
                            <Button size="sm" variant="outline" className="shrink-0 rounded-full px-3" disabled={flow.writing} onClick={() => void flow.write({ topic: `Reply-to-comment video answering a viewer who asked: "${q.title}". ${q.why}`, hook: q.how_to_use || undefined })}>
                              Script a reply
                            </Button>
                          </li>
                        ))}
                    </ul>
                    <p className="text-muted-foreground text-xs">A reply video shows the viewer's comment on screen. It answers a real question and tells TikTok people want more from you. Each of these ideas is also in Your ideas above.</p>
                  </>
                ) : (
                  <Empty>Every Sunday and Wednesday the Studio reads your recent comments and turns real questions into video ideas. They show up here.</Empty>
                )}
              </Panel>
            </Grid>
          )}
        </div>
      </section>
      {flow.ui}
    </>
  );
}
