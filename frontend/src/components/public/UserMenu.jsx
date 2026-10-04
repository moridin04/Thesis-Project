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

export default function UserMenu() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
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

  async function handleLogout() {
    await logout()
    setOpen(false)
    navigate('/', { replace: true })
  }

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
