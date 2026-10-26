import { AnimatePresence, motion } from "motion/react";
import { Component, useCallback, useState, type ReactNode } from "react";

import { ToastProvider, nyDay } from "./bits";
import { BrandsPanel } from "./brands";
import { CarouselsPanel } from "./carousels";
import { CreatePanel } from "./create";
import { useStudioData } from "./data";
import StudioFooter from "./footer";
import { InsightsPanel } from "./insights";
import LockScreen from "./lock";
import StudioNavbar from "./navbar";
import { HomePanel } from "./panels";
import { PlanPanel } from "./plan";
import { RequestModal } from "./request";
import { StudioProvider } from "./store";
import { TABS, type TabId } from "./tabs";
import { TrendsPanel } from "./trends";

/** Keeps one broken screen from blanking the whole Studio. */
class Boundary extends Component<{ children: ReactNode; resetKey: string }, { err: boolean; key: string }> {
  state = { err: false, key: this.props.resetKey };
  static getDerivedStateFromError() {
    return { err: true };
  }
  static getDerivedStateFromProps(p: { resetKey: string }, s: { err: boolean; key: string }) {
    return p.resetKey !== s.key ? { err: false, key: p.resetKey } : null;
  }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="container py-40 text-center">
        <p className="text-lg font-semibold">This screen hit a snag.</p>
        <p className="text-muted-foreground mt-2 text-sm">Try another tab, or refresh the page. Use Suggest a feature to tell Bernie what you tapped.</p>
      </div>
    );
  }
}

const initialTab = (): TabId => {
  try {
    const t = localStorage.getItem("mts-tab") as TabId | null;
    if (t && TABS.some((x) => x.id === t)) return t;
  } catch {
    /* ignore */
  }
  return "home";
};

export default function App() {
  return (
    <ToastProvider>
      <Studio />
    </ToastProvider>
  );
}

function Studio() {
  const s = useStudioData();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [req, setReq] = useState<{ open: boolean; resume: { key: string; question: string } | null }>({ open: false, resume: null });

  const goto = useCallback((t: TabId) => {
    setTab(t);
    try {
      localStorage.setItem("mts-tab", t);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const openRequest = useCallback((resume?: { key: string; question: string }) => setReq({ open: true, resume: resume || null }), []);

  if (s.locked) return <LockScreen onUnlock={s.unlock} error={s.authError} checking={s.checking} />;

  const ideas = s.data?.ideas || [];
  const today = nyDay();
  const counts: Partial<Record<TabId, number>> = {
    create: ideas.filter((x) => x.status === "idea").length,
    plan:
      ideas.filter((x) => (x.status === "planned" || x.status === "filmed") && x.plan_date && x.plan_date < today).length +
      (s.data?.carousels || []).filter((x) => x.status === "planned" && x.plan_date && x.plan_date < today).length,
  };
  const fresh = s.data ? "Live from n8n" : "Connecting…";
  return (
    <StudioProvider value={{ d: s.data, mutate: s.mutate, refresh: s.refresh, goto, openRequest }}>
      <div className="flex min-h-screen flex-col">
        <StudioNavbar tab={tab} onTab={goto} counts={counts} fresh={fresh} onRefresh={() => void s.refresh()} onLock={s.lock} onSuggest={() => openRequest()} />
        {s.notice ? (
          <div className="container relative z-40 mt-4 lg:fixed lg:inset-x-0 lg:top-[calc(var(--header-height)+4px)] lg:mt-0">
            <div className={"bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-md " + (s.notice.kind === "err" ? "border-rose-500/50" : "border-amber-500/50")}>
              <p className="max-w-[70ch] text-sm">{s.notice.text}</p>
              {s.notice.button ? (
                <button type="button" onClick={s.notice.onClick} className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium">
                  {s.notice.button}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <Boundary resetKey={tab}>
              {tab === "home" ? (
                <HomePanel />
              ) : tab === "plan" ? (
                <PlanPanel />
              ) : tab === "create" ? (
                <CreatePanel />
              ) : tab === "carousels" ? (
                <CarouselsPanel />
              ) : tab === "trends" ? (
                <TrendsPanel />
              ) : tab === "insights" ? (
                <InsightsPanel d={s.data} />
              ) : (
                <BrandsPanel />
              )}
              </Boundary>
            </motion.div>
          </AnimatePresence>
        </main>
        <StudioFooter onSuggest={() => openRequest()} />
        <RequestModal key={req.resume ? "r-" + req.resume.key : "new"} open={req.open} resume={req.resume} onClose={() => setReq({ open: false, resume: null })} />
      </div>
    </StudioProvider>
  );
}
