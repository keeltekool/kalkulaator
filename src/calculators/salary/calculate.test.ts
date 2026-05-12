import { describe, it, expect } from 'vitest'
import { calculateSalary } from './calculate'
import type { SalaryInput } from './types'
import { DEFAULT_SALARY_INPUT } from './types'

function calc(overrides: Partial<SalaryInput>) {
  return calculateSalary({ ...DEFAULT_SALARY_INPUT, ...overrides })
}

// ══════════════════════════════════════════════
// GOLDEN FIXTURES A-L from live kalkulaator.ee
// ══════════════════════════════════════════════

describe('Fixture A: 2026 Gross 2000 Default', () => {
  const r = calc({ year: 2026, inputMode: 'gross', amount: 2000 })
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('socialTax = 660.00', () => expect(r.socialTax).toBe(660.00))
  it('employerUnemployment = 16.00', () => expect(r.employerUnemployment).toBe(16.00))
  it('gross = 2000.00', () => expect(r.gross).toBe(2000.00))
  it('fundedPension = 40.00', () => expect(r.fundedPensionEmployee).toBe(40.00))
  it('employeeUnemployment = 32.00', () => expect(r.employeeUnemployment).toBe(32.00))
  it('incomeTax = 270.16', () => expect(r.incomeTax).toBe(270.16))
  it('net = 1657.84', () => expect(r.net).toBe(1657.84))
  it('taxFreeApplied = 700.00', () => expect(r.taxFreeApplied).toBe(700.00))
  it('chart.stateTaxes = 672.36', () => expect(r.chart.stateTaxes).toBe(672.36))
  it('chart.localGov = 225.80', () => expect(r.chart.localGovernmentTaxes).toBe(225.80))
  it('chart.net = 1657.84', () => expect(r.chart.netWage).toBe(1657.84))
  it('chart.pension = 120.00', () => expect(r.chart.pensionFund).toBe(120.00))
})

describe('Fixture B: 2026 Net 1657.84 Reverse to Gross', () => {
  const r = calc({ year: 2026, inputMode: 'net', amount: 1657.84 })
  it('gross = 2000.00', () => expect(r.gross).toBe(2000.00))
  it('net = 1657.84', () => expect(r.net).toBe(1657.84))
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('incomeTax = 270.16', () => expect(r.incomeTax).toBe(270.16))
  it('taxFreeApplied = 700.00', () => expect(r.taxFreeApplied).toBe(700.00))
})

describe('Fixture C: 2026 Employer Cost 2676 Reverse', () => {
  const r = calc({ year: 2026, inputMode: 'employerCost', amount: 2676.00 })
  it('gross = 2000.00', () => expect(r.gross).toBe(2000.00))
  it('net = 1657.84', () => expect(r.net).toBe(1657.84))
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('incomeTax = 270.16', () => expect(r.incomeTax).toBe(270.16))
  it('taxFreeApplied = 700.00', () => expect(r.taxFreeApplied).toBe(700.00))
})

describe('Fixture D: 2025 Gross 2000 Sliding Tax-Free', () => {
  const r = calc({ year: 2025, inputMode: 'gross', amount: 2000 })
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('gross = 2000.00', () => expect(r.gross).toBe(2000.00))
  it('incomeTax = 408.17', () => expect(r.incomeTax).toBe(408.17))
  it('net = 1519.83', () => expect(r.net).toBe(1519.83))
  it('taxFreeApplied = 72.67', () => expect(r.taxFreeApplied).toBe(72.67))
  it('chart.stateTaxes = 810.37', () => expect(r.chart.stateTaxes).toBe(810.37))
  it('chart.localGov = 225.80', () => expect(r.chart.localGovernmentTaxes).toBe(225.80))
  it('chart.pension = 120.00', () => expect(r.chart.pensionFund).toBe(120.00))
})

