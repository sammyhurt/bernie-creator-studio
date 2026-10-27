import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import Bookmark from "@iconify-react/solar/bookmark-linear";
import Trash from "@iconify-react/solar/trash-bin-minimalistic-linear";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { Field, Pill, Spinner, Working, useAction, useToast } from "./bits";
import type { SavedVideo } from "./data";
import { compact } from "./insights";
import { CarouselButton } from "./carousel-button";
import { useStudio } from "./store";
import { Empty, Panel } from "./ui";

const LINK = /https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/[^\s"'<>]+/gi;

function Cover({ src }: { src: string }) {
  const [ok, setOk] = useState(!!src);
  return (
    <span className="bg-muted block aspect-[3/4] w-full overflow-hidden rounded-lg">
      {ok ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setOk(false)} className="size-full object-cover" /> : null}
    </span>
  );
}

function SavedCard({ v, onScript, writing }: { v: SavedVideo; onScript: (v: SavedVideo) => void; writing: boolean }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [note, setNote] = useState(v.note);
  const [editing, setEditing] = useState(false);
  return (
    <article className={cn("bg-background/70 border-border grid grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-xl border p-3 sm:grid-cols-[110px_minmax(0,1fr)] sm:p-4", v.used && "opacity-70")}>
      <a href={v.url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open ${v.author}'s video on TikTok`}>
        <Cover src={v.cover} />
      </a>
      <div className="grid min-w-0 content-start gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold">{v.author}</span>
          {v.collection ? <Pill>{v.collection}</Pill> : null}
          {v.pillar ? <Pill tone="accent">{v.pillar}</Pill> : null}
          {v.used ? <Pill tone="ok">Made it</Pill> : null}
        </div>
        {v.caption ? <p className="line-clamp-2 text-sm">{v.caption}</p> : null}
        <p className="text-muted-foreground text-xs tabular-nums">
          {compact(v.views)} views · {compact(v.likes)} likes · {compact(v.saves)} saves{v.duration ? ` · ${v.duration}s` : ""}
          {v.sound ? ` · ${v.sound}` : ""}
        </p>
        {v.why ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Why it works: </span>
            {v.why}
          </p>
        ) : null}
        {v.your_version ? (
          <p className="bg-chart-1/10 rounded-lg p-2.5 text-sm">
            <span className="font-semibold">Your version: </span>
            {v.your_version}
          </p>
        ) : null}
        {editing ? (
          <div className="grid gap-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder="Your note, e.g. film this at the Brooklyn Bridge" aria-label="Note" />
            <div className="flex gap-2">
              <Button
                size="xs"
                className="rounded-full px-2.5"
                disabled={!!busy}
                onClick={async () => {
                  const ok = await run("note", () => s.updateSaved(v, { note: note.trim() }).then(() => true), "Note saved");
                  if (ok) setEditing(false);
                }}
              >
                {busy === "note" ? <Spinner className="size-3" /> : null} Save note
              </Button>
              <Button size="xs" variant="ghost" className="rounded-full px-2.5" onClick={() => { setNote(v.note); setEditing(false); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : v.note ? (
          <button type="button" onClick={() => setEditing(true)} className="text-left text-sm italic hover:underline">
            “{v.note}”
          </button>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Button size="xs" className="rounded-full px-2.5" disabled={writing} onClick={() => onScript(v)}>
            Script my version
          </Button>
          <CarouselButton size="xs" topic={v.your_version || `My own version of a TikTok I saved${v.author ? ` from @${v.author}` : ""}`} label={`A TikTok you saved${v.author ? ` (@${v.author})` : ""}, inspired not copied`} text={[v.caption ? `Their caption: ${v.caption}` : "", v.why ? `Why it worked: ${v.why}` : "", v.note ? `His note: ${v.note}` : ""].filter(Boolean).join(" ")}>
            Carousel
          </CarouselButton>
          <label className="border-border hover:bg-muted inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium">
            <input type="checkbox" className="accent-[var(--chart-1)] size-3.5" checked={v.used} disabled={!!busy} onChange={() => void run("used", () => s.updateSaved(v, { used: !v.used }), v.used ? "Moved back to ideas" : "Marked as made")} />
            Made it
          </label>
          {!editing && !v.note ? (
            <Button size="xs" variant="ghost" className="rounded-full px-2.5" onClick={() => setEditing(true)}>
              Add note
            </Button>
          ) : null}
          {v.url ? (
            <Button size="xs" variant="ghost" className="rounded-full px-2.5" asChild>
              <a href={v.url} target="_blank" rel="noopener noreferrer">
                Open <ArrowRightUp className="size-3" />
              </a>
            </Button>
          ) : null}
          <Button size="xs" variant="ghost" className="text-muted-foreground rounded-full px-2" aria-label="Remove" disabled={!!busy} onClick={() => void run("rm", () => s.updateSaved(v, { remove: true }), "Removed")}>
            {busy === "rm" ? <Spinner className="size-3" /> : <Trash className="size-3.5" />}
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Trends tab: TikToks he saved in his collections, pasted in as links, turned into his own ideas. */
export function SavedIdeasPanel({ onScript, writing }: { onScript: (topic: string) => void; writing: boolean }) {
  const s = useStudio();
  const toast = useToast();
  const { busy, run } = useAction();
  const saved = s.d?.saved || [];
  const [text, setText] = useState("");
  const [collection, setCollection] = useState("Social Trends");
  const [show, setShow] = useState<"todo" | "made" | "all">("todo");
  const [coll, setColl] = useState("");
  const collections = useMemo(() => [...new Set(["Social Trends", ...saved.map((x) => x.collection).filter(Boolean)])], [saved]);
  const links = (text.match(LINK) || []).length;
  const list = saved.filter((x) => (show === "all" ? true : show === "made" ? x.used : !x.used)).filter((x) => !coll || x.collection === coll);

  const add = async () => {
    const r = await run("add", () => s.addSaved(text, collection.trim(), ""));
    if (!r) return;
    const parts = [r.added ? `${r.added} added` : "", r.skipped ? `${r.skipped} already saved` : "", r.failed ? `${r.failed} couldn't be read` : ""].filter(Boolean);
    toast(parts.join(" · ") || "Nothing new to add", r.failed && !r.added ? "err" : "ok");
    if (r.added || r.skipped) setText("");
  };

  return (
    <Panel eyebrow={`Saved from TikTok · ${saved.filter((x) => !x.used).length} to make`} pattern="wave" className="lg:col-span-6" action={<Bookmark className="text-chart-1 size-5" />}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <form
          className="grid content-start gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (links) void add();
          }}
        >
          <Field label="Paste TikTok links" hint="Up to 10 at a time. Any text around the links is fine.">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={"https://www.tiktok.com/@creator/video/…\nhttps://vm.tiktok.com/…"} />
          </Field>
          <Field label="Collection">
            <Input value={collection} onChange={(e) => setCollection(e.target.value)} list="mts-collections" maxLength={40} />
            <datalist id="mts-collections">
              {collections.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Button type="submit" className="h-11 rounded-full" disabled={busy === "add" || !links}>
            {busy === "add" ? <Spinner /> : <Bookmark className="size-4" />} {links > 1 ? `Add ${Math.min(10, links)} videos` : "Add video"}
          </Button>
          {busy === "add" ? <Working text="Reading each video and writing your own version. About 20–40 seconds." /> : null}
          <details className="text-muted-foreground text-xs">
            <summary className="cursor-pointer font-medium">How to copy links from your collections</summary>
            <p className="mt-1.5 leading-relaxed">
              In TikTok, go to your profile and tap the bookmark tab, then Collections, then a collection like Social Trends. Open a video, tap Share, then Copy link, and paste it here. TikTok doesn't let other apps open your private collections, so links are the way in.
            </p>
          </details>
        </form>

        <div className="grid content-start gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              ["todo", "To make"],
              ["made", "Made"],
              ["all", "All"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setShow(k)}
                aria-pressed={show === k}
                className={cn("rounded-full px-3 py-1 text-xs font-semibold", show === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                {label}
              </button>
            ))}
            {collections.length > 1 ? (
              <select value={coll} onChange={(e) => setColl(e.target.value)} aria-label="Collection" className="border-input dark:bg-input/30 ml-auto h-7 rounded-full border bg-transparent px-2.5 text-xs">
                <option value="">All collections</option>
                {collections.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {list.length ? (
            <div className="grid gap-3">
              {list.map((v) => (
                <SavedCard
                  key={v.id}
                  v={v}
                  writing={writing}
                  onScript={(x) => onScript(`His own original version of a TikTok he saved from ${x.author} (${compact(x.views)} views). Caption: "${x.caption}". Why it works: ${x.why} His version: ${x.your_version}${x.note ? ` His note: ${x.note}` : ""}`)}
                />
              ))}
            </div>
          ) : (
            <Empty>{saved.length ? "Nothing here with this filter." : "Paste links from your TikTok collections and they show up here with why they work and your own version."}</Empty>
          )}
        </div>
      </div>
    </Panel>
  );
}
