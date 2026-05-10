import { EngineType } from './types'

export const ANNUAL_AGE_MULTIPLIERS: Array<{ minAge: number; multiplier: number }> = [
  { minAge: 20, multiplier: 0 },
  { minAge: 15, multiplier: 0.10 },
  { minAge: 14, multiplier: 0.18 },
  { minAge: 13, multiplier: 0.26 },
  { minAge: 12, multiplier: 0.35 },
  { minAge: 11, multiplier: 0.43 },
  { minAge: 10, multiplier: 0.51 },
  { minAge: 9,  multiplier: 0.59 },
  { minAge: 8,  multiplier: 0.67 },
  { minAge: 7,  multiplier: 0.75 },
  { minAge: 6,  multiplier: 0.84 },
  { minAge: 5,  multiplier: 0.92 },
  { minAge: 0,  multiplier: 1.00 },
]

export const REG_AGE_MULTIPLIERS: Array<{ minAge: number; multiplier: number }> = [
  { minAge: 20, multiplier: 0.05 },
  { minAge: 19, multiplier: 0.06 },
  { minAge: 18, multiplier: 0.07 },
  { minAge: 17, multiplier: 0.08 },
  { minAge: 16, multiplier: 0.09 },
  { minAge: 15, multiplier: 0.10 },
  { minAge: 14, multiplier: 0.12 },
  { minAge: 13, multiplier: 0.14 },
  { minAge: 12, multiplier: 0.16 },
  { minAge: 11, multiplier: 0.19 },
  { minAge: 10, multiplier: 0.22 },
  { minAge: 9,  multiplier: 0.26 },
  { minAge: 8,  multiplier: 0.31 },
  { minAge: 7,  multiplier: 0.36 },
  { minAge: 6,  multiplier: 0.42 },
  { minAge: 5,  multiplier: 0.48 },
  { minAge: 4,  multiplier: 0.56 },
  { minAge: 3,  multiplier: 0.65 },
  { minAge: 2,  multiplier: 0.75 },
  { minAge: 1,  multiplier: 0.87 },
  { minAge: 0,  multiplier: 1.00 },
]

export const MOTO_TAX_YOUNG: Array<{ minCc: number; maxCc: number; tax: number }> = [
  { minCc: 1501, maxCc: Infinity, tax: 90 },
  { minCc: 1001, maxCc: 1500,     tax: 75 },
  { minCc: 501,  maxCc: 1000,     tax: 60 },
  { minCc: 126,  maxCc: 500,      tax: 45 },
  { minCc: 51,   maxCc: 125,      tax: 30 },
]

export const MOTO_TAX_OLD: Array<{ minCc: number; maxCc: number; tax: number }> = [
  { minCc: 1501, maxCc: Infinity, tax: 75 },
  { minCc: 1001, maxCc: 1500,     tax: 60 },
  { minCc: 501,  maxCc: 1000,     tax: 45 },
  { minCc: 126,  maxCc: 500,      tax: 30 },
]

export const MASS_CONFIG: Record<string, Record<string, {
  threshold: number; annualRate: number; annualCap: number; regRate: number; regCap: number
}>> = {
  car_or_powerful_van: {
    [EngineType.ICE]:      { threshold: 2000, annualRate: 0.4, annualCap: 400, regRate: 2, regCap: 2000 },
    [EngineType.NOVC_HEV]: { threshold: 2000, annualRate: 0.4, annualCap: 400, regRate: 2, regCap: 2000 },
    [EngineType.OVC_HEV]:  { threshold: 2200, annualRate: 0.4, annualCap: 400, regRate: 2, regCap: 2000 },
    [EngineType.ELECTRIC]: { threshold: 2400, annualRate: 0.4, annualCap: 440, regRate: 2, regCap: 2200 },
  },
}

export const NEDC_COEFFICIENTS = {
  car_or_powerful_van: 1.21,
  weak_van_or_dwelling: 1.30,
} as const

export const MISSING_CO2_CAP = 350

export const OVC_HEV_MISSING_CO2_REG_FIXED = {
  car_or_powerful_van: 230,
  weak_van_or_dwelling: 138,
} as const
