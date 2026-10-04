// Draws a fake barangay map for a hero card on the landing page.
// The current Landing page does not import this file.
// It does not read a data module. Fills are theme tokens.
// Low uses tint #afdde5 and secondary #0fa4af.
// Medium uses --risk-moderate #b8893d. High uses accent #964734.

/**
 * Stylized static choropleth preview for the landing hero visual card.
 * Simplified barangay polygons — not geographically precise.
 */
export default function HeroMapPreview() {
  const stroke = 'var(--background)'

  return (
    <svg
      className="hero-map-preview"
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Simplified barangay risk map preview"
    >
      {/* Low risk — light teal */}
      <path
        d="M48 88 L92 62 L128 78 L118 118 L72 124 Z"
        fill="var(--color-tint)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M128 78 L168 68 L188 108 L162 132 L118 118 Z"
        fill="var(--color-secondary)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M28 132 L72 124 L88 168 L52 188 L24 160 Z"
        fill="var(--color-tint)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M188 108 L228 96 L252 136 L220 158 L162 132 Z"
        fill="var(--color-tint)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M252 136 L288 124 L304 168 L268 188 L220 158 Z"
        fill="var(--color-secondary)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M88 168 L118 118 L162 132 L148 178 L108 198 Z"
        fill="var(--color-tint)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Medium priority — amber */}
      <path
        d="M148 178 L162 132 L220 158 L208 204 L168 216 Z"
        fill="var(--risk-moderate)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M208 204 L220 158 L268 188 L256 228 L212 236 Z"
        fill="var(--risk-moderate)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M108 198 L148 178 L168 216 L142 252 L96 240 Z"
        fill="var(--risk-moderate)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M52 188 L88 168 L108 198 L96 240 L58 228 Z"
        fill="var(--risk-moderate)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <path
        d="M168 216 L208 204 L212 236 L188 268 L148 252 Z"
        fill="var(--risk-moderate)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* High risk — rust accent */}
      <path
        d="M142 252 L168 216 L188 268 L162 292 L128 278 Z"
        fill="var(--color-accent)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M188 268 L212 236 L256 228 L248 272 L208 284 Z"
        fill="var(--color-accent)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.92"
      />
      <path
        d="M128 278 L162 292 L152 312 L112 304 L96 240 L142 252 Z"
        fill="var(--color-accent)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.88"
      />
      <path
        d="M220 158 L268 188 L256 228 L212 236 L208 204 Z"
        fill="var(--color-accent)"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  )
}
