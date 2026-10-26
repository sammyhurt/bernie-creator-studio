import { siteConfig } from "@/data/config";

import { Wordmark } from "./wordmark";

export default function StudioFooter({ onSuggest }: { onSuggest?: () => void }) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#2f4156] py-14 text-white lg:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center overflow-hidden">
        <span className="font-serif translate-y-[30%] text-[8rem] leading-none text-white/[0.05] select-none sm:text-[14rem] lg:text-[20rem]">Bernie</span>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 260px at 10% 0%, rgba(200,217,230,0.18), transparent 70%), radial-gradient(500px 240px at 100% 10%, rgba(86,124,141,0.35), transparent 70%)" }} />
      <div className="relative z-10 container flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <Wordmark light size="lg" />
          <p className="mt-6 max-w-sm text-xl leading-snug font-medium">Brooklyn living, one video at a time.</p>
          <a href={siteConfig.tiktok} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-white/70 hover:text-white">
            {siteConfig.handle} on TikTok
          </a>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {onSuggest ? (
            <button type="button" onClick={onSuggest} className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-[#2f4156]">
              Suggest a feature
            </button>
          ) : null}
          <p className="text-xs text-white/60">Private to Bernie · nothing posts without his OK.</p>
        </div>
      </div>
    </footer>
  );
}
