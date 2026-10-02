import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GeoJSON, MapContainer, ScaleControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Building2,
  Database,
  Link2,
  Mountain,
  Shield,
  Users,
  Waves,
} from 'lucide-react'
import BarangayPhoto from '../../components/shared/BarangayPhoto'
import { fetchPublicBarangay } from '../../services/publicService'
import { riskColors } from '../../theme/colors'

const calculationSteps = [
  'Normalize indicators',
  'Apply entropy weights (Hazard 0.19, Exposure 0.75, Vulnerability 0.06)',
  'Compute composite DPI score',
  'Rank among Manila barangays',
]

const profileDataSources = [
  { label: 'Hazard (e.g., flood maps)' },
  { label: 'Exposure (e.g. population data)' },
  { label: 'Vulnerability (e.g., built environment)' },
]

function FitToData({ data }) {
  const map = useMap()
  useEffect(() => {
    if (!data?.features?.length) return
    const bounds = L.geoJSON(data).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [12, 12] })
  }, [data, map])
  return null
}

function SelectedBarangayMap({ name, riskLevel }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/manila-barangays.geojson')
      .then((response) => response.json())
      .then((json) => {
        if (!active) return
        const match = (json.features || []).find((feature) => feature.properties?.name === name)
        setData(match ? { type: 'FeatureCollection', features: [match] } : null)
      })
      .catch(() => {
        if (active) setData(null)
      })
    return () => {
      active = false
    }
  }, [name])

  return (
    <div className="relative h-56 overflow-hidden rounded-xl">
      <MapContainer
        center={[14.5995, 120.9842]}
        zoom={14}
        className="h-full w-full"
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        {data ? (
          <>
            <FitToData data={data} />
            <GeoJSON
              data={data}
              style={{
                color: 'var(--color-foundation)',
                weight: 1.5,
                fillColor: riskColors[riskLevel] || 'var(--color-pale)',
                fillOpacity: 0.75,
              }}
            />
          </>
        ) : null}
        <ScaleControl position="bottomleft" imperial={false} />
      </MapContainer>
    </div>
  )
}

function ScoreBar({ icon: Icon, label, value, barClass }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-foundation">
          <Icon className="h-4 w-4 text-ocean" aria-hidden />
          {label}
        </span>
        <span className="tabular-nums text-foundation">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-pale/80">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function PriorityGauge({ value }) {
  const radius = 58
  const circumference = Math.PI * radius
  const filled = circumference * (Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 100" className="w-40" aria-hidden>
        <path
          d="M16 88 A64 64 0 0 1 144 88"
          fill="none"
          className="text-pale"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M16 88 A64 64 0 0 1 144 88"
          fill="none"
          className="text-accent"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <p className="-mt-8 text-center">
        <span className="font-display text-4xl font-bold text-foundation">{value}</span>
        <span className="text-sm text-ocean">/100</span>
      </p>
    </div>
  )
}

export default function BarangayProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trailOpen, setTrailOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchPublicBarangay(id)
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch(() => {
        if (active) {
          setProfile(null)
          setError('Unable to load this barangay profile.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <p className="text-sm text-ocean">Loading barangay profile…</p>
  if (error || !profile) return <p className="text-sm text-accent">{error || 'Barangay not found.'}</p>

  const hazardScore = profile.hazardScore ?? Math.round((profile.dpi ?? 0) * 100)
  const exposureScore = profile.exposureScore ?? Math.round((profile.dpi ?? 0) * 100)
  const vulnerabilityScore = profile.vulnerabilityScore ?? Math.round((profile.dpi ?? 0) * 100)
  const priorityScore = profile.priorityScore ?? Math.round((profile.dpi ?? 0) * 100)

  const band = (score) => (score >= 67 ? 'High' : score >= 34 ? 'Medium' : 'Low')
  const factors = [
    { icon: Waves, label: 'Flood coverage', tag: band(hazardScore), bar: 'bg-[var(--risk-high)]', width: hazardScore },
    { icon: Users, label: 'Affected population estimate', tag: band(exposureScore), bar: 'bg-[var(--risk-moderate)]', width: exposureScore },
    { icon: Building2, label: 'Population density', tag: band(exposureScore), bar: 'bg-[var(--risk-moderate)]', width: Math.min(100, exposureScore) },
    { icon: Mountain, label: 'Mean elevation', tag: profile.elevationMean == null ? '—' : `${Number(profile.elevationMean).toFixed(2)} m`, bar: 'bg-secondary', width: 100 },
  ]

  const headingName = profile.barangay.replace(/^Barangay\s+/i, '')

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">Barangay Profile</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-foundation sm:text-4xl">
          Barangay {headingName}, Manila
        </h1>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.2fr_0.8fr]">
        <div className="rounded-2xl border border-pale bg-surface p-4">
          <SelectedBarangayMap name={profile.barangay} riskLevel={profile.riskLevel} />
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-ocean">
            <span className="h-3 w-3 rounded-sm" style={{ background: riskColors[profile.riskLevel] }} aria-hidden />
            Selected Barangay
          </p>
        </div>

        <div className="rounded-2xl border border-pale bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-foundation">Why this priority?</h2>
          <p className="mt-2 text-sm text-ocean">
            This barangay has higher relative risk due to the combined effects of hazard, exposure,
            and vulnerability.
          </p>
          <div className="mt-5 space-y-4">
            <ScoreBar icon={Waves} label="Hazard" value={hazardScore} barClass="bg-[var(--risk-high)]" />
            <ScoreBar icon={Users} label="Exposure" value={exposureScore} barClass="bg-[var(--risk-moderate)]" />
            <ScoreBar icon={Shield} label="Vulnerability" value={vulnerabilityScore} barClass="bg-secondary" />
          </div>
        </div>

        <div className="rounded-2xl border border-pale bg-white p-5 text-center">
          <h2 className="font-display text-lg font-semibold text-foundation">Relative Planning Priority</h2>
          <div className="mt-2">
            <PriorityGauge value={priorityScore} />
          </div>
          <p className="mt-2 text-sm font-semibold text-accent">Higher relative priority</p>
          <p className="text-xs text-ocean">Compared to other Manila barangays</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-pale bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-foundation">Contributing Factors</h2>
          <ul className="mt-4 space-y-4">
            {factors.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-foundation">
                      <Icon className="h-4 w-4 text-ocean" aria-hidden />
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-ocean">{item.tag}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-pale/80">
                    <div className={`h-full ${item.bar}`} style={{ width: `${item.width}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-pale bg-white p-5">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setTrailOpen((open) => !open)}
            aria-expanded={trailOpen}
          >
            <h2 className="font-display text-lg font-semibold text-foundation">View Calculation Trail</h2>
            <span className="text-ocean">{trailOpen ? '–' : '›'}</span>
          </button>
          {trailOpen ? (
            <ol className="mt-4 space-y-3">
              {calculationSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-ocean">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foundation text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <div className="rounded-2xl border border-pale bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-foundation">Data Source</h2>
          <ul className="mt-4 space-y-3 text-sm text-ocean">
            {profileDataSources.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <Database className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </li>
            ))}
            <li>
              <button
                type="button"
                className="inline-flex items-center gap-2 font-medium text-action hover:underline"
                onClick={() => setTrailOpen(true)}
              >
                <Link2 className="h-4 w-4" aria-hidden />
                View Calculation Trail
              </button>
            </li>
          </ul>
        </div>
      </section>

      <BarangayPhoto
        imageUrl={profile.imageUrl}
        alt=""
        className="h-40 w-full rounded-2xl object-cover"
      />
    </div>
  )
}
