import { riskColors } from '../theme/colors'

export const overviewStats = {
  totalBarangays: 897,
  highRiskCount: 142,
  affectedPopulation: 1_284_500,
  bestModelF1: 0.912,
}

export const riskDistribution = [
  { name: 'Low', value: 318, color: riskColors.Low },
  { name: 'Moderate', value: 287, color: riskColors.Moderate },
  { name: 'High', value: 150, color: riskColors.High },
  { name: 'Critical', value: 142, color: riskColors.Critical },
]

export const topBarangaysByDpi = [
  { barangay: 'Baseco', dpi: 0.94 },
  { barangay: 'Tondo I', dpi: 0.91 },
  { barangay: 'Quiapo', dpi: 0.88 },
  { barangay: 'San Andres', dpi: 0.85 },
  { barangay: 'Pandacan', dpi: 0.83 },
  { barangay: 'Sta. Ana', dpi: 0.81 },
  { barangay: 'Port Area', dpi: 0.79 },
  { barangay: 'Sampaloc', dpi: 0.76 },
]

export const priorityBarangays = [
  {
    id: 1,
    barangay: 'Baseco Compound',
    district: 'Port Area',
    riskLevel: 'Critical',
    dpi: 0.94,
    population: 62400,
    floodDepthM: 2.8,
  },
  {
    id: 2,
    barangay: 'Barangay 1',
    district: 'Tondo',
    riskLevel: 'Critical',
    dpi: 0.91,
    population: 41200,
    floodDepthM: 2.5,
  },
  {
    id: 3,
    barangay: 'Barangay 306',
    district: 'Quiapo',
    riskLevel: 'High',
    dpi: 0.88,
    population: 18750,
    floodDepthM: 2.1,
  },
  {
    id: 4,
    barangay: 'Barangay 745',
    district: 'San Andres',
    riskLevel: 'High',
    dpi: 0.85,
    population: 22100,
    floodDepthM: 1.9,
  },
  {
    id: 5,
    barangay: 'Barangay 833',
    district: 'Pandacan',
    riskLevel: 'High',
    dpi: 0.83,
    population: 19800,
    floodDepthM: 1.8,
  },
  {
    id: 6,
    barangay: 'Barangay 878',
    district: 'Santa Ana',
    riskLevel: 'High',
    dpi: 0.81,
    population: 15600,
    floodDepthM: 1.7,
  },
  {
    id: 7,
    barangay: 'Barangay 650',
    district: 'Port Area',
    riskLevel: 'Moderate',
    dpi: 0.79,
    population: 9400,
    floodDepthM: 1.5,
  },
  {
    id: 8,
    barangay: 'Barangay 412',
    district: 'Sampaloc',
    riskLevel: 'Moderate',
    dpi: 0.76,
    population: 27300,
    floodDepthM: 1.4,
  },
]
