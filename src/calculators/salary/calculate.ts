import type { SalaryInput, SalaryResult, SalaryYear } from './types'
import {
  INCOME_TAX_RATE, SOCIAL_TAX_RATE, MINIMUM_SOCIAL_TAX,
  EMPLOYER_UNEMPLOYMENT_RATE, EMPLOYEE_UNEMPLOYMENT_RATE,
  LOCAL_GOVERNMENT_TAX_SHARE, SOCIAL_TAX_PENSION_SHARE,
  TAX_FREE_ANNUAL, TAX_FREE_MONTHLY,
  RETIRED_TAX_FREE_ANNUAL, RETIRED_TAX_FREE_MONTHLY,
  SLIDING_LOWER, SLIDING_UPPER, SLIDING_RANGE,
} from './constants'

export function round2(n: number): number {
  const x = Math.round(n * 100) / 100
  return Number(x.toFixed(2))
}

function getTaxFreeMonthly(year: SalaryYear, retired: boolean): number {
  if (retired && (year === 2025 || year === 2026)) return RETIRED_TAX_FREE_MONTHLY
  return TAX_FREE_MONTHLY[year]
}

function getTaxFreeAnnual(year: SalaryYear, retired: boolean): number {
  if (retired && (year === 2025 || year === 2026)) return RETIRED_TAX_FREE_ANNUAL
  return TAX_FREE_ANNUAL[year]
}

