import Calendar from "@iconify-react/solar/calendar-linear";
import Chart from "@iconify-react/solar/chart-2-linear";
import Fire from "@iconify-react/solar/fire-linear";
import Home from "@iconify-react/solar/home-2-linear";
import GalleryWide from "@iconify-react/solar/gallery-wide-linear";
import Magic from "@iconify-react/solar/magic-stick-3-linear";
import Star from "@iconify-react/solar/star-linear";

export type TabId = "home" | "plan" | "create" | "carousels" | "trends" | "insights" | "brands";
export const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "plan", label: "Plan", icon: Calendar },
  { id: "create", label: "Create", icon: Magic },
  { id: "carousels", label: "Carousels", icon: GalleryWide },
  { id: "trends", label: "Trends", icon: Fire },
  { id: "insights", label: "Insights", icon: Chart },
  { id: "brands", label: "Brands", icon: Star },
];
