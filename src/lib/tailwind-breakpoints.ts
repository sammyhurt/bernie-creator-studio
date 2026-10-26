export const tailwindBreakpoints = [
  { name: "2xl", min: 1536 },
  { name: "xl", min: 1280 },
  { name: "lg", min: 1024 },
  { name: "md", min: 768 },
  { name: "sm", min: 640 },
] as const;

export type TailwindBreakpointName = (typeof tailwindBreakpoints)[number]["name"] | "default";

export function getTailwindBreakpoint(width: number): TailwindBreakpointName {
  for (const breakpoint of tailwindBreakpoints) {
    if (width >= breakpoint.min) {
      return breakpoint.name;
    }
  }

  return "default";
}