function isFlatTaxFree(year: SalaryYear, retired: boolean): boolean {
  return year === 2026 || (retired && year === 2025)
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const {
    year, inputMode, amount, period, workHoursPerMonth,
    taxFreeEnabled, taxFreeMode, annualRevenue: annualRevenueOverride,
    retired,
    applyMinimumSocialTax,
    includeEmployerUnemployment, includeEmployeeUnemployment,
    includeFundedPension, fundedPensionRate,
    percentBase,
  } = input

  const itr = INCOME_TAX_RATE[year]
  const socialTaxMin = MINIMUM_SOCIAL_TAX[year]
  const uip1 = includeEmployerUnemployment ? EMPLOYER_UNEMPLOYMENT_RATE : 0
  const uip2 = includeEmployeeUnemployment ? EMPLOYEE_UNEMPLOYMENT_RATE : 0
  const fp1 = includeFundedPension ? (year >= 2025 ? fundedPensionRate : 0.02) : 0
  const fp2 = includeFundedPension ? SOCIAL_TAX_PENSION_SHARE : 0

  const tfm = getTaxFreeMonthly(year, retired)
  const taxfreeMin = getTaxFreeAnnual(year, retired)

  const workhours = period === 'hourly' ? workHoursPerMonth : 1
  const nper: 1 | 12 = period === 'annual' ? 12 : 1
  const sum = amount * workhours

  const warnings: string[] = []

  // taxfree_period i: for simplicity, always use monthly (i=1) as the source default
  const i = 1

  // ══════════════════════════════════════════════
  // STEP 1: revenueCalc — compute annual revenue and tax-free amount
  // ══════════════════════════════════════════════
  let annualRevenueUsed: number | null = null
  let computedAnnualRevenue = 0
  let taxFreeApplied = 0

  if (taxFreeEnabled) {
    // Use annual revenue override if mode is annualRevenue
    if (taxFreeMode === 'annualRevenue' && annualRevenueOverride != null) {
      computedAnnualRevenue = annualRevenueOverride
      annualRevenueUsed = annualRevenueOverride
    } else {
      // Compute annual revenue from input
      if (inputMode === 'employerCost') {
        if (applyMinimumSocialTax && sum < socialTaxMin) {
          computedAnnualRevenue = NaN
        } else if (applyMinimumSocialTax && sum < (socialTaxMin / SOCIAL_TAX_RATE) * (1 + SOCIAL_TAX_RATE + uip1)) {
          computedAnnualRevenue = round2(((sum - socialTaxMin) / (1 + uip1)) * 12 / nper)
        } else {
          computedAnnualRevenue = round2((sum / (1 + SOCIAL_TAX_RATE + uip1)) * 12 / nper)
        }
      } else if (inputMode === 'gross') {
        computedAnnualRevenue = round2(sum * 12 / nper)
      } else if (inputMode === 'net') {
        // Solve intermediate X for sliding tax-free
        const X = round2(
          ((sum * 12 / nper) / (1 - itr) - SLIDING_UPPER * (1 - (fp1 + uip2)))
          /
          (-((SLIDING_UPPER - SLIDING_LOWER) / taxfreeMin) * (1 - (fp1 + uip2)) - 1 + 1 / (1 - itr))
        )

        let n: number
        if (X < 0) {
          n = 0
        } else if ((sum * (1 - (fp1 + uip2)) * 12 / nper) < taxfreeMin && X > taxfreeMin) {
          n = sum
        } else if (X > taxfreeMin) {
          n = taxfreeMin * nper / 12
        } else {
          n = round2(X * nper / 12)
        }

        const incTaxRate = ((sum * (1 - (fp1 + uip2)) * 12 / nper) - n) <= 0 ? 0 : itr

        computedAnnualRevenue = round2(
          round2((((sum - n) / (1 - incTaxRate)) + n) / (1 - (fp1 + uip2))) * 12 / nper
        )
      }
    }

    // Compute tax-free amount
    if (isFlatTaxFree(year, retired)) {
      taxFreeApplied = round2(taxfreeMin * i / 12)
    } else if (computedAnnualRevenue > SLIDING_UPPER) {
      taxFreeApplied = 0
    } else if (computedAnnualRevenue * (1 - (fp1 + uip2)) < taxfreeMin) {
      // Low income: tax-free equals income
      if (inputMode === 'net') {
        taxFreeApplied = round2(sum * 12 / nper * i / 12)
      } else if (inputMode === 'gross') {
        taxFreeApplied = round2(sum * (1 - (fp1 + uip2)) * 12 / nper * i / 12)
      } else if (inputMode === 'employerCost') {
        if (applyMinimumSocialTax && sum < (socialTaxMin / SOCIAL_TAX_RATE) * (1 + SOCIAL_TAX_RATE + uip1)) {
          taxFreeApplied = round2(
            ((sum - socialTaxMin) / (1 + uip1)) * (1 - (fp1 + uip2)) * 12 / nper * i / 12
          )
        } else {
          taxFreeApplied = round2(
            (sum / (1 + SOCIAL_TAX_RATE + uip1)) * (1 - (fp1 + uip2)) * 12 / nper * i / 12
          )
        }
      }
    } else if (computedAnnualRevenue < SLIDING_LOWER) {
      taxFreeApplied = round2(taxfreeMin * i / 12)
    } else {
      // Sliding reduction
      taxFreeApplied = round2(
        round2(taxfreeMin - taxfreeMin * (computedAnnualRevenue - SLIDING_LOWER) / SLIDING_RANGE) * i / 12
      )
    }
  }

  // ══════════════════════════════════════════════
  // STEP 2: wageCalc — compute gross, taxes, net
  // ══════════════════════════════════════════════

  // Resolve final tax-free amount used by wageCalc
  let taxfree: number
  if (!taxFreeEnabled) {
    taxfree = 0
  } else if (isFlatTaxFree(year, retired)) {
    taxfree = round2(taxFreeApplied * nper)
  } else if (taxFreeMode === 'annualRevenue' && annualRevenueOverride != null) {
    // F2 mode: compute from annual revenue
    if (annualRevenueOverride > SLIDING_UPPER) {
      taxfree = 0
    } else if (annualRevenueOverride < SLIDING_LOWER) {
      taxfree = taxfreeMin * nper / 12
    } else {
      taxfree = round2(
        round2(taxfreeMin - taxfreeMin * (annualRevenueOverride - SLIDING_LOWER) / SLIDING_RANGE) * nper / 12
      )
    }
  } else {
    // F1 mode: use computed tax-free, clamped
    const tfs = taxFreeApplied
    if (tfs > tfm) {
      taxfree = tfm * nper
    } else if (tfs < 0) {
      taxfree = 0
    } else {
      taxfree = round2(tfs * nper)
    }
  }

  // income_tax_rate for net reverse
  const incTaxRateForCalc = ((sum - taxfree) <= 0) ? 0 : itr
  const minThreshold = (socialTaxMin / SOCIAL_TAX_RATE) * (1 + SOCIAL_TAX_RATE + uip1)

  // ── Gross calculation ──
  let gross: number
  if (inputMode === 'employerCost') {
    if (applyMinimumSocialTax && sum < socialTaxMin) {
      gross = NaN
      warnings.push('Tööandja kulu on väiksem kui sotsiaalmaksu miinimum')
    } else if (applyMinimumSocialTax && sum < minThreshold) {
      gross = round2((sum - socialTaxMin) / (1 + uip1))
    } else {
      gross = round2(sum / (1 + SOCIAL_TAX_RATE + uip1))
    }
  } else if (inputMode === 'gross') {
    gross = round2(sum)
  } else {
    // net → gross
    gross = round2(
      (((sum - taxfree) / (1 - incTaxRateForCalc)) + taxfree) / (1 - (fp1 + uip2))
    )
  }

  // ── Social tax ──
  let socialTax: number
  if (inputMode === 'employerCost' && applyMinimumSocialTax && sum < socialTaxMin) {
    socialTax = NaN
  } else if (inputMode === 'employerCost' && applyMinimumSocialTax && sum < minThreshold) {
    socialTax = socialTaxMin
  } else if (applyMinimumSocialTax && gross * SOCIAL_TAX_RATE < socialTaxMin) {
    socialTax = socialTaxMin
  } else {
    socialTax = round2(gross * SOCIAL_TAX_RATE)
  }

  // ── Other deductions ──
  const employerUnemployment = round2(gross * uip1)
  const employeeUnemployment = round2(gross * uip2)
  const fundedPensionEmployee = round2(gross * fp1)

  // ── Income tax ──
  let incomeTax: number
  if (gross < (taxfree + gross * (uip2 + fp1))) {
    incomeTax = 0
  } else {
    incomeTax = round2((gross - employeeUnemployment - fundedPensionEmployee - taxfree) * itr)
  }

  // ── Net and employer cost ──
  const net = round2(gross - employeeUnemployment - fundedPensionEmployee - incomeTax)
  const employerCost = round2(gross + employerUnemployment + socialTax)

  // ── Chart values ──
  const localGovernmentTaxes = round2(gross * LOCAL_GOVERNMENT_TAX_SHARE)
  const pensionFund = round2(gross * (fp1 + fp2))
  const stateTaxes = round2(
    employerUnemployment + employeeUnemployment + socialTax + incomeTax - gross * fp2 - localGovernmentTaxes
  )

  // ── Percentages ──
  const pctBase = percentBase === 'employerCost' ? employerCost
    : percentBase === 'gross' ? gross
    : net
  const pct = (v: number) => pctBase > 0 ? round2(v / pctBase * 100) : 0

  return {
    employerCost,
    socialTax,
    employerUnemployment,
    gross,
    fundedPensionEmployee,
    employeeUnemployment,
    incomeTax,
    net,
    taxFreeApplied: round2(taxfree),
    annualRevenueUsed,
    chart: {
      stateTaxes,
      localGovernmentTaxes,
      netWage: net,
      pensionFund,
    },
    percentages: {
      employerCost: pct(employerCost),
      socialTax: pct(socialTax),
      employerUnemployment: pct(employerUnemployment),
      gross: pct(gross),
      fundedPensionEmployee: pct(fundedPensionEmployee),
      employeeUnemployment: pct(employeeUnemployment),
      incomeTax: pct(incomeTax),
      net: pct(net),
    },
    derived: {
      calculationBaseAmount: sum,
      periodMultiplier: nper,
      taxFreeAnnualLimit: taxfreeMin,
      incomeTaxRate: itr,
      employeePensionRate: fp1,
      socialTaxFundedPensionRate: fp2,
      employerUnemploymentRate: uip1,
      employeeUnemploymentRate: uip2,
      minimumSocialTaxAmount: socialTaxMin,
    },
    warnings,
  }
}
