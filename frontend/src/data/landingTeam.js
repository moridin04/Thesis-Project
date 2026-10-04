/*
 * Team names and feedback links for the landing page.
 * Landing.jsx builds the team cards and the two survey buttons from this.
 * The survey URLs below are still placeholders.
 */
/** PLACEHOLDER — replace with real survey URLs before launch */
export const feedbackLinks = {
  user: 'https://example.com/agos-user-feedback',
  expert: 'https://example.com/agos-expert-feedback',
}

// Names and emails shown on the landing team section.
export const teamMembers = [
  {
    name: 'Jan Allen R. Bernabe',
    email: 'janallen.bernabe@example.com',
  },
  {
    name: 'Justin Neo R. Flores',
    email: 'justin.flores@example.com',
  },
  {
    name: 'Angelo Gabriel D. Castillo',
    email: 'angelo.castillo@example.com',
  },
  {
    name: 'Erica O. Galindo',
    email: 'erica.galindo@example.com',
  },
  {
    name: 'Xavier P. Pagdanganan',
    email: 'xavier.pagdanganan@example.com',
  },
]

// One color per member. The list repeats if there are more people.
export const avatarColors = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-primary)',
  'var(--color-secondary)',
]

// First letters of the first two words, for the round avatar.
export function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
