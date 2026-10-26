import { useTheme } from "@/hooks/use-theme";

import { FluxShader } from "@/components/elements/flux-shader";
import { useChartColors } from "@/hooks/use-chart-colors";
import { useMounted } from "@/hooks/use-mounted";

export function AuthShaderPanel() {
  const { resolvedTheme } = useTheme();
  const chartColors = useChartColors();
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";
  const shaderBackgroundColor = isDark ? "#0a0a0d" : "#ffffff";
  const shaderObjectColor = isDark ? "#ffffff" : "#0a0a0d";

  return (
    <div className="relative hidden overflow-hidden lg:block">
      <FluxShader
        key={isDark ? "dark" : "light"}
        backgroundColor={shaderBackgroundColor}
        objectColor={shaderObjectColor}
        accentColors={[chartColors.chart1, chartColors.chart2, chartColors.chart3]}
        accentStrength={0.14}
        className="pointer-events-none absolute inset-0 h-full max-h-none min-h-0 opacity-60 dark:opacity-50"
      />
    </div>
  );
}
