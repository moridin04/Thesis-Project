import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, UserCircle2 } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

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

  const initials = (account?.full_name || account?.username || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="public-header__user-menu" ref={rootRef}>
      <button
        type="button"
        className="public-header__user-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="public-header__avatar" aria-hidden>
          {initials || <UserCircle2 className="h-4 w-4" />}
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
