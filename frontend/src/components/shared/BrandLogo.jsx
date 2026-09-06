import { BRAND } from '../../auth/config'
import sagipLogo from '../../assets/sagip-logo.png'

export default function BrandLogo() {
  return (
    <div className="flex items-center gap-3 sm:gap-3.5">
      <img
        src={sagipLogo}
        alt="SAGIP Manila logo"
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
