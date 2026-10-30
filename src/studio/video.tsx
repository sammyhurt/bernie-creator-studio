import CheckCircle from "@iconify-react/solar/check-circle-linear";
import Magic from "@iconify-react/solar/magic-stick-3-linear";
import Pen from "@iconify-react/solar/pen-linear";
import Restart from "@iconify-react/solar/restart-linear";
import VideoIcon from "@iconify-react/solar/video-frame-play-vertical-linear";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { CopyButton, Field, NativeSelect, PILLARS, Pill, Spinner, Working, useAction } from "./bits";
import { VIDEO_URL, studioPost, toVideoRun, type VideoRun, type VideoSummary } from "./data";
import { readVideo, type VideoRead } from "./videoread";

const EMPTY: VideoSummary = { what_happens: "", moments: "", on_screen_text: "", setting: "", people: "", mood: "", pillar: "" };
const MAX_FILE = 1024 * 1024 * 1024;
const when = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
};
const statusPill = (r: VideoRun) =>
  r.status === "posted" ? <Pill tone="ok">Posted</Pill> : r.used_hook ? <Pill tone="accent">Hook picked</Pill> : r.body ? <Pill tone="accent">Hooks ready</Pill> : <Pill>Summary only</Pill>;

type Phase = "pick" | "reading" | "summary" | "writing" | "done";

