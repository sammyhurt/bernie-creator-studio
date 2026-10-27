import ArrowRightUp from "@iconify-react/solar/arrow-right-up-linear";
import Danger from "@iconify-react/solar/danger-triangle-linear";
import Letter from "@iconify-react/solar/letter-linear";
import PenNew from "@iconify-react/solar/pen-new-square-linear";
import Shop from "@iconify-react/solar/shop-linear";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { CopyButton, Field, Modal, NativeSelect, Pill, Spinner, Working, useAction } from "./bits";
import { KIT_URL, type Deal, type DealStatus } from "./data";
import StudioHero from "./hero";
import { compact, n, shortDate } from "./insights";
import { DealLinks, LinkPagePanel } from "./links";
import { BrandRadarPanel, EarningsPanel, RateCardPanel, ReportLinksPanel } from "./money";
import { useStudio } from "./store";
import { Empty, Grid, Panel, Skeleton, Stat } from "./ui";

const STATUSES: DealStatus[] = ["Idea", "Pitched", "Talking", "Signed", "Posted", "Paid", "Passed"];
const STATUS_HINT: Record<DealStatus, string> = { Idea: "Want to work with", Pitched: "Email sent", Talking: "They replied", Signed: "Agreed in writing", Posted: "Content is live", Paid: "Money received", Passed: "Not a fit" };

function DealModal({ deal, onClose }: { deal: Partial<Deal> | null; onClose: () => void }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [f, setF] = useState<Partial<Deal>>(deal || {});
  const set = (k: keyof Deal) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  if (!deal) return null;
  return (
    <Modal open onClose={onClose} title={deal.id ? `Edit ${deal.brand}` : "Add a brand"}>
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!f.brand?.trim()) return;
          const ok = await run("save", () => s.saveDeal({ ...f, brand: f.brand!.trim() }), "Saved");
          if (ok) onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand" className="col-span-2 sm:col-span-1">
            <Input value={f.brand || ""} onChange={(e) => set("brand")(e.target.value)} required maxLength={80} placeholder="Todd Snyder" />
          </Field>
          <Field label="Stage" className="col-span-2 sm:col-span-1">
            <NativeSelect value={f.status || "Idea"} onChange={set("status")} options={STATUSES.map((x) => ({ value: x, label: `${x} · ${STATUS_HINT[x]}` }))} ariaLabel="Stage" />
          </Field>
          <Field label="Contact" className="col-span-2" hint="Name and email of the person you spoke to.">
            <Input value={f.contact || ""} onChange={(e) => set("contact")(e.target.value)} maxLength={120} placeholder="Jane Doe, partnerships@brand.com" />
          </Field>
          <Field label="Rate or value">
            <Input value={f.value || ""} onChange={(e) => set("value")(e.target.value)} maxLength={60} placeholder="$500 or gifted" />
          </Field>
          <Field label="Due">
            <Input type="date" value={f.due || ""} onChange={(e) => set("due")(e.target.value)} />
          </Field>
          <Field label="Deliverables" className="col-span-2">
            <Input value={f.deliverables || ""} onChange={(e) => set("deliverables")(e.target.value)} maxLength={300} placeholder="1 TikTok + 3 stories, 30 days usage" />
          </Field>
          <Field label="Notes" className="col-span-2">
            <Textarea value={f.notes || ""} onChange={(e) => set("notes")(e.target.value)} maxLength={1000} rows={3} />
          </Field>
        </div>
        <Button type="submit" className="h-11 rounded-full" disabled={busy === "save"}>
          {busy === "save" ? <Spinner /> : null} Save
        </Button>
      </form>
    </Modal>
  );
}

