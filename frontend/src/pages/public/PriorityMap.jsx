import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GeoJSON, MapContainer, ScaleControl, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  BarChart3,
  Bookmark,
  ChevronRight,
  Compass,
  Download,
  Home,
  Info,
  List,
  MapPin,
  Users,
  Waves,
} from 'lucide-react'
import BarangayPhoto from '../../components/shared/BarangayPhoto'
import PublicHeader from '../../components/public/PublicHeader'
import { riskColors } from '../../theme/colors'
import { usePublicBarangays } from '../../hooks/usePublicBarangays'
import { buildReportHtml, downloadTextFile, exportBasename, rowsToCsv } from '../../utils/agosExport'
import 'leaflet/dist/leaflet.css'

function FitToData({ data }) {
  const map = useMap()
  useEffect(() => {
    if (!data?.features?.length) return
    const bounds = L.geoJSON(data).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [4, 4] })
  }, [data, map])
  return null
}

function OverviewMiniMap() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/manila-barangays.geojson')
      .then((response) => response.json())
      .then((json) => {
        if (active) setData(json)
      })
      .catch(() => {
        if (active) setData(null)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="h-28 overflow-hidden rounded-lg">
      <MapContainer
        center={[14.5995, 120.9842]}
        zoom={11}
        className="h-full w-full"
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
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
                weight: 0.2,
                fillColor: 'var(--color-secondary)',
                fillOpacity: 0.65,
              }}
            />
          </>
        ) : null}
      </MapContainer>
    </div>
  )
}

function BoundaryMap({ selectedName, onSelect, riskByName }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/manila-barangays.geojson')
      .then((response) => response.json())
      .then((json) => {
        if (active) setData(json)
      })
      .catch(() => {
        if (active) setData(null)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <MapContainer
      center={[14.5995, 120.9842]}
      zoom={13}
      className="h-full min-h-[320px] w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {data ? (
        <GeoJSON
          key={`${selectedName || 'all'}-${riskByName.size}`}
          data={data}
          style={(feature) => {
            const name = feature?.properties?.name
            const level = riskByName.get(name)
            return {
              color: 'var(--color-foundation)',
              weight: name === selectedName ? 2 : 0.4,
              fillColor: riskColors[level] || 'var(--color-pale)',
              fillOpacity: name === selectedName ? 0.9 : 0.55,
            }
          }}
          onEachFeature={(feature, layer) => {
            layer.on('click', () => onSelect(feature?.properties?.name))
          }}
        />
      ) : null}
      <ScaleControl position="bottomleft" imperial={false} />
    </MapContainer>
  )
}

function scoreOf(row, key, fallback) {
  const value = row?.[key]
  return typeof value === 'number' ? value : fallback
}

