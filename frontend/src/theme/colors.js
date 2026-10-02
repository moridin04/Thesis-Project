/** AGOS Manila semantic color tokens — single source of truth for JS consumers */
export const colors = {
  darkest: '#003135',
  primary: '#024950',
  accent: '#964734',
  secondary: '#0FA4AF',
  tint: '#AFDDE5',
  primaryHover: '#013238',
  tintSoft: 'rgba(175, 221, 229, 0.35)',
  secondarySoft: 'rgba(15, 164, 175, 0.15)',
  accentSoft: 'rgba(150, 71, 52, 0.1)',
  background: '#FFFFFF',
  backgroundSoft: 'rgba(175, 221, 229, 0.35)',
  surface: '#FFFFFF',
  textHeading: '#003135',
  textBody: 'rgba(0, 49, 53, 0.75)',
  textMuted: 'rgba(0, 49, 53, 0.55)',
  textOnPrimary: '#FFFFFF',
  white: '#FFFFFF',

  /* Aliases used by charts and legacy components */
  foundation: '#003135',
  ocean: '#406467',
  action: '#024950',
  pale: '#AFDDE5',
  ink: '#003135',
  brandTeal: '#024950',
  brandPeach: '#964734',
  brandWhite: '#FFFFFF',
  brandBlue100: '#AFDDE5',
  brandBlue400: '#0FA4AF',
  primarySoft: 'rgba(15, 164, 175, 0.15)',
  secondaryHover: '#0FA4AF',
  accentSoftMuted: 'rgba(150, 71, 52, 0.1)',
  textPrimary: '#003135',
  textSecondary: 'rgba(0, 49, 53, 0.75)',
  surfaceBlue: 'rgba(175, 221, 229, 0.35)',
}

/**
 * Semantic flood-risk scale (labels always accompany color).
 * Brand palette colors are not used for dangerous risk states.
 */
export const riskColors = {
  High: '#C2410C',
  Medium: '#B8893D',
  Low: colors.primary,
}

export const riskBadgeClasses = {
  High: 'bg-[color-mix(in_srgb,var(--risk-high)_12%,white)] text-[var(--risk-high)] ring-[color-mix(in_srgb,var(--risk-high)_28%,white)]',
  Medium:
    'bg-[color-mix(in_srgb,var(--risk-moderate)_16%,white)] text-[color-mix(in_srgb,var(--risk-moderate)_82%,black)] ring-[color-mix(in_srgb,var(--risk-moderate)_38%,white)]',
  Low: 'bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] ring-[color-mix(in_srgb,var(--primary)_28%,white)]',
}

export const riskLegend = [
  { label: 'Low Priority', level: 'Low', color: riskColors.Low },
  { label: 'Medium Priority', level: 'Medium', color: riskColors.Medium },
  { label: 'High Priority', level: 'High', color: riskColors.High },
]
