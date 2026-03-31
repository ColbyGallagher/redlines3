import type { Theme } from "@glideapps/glide-data-grid"

/**
 * Reads a CSS custom property from :root / .dark and returns its current
 * computed value.  Falls back to `fallback` when running server-side or
 * when the property is not defined.
 */
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return value || fallback
}

/**
 * Build a Glide Data Grid `Theme` that mirrors the application's Shadcn /
 * Tailwind CSS design tokens.  Because the grid renders on a `<canvas>` it
 * cannot consume CSS variables directly — we read them once and pass the
 * resolved values.
 *
 * Call this inside a `useMemo` so values are recalculated when the colour
 * scheme changes.
 */
export function buildGlideTheme(): Partial<Theme> {
  // ── Resolved design-token values ──────────────────────────────────
  const bg = cssVar("--background", "#ffffff")
  const fg = cssVar("--foreground", "#0f172a")
  const card = cssVar("--card", "#ffffff")
  const cardFg = cssVar("--card-foreground", "#0f172a")
  const muted = cssVar("--muted", "#f1f5f9")
  const mutedFg = cssVar("--muted-foreground", "#64748b")
  const border = cssVar("--border", "#e2e8f0")
  const primary = cssVar("--primary", "#dc4a2d")
  const primaryFg = cssVar("--primary-foreground", "#fef2f2")
  const accent = cssVar("--accent", "#f1f5f9")
  const ring = cssVar("--ring", "#dc4a2d")

  return {
    // Cell backgrounds
    bgCell: card,
    bgHeader: muted,
    bgHeaderHasFocus: accent,
    bgHeaderHovered: accent,
    bgBubble: muted,
    bgBubbleSelected: primary,
    bgSearchResult: accent,

    // Text
    textDark: cardFg,
    textMedium: mutedFg,
    textLight: mutedFg,
    textBubble: fg,
    textHeader: mutedFg,
    textHeaderSelected: primaryFg,
    textGroupHeader: fg,

    // Borders / lines
    borderColor: border,
    horizontalBorderColor: border,
    drilldownBorder: border,

    // Selection & focus
    accentColor: primary,
    accentFg: primaryFg,
    accentLight: accent,

    // Link colour
    linkColor: primary,

    // Grid chrome
    bgIconHeader: mutedFg,
    fgIconHeader: card,
    bgCellMedium: bg,

    // Header font
    headerFontStyle: "600 13px",
    baseFontStyle: "13px",
    editorFontSize: "13px",
    lineHeight: 1.5,
  }
}
