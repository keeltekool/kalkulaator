import type { SalaryYear } from './types'

export const INCOME_TAX_RATE: Record<SalaryYear, number> = {
  2022: 0.20,
  2023: 0.20,
  2024: 0.20,
  2025: 0.22,
  2026: 0.22,
}

export const SOCIAL_TAX_RATE = 0.33

export const MINIMUM_SOCIAL_TAX: Record<SalaryYear, number> = {
  2022: 192.72,
  2023: 215.82,
  2024: 239.25,
  2025: 270.60,
  2026: 292.38,
}

export const EMPLOYER_UNEMPLOYMENT_RATE = 0.008
export const EMPLOYEE_UNEMPLOYMENT_RATE = 0.016

export const LOCAL_GOVERNMENT_TAX_SHARE = 0.1129

export const SOCIAL_TAX_PENSION_SHARE = 0.04

export const TAX_FREE_ANNUAL: Record<SalaryYear, number> = {
  2022: 6000,
  2023: 7848,
  2024: 7848,
  2025: 7848,
  2026: 8400,
}

export const TAX_FREE_MONTHLY: Record<SalaryYear, number> = {
  2022: 500,
  2023: 654,
  2024: 654,
  2025: 654,
  2026: 700,
}

export const RETIRED_TAX_FREE_ANNUAL = 9312
export const RETIRED_TAX_FREE_MONTHLY = 776

export const SLIDING_LOWER = 14400
export const SLIDING_UPPER = 25200
export const SLIDING_RANGE = 10800
