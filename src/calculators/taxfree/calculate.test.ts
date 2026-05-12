import { describe, it, expect } from 'vitest'
import { calculateTaxFree } from './calculate'
import type { TaxFreeInput } from './types'

const defaults: TaxFreeInput = {
  year: 2025,
  inputMode: 'gross',
  amount: 0,
  inputPeriod: 'monthly',
  workHoursPerMonth: 160,
  includeEmployeeUnemployment: true,
  includeFundedPension: true,
  fundedPensionRate: 0.02,
  outputPeriod: 'monthly',
  retired: false,
}

function calc(overrides: Partial<TaxFreeInput>) {
  return calculateTaxFree({ ...defaults, ...overrides })
}

describe('Fixture A: Gross 1000, full allowance', () => {
  const r = calc({ amount: 1000 })
  it('annual_revenue = 12000.00', () => expect(r.annualRevenue).toBe('12000.00'))
  it('taxfree = 654.00', () => expect(r.taxFreeAmount).toBe('654.00'))
})

describe('Fixture B: Gross 500, low-income branch', () => {
  const r = calc({ amount: 500 })
  it('annual_revenue = 6000.00', () => expect(r.annualRevenue).toBe('6000.00'))
  it('taxfree = 482.00', () => expect(r.taxFreeAmount).toBe('482.00'))
})

describe('Fixture C: Gross 1200, lower boundary', () => {
  const r = calc({ amount: 1200 })
  it('annual_revenue = 14400.00', () => expect(r.annualRevenue).toBe('14400.00'))
  it('taxfree = 654.00', () => expect(r.taxFreeAmount).toBe('654.00'))
})

describe('Fixture D: Gross 1600, sliding', () => {
  const r = calc({ amount: 1600 })
  it('annual_revenue = 19200.00', () => expect(r.annualRevenue).toBe('19200.00'))
  it('taxfree = 363.33', () => expect(r.taxFreeAmount).toBe('363.33'))
})

describe('Fixture E: Gross 2100, upper boundary', () => {
  const r = calc({ amount: 2100 })
  it('annual_revenue = 25200.00', () => expect(r.annualRevenue).toBe('25200.00'))
  it('taxfree = 0.00', () => expect(r.taxFreeAmount).toBe('0.00'))
})

describe('Fixture F: Gross 2100.01, above upper', () => {
  const r = calc({ amount: 2100.01 })
  it('annual_revenue = 25200.12', () => expect(r.annualRevenue).toBe('25200.12'))
  it('taxfree = 0.00', () => expect(r.taxFreeAmount).toBe('0.00'))
})

describe('Fixture G: Gross 1600, annual output', () => {
  const r = calc({ amount: 1600, outputPeriod: 'annual' })
  it('annual_revenue = 19200.00', () => expect(r.annualRevenue).toBe('19200.00'))
  it('taxfree = 4360.00', () => expect(r.taxFreeAmount).toBe('4360.00'))
})

describe('Fixture H: Hourly 10, 160h', () => {
  const r = calc({ amount: 10, inputPeriod: 'hourly', workHoursPerMonth: 160 })
  it('annual_revenue = 19200.00', () => expect(r.annualRevenue).toBe('19200.00'))
  it('taxfree = 363.33', () => expect(r.taxFreeAmount).toBe('363.33'))
})

describe('Fixture I: Annual 24000', () => {
  const r = calc({ amount: 24000, inputPeriod: 'annual' })
  it('annual_revenue = 24000.00', () => expect(r.annualRevenue).toBe('24000.00'))
  it('taxfree = 72.67', () => expect(r.taxFreeAmount).toBe('72.67'))
})

describe('Fixture J: Net 1000', () => {
  const r = calc({ amount: 1000, inputMode: 'net' })
  it('annual_revenue = 13662.96', () => expect(r.annualRevenue).toBe('13662.96'))
  it('taxfree = 654.00', () => expect(r.taxFreeAmount).toBe('654.00'))
})

describe('Fixture K: Net 500, low-income net', () => {
  const r = calc({ amount: 500, inputMode: 'net' })
  it('annual_revenue = 6224.04', () => expect(r.annualRevenue).toBe('6224.04'))
  it('taxfree = 500.00', () => expect(r.taxFreeAmount).toBe('500.00'))
})

describe('Fixture L: Gross 500, no unemployment', () => {
  const r = calc({ amount: 500, includeEmployeeUnemployment: false })
  it('annual_revenue = 6000.00', () => expect(r.annualRevenue).toBe('6000.00'))
  it('taxfree = 490.00', () => expect(r.taxFreeAmount).toBe('490.00'))
})

describe('Fixture M: Gross 500, no pension', () => {
  const r = calc({ amount: 500, includeFundedPension: false })
  it('annual_revenue = 6000.00', () => expect(r.annualRevenue).toBe('6000.00'))
  it('taxfree = 492.00', () => expect(r.taxFreeAmount).toBe('492.00'))
})

describe('Fixture N: Gross 500, pension 4%', () => {
  const r = calc({ amount: 500, fundedPensionRate: 0.04 })
  it('annual_revenue = 6000.00', () => expect(r.annualRevenue).toBe('6000.00'))
  it('taxfree = 472.00', () => expect(r.taxFreeAmount).toBe('472.00'))
})

describe('Fixture O: Gross 500, pension 6%', () => {
  const r = calc({ amount: 500, fundedPensionRate: 0.06 })
  it('annual_revenue = 6000.00', () => expect(r.annualRevenue).toBe('6000.00'))
  it('taxfree = 462.00', () => expect(r.taxFreeAmount).toBe('462.00'))
})

describe('Fixture P: Net 1600, above upper after reverse', () => {
  const r = calc({ amount: 1600, inputMode: 'net' })
  it('annual_revenue = 25534.68', () => expect(r.annualRevenue).toBe('25534.68'))
  it('taxfree = 0.00', () => expect(r.taxFreeAmount).toBe('0.00'))
})

// Fixtures Q and R test source parsing quirks — skip in numeric-input product mode

describe('2026 extension: regular', () => {
  const r = calc({ year: 2026, amount: 5000 })
  it('monthly = 700.00', () => expect(r.taxFreeAmount).toBe('700.00'))
  const r2 = calc({ year: 2026, amount: 5000, outputPeriod: 'annual' })
  it('annual = 8400.00', () => expect(r2.taxFreeAmount).toBe('8400.00'))
})

describe('2026 extension: retired', () => {
  const r = calc({ year: 2026, amount: 5000, retired: true })
  it('monthly = 776.00', () => expect(r.taxFreeAmount).toBe('776.00'))
  const r2 = calc({ year: 2026, amount: 5000, outputPeriod: 'annual', retired: true })
  it('annual = 9312.00', () => expect(r2.taxFreeAmount).toBe('9312.00'))
})
