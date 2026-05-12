import type { TaxFreeInput, TaxFreeResult } from './types'
import {
  SLIDING_LOWER, SLIDING_UPPER, SLIDING_RANGE,
  TAX_FREE_ANNUAL, TAX_FREE_MONTHLY,
  RETIRED_TAX_FREE_ANNUAL, RETIRED_TAX_FREE_MONTHLY,
  EMPLOYEE_UNEMPLOYMENT_RATE,
} from '@/calculators/salary/constants'

function round(n: number, dec: number): string {
  const x = Math.round(n * Math.pow(10, dec))
  return (x / Math.pow(10, dec)).toFixed(dec)
}

export function calculateTaxFree(input: TaxFreeInput): TaxFreeResult {
  const {
    year, inputMode, amount, inputPeriod, workHoursPerMonth,
    includeEmployeeUnemployment, includeFundedPension, fundedPensionRate,
    outputPeriod, retired,
  } = input

  const warnings: string[] = []

  // 2026 flat mode
  if (year === 2026) {
    const monthly = retired ? RETIRED_TAX_FREE_MONTHLY : TAX_FREE_MONTHLY[2026]
    const annual = retired ? RETIRED_TAX_FREE_ANNUAL : TAX_FREE_ANNUAL[2026]
    const val = outputPeriod === 'annual' ? annual : monthly
    return {
      taxFreeAmount: round(val, 2),
      annualRevenue: 'N/A',
      outputPeriod,
      year,
      warnings: ['2026. aasta maksuvaba tulu on fikseeritud summa, ei sõltu sissetulekust.'],
    }
  }

  // 2025 source parity
  const itr = 0.22
  const taxfreeMin = 7848
  const uip2 = includeEmployeeUnemployment ? EMPLOYEE_UNEMPLOYMENT_RATE : 0
  const fp1 = includeFundedPension ? fundedPensionRate : 0

  const workhours = inputPeriod === 'hourly' ? workHoursPerMonth : 1
  const nper = inputPeriod === 'annual' ? 12 : 1
  const sum = amount * workhours

  const i = outputPeriod === 'annual' ? 12 : 1

  // Compute annual revenue
  let annualRevenueStr: string

  if (inputMode === 'gross') {
    annualRevenueStr = round(sum * 12 / nper, 2)
  } else {
    // Net reverse
    const X = Number(round(
      ((sum * 12 / nper) / (1 - itr) - SLIDING_UPPER * (1 - (fp1 + uip2)))
      /
      (-((SLIDING_UPPER - SLIDING_LOWER) / taxfreeMin) * (1 - (fp1 + uip2)) - 1 + 1 / (1 - itr)),
      2
    ))

    let n: number
    if (X < 0) {
      n = 0
    } else if ((sum * (1 - (fp1 + uip2)) * 12 / nper) < taxfreeMin && X > taxfreeMin) {
      n = sum
    } else if (X > taxfreeMin) {
      n = taxfreeMin * nper / 12
    } else {
      n = Number(round(X * nper / 12, 2))
    }

    const incTaxRate = ((sum * (1 - (fp1 + uip2)) * 12 / nper) - n) <= 0 ? 0 : itr

    annualRevenueStr = round(
      Number(round((((sum - n) / (1 - incTaxRate)) + n) / (1 - (fp1 + uip2)), 2)) * 12 / nper,
      2
    )
  }

  const annualRevenue = Number(annualRevenueStr)

  // Compute tax-free amount
  let taxFreeStr: string

  if (annualRevenue > SLIDING_UPPER) {
    taxFreeStr = round(0, 2)
  } else if (annualRevenue * (1 - (fp1 + uip2)) < taxfreeMin) {
    if (inputMode === 'net') {
      taxFreeStr = round(sum * 12 / nper * i / 12, 2)
    } else {
      taxFreeStr = round(sum * (1 - (fp1 + uip2)) * 12 / nper * i / 12, 2)
    }
  } else if (annualRevenue < SLIDING_LOWER) {
    taxFreeStr = round(taxfreeMin * i / 12, 2)
  } else {
    taxFreeStr = round(
      Number(round(taxfreeMin - taxfreeMin * (annualRevenue - SLIDING_LOWER) / SLIDING_RANGE, 2)) * i / 12,
      2
    )
  }

  return {
    taxFreeAmount: taxFreeStr,
    annualRevenue: annualRevenueStr,
    outputPeriod,
    year,
    warnings,
  }
}
