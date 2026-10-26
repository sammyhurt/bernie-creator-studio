import GalleryWide from "@iconify-react/solar/gallery-wide-linear";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useStudio } from "./store";

/** "Make it a carousel": opens the Carousels tab with this idea filled in, plus where it came from. */
export function CarouselButton({ topic, label, text, facts, size = "sm", variant = "outline", children = "Make it a carousel", className }: { topic: string; label: string; text?: string; facts?: string; size?: "sm" | "xs"; variant?: "outline" | "ghost"; children?: string; className?: string }) {
  const s = useStudio();
  return (
    <Button type="button" size={size} variant={variant} className={cn("rounded-full", size === "xs" ? "px-2.5" : "px-3", className)} onClick={() => s.startCarousel({ topic, label, text, facts })}>
      <GalleryWide className={size === "xs" ? "size-3.5" : "size-4"} /> {children}
    </Button>
  );
}