describe('Fixture E: 2026 Gross 500 Min Social Tax', () => {
  const r = calc({ year: 2026, inputMode: 'gross', amount: 500, applyMinimumSocialTax: true })
  it('employerCost = 796.38', () => expect(r.employerCost).toBe(796.38))
  it('socialTax = 292.38', () => expect(r.socialTax).toBe(292.38))
  it('employerUnemployment = 4.00', () => expect(r.employerUnemployment).toBe(4.00))
  it('gross = 500.00', () => expect(r.gross).toBe(500.00))
  it('fundedPension = 10.00', () => expect(r.fundedPensionEmployee).toBe(10.00))
  it('employeeUnemployment = 8.00', () => expect(r.employeeUnemployment).toBe(8.00))
  it('incomeTax = 0.00', () => expect(r.incomeTax).toBe(0.00))
  it('net = 482.00', () => expect(r.net).toBe(482.00))
  it('taxFreeApplied = 700.00', () => expect(r.taxFreeApplied).toBe(700.00))
  it('chart.stateTaxes = 227.93', () => expect(r.chart.stateTaxes).toBe(227.93))
  it('chart.localGov = 56.45', () => expect(r.chart.localGovernmentTaxes).toBe(56.45))
  it('chart.pension = 30.00', () => expect(r.chart.pensionFund).toBe(30.00))
})

describe('Fixture F: 2026 Gross 2000 6% Pension', () => {
  const r = calc({ year: 2026, inputMode: 'gross', amount: 2000, fundedPensionRate: 0.06 })
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('fundedPension = 120.00', () => expect(r.fundedPensionEmployee).toBe(120.00))
  it('incomeTax = 252.56', () => expect(r.incomeTax).toBe(252.56))
  it('net = 1595.44', () => expect(r.net).toBe(1595.44))
  it('taxFreeApplied = 700.00', () => expect(r.taxFreeApplied).toBe(700.00))
  it('chart.stateTaxes = 654.76', () => expect(r.chart.stateTaxes).toBe(654.76))
  it('chart.pension = 200.00', () => expect(r.chart.pensionFund).toBe(200.00))
})

describe('Fixture G: 2026 Gross 2000 Retired', () => {
  const r = calc({ year: 2026, inputMode: 'gross', amount: 2000, retired: true })
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('incomeTax = 253.44', () => expect(r.incomeTax).toBe(253.44))
  it('net = 1674.56', () => expect(r.net).toBe(1674.56))
  it('taxFreeApplied = 776.00', () => expect(r.taxFreeApplied).toBe(776.00))
  it('chart.stateTaxes = 655.64', () => expect(r.chart.stateTaxes).toBe(655.64))
  it('chart.localGov = 225.80', () => expect(r.chart.localGovernmentTaxes).toBe(225.80))
  it('chart.pension = 120.00', () => expect(r.chart.pensionFund).toBe(120.00))
})

describe('Fixture H: 2026 Gross 2000 Tax-Free Disabled', () => {
  const r = calc({ year: 2026, inputMode: 'gross', amount: 2000, taxFreeEnabled: false })
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('incomeTax = 424.16', () => expect(r.incomeTax).toBe(424.16))
  it('net = 1503.84', () => expect(r.net).toBe(1503.84))
  it('taxFreeApplied = 0.00', () => expect(r.taxFreeApplied).toBe(0.00))
  it('chart.stateTaxes = 826.36', () => expect(r.chart.stateTaxes).toBe(826.36))
})

describe('Fixture I: 2025 Gross 2000 Annual Revenue Override 30000', () => {
  const r = calc({
    year: 2025, inputMode: 'gross', amount: 2000,
    taxFreeMode: 'annualRevenue', annualRevenue: 30000,
  })
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('incomeTax = 424.16', () => expect(r.incomeTax).toBe(424.16))
  it('net = 1503.84', () => expect(r.net).toBe(1503.84))
  it('taxFreeApplied = 0.00', () => expect(r.taxFreeApplied).toBe(0.00))
  it('annualRevenueUsed = 30000', () => expect(r.annualRevenueUsed).toBe(30000))
})

describe('Fixture J: 2026 Hourly 10 x 160 Hours', () => {
  const r = calc({
    year: 2026, inputMode: 'gross', amount: 10,
    period: 'hourly', workHoursPerMonth: 160,
  })
  it('employerCost = 2140.80', () => expect(r.employerCost).toBe(2140.80))
  it('socialTax = 528.00', () => expect(r.socialTax).toBe(528.00))
  it('employerUnemployment = 12.80', () => expect(r.employerUnemployment).toBe(12.80))
  it('gross = 1600.00', () => expect(r.gross).toBe(1600.00))
  it('fundedPension = 32.00', () => expect(r.fundedPensionEmployee).toBe(32.00))
  it('employeeUnemployment = 25.60', () => expect(r.employeeUnemployment).toBe(25.60))
  it('incomeTax = 185.33', () => expect(r.incomeTax).toBe(185.33))
  it('net = 1357.07', () => expect(r.net).toBe(1357.07))
  it('taxFreeApplied = 700.00', () => expect(r.taxFreeApplied).toBe(700.00))
})

