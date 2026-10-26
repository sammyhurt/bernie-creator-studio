import Lightbulb from "@iconify-react/solar/lightbulb-linear";
import RefreshLinear from "@iconify-react/solar/refresh-linear";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/utility/theme-toggle";
import { cn } from "@/lib/utils";

import { TABS, type TabId } from "./tabs";
import { Wordmark } from "./wordmark";

function Logo() {
  return (
    <button type="button" className="flex items-center" aria-label="Bernie Creator Studio home" data-home>
      <Wordmark />
    </button>
  );
}

function Count({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span
      className={cn(
        "bg-chart-2 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 text-[10.5px] font-bold text-[#2f4156] tabular-nums",
        className,
      )}
    >
      {n}
    </span>
  );
}

export default function StudioNavbar({
  tab,
  onTab,
  counts,
  fresh,
  onRefresh,
  onLock,
  onSuggest,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  counts: Partial<Record<TabId, number>>;
  fresh: string;
  onRefresh: () => void;
  onLock?: () => void;
  onSuggest?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const go = (t: TabId) => {
    setOpen(false);
    onTab(t);
  };

  return (
    <header
      className={cn(
        "bg-popover/90 sticky top-0 isolate z-50 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none",
        "lg:fixed lg:inset-x-0 lg:top-0 lg:translate-y-[18px]",
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-home]")) go("home");
      }}
    >
      <div className="lg:bg-popover relative z-50 container flex h-[var(--header-height)] items-center justify-between gap-4 lg:h-[calc(var(--header-height)-20px)] lg:rounded-full lg:shadow-sm lg:backdrop-blur-md">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Studio sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "hover:bg-accent inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                tab === t.id && "bg-accent font-semibold",
              )}
            >
              {t.label}
              <Count n={counts[t.id] || 0} />
            </button>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <span className="text-muted-foreground hidden items-center gap-2 text-xs xl:inline-flex">
            <span className="relative flex size-1.5">
              <span className="bg-chart-2 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-chart-2 relative inline-flex size-1.5 rounded-full" />
            </span>
            {fresh}
          </span>
          {onSuggest ? (
            <Button size="sm" variant="outline" className="rounded-full px-3" onClick={onSuggest} title="Suggest a feature">
              <Lightbulb className="size-4" /> <span className="hidden xl:inline">Suggest</span>
            </Button>
          ) : null}
          <ThemeToggle />
          {onLock ? (
            <Button size="sm" variant="ghost" className="rounded-full px-3" onClick={onLock}>
              Lock
            </Button>
          ) : null}
          <Button size="sm" className="rounded-full px-3.5 shadow-none" onClick={onRefresh}>
            <RefreshLinear className="size-4" /> Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            className="text-muted-foreground relative flex size-8 rounded-sm border"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <span className="sr-only">Open menu</span>
            <div className="absolute top-1/2 left-1/2 block w-4 -translate-x-1/2 -translate-y-1/2">
              <span aria-hidden className={cn("absolute block h-0.25 w-full rounded-full bg-current transition duration-500 ease-in-out", open ? "rotate-45" : "-translate-y-1.5")} />
              <span aria-hidden className={cn("absolute block h-0.25 w-full rounded-full bg-current transition duration-500 ease-in-out", open ? "opacity-0" : "")} />
              <span aria-hidden className={cn("absolute block h-0.25 w-full rounded-full bg-current transition duration-500 ease-in-out", open ? "-rotate-45" : "translate-y-1.5")} />
            </div>
            {(counts.create || 0) + (counts.plan || 0) > 0 && !open ? (
              <span className="bg-chart-2 absolute -top-1 -right-1 size-2.5 rounded-full ring-2 ring-[var(--popover)]" />
            ) : null}
          </button>
        </div>
      </div>

      {/* Mobile menu (the template's full-screen menu) */}
      <div
        className={cn(
          "bg-popover text-popover-foreground fixed inset-0 z-40 flex flex-col justify-between pt-[var(--header-height)] tracking-normal transition-opacity duration-300 ease-out lg:hidden",
          open ? "visible opacity-100" : "pointer-events-none invisible opacity-0",
        )}
      >
        <div className="container py-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className={cn(
                "hover:text-foreground flex w-full items-center justify-between px-2 py-3 text-left text-lg transition-colors",
                tab === t.id ? "text-primary font-semibold" : "text-foreground/80",
              )}
            >
              <span className="inline-flex items-center gap-3">
                <t.icon className="size-5" /> {t.label}
              </span>
              <Count n={counts[t.id] || 0} />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t px-6 py-4">
          <p className="text-muted-foreground text-center text-xs">{fresh}</p>
          <Button
            className="h-12 w-full rounded-full shadow-sm"
            onClick={() => {
              setOpen(false);
              onRefresh();
            }}
          >
            <RefreshLinear className="size-4" /> Refresh data
          </Button>
          {onSuggest ? (
            <Button variant="outline" className="h-12 w-full rounded-full" onClick={() => { setOpen(false); onSuggest(); }}>
              <Lightbulb className="size-4" /> Suggest a feature
            </Button>
          ) : null}
          {onLock ? (
            <Button variant="outline" className="h-12 w-full rounded-full" onClick={() => { setOpen(false); onLock(); }}>
              Lock the Studio
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
