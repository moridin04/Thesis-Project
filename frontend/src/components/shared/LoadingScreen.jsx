import agosLogo from '../../assets/agos-logo-transparent.png'
import { BRAND } from '../../auth/config'

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="card-surface flex flex-col items-center gap-4 px-8 py-10">
        <img
          src={agosLogo}
          alt="AGOS Manila logo"
          width={120}
          height={74}
          className="brand-mark max-h-12"
          decoding="async"
        />
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-heading">
            {BRAND.name}
          </p>
          <p className="mt-1 text-sm text-body">{message}</p>
        </div>
      </div>
    </div>
  )
}
