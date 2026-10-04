// Top bar for public pages, the dashboard, and the admin area.
// Those layouts, plus Landing and the priority map, render it.
// Visible links depend on useAuth and config/navRoles.

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
  { to: '/priority-map', label: 'Priority Map' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/methodology', label: 'Methodology' },
  { to: '/about', label: 'About' },
]

const workspaceNavItems = [
  { to: '/dashboard/overview', label: 'Dashboard', roles: [NAV_LGU, NAV_ADMIN], matchPrefix: '/dashboard' },
  { to: '/admin/review-uploads', label: 'Admin Panel', roles: [NAV_ADMIN], matchPrefix: '/admin' },
]

const SCROLL_THRESHOLD = 24

// Role links, a mobile menu, and the scroll progress strip.
export default function PublicHeader() {
  const { isAuthenticated, role, loading } = useAuth()
  const navRole = navRoleFromAuth(isAuthenticated, role)
  const [menuPath, setMenuPath] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  // The menu is stored per path, so a route change closes it.
  const open = menuPath === location.pathname
  const menuId = 'public-mobile-nav'

  // Dashboard and Admin links appear only for roles listed on each item.
  const navItems = [
    ...publicNavItems,
    ...workspaceNavItems.filter((item) => item.roles.includes(navRole)),
  ]

  useEffect(() => {
    let frame = 0

    // Past 24px we mark the header as scrolled, and skip a no-op update.
    function updateScrolled() {
      frame = 0
      const next = window.scrollY > SCROLL_THRESHOLD
      setIsScrolled((prev) => (prev === next ? prev : next))
    }

    // One update per frame, even if many scroll events arrive.
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

  // Escape closes the mobile menu.
  useEffect(() => {
    // Escape clears the open menu.
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuPath(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Clears the stored path so the menu closes.
  function closeMenu() {
    setMenuPath(null)
  }

  // Opens the menu for this path, or closes it if it is already open.
  function toggleMenu() {
    setMenuPath((current) =>
      current === location.pathname ? null : location.pathname,
    )
  }

  // Desktop link style. Active state comes from the router.
  const linkClass = ({ isActive }) =>
    `public-nav-link ${isActive ? 'public-nav-link--active' : ''}`

  // Workspace links stay active for the whole dashboard or admin section.
  function navLinkClass(item) {
    return ({ isActive }) => {
      const active = item.matchPrefix
        ? location.pathname.startsWith(item.matchPrefix)
        : isActive
      return `public-nav-link ${active ? 'public-nav-link--active' : ''}`
    }
  }

  // Same active rule, with the mobile link style added.
  function mobileLinkClass(item) {
    return ({ isActive }) => {
      const active = item.matchPrefix
        ? location.pathname.startsWith(item.matchPrefix)
        : isActive
      return `public-nav-link public-nav-link--mobile ${active ? 'public-nav-link--active' : ''}`
    }
  }

  // Visitors see Login. Signed-in staff and admins see the account menu.
  const showLogin = !loading && navRole === 'public'
  const showUserMenu = !loading && navRole !== 'public'

  return (
    <header
      className={`public-header ${isScrolled ? 'public-header--scrolled' : ''}`}
    >
      <div className="public-header__bar">
        <Link
          to="/"
          aria-label="AGOS Manila home"
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