describe('Fixture K: 2026 Annual 24000', () => {
  const r = calc({
    year: 2026, inputMode: 'gross', amount: 24000, period: 'annual',
  })
  it('employerCost = 32112.00', () => expect(r.employerCost).toBe(32112.00))
  it('socialTax = 7920.00', () => expect(r.socialTax).toBe(7920.00))
  it('employerUnemployment = 192.00', () => expect(r.employerUnemployment).toBe(192.00))
  it('gross = 24000.00', () => expect(r.gross).toBe(24000.00))
  it('fundedPension = 480.00', () => expect(r.fundedPensionEmployee).toBe(480.00))
  it('employeeUnemployment = 384.00', () => expect(r.employeeUnemployment).toBe(384.00))
  it('incomeTax = 3241.92', () => expect(r.incomeTax).toBe(3241.92))
  it('net = 19894.08', () => expect(r.net).toBe(19894.08))
  it('taxFreeApplied = 8400.00', () => expect(r.taxFreeApplied).toBe(8400.00))
  it('chart.stateTaxes ≈ 8068', () => expect(r.chart.stateTaxes).toBeCloseTo(8068, 0))
  it('chart.localGov = 2709.60', () => expect(r.chart.localGovernmentTaxes).toBe(2709.60))
  it('chart.pension = 1440.00', () => expect(r.chart.pensionFund).toBe(1440.00))
})

describe('Fixture L: 2022 Gross 2000 Old Tax Rate', () => {
  const r = calc({ year: 2022, inputMode: 'gross', amount: 2000 })
  it('employerCost = 2676.00', () => expect(r.employerCost).toBe(2676.00))
  it('gross = 2000.00', () => expect(r.gross).toBe(2000.00))
  it('incomeTax = 374.49', () => expect(r.incomeTax).toBe(374.49))
  it('net = 1553.51', () => expect(r.net).toBe(1553.51))
  it('taxFreeApplied = 55.56', () => expect(r.taxFreeApplied).toBe(55.56))
})

// ══════════════════════════════════════════════
// UNIT TESTS
// ══════════════════════════════════════════════

describe('Constants by year', () => {
  it('2025 uses 22% income tax', () => {
    const r = calc({ year: 2025, inputMode: 'gross', amount: 1000, taxFreeEnabled: false })
    expect(r.derived.incomeTaxRate).toBe(0.22)
  })
  it('2024 uses 20% income tax', () => {
    const r = calc({ year: 2024, inputMode: 'gross', amount: 1000, taxFreeEnabled: false })
    expect(r.derived.incomeTaxRate).toBe(0.20)
  })
})

describe('Tax-free amounts', () => {
  it('2026 flat 700/month', () => {
    const r = calc({ year: 2026, inputMode: 'gross', amount: 5000 })
    expect(r.taxFreeApplied).toBe(700.00)
  })
  it('2026 retired 776/month', () => {
    const r = calc({ year: 2026, inputMode: 'gross', amount: 5000, retired: true })
    expect(r.taxFreeApplied).toBe(776.00)
  })
})

describe('Pension disabled', () => {
  it('no pension deduction when disabled', () => {
    const r = calc({ year: 2026, inputMode: 'gross', amount: 2000, includeFundedPension: false })
    expect(r.fundedPensionEmployee).toBe(0)
    expect(r.chart.pensionFund).toBe(0)
  })
})

describe('Unemployment disabled', () => {
  it('no employer UI when disabled', () => {
    const r = calc({ year: 2026, inputMode: 'gross', amount: 2000, includeEmployerUnemployment: false })
    expect(r.employerUnemployment).toBe(0)
  })
  it('no employee UI when disabled', () => {
    const r = calc({ year: 2026, inputMode: 'gross', amount: 2000, includeEmployeeUnemployment: false })
    expect(r.employeeUnemployment).toBe(0)
  })
})
