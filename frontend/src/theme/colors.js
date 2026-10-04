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
 * Priority class colors (labels always accompany color). Values are the
 * --color-priority-* tokens in index.css; keep hex values there only.
 */
export const riskColors = {
  High: 'var(--color-priority-high)',
  Medium: 'var(--color-priority-medium)',
  Low: 'var(--color-priority-low)',
}

/* Shade of each class color that passes WCAG AA as text on white. */
export const riskTextColors = {
  High: 'var(--color-priority-high-text)',
  Medium: 'var(--color-priority-medium-text)',
  Low: 'var(--color-priority-low-text)',
}

export const riskBadgeClasses = {
  High: 'bg-[color:var(--color-priority-high-soft)] text-[color:var(--color-priority-high-text)] ring-[color:var(--color-priority-high-ring)]',
  Medium:
    'bg-[color:var(--color-priority-medium-soft)] text-[color:var(--color-priority-medium-text)] ring-[color:var(--color-priority-medium-ring)]',
  Low: 'bg-[color:var(--color-priority-low-soft)] text-[color:var(--color-priority-low-text)] ring-[color:var(--color-priority-low-ring)]',
}

export const riskLegend = [
  { label: 'Low Priority', level: 'Low', color: riskColors.Low },
  { label: 'Medium Priority', level: 'Medium', color: riskColors.Medium },
  { label: 'High Priority', level: 'High', color: riskColors.High },
]