function IndicatorRow({ icon: Icon, label, value, barClass }) {
  const width = `${Math.max(0, Math.min(1, value)) * 100}%`
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm text-foundation">
        <span className="inline-flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-ocean" aria-hidden />
          {label}
        </span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-pale/70">
        <div className={`h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
    </div>
  )
}

export default function PriorityMap() {
  const { rows: barangays, loading, error } = usePublicBarangays()
  const [district, setDistrict] = useState('All Districts')
  const [barangayName, setBarangayName] = useState('All Barangays')

  const districts = useMemo(() => {
    return [...new Set(barangays.map((row) => row.district).filter(Boolean))].sort()
  }, [barangays])

  const filtered = useMemo(() => {
    if (district === 'All Districts') return barangays
    return barangays.filter((row) => row.district === district)
  }, [barangays, district])

  const selected = useMemo(() => {
    if (barangayName !== 'All Barangays') {
      return filtered.find((row) => row.barangay === barangayName) ?? filtered[0] ?? barangays[0]
    }
    return filtered[0] ?? barangays[0]
  }, [barangayName, filtered, barangays])

  const exportRows = useMemo(() => {
    if (barangayName !== 'All Barangays') {
      const match = filtered.find((row) => row.barangay === barangayName)
      return match ? [match] : []
    }
    return filtered
  }, [barangayName, filtered])

  const hazard = scoreOf(selected, 'hazard', selected?.dpi ?? 0)
  const exposure = scoreOf(selected, 'exposure', selected?.dpi ?? 0)
  const vulnerability = scoreOf(selected, 'vulnerability', selected?.dpi ?? 0)

  const exportDisabled = exportRows.length === 0
  const exportDisabledTitle = 'No barangays match the current filters.'

  function exportCsv() {
    if (exportDisabled) return
    downloadTextFile(
      `${exportBasename()}.csv`,
      rowsToCsv(exportRows),
      'text/csv;charset=utf-8',
    )
  }

  function exportReport() {
    if (exportDisabled) return
    downloadTextFile(
      `${exportBasename()}.html`,
      buildReportHtml(exportRows),
      'text/html;charset=utf-8',
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-foundation text-white lg:h-screen lg:overflow-hidden">
      <PublicHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="order-2 flex w-full shrink-0 flex-col gap-4 bg-foundation p-4 lg:order-1 lg:w-80 lg:overflow-y-auto">
          <h1 className="text-lg font-bold text-white">Barangay Priority Map</h1>
          {loading ? <p className="text-sm text-pale">Loading priorities…</p> : null}
          {error ? <p className="text-sm text-pale">{error}</p> : null}

          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-medium text-pale">
              <MapPin className="h-4 w-4" aria-hidden />
              District
            </span>
            <select
              value={district}
              onChange={(event) => {
                setDistrict(event.target.value)
                setBarangayName('All Barangays')
              }}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white"
            >
              <option className="text-foundation">All Districts</option>
              {districts.map((name) => (
                <option key={name} className="text-foundation">
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-medium text-pale">
              <Users className="h-4 w-4" aria-hidden />
              Barangay
            </span>
            <select
              value={filtered.some((row) => row.barangay === barangayName) ? barangayName : 'All Barangays'}
              onChange={(event) => setBarangayName(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white"
            >
              <option className="text-foundation">All Barangays</option>
              {filtered.map((row) => (
                <option key={row.id ?? row.barangay} className="text-foundation">
                  {row.barangay}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <OverviewMiniMap />
            <p className="mt-2 text-center text-[0.65rem] uppercase tracking-widest text-white/60">
              City Overview
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pale">
              Planning Priority (Relative)
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: riskColors.High }} aria-hidden />
                High Priority
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: riskColors.Medium }} aria-hidden />
                Medium Priority
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: riskColors.Low }} aria-hidden />
                Low Priority
              </li>
            </ul>
          </div>

          <div className="mt-auto flex gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>This map supports planning and resource prioritization only. It is not an official warning.</p>
          </div>
        </aside>

        <section className="relative order-1 min-h-[320px] flex-1 lg:order-2">
          <BoundaryMap
            selectedName={selected?.barangay}
            riskByName={new Map(barangays.map((row) => [row.barangay, row.riskLevel]))}
            onSelect={(name) => {
              if (name) setBarangayName(name)
            }}
          />
          <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-full bg-foundation/90 p-2 text-white">
            <Compass className="h-5 w-5" aria-label="North" />
          </div>
        </section>

        <aside className="order-3 w-full shrink-0 bg-white p-4 text-foundation lg:w-[22rem] lg:overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Selected Barangay</p>
            <Bookmark className="h-4 w-4 text-ocean" aria-hidden />
          </div>
          <BarangayPhoto
            imageUrl={selected?.imageUrl}
            alt={selected ? `${selected.barangay} photo` : ''}
            className="mb-3 h-36 w-full rounded-xl object-cover"
          />
          {selected ? (
            <Link
              to={`/barangays/${selected.id}`}
              className="mb-4 flex items-center justify-between gap-2"
            >
              <span>
                <span className="block text-lg font-bold">{selected.barangay}</span>
                <span className="text-sm text-ocean">{selected.district}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-action" aria-hidden />
            </Link>
          ) : null}
          <div className="space-y-3">
            <IndicatorRow icon={Waves} label="Hazard" value={hazard} barClass="bg-[var(--risk-high)]" />
            <IndicatorRow icon={Users} label="Exposure" value={exposure} barClass="bg-[var(--risk-moderate)]" />
            <IndicatorRow icon={Home} label="Vulnerability" value={vulnerability} barClass="bg-secondary" />
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-ocean">
            <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Higher values indicate greater relative need for planning attention.
          </p>
        </aside>
      </div>

      <div className="grid shrink-0 gap-3 border-t border-white/10 bg-foundation p-3 sm:grid-cols-3">
        <Link
          to="/compare"
          className="flex items-center gap-3 rounded-xl bg-slate-800 p-4 text-left transition-colors hover:bg-slate-700"
        >
          <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Compare Barangays</span>
            <span className="block text-xs text-white/70">View and contrast indicators across selected areas.</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        <Link
          to="/rankings"
          className="flex items-center gap-3 rounded-xl bg-slate-800 p-4 text-left transition-colors hover:bg-slate-700"
        >
          <List className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Barangay Ranking</span>
            <span className="block text-xs text-white/70">See the priority ranking across Manila.</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        <div
          className={`flex flex-col gap-3 rounded-xl bg-slate-800 p-4 text-left ${exportDisabled ? 'opacity-60' : ''}`}
          title={exportDisabled ? exportDisabledTitle : undefined}
        >
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Export</span>
              <span className="block text-xs text-white/70">Download the current filtered view.</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={exportDisabled}
              title={exportDisabled ? exportDisabledTitle : 'Export as CSV'}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium enabled:hover:bg-white/20 disabled:cursor-not-allowed"
            >
              Export as CSV
            </button>
            <button
              type="button"
              onClick={exportReport}
              disabled={exportDisabled}
              title={exportDisabled ? exportDisabledTitle : 'Export as Report'}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium enabled:hover:bg-white/20 disabled:cursor-not-allowed"
            >
              Export as Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
