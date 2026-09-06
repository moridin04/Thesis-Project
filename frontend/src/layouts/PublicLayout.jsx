import { Outlet } from 'react-router-dom'
import PublicHeader from '../components/public/PublicHeader'
import PublicFooter from '../components/public/PublicFooter'

export default function PublicLayout() {
  return (
    <div className="page-shell-public flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto min-h-[calc(100vh-var(--public-header-height))] max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <div className="public-footer-shell mt-auto">
        <PublicFooter />
      </div>
    </div>
  )
}