function DealCard({ deal, onEdit }: { deal: Deal; onEdit: () => void }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [show, setShow] = useState(false);
  return (
    <div className="bg-background/70 border-border grid gap-2.5 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{deal.brand}</h3>
          {deal.contact ? <p className="text-muted-foreground truncate text-xs">{deal.contact}</p> : null}
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${deal.brand}`}>
          <PenNew className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {deal.value ? <Pill tone="accent">{deal.value}</Pill> : null}
        {deal.due ? <Pill>Due {shortDate(deal.due + "T12:00:00Z")}</Pill> : null}
      </div>
      {deal.deliverables ? <p className="text-sm">{deal.deliverables}</p> : null}
      <div className="flex items-center gap-2">
        <NativeSelect
          value={deal.status}
          ariaLabel={`Stage for ${deal.brand}`}
          className="h-8 text-sm"
          onChange={(v) => void run("st", () => s.saveDeal({ ...deal, status: v as DealStatus }), `Moved to ${v}`)}
          options={STATUSES.map((x) => ({ value: x, label: x }))}
        />
        {busy ? <Spinner className="text-chart-1" /> : null}
      </div>
      <DealLinks deal={deal} />
      {deal.pitch ? (
        <>
          <button type="button" onClick={() => setShow(!show)} className="text-primary dark:text-chart-1 justify-self-start text-sm font-medium hover:underline">
            {show ? "Hide pitch" : "View pitch draft"}
          </button>
          {show ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium">{deal.pitch_subject}</p>
              <p className="bg-muted/60 rounded-lg p-3 text-sm whitespace-pre-line">{deal.pitch}</p>
              <CopyButton text={`${deal.pitch_subject}\n\n${deal.pitch}`} label="Copy pitch" size="xs" className="justify-self-start" />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function PitchWriter({ brands }: { brands: string[] }) {
  const s = useStudio();
  const { busy, run } = useAction();
  const [brand, setBrand] = useState("");
  const [angle, setAngle] = useState("");
  const [out, setOut] = useState<Deal | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const email = (out?.contact.match(/[^\s<>,;]+@[^\s<>,;]+\.[a-z]{2,}/i) || [""])[0];
  return (
    <div className="grid gap-4">
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (brand.trim().length < 2) return;
          const existing = (s.d?.deals || []).find((x) => x.brand.toLowerCase() === brand.trim().toLowerCase());
          const r = await run("pitch", () => s.pitch(existing ? { deal_id: existing.id, angle: angle.trim() } : { brand: brand.trim(), angle: angle.trim() }));
          if (r) {
            setOut(r);
            setSubject(r.pitch_subject);
            setBody(r.pitch);
          }
        }}
      >
        <Field label="Brand">
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} list="mts-brands" placeholder="e.g. Buck Mason" maxLength={80} required />
          <datalist id="mts-brands">
            {brands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="Angle (optional)" hint="What you'd make for them. The Studio adds your real numbers and your media kit link.">
          <Textarea value={angle} onChange={(e) => setAngle(e.target.value)} rows={2} maxLength={400} placeholder="A fall fit check series around Brooklyn" />
        </Field>
        <Button type="submit" className="h-11 rounded-full" disabled={busy === "pitch" || brand.trim().length < 2}>
          {busy === "pitch" ? <Spinner /> : <Letter className="size-4" />} Write pitch draft
        </Button>
      </form>
      {busy === "pitch" ? <Working text="Writing a short pitch with your real numbers. About 20 seconds." /> : null}
      {out && !busy ? (
        <div className="border-chart-1/30 bg-chart-1/5 grid gap-3 rounded-xl border p-4">
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Email">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={() => `${subject}\n\n${body}`} label="Copy" />
            <Button size="sm" variant="outline" className="rounded-full px-3" asChild>
              <a href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                <Letter className="size-4" /> Open in email
              </a>
            </Button>
            {out.status === "Idea" ? (
              <Button size="sm" className="rounded-full px-3" disabled={!!busy} onClick={async () => { const r = await run("mark", () => s.saveDeal({ ...out, status: "Pitched" }), "Moved to Pitched"); if (r) setOut(r); }}>
                I sent it
              </Button>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">A draft only. Read it, make it sound like you, and send it from your own email. It's saved on the {out.brand} card below.</p>
        </div>
      ) : null}
    </div>
  );
}

export function BrandsPanel() {
  const s = useStudio();
  const d = s.d;
  const st = d?.stats;
  const [edit, setEdit] = useState<Partial<Deal> | null>(null);
  const [showPassed, setShowPassed] = useState(false);
  const deals = d?.deals || [];
  const open = deals.filter((x) => x.status !== "Passed");
  const passed = deals.filter((x) => x.status === "Passed");
  const dream = d?.profile.dream_brands?.length ? d.profile.dream_brands : ["Menswear and streetwear", "Fitness and wellness", "NYC restaurants and experiences", "Couple fashion"];
  const suggestions = ["Todd Snyder", "Abercrombie & Fitch", "Uniqlo", "Buck Mason", "Aimé Leon Dore", "Kith", "Nike", "New Balance", "Lululemon", "Vuori", "Equinox", "1 Hotels", "Soho House", ...dream].filter((v, i, a) => a.indexOf(v) === i);
  const shopLinks = String(d?.profile.shop_links || "")
    .split(/[\s|,;]+/)
    .filter((x) => /^https?:\/\//.test(x));
  const kit = d?.kit_url || KIT_URL;

  return (
    <>
      <StudioHero eyebrow="Brands" title="Sponsorships, shop and links" lead="Your live media kit, your link page, pitch drafts with your real numbers, and a tracker from first email to paid." />
      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="container">
          {!d ? (
            <Skeleton className="h-72" />
          ) : (
            <Grid>
              <Panel eyebrow="Your media kit" pattern="dots" className="lg:col-span-3">
                {st ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Followers" value={n(st.followers)} />
                    <Stat label="Avg views · 30 days" value={compact(st.avg_views_30d)} />
                    <Stat label="Engagement" value={`${st.er_avg}%`} />
                    <Stat label="Videos · 30 days" value={n(st.posts_30d)} />
                  </div>
                ) : (
                  <Empty>Your kit fills in once TikTok stats arrive.</Empty>
                )}
                <p className="text-sm">One link that always shows today's real numbers, your top videos and your contact. Brands see only this page, never the Studio.</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-full px-3" asChild>
                    <a href={kit} target="_blank" rel="noopener noreferrer">
                      Open media kit <ArrowRightUp className="size-4" />
                    </a>
                  </Button>
                  <CopyButton text={kit} label="Copy link" />
                </div>
              </Panel>

              <RateCardPanel />

              <Panel eyebrow="Pitch writer" pattern="wave" className="lg:col-span-3">
                <PitchWriter brands={suggestions} />
              </Panel>

              <EarningsPanel />

              <BrandRadarPanel />

              <LinkPagePanel />

              <Panel
                eyebrow={`Deal tracker · ${open.length}`}
                pattern="lines"
                className="lg:col-span-6"
                action={
                  <Button size="sm" variant="outline" className="rounded-full px-3" onClick={() => setEdit({ status: "Idea" })}>
                    Add a brand
                  </Button>
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.filter((x) => x !== "Passed").map((x) => {
                    const c = deals.filter((y) => y.status === x).length;
                    return (
                      <span key={x} className={cn("rounded-full px-3 py-1 text-xs font-semibold", c ? "bg-chart-1/15" : "bg-muted text-muted-foreground")}>
                        {x} · {c}
                      </span>
                    );
                  })}
                </div>
                {open.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {open.map((x) => (
                      <DealCard key={x.id} deal={x} onEdit={() => setEdit(x)} />
                    ))}
                  </div>
                ) : (
                  <Empty>No brands yet. Write a pitch above, or add a brand you're talking to.</Empty>
                )}
                {passed.length ? (
                  <button type="button" className="text-muted-foreground justify-self-start text-sm hover:underline" onClick={() => setShowPassed(!showPassed)}>
                    {showPassed ? "Hide" : "Show"} {passed.length} passed
                  </button>
                ) : null}
                {showPassed ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {passed.map((x) => (
                      <DealCard key={x.id} deal={x} onEdit={() => setEdit(x)} />
                    ))}
                  </div>
                ) : null}
              </Panel>

              <ReportLinksPanel />

              <Panel eyebrow="Brands that fit you" pattern="dots" className="lg:col-span-3">
                <div className="flex flex-wrap gap-1.5">
                  {dream.map((b) => (
                    <Pill key={b} tone="accent" className="text-[13px]">
                      {b}
                    </Pill>
                  ))}
                </div>
                <ul className="grid gap-2 text-sm">
                  <li>
                    <span className="font-medium">Start with brands you already wear and visit.</span> A real “I've worn this for years” beats a cold pitch.
                  </li>
                  <li>
                    <span className="font-medium">NYC restaurants and experiences:</span> pitch a date-night visit with Meredith (1 TikTok plus stories), sent to their PR or marketing email, not the front desk.
                  </li>
                  <li>
                    <span className="font-medium">Join TikTok One</span> (TikTok's creator marketplace) so brands searching for NYC menswear and couple creators can find you.
                  </li>
                  <li className="text-muted-foreground">Never pitched: {(d.profile.never_brands?.length ? d.profile.never_brands : ["Target", "Starbucks"]).join(", ")}.</li>
                </ul>
              </Panel>

              <Panel eyebrow="Shop coach" pattern="wave" className="lg:col-span-3" action={<Shop className="text-chart-1 size-5" />}>
                <ul className="grid gap-2.5 text-sm">
                  <li>
                    <span className="font-medium">Link every outfit.</span> Add each look to ShopMy or your Amazon storefront the same day you post, then say “linked in my bio” on screen.
                  </li>
                  <li>
                    <span className="font-medium">Make collections, not single links:</span> “Fall fits”, “Gym bag essentials”, “Couple date night looks”.
                  </li>
                  <li>
                    <span className="font-medium">Reuse your winners.</span> Your top outfit videos are your best shop posts. Pin one and keep its links fresh.
                  </li>
                  <li>
                    <span className="font-medium">TikTok Shop affiliate</span> has its own follower minimum. Check it in the TikTok app under Creator tools.
                  </li>
                </ul>
                {shopLinks.length ? (
                  <div className="flex flex-wrap gap-2">
                    {shopLinks.map((u) => (
                      <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-chart-1 inline-flex items-center gap-1 text-sm font-medium hover:underline">
                        {u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <ArrowRightUp className="size-3.5" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </Panel>

              <Panel eyebrow="Before any sponsored post" pattern="lines" className="lg:col-span-3">
                <div className="flex items-start gap-3">
                  <Danger className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <ul className="grid gap-1.5 text-sm">
                    <li>Turn on <span className="font-medium">Content disclosure → Paid partnership</span> when you post. Gifted products count too.</li>
                    <li>Use a sound cleared for business use. Many trending songs aren't allowed in paid posts.</li>
                    <li>Get the deal in writing: deliverables, dates, how long they can use your video, and when you get paid.</li>
                  </ul>
                </div>
              </Panel>
            </Grid>
          )}
        </div>
      </section>
      <DealModal key={edit ? edit.id || "new" : "none"} deal={edit} onClose={() => setEdit(null)} />
    </>
  );
}
