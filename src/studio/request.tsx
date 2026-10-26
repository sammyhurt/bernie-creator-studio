import GalleryAdd from "@iconify-react/solar/gallery-add-linear";
import Lightbulb from "@iconify-react/solar/lightbulb-linear";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Field, Modal, Pill, Spinner, Working, useToast } from "./bits";
import { REQUEST_URL, studioPost, type FeatureRequest } from "./data";
import { shortDate } from "./insights";
import { useStudio } from "./store";
import { Empty } from "./ui";

/** Shrinks a screenshot to a small JPEG data URL so it uploads fast on phone data. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("That file isn't an image we can read. Try a PNG or JPG screenshot."));
      i.src = url;
    });
    const max = 1400;
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Could not read the screenshot.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Step = { kind: "write" } | { kind: "ask"; key: string; question: string } | { kind: "done"; title: string; better: string; size: string };
const SIZE_HINT: Record<string, string> = { Small: "under an hour to build", Medium: "a few hours to build", Large: "a day or more to build" };

export function RequestModal({ open, onClose, resume }: { open: boolean; onClose: () => void; resume?: { key: string; question: string } | null }) {
  const s = useStudio();
  const toast = useToast();
  const [step, setStep] = useState<Step>(resume ? { kind: "ask", ...resume } : { kind: "write" });
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = () => {
    onClose();
    if (step.kind === "done") {
      setStep({ kind: "write" });
      setText("");
      setAnswer("");
      setShot(null);
    }
  };
  const finish = (r: { status: string; key: string; question?: string; title?: string; better_version?: string; size?: string }) => {
    if (r.status === "Needs answer" && r.question) setStep({ kind: "ask", key: r.key, question: r.question });
    else {
      setStep({ kind: "done", title: r.title || "Your idea", better: r.better_version || "", size: r.size || "" });
      void s.refresh();
    }
  };
  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      finish(await studioPost<{ status: string; key: string; question?: string; title?: string; better_version?: string; size?: string }>(REQUEST_URL, body));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not send. Please try again.", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Suggest a feature">
      {step.kind === "write" ? (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim().length < 3) return;
            void send({ action: "start", text: text.trim(), ...(shot ? { screenshot: shot } : {}) });
          }}
        >
          <p className="text-muted-foreground text-sm">Anything you wish the Studio did. Plain words are perfect. The Studio tidies it up, may ask one quick question, then sends it to Bernie to build.</p>
          <Field label="Your idea">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} placeholder="e.g. A button that turns my top video into a part 2 script" required />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  setShot(await shrink(f));
                } catch (err) {
                  toast(err instanceof Error ? err.message : "Could not read that image.", "err");
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" className="rounded-full px-3" onClick={() => fileRef.current?.click()}>
              <GalleryAdd className="size-4" /> {shot ? "Change screenshot" : "Add a screenshot (optional)"}
            </Button>
            {shot ? (
              <span className="flex items-center gap-2">
                <img src={shot} alt="Screenshot to send" className="h-12 w-auto rounded border" />
                <button type="button" className="text-muted-foreground text-xs hover:underline" onClick={() => setShot(null)}>
                  Remove
                </button>
              </span>
            ) : null}
          </div>
          {busy ? <Working text="Reading your idea. About 10 seconds." /> : null}
          <Button type="submit" className="h-11 rounded-full" disabled={busy || text.trim().length < 3}>
            {busy ? <Spinner /> : <Lightbulb className="size-4" />} Send idea
          </Button>
        </form>
      ) : step.kind === "ask" ? (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!answer.trim()) return;
            void send({ action: "answer", key: step.key, answer: answer.trim() });
          }}
        >
          <div className="bg-chart-1/10 border-chart-1/30 rounded-xl border p-4">
            <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">One quick question</div>
            <p className="mt-1.5 font-medium">{step.question}</p>
          </div>
          <Field label="Your answer">
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} maxLength={1000} required />
          </Field>
          {busy ? <Working text="Finishing your request. About 10 seconds." /> : null}
          <Button type="submit" className="h-11 rounded-full" disabled={busy || !answer.trim()}>
            {busy ? <Spinner /> : null} Send answer
          </Button>
          <button
            type="button"
            className="text-muted-foreground justify-self-center text-sm hover:underline"
            onClick={() => {
              setStep({ kind: "write" });
              setText("");
              setAnswer("");
              setShot(null);
            }}
          >
            Start a new idea instead
          </button>
        </form>
      ) : (
        <div className="grid gap-4">
          <div className="bg-chart-1/10 border-chart-1/30 rounded-xl border p-4">
            <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">Sent to Bernie</div>
            <p className="mt-1 text-lg font-semibold">{step.title}</p>
            {step.better ? <p className="mt-2 text-sm">{step.better}</p> : null}
            {step.size ? <p className="text-muted-foreground mt-2 text-xs">Size: {step.size}{SIZE_HINT[step.size] ? `, ${SIZE_HINT[step.size]}` : ""}</p> : null}
          </div>
          <p className="text-muted-foreground text-sm">Bernie got it by email and on his phone. You'll see its status change on the Home tab: Approved, Planned, then Built.</p>
          <Button className="h-11 rounded-full" onClick={close}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

const TONE: Record<string, "accent" | "ok" | "muted" | "warn"> = { Built: "ok", Approved: "accent", Planned: "accent", Sent: "muted", "Needs answer": "warn", "Not now": "muted" };

export function RequestList({ items }: { items: FeatureRequest[] }) {
  const s = useStudio();
  const list = [...items].sort((a, b) => Date.parse(b.updated_at || b.submitted_at) - Date.parse(a.updated_at || a.submitted_at));
  if (!list.length) return <Empty>Nothing suggested yet. Tap “Suggest a feature” any time you wish the Studio did something.</Empty>;
  return (
    <ul className="grid gap-2">
      {list.slice(0, 8).map((r) => (
        <li key={r.key || r.submitted_at} className="border-border grid gap-1 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{r.title || r.request.slice(0, 80)}</span>
            <Pill tone={TONE[r.status] || "muted"}>{r.status === "Sent" ? "With Bernie" : r.status}</Pill>
          </div>
          {r.status === "Needs answer" && r.follow_up_q ? (
            <span className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Waiting on your answer: {r.follow_up_q}</span>
              <button type="button" className="text-primary dark:text-chart-1 font-semibold hover:underline" onClick={() => s.openRequest({ key: r.key, question: r.follow_up_q })}>
                Answer
              </button>
            </span>
          ) : null}
          <span className="text-muted-foreground text-xs">
            Sent {shortDate(r.submitted_at)}
            {r.built_at ? ` · built ${shortDate(r.built_at)}` : ""}
          </span>
        </li>
      ))}
      {list.length > 8 ? <li className="text-muted-foreground text-xs">and {list.length - 8} more</li> : null}
      <li>
        <button type="button" className="text-primary dark:text-chart-1 text-sm font-medium hover:underline" onClick={() => s.openRequest()}>
          Suggest another →
        </button>
      </li>
    </ul>
  );
}
