import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { NAV_ADMIN, NAV_LGU, navRoleFromAuth } from '../../config/navRoles'
import BrandLogo from '../shared/BrandLogo'
import ScrollProgress from './ScrollProgress'
import UserMenu from './UserMenu'

const publicNavItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/risk-map', label: 'Risk Map' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/methodology', label: 'Methodology' },
]

const workspaceNavItems = [
  { to: '/dashboard/overview', label: 'Dashboard', roles: [NAV_LGU, NAV_ADMIN], matchPrefix: '/dashboard' },
  { to: '/admin/review-uploads', label: 'Admin Panel', roles: [NAV_ADMIN], matchPrefix: '/admin' },
]

const SCROLL_THRESHOLD = 24

export default function PublicHeader() {
  const { isAuthenticated, role, loading } = useAuth()
  const navRole = navRoleFromAuth(isAuthenticated, role)
  const [menuPath, setMenuPath] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const open = menuPath === location.pathname
  const menuId = 'public-mobile-nav'

  const navItems = [
    ...publicNavItems,
    ...workspaceNavItems.filter((item) => item.roles.includes(navRole)),
  ]

  useEffect(() => {
    let frame = 0

    function updateScrolled() {
      frame = 0
      const next = window.scrollY > SCROLL_THRESHOLD
      setIsScrolled((prev) => (prev === next ? prev : next))
    }

    function onScroll() {
      if (frame) return
      frame = window.requestAnimationFrame(updateScrolled)
    }

    updateScrolled()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuPath(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function closeMenu() {
    setMenuPath(null)
  }

  function toggleMenu() {
    setMenuPath((current) =>
      current === location.pathname ? null : location.pathname,
    )
  }

  const linkClass = ({ isActive }) =>
    `public-nav-link ${isActive ? 'public-nav-link--active' : ''}`

  function navLinkClass(item) {
    return ({ isActive }) => {
      const active = item.matchPrefix
        ? location.pathname.startsWith(item.matchPrefix)
        : isActive
      return `public-nav-link ${active ? 'public-nav-link--active' : ''}`
    }
  }

  function mobileLinkClass(item) {
    return ({ isActive }) => {
      const active = item.matchPrefix
        ? location.pathname.startsWith(item.matchPrefix)
        : isActive
      return `public-nav-link public-nav-link--mobile ${active ? 'public-nav-link--active' : ''}`
    }
  }

  const showLogin = !loading && navRole === 'public'
  const showUserMenu = !loading && navRole !== 'public'

  return (
    <header
      className={`public-header ${isScrolled ? 'public-header--scrolled' : ''}`}
    >
      <div className="public-header__bar">
        <Link
          to="/"
          aria-label="SAGIP Manila home"
          className="public-header__brand min-w-0 shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
        >
          <BrandLogo />
        </Link>

        <nav className="public-header__nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={item.matchPrefix ? navLinkClass(item) : linkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="public-header__actions">
          {showLogin ? (
            <Link to="/login" className="public-header__login">
              Login
            </Link>
          ) : null}
          {showUserMenu ? <UserMenu /> : null}
          <button
            type="button"
            className="public-header__menu-btn"
            aria-label={open ? 'Close main menu' : 'Open main menu'}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={toggleMenu}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div id={menuId} className="public-header__mobile">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={item.matchPrefix ? mobileLinkClass(item) : linkClass}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}
            {showLogin ? (
              <Link
                to="/login"
                className="public-header__login public-header__login--menu"
                onClick={closeMenu}
              >
                Login
              </Link>
            ) : null}
            {showUserMenu ? (
              <div className="mt-2 px-1">
                <UserMenu />
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}

      <ScrollProgress />
    </header>
  )
}
