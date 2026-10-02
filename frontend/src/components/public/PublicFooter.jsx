import { Link } from 'react-router-dom'
import { ArrowUp, Phone } from 'lucide-react'
import agosLogoWhite from '../../assets/agos-logo-white.png'

const siteMapLinks = [
  { to: '/', label: 'Home' },
  { to: '/priority-map', label: 'Priority Map' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/methodology', label: 'Methodology' },
]

const projectLinks = [
  { to: '/about', label: 'About the Team' },
  { to: '/methodology', label: 'Data Sources' },
  { to: '/#feedback-cta', label: 'Give Feedback' },
]

const resourceLinks = [
  { to: '/overview', label: 'Overview' },
  { to: '/compare', label: 'Compare' },
  { to: '/indicators', label: 'Indicators' },
  { to: '/recommendations', label: 'Recommendations' },
]

const contactPhone = '(91) 98765 4321 54'
const contactPhoneHref = 'tel:+9198765432154'

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="public-footer__social-icon">
        <path
          fill="currentColor"
          d="M13.5 3.5H16V0h-2.5C10.57 0 9 1.74 9 4.89V7.5H6v3.5h3V24h3.5v-13H16l.5-3.5h-3V5.22c0-1 .28-1.72 1.72-1.72z"
        />
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="public-footer__social-icon">
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
    ),
  },
]

function scrollToTop() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
}

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer__container">
        <div className="public-footer__top">
          <div className="public-footer__brand">
            <div className="public-footer__brand-row">
              <img
                src={agosLogoWhite}
                alt=""
                width={160}
                height={98}
                className="brand-mark"
                decoding="async"
              />
            </div>
            <p className="public-footer__mission">
              A Barangay-Level Flood Risk Prioritization and Decision Support Platform
            </p>
            <div className="public-footer__social" aria-label="Social media">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="public-footer__social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <nav className="public-footer__nav-col" aria-label="Site map">
            <p className="public-footer__nav-heading">Site Map</p>
            <ul className="public-footer__link-list">
              {siteMapLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="public-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="public-footer__nav-col" aria-label="Project">
            <p className="public-footer__nav-heading">Project</p>
            <ul className="public-footer__link-list">
              {projectLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="public-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="public-footer__nav-col" aria-label="Resources">
            <p className="public-footer__nav-heading">Resources</p>
            <ul className="public-footer__link-list">
              {resourceLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="public-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="public-footer__nav-col public-footer__contact">
            <p className="public-footer__nav-heading">Contact Us</p>
            <a href={contactPhoneHref} className="public-footer__phone">
              <Phone className="public-footer__phone-icon" aria-hidden />
              <span>{contactPhone}</span>
            </a>
          </div>
        </div>

        <div className="public-footer__accent-bar" aria-hidden="true" />

        <div className="public-footer__bottom">
          <p className="public-footer__copyright">
            © 2025-2026 AGOS Team, Thesis Project. All Rights Reserved.
          </p>
          <button type="button" className="public-footer__back-to-top" onClick={scrollToTop}>
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
            Back to Top
          </button>
        </div>
      </div>
    </footer>
  )
}
