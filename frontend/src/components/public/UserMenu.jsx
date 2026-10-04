// Account menu in the public header for signed-in staff and admins.
// PublicHeader shows it after auth, when the role is not public.
// Name and role come from useAuth. Icons use config/permissions.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, IdCard, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { ROLE_ADMIN, ROLE_STAFF } from '../../config/permissions'

const ROLE_AVATARS = {
  [ROLE_ADMIN]: { Icon: ShieldCheck, label: 'Admin' },
  [ROLE_STAFF]: { Icon: IdCard, label: 'LGU Staff' },
}
const FALLBACK_AVATAR = { Icon: UserRound, label: null }

// Closes on an outside click or Escape, then can sign the user out.
export default function UserMenu() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // Outside click or Escape closes the menu.
  useEffect(() => {
    // A click outside the menu closes it.
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    // Escape closes the menu.
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // Signs out and returns to the public home page.
  async function handleLogout() {
    await logout()
    setOpen(false)
    navigate('/', { replace: true })
  }

  // Admin and staff get their own icon. Anyone else gets a user icon.
  const { Icon: RoleIcon, label: roleLabel } = ROLE_AVATARS[account?.role] ?? FALLBACK_AVATAR

  return (
    <div className="public-header__user-menu" ref={rootRef}>
      <button
        type="button"
        className="public-header__user-trigger"
        aria-label={roleLabel ? `Account menu, ${roleLabel}` : 'Account menu'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="public-header__avatar" title={roleLabel ?? undefined} aria-hidden>
          <RoleIcon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      </button>
      {open ? (
        <div className="public-header__user-dropdown" role="menu">
          <p className="public-header__user-name">{account?.full_name || account?.username}</p>
          {/* Any role other than admin is labeled LGU / Staff. */}
          <p className="public-header__user-role">{account?.role === 'admin' ? 'Admin' : 'LGU / Staff'}</p>
          <button type="button" className="public-header__user-logout" role="menuitem" onClick={handleLogout}>
            <LogOut className="h-4 w-4" aria-hidden />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
