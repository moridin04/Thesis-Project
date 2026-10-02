export const datasetMeta = {
  version: '2026.1-mock',
  lastUpdated: '2026-08-22',
  sourceNote: 'Prototype dataset for thesis demonstration only.',
}

export const dpiAggregationNote =
  'The Disaster Prioritization Index (DPI) uses a two-level aggregation: individual indicators within each component (Hazard, Exposure, Vulnerability) are normalized and equally averaged into a component score. The three component scores are then combined using entropy-derived weights to produce the final DPI, which is used to classify barangays into Low, Medium, and High flood risk priority.'

export const indicatorSections = [
  {
    title: 'Hazard Score Indicators',
    rows: [
      {
        indicator: 'Flood PCT 5yr',
        formula: '(FloodArea₅ / BarangayArea) × 100',
        description: 'Percentage of barangay area intersecting the 5-year flood-hazard layer',
      },
      {
        indicator: 'Flood PCT 25yr',
        formula: '(FloodArea₂₅ / BarangayArea) × 100',
        description: 'Percentage of barangay area intersecting the 25-year flood-hazard layer',
      },
      {
        indicator: 'Flood Escalation 5→25',
        formula: 'FloodPCT₂₅ − FloodPCT₅',
        description: 'Increase in flood coverage percentage from the 5-year to 25-year scenario',
      },
      {
        indicator: 'Flood Severity Increase 5→25',
        formula: 'FloodArea₂₅ − FloodArea₅ (sqm)',
        description: 'Increase in flooded land area in square meters',
      },
    ],
  },
  {
    title: 'Exposure Score Indicators',
    rows: [
      {
        indicator: 'Affected Population 5yr',
        formula: 'Population₂₀₂₄ × FloodPCT₅ / 100',
        description: 'Estimated population affected under the 5-year flood scenario',
      },
      {
        indicator: 'Affected Population 25yr',
        formula: 'Population₂₀₂₄ × FloodPCT₂₅ / 100',
        description: 'Estimated population affected under the 25-year flood scenario',
      },
      {
        indicator: 'Affected Population Increase 5→25',
        formula: 'AffectedPop₂₅ − AffectedPop₅',
        description: 'Additional population affected between the two scenarios',
      },
    ],
  },
  {
    title: 'Vulnerability Score Indicators',
    rows: [
      {
        indicator: 'Population Density (per hectare)',
        formula: 'Population₂₀₂₄ / BarangayArea(ha)',
        description: 'Concentration of residents per hectare',
      },
      {
        indicator: 'Population Change 2020–2024 (%)',
        formula: '((Pop₂₀₂₄ − Pop₂₀₂₀) / Pop₂₀₂₀) × 100',
        description: 'Recent barangay-level population growth or decline',
      },
      {
        indicator: 'Elevation_Mean (reverse-normalized)',
        formula: 'DTM-derived mean elevation, NAMRIA',
        description: 'Lower elevation corresponds to greater physical susceptibility to flooding',
      },
    ],
  },
  {
    title: 'Identifiers and target',
    note: 'Display and joining fields only. These are not used as machine-learning predictors.',
    rows: [
      {
        indicator: 'Barangay',
        formula: 'Name / label',
        description: 'Used for joining and display only',
      },
      {
        indicator: 'PSGC / Barangay code',
        formula: 'Administrative code',
        description: 'Used for joining and mapping only',
      },
      {
        indicator: 'DPI Risk-Priority Class',
        formula: 'Low / Medium / High tertile',
        description: 'The tertile-based target label produced by the model',
      },
    ],
  },
]

export const methodologySections = [
  {
    title: 'Data sources',
    body: 'LiPAD 5-year and 25-year flood hazard data, PSA 2020 and 2024 population, barangay administrative data, and DTM-derived elevation.',
  },
  {
    title: 'Preprocessing',
    body: 'Spatial joins, normalization, missing-value handling, and feature validation.',
  },
  {
    title: 'Risk classification',
    body: 'Three models (Random Forest, Gradient Boosting and MLP) were trained and compared using cross-validation on the training data. Gradient Boosting scored highest and was selected, and it is the model applied to every barangay.',
  },
  {
    title: 'Limitations',
    body: 'Outputs are planning-support classifications based on the finalized dataset. They are not forecasts or real-time warnings and do not replace official advisories.',
  },
  {
    title: 'Data Governance and Validation',
    points: [
      'Zero flood-coverage values are retained only when valid geometry, source coverage, coordinate reference, and absence of spatial intersection are confirmed. Missing, unmatched, failed, or out-of-coverage values are not silently converted to zero.',
      'The 100-year flood return-period layer was excluded after validation found inconsistencies in 589 of 897 barangays, where 100-year flood coverage was lower than 25-year coverage — evidence of unreliable source data for that layer.',
      'All dataset versions, validation logs, and update records are maintained to support reproducibility and auditability.',
    ],
  },
]

export const ndrrmpPillars = [
  { pillar: 'Prevention and Mitigation', lead: 'DOST' },
  { pillar: 'Preparedness', lead: 'DILG' },
  { pillar: 'Response and Early Recovery', lead: 'DSWD' },
  { pillar: 'Rehabilitation and Recovery', lead: 'NEDA' },
]
export const recommendationsByCategory = {
  High: [
    'Prioritize evacuation planning and shelter readiness.',
    'Coordinate with barangay disaster response teams.',
  ],
  Medium: [
    'Monitor seasonal rainfall advisories.',
    'Update community hazard maps and contact lists.',
  ],
  Low: [
    'Maintain drainage assets and clear priority corridors.',
    'Review localized preparedness materials regularly.',
  ],
}
