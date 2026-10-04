// AGOS wordmark and the two-line tagline from the brand config.
// The public header uses the default mark. Login uses the white one.
// Image files are local. Tagline text comes from auth/config.

import { BRAND } from '../../auth/config'
import agosLogo from '../../assets/agos-logo-transparent.png'
import agosLogoWhite from '../../assets/agos-logo-white.png'

/**
 * @param {{ variant?: 'default' | 'white' }} props
 * `white` = white wordmark for dark surfaces (footer already uses its own asset).
 */
export default function BrandLogo({ variant = 'default' }) {
  const src = variant === 'white' ? agosLogoWhite : agosLogo
  return (
    <div className="flex items-center gap-3 sm:gap-3.5">
      <img
        src={src}
        alt="AGOS Manila logo"
        width={160}
        height={98}
        className="brand-mark"
        decoding="async"
      />
      <div className="header-brand-text">
        <span className="header-tagline-line">{BRAND.taglineLine1}</span>
        <span className="header-tagline-line">{BRAND.taglineLine2}</span>
      </div>
    </div>
  )
}
