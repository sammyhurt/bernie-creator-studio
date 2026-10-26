import { motion as m } from "motion/react";
import { useTheme } from "@/hooks/use-theme";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  const shineVariant = {
    hidden: {
      opacity: 0,
      scale: 2,
      strokeDasharray: "20, 1000",
      strokeDashoffset: 0,
      filter: "blur(0px)",
    },
    visible: {
      opacity: [0, 1, 0],
      strokeDashoffset: [0, -50, -100],
      filter: ["blur(2px)", "blur(2px)", "blur(0px)"],
      transition: {
        duration: 0.75,
      },
    },
  };

  const raysVariants = {
    hidden: {
      strokeOpacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    visible: {
      strokeOpacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const rayVariant = {
    hidden: {
      pathLength: 0,
      opacity: 0,
      scale: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        pathLength: { duration: 0.3 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 },
      },
    },
  };

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";

    if (document.startViewTransition) {
      document.documentElement.classList.remove("page-transition");
      document.documentElement.classList.add("theme-transition");

      const transition = document.startViewTransition(() => {
        setTheme(nextTheme);
      });

      transition.finished.finally(() => {
        document.documentElement.classList.remove("theme-transition");
      });
    } else {
      setTheme(nextTheme);
    }
  };

  const sunPath =
    "M70 49.5C70 60.8218 60.8218 70 49.5 70C38.1782 70 29 60.8218 29 49.5C29 38.1782 38.1782 29 49.5 29C60 29 69.5 38 70 49.5Z";
  const moonPath =
    "M70 49.5C70 60.8218 60.8218 70 49.5 70C38.1782 70 29 60.8218 29 49.5C29 38.1782 38.1782 29 49.5 29C39 45 49.5 59.5 70 49.5Z";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-theme-toggle
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      suppressHydrationWarning
    >
      <m.svg
        strokeWidth="4"
        strokeLinecap="round"
        width={100}
        height={100}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary relative"
      >
        <m.path
          variants={shineVariant}
          d={moonPath}
          className="stroke-primary absolute top-0 left-0"
          initial="hidden"
          animate={isDark ? "visible" : "hidden"}
        />

        <m.g
          variants={raysVariants}
          initial="hidden"
          animate={isDark ? "hidden" : "visible"}
          className="stroke-primary stroke-6"
          style={{ strokeLinecap: "round" }}
        >
          <m.path className="origin-center" variants={rayVariant} d="M50 2V11" />
          <m.path variants={rayVariant} d="M85 15L78 22" />
          <m.path variants={rayVariant} d="M98 50H89" />
          <m.path variants={rayVariant} d="M85 85L78 78" />
          <m.path variants={rayVariant} d="M50 98V89" />
          <m.path variants={rayVariant} d="M23 78L16 84" />
          <m.path variants={rayVariant} d="M11 50H2" />
          <m.path variants={rayVariant} d="M23 23L16 16" />
        </m.g>

        <m.path
          d={sunPath}
          className="fill-primary stroke-primary"
          transition={{ duration: 1, type: "spring" }}
          initial={{ fillOpacity: 0, strokeOpacity: 0, rotate: 0, scale: 1 }}
          animate={{
            d: isDark ? moonPath : sunPath,
            rotate: isDark ? -360 : 0,
            scale: isDark ? 2 : 1,
            fillOpacity: 0.35,
            strokeOpacity: 1,
            transition: { delay: 0.1 },
          }}
        />
      </m.svg>
    </Button>
  );
}