export function VideoLab() {
  const { busy, run } = useAction();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState("");
  const [phase, setPhase] = useState<Phase>("pick");
  const [read, setRead] = useState<VideoRead | null>(null);
  const [heard, setHeard] = useState("");
  const [current, setCurrent] = useState<VideoRun | null>(null);
  const [summary, setSummary] = useState<VideoSummary>(EMPTY);
  const [speech, setSpeech] = useState("");
  const [history, setHistory] = useState<VideoRun[]>([]);
  const [postUrl, setPostUrl] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    try {
      const r = await studioPost<{ rows: Record<string, unknown>[] }>(VIDEO_URL, { action: "list" });
      setHistory((r.rows || []).map(toVideoRun).filter((x) => x.id));
    } catch {
      /* history is optional; the panel still works */
    }
  };
  useEffect(() => {
    void loadHistory();
  }, []);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  const setField = (k: keyof VideoSummary, v: string) => setSummary((s) => ({ ...s, [k]: v }));
  const open = (r: VideoRun) => {
    setCurrent(r);
    setSummary(r.summary);
    setSpeech(r.transcript);
    setNotes(r.notes);
    setPostUrl(r.posted_url);
    setRead(null);
    setHeard("");
    setPhase(r.body ? "done" : "summary");
    setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const reset = () => {
    setFile(null);
    setPreview("");
    setNotes("");
    setRead(null);
    setCurrent(null);
    setSummary(EMPTY);
    setSpeech("");
    setPostUrl("");
    setPhase("pick");
    if (input.current) input.current.value = "";
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm)$/i.test(f.name)) return void run("pick", async () => Promise.reject(new Error("Pick a video file (MP4 or MOV).")));
    if (f.size > MAX_FILE) return void run("pick", async () => Promise.reject(new Error("That video is over 1 GB. Export a smaller copy and try again.")));
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setCurrent(null);
    setRead(null);
    setPhase("pick");
  };

  const analyze = async () => {
    if (!file) return;
    setPhase("reading");
    const r = await run("read", async () => {
      const v = await readVideo(file, setStep);
      setRead(v);
      setStep(v.audio ? "Transcribing your words and reading the visuals and on-screen text" : "Reading the visuals and on-screen text");
      return studioPost<{ run: Record<string, unknown>; heard?: string }>(VIDEO_URL, {
        action: "analyze",
        file_name: file.name.slice(0, 120),
        duration_sec: v.duration,
        frames: v.frames,
        stamps: v.stamps,
        notes: notes.trim(),
        sheet: v.sheet,
        audio: v.audio,
      });
    });
    if (!r) return setPhase("pick");
    const vr = toVideoRun(r.run);
    setHeard(r.heard || "");
    setCurrent(vr);
    setSummary(vr.summary);
    setSpeech(vr.transcript);
    setPhase("summary");
    void loadHistory();
  };

  const write = async () => {
    if (!current) return;
    setPhase("writing");
    const r = await run("write", () => studioPost<{ rows: Record<string, unknown>[] }>(VIDEO_URL, { action: "write", id: current.id, summary, speech: speech.trim(), notes: notes.trim(), pillar: summary.pillar }));
    const row = r?.rows?.[0];
    if (!row) return setPhase("summary");
    const vr = toVideoRun(row);
    setCurrent(vr);
    setPhase("done");
    void loadHistory();
  };

  const update = async (patch: { used_hook?: string; status?: string; posted_url?: string }, ok: string) => {
    if (!current) return;
    const r = await run("update", () => studioPost<{ rows: Record<string, unknown>[] }>(VIDEO_URL, { action: "update", id: current.id, used_hook: patch.used_hook ?? current.used_hook, posted_url: patch.posted_url ?? current.posted_url, status: patch.status ?? (current.status === "posted" ? "posted" : "used") }), ok);
    const row = r?.rows?.[0];
    if (row) {
      setCurrent(toVideoRun(row));
      void loadHistory();
    }
  };

  const body = current?.body || null;
  const tags = body?.hashtags.join(" ") || "";
  const audioLine = read?.audioNote || (heard === "no clear speech" ? "No clear speech was heard. Type what you say if there is any." : heard === "no audio was sent" ? "No sound was sent. Type what you say if there is any." : "Automatic transcript. Fix any words it got wrong.");

  return (
    <div ref={top} className="grid scroll-mt-32 gap-4">
      {phase === "pick" || phase === "reading" ? (
        <>
          <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className={cn("border-border hover:border-foreground/30 grid aspect-[9/16] max-h-80 w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors md:max-h-none", preview && "border-solid")}
              disabled={phase === "reading"}
              aria-label={file ? "Pick a different video" : "Pick a video"}
            >
              {preview ? (
                <video src={preview} className="h-full w-full object-cover" muted playsInline controls={false} preload="metadata" />
              ) : (
                <span className="text-muted-foreground grid gap-2 p-4 text-sm">
                  <VideoIcon className="mx-auto size-8" />
                  Tap to pick a video
                  <span className="text-xs">MP4 or MOV, up to 3 minutes of sound is transcribed</span>
                </span>
              )}
            </button>
            <input ref={input} type="file" accept="video/*,.mp4,.mov,.m4v,.webm" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            <div className="grid gap-3">
              <p className="text-sm">
                The Studio reads what is <b>in</b> your video: what happens, what you say, and any text on screen. You check that summary, then it writes 5 hooks, 3 titles and hashtags from it.
              </p>
              <Field label="Anything it should know (optional)" hint="e.g. this is part 2, or the jacket is thrifted">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={600} disabled={phase === "reading"} />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <Button className="h-11 rounded-full px-5" disabled={!file || phase === "reading"} onClick={() => void analyze()}>
                  {phase === "reading" ? <Spinner /> : <Magic className="size-4" />} Read my video
                </Button>
                {file ? <span className="text-muted-foreground truncate text-xs">{file.name}</span> : null}
              </div>
              <p className="text-muted-foreground text-xs">Only still frames and the sound leave your device, never the full video. Nothing is posted anywhere.</p>
            </div>
          </div>
          {phase === "reading" ? <Working text={`${step || "Working"}… About 20–40 seconds.`} /> : null}
        </>
      ) : null}

      {(phase === "summary" || phase === "writing") && current ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid gap-0.5">
              <span className="font-semibold">Check the summary</span>
              <span className="text-muted-foreground text-sm">Fix anything wrong. Hooks are written only from this.</span>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={reset} disabled={phase === "writing"}>
              <Restart className="size-4" /> New video
            </Button>
          </div>
          {read?.sheetUrl ? (
            <details className="border-border rounded-lg border p-2">
              <summary className="text-muted-foreground cursor-pointer text-xs">Frames the Studio looked at ({read.frames})</summary>
              <img src={read.sheetUrl} alt="Frames pulled from your video" className="mt-2 max-h-96 rounded" />
            </details>
          ) : null}
          <Field label="What happens">
            <Textarea value={summary.what_happens} onChange={(e) => setField("what_happens", e.target.value)} rows={3} maxLength={600} />
          </Field>
          <Field label="What you say" hint={audioLine}>
            <Textarea value={speech} onChange={(e) => setSpeech(e.target.value)} rows={3} maxLength={4000} placeholder="No speech" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Text on screen" hint="Exactly as it appears, with the second">
              <Textarea value={summary.on_screen_text} onChange={(e) => setField("on_screen_text", e.target.value)} rows={3} maxLength={800} placeholder="None" />
            </Field>
            <Field label="Key moments">
              <Textarea value={summary.moments} onChange={(e) => setField("moments", e.target.value)} rows={3} maxLength={1200} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Where">
              <Input value={summary.setting} onChange={(e) => setField("setting", e.target.value)} maxLength={300} />
            </Field>
            <Field label="Who's in it">
              <Input value={summary.people} onChange={(e) => setField("people", e.target.value)} maxLength={300} />
            </Field>
            <Field label="Mood">
              <Input value={summary.mood} onChange={(e) => setField("mood", e.target.value)} maxLength={200} />
            </Field>
            <Field label="Pillar">
              <NativeSelect value={PILLARS.includes(summary.pillar) ? summary.pillar : ""} onChange={(v) => setField("pillar", v)} options={[{ value: "", label: "Pick one" }, ...PILLARS.map((p) => ({ value: p, label: p }))]} ariaLabel="Pillar" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11 rounded-full px-5" disabled={phase === "writing" || (!summary.what_happens.trim() && !speech.trim())} onClick={() => void write()}>
              {phase === "writing" ? <Spinner /> : <Magic className="size-4" />} Write hooks, titles and hashtags
            </Button>
            {current.body ? (
              <Button variant="outline" className="h-11 rounded-full px-5" disabled={phase === "writing"} onClick={() => setPhase("done")}>
                Back to the last results
              </Button>
            ) : null}
          </div>
          {phase === "writing" ? <Working text="Writing 5 hooks, 3 titles and hashtags from your summary. About 15–30 seconds." /> : null}
        </div>
      ) : null}

      {phase === "done" && current && body ? (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="grid gap-0.5">
              <span className="font-semibold">{current.file_name || "Your video"}</span>
              <span className="text-muted-foreground text-sm">{current.summary.what_happens}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setPhase("summary")}>
                <Pen className="size-4" /> Edit summary and rewrite
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={reset}>
                <Restart className="size-4" /> New video
              </Button>
            </div>
          </div>

          <section className="grid gap-2" aria-label="Hooks">
            <h4 className="text-sm font-semibold">Hooks</h4>
            {body.top_pick_why ? <p className="text-muted-foreground text-xs">Why #1: {body.top_pick_why}</p> : null}
            <ol className="grid gap-2">
              {body.hooks.map((h, i) => {
                const text = h.say || h.on_screen;
                const picked = current.used_hook && current.used_hook === text;
                return (
                  <li key={i} className={cn("border-border grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-lg border p-3 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center", picked && "border-chart-1")}>
                    <span className={cn("grid size-9 place-items-center rounded-full text-sm font-bold tabular-nums", Number(h.score) >= 8 ? "bg-chart-1 text-white" : "bg-muted")}>{h.score}</span>
                    <span className="grid min-w-0 gap-0.5">
                      {h.say ? <span className="font-medium">Say: “{h.say}”</span> : <span className="font-medium">Silent open</span>}
                      {h.on_screen ? <span className="text-sm">On screen: {h.on_screen}</span> : null}
                      {h.open_on ? <span className="text-muted-foreground text-xs">Open on {h.open_on}</span> : null}
                      <span className="text-muted-foreground text-xs">
                        {h.hook_type}
                        {h.why ? ` · ${h.why}` : ""}
                      </span>
                    </span>
                    <span className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto">
                      <CopyButton text={[h.say, h.on_screen].filter(Boolean).join(" / ")} size="xs" />
                      <Button size="xs" variant={picked ? "default" : "outline"} className="rounded-full px-2.5" disabled={busy === "update"} onClick={() => void update({ used_hook: text }, "Saved as the hook you used")}>
                        {picked ? <CheckCircle className="size-3" /> : null} {picked ? "Using this" : "Use this"}
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="grid gap-2" aria-label="Titles">
            <h4 className="text-sm font-semibold">Titles and captions</h4>
            <ul className="grid gap-2">
              {body.titles.map((t, i) => (
                <li key={i} className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="grid min-w-0 gap-0.5">
                    <span className="font-medium">{t.caption}</span>
                    {t.why ? <span className="text-muted-foreground text-xs">{t.why}</span> : null}
                  </span>
                  <span className="flex shrink-0 gap-2">
                    <CopyButton text={t.caption} size="xs" />
                    <CopyButton text={t.caption + (tags ? "\n\n" + tags : "")} size="xs" label="With hashtags" />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2" aria-label="Hashtags">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Hashtags</h4>
              {tags ? <CopyButton text={tags} size="xs" label="Copy all" /> : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {body.hashtags.map((t) => (
                <Pill key={t} tone="accent" className="text-xs">
                  {t}
                </Pill>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">Picked to fit this video. They aren't checked against what's trending today.</p>
          </section>

          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            {body.search_phrase ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <dt className="text-muted-foreground text-xs">Say it and put it on screen</dt>
                <dd className="font-medium">“{body.search_phrase}”</dd>
              </div>
            ) : null}
            {body.cover_at ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <dt className="text-muted-foreground text-xs">Cover frame</dt>
                <dd>{body.cover_at}</dd>
              </div>
            ) : null}
            {body.edit_tip ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <dt className="text-muted-foreground text-xs">Edit tip</dt>
                <dd>{body.edit_tip}</dd>
              </div>
            ) : null}
          </dl>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void update({ status: "posted", posted_url: postUrl.trim() }, "Marked as posted");
            }}
          >
            <Input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="Posted? Paste the TikTok link (optional)" className="h-10" maxLength={300} aria-label="Posted link" />
            <Button type="submit" variant="outline" className="h-10 rounded-full px-4" disabled={busy === "update"}>
              Mark posted
            </Button>
          </form>
        </div>
      ) : null}

      {history.length ? (
        <details className="border-border rounded-lg border p-3" open={phase === "pick" && !file}>
          <summary className="cursor-pointer text-sm font-semibold">Recent videos · {history.length}</summary>
          <ul className="mt-3 grid gap-2">
            {history.slice(0, 12).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="grid min-w-0 gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{r.file_name || "Video"}</span>
                    {statusPill(r)}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {when(r.created_at)}
                    {r.pillar ? ` · ${r.pillar}` : ""}
                    {r.used_hook ? ` · used: “${r.used_hook}”` : ""}
                  </span>
                </span>
                <Button size="xs" variant="outline" className="rounded-full px-2.5" onClick={() => open(r)}>
                  Open
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
