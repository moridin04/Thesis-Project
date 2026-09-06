export {
  overviewStats,
  riskDistribution,
  topBarangaysByDpi,
  priorityBarangays,
} from './mockOverview'

export const datasetMeta = {
  version: '2026.1-mock',
  lastUpdated: '2026-08-22',
  sourceNote: 'Prototype dataset for thesis demonstration only.',
}

export const indicatorsCatalog = [
  {
    name: 'Flood depth',
    category: 'Hazard',
    description:
      'Estimated maximum inundation depth during modeled rainfall scenarios.',
  },
  {
    name: 'Rainfall index',
    category: 'Hazard',
    description: 'Composite rainfall intensity indicator for the barangay area.',
  },
  {
    name: 'Population density',
    category: 'Exposure',
    description: 'Residents per square kilometer within the barangay boundary.',
  },
  {
    name: 'Poverty index',
    category: 'Vulnerability',
    description: 'Composite socioeconomic vulnerability indicator.',
  },
]

export const methodologySections = [
  {
    title: 'Data sources',
    body: 'OpenStreetMap boundaries, PSA census tables, and approved rainfall scenario layers.',
  },
  {
    title: 'Preprocessing',
    body: 'Spatial joins, normalization, missing-value handling, and feature validation.',
  },
  {
    title: 'Risk classification',
    body: 'Random Forest model with cross-validation and held-out evaluation.',
  },
  {
    title: 'Limitations',
    body: 'Prototype outputs use approved mock and sample datasets and must not be treated as forecasts.',
  },
]

export const recommendationsByCategory = {
  Critical: [
    'Prioritize evacuation planning and shelter readiness.',
    'Coordinate with barangay disaster response teams.',
  ],
  High: [
    'Maintain drainage assets and clear priority corridors.',
    'Review localized preparedness materials regularly.',
  ],
  Moderate: [
    'Monitor seasonal rainfall advisories.',
    'Update community hazard maps and contact lists.',
  ],
}
