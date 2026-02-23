export const OUTCOME_SERIES_COLORS = [
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#F59E0B",
];

/** Fallback when CSS vars are not available (SSR or missing theme). */
export const CHART_BACKGROUND_FALLBACK = "#1E293B";

/**
 * Reads theme colors from the document and returns SciChart theme overrides
 * so chart background and axis/grid colors match the app theme.
 * Call in the browser when creating the chart.
 */
export function getSciChartThemeOverrides(): {
  sciChartBackground: string;
  tickTextBrush?: string;
  axisBorder?: string;
  majorGridLineBrush?: string;
  minorGridLineBrush?: string;
  gridBackgroundBrush?: string;
  axisBandsFill?: string;
} {
  if (typeof document === "undefined") {
    return { sciChartBackground: CHART_BACKGROUND_FALLBACK };
  }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const surface = style.getPropertyValue("--color-surface").trim();
  const text = style.getPropertyValue("--color-text").trim();
  const border = style.getPropertyValue("--color-border").trim();
  const pageBg = style.getPropertyValue("--color-page-bg").trim();
  const sciChartBackground =
    surface || pageBg || CHART_BACKGROUND_FALLBACK;
  const tickTextBrush = text || undefined;
  const axisBorder = border || undefined;
  const majorGridLineBrush = border || undefined;
  const minorGridLineBrush = border || undefined;
  const gridBackgroundBrush = sciChartBackground;
  const axisBandsFill = surface || pageBg || undefined;
  return {
    sciChartBackground,
    ...(tickTextBrush && { tickTextBrush }),
    ...(axisBorder && { axisBorder }),
    ...(majorGridLineBrush && { majorGridLineBrush }),
    ...(minorGridLineBrush && { minorGridLineBrush }),
    ...(gridBackgroundBrush && { gridBackgroundBrush }),
    ...(axisBandsFill && { axisBandsFill }),
  };
}
