/** PLACEHOLDER — replace with real survey URLs before launch */
export const feedbackLinks = {
  user: 'https://example.com/sagip-user-feedback',
  expert: 'https://example.com/sagip-expert-feedback',
}

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

export const avatarColors = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-primary)',
  'var(--color-secondary)',
]

export function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
