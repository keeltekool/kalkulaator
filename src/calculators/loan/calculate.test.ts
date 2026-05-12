import { describe, it, expect } from 'vitest'
import { calculateLoan, sourceRound } from './calculate'
import type { LoanInput } from './types'

const defaults: LoanInput = {
  solveMode: 'monthlyPayment',
  periodUnit: 'years',
  principal: 10000,
  monthlyPayment: 0,
  annualInterestPercent: 5,
  period: 5,
}

function calc(overrides: Partial<LoanInput>) {
  return calculateLoan({ ...defaults, ...overrides })
}

describe('sourceRound', () => {
  it('rounds to 2 decimals', () => expect(sourceRound(188.705, 2)).toBe('188.71'))
  it('pads trailing zeros', () => expect(sourceRound(12000, 2)).toBe('12000.00'))
  it('rounds to 3 decimals', () => expect(sourceRound(5.0001, 3)).toBe('5.000'))
})

// ══════════════════════════════════════════════
// GOLDEN FIXTURES A-M
// ══════════════════════════════════════════════

describe('Fixture A: F2, Years, Find PMT', () => {
  const r = calc({ solveMode: 'monthlyPayment', principal: 10000, annualInterestPercent: 5, period: 5 })
  it('PMT = 188.71', () => expect(r.monthlyPayment).toBe('188.71'))
  it('totalInterest = 1322.60', () => expect(r.totalInterest).toBe('1322.60'))
  it('totalRepayment = 11322.60', () => expect(r.totalRepayment).toBe('11322.60'))
})

describe('Fixture B: F1, Years, Find PV', () => {
  const r = calc({ solveMode: 'loanAmount', monthlyPayment: 200, annualInterestPercent: 5, period: 5 })
  it('PV = 10598.14', () => expect(r.principal).toBe('10598.14'))
  it('totalInterest = 1401.86', () => expect(r.totalInterest).toBe('1401.86'))
  it('totalRepayment = 12000.00', () => expect(r.totalRepayment).toBe('12000.00'))
})

describe('Fixture C: F3, Years, Find Interest', () => {
  const r = calc({ solveMode: 'annualInterest', principal: 10000, monthlyPayment: 188.71, period: 5 })
  it('interest = 4.999 %', () => expect(r.annualInterestPercent).toBe('4.999 %'))
  it('totalInterest = 1322.60', () => expect(r.totalInterest).toBe('1322.60'))
  it('totalRepayment = 11322.60', () => expect(r.totalRepayment).toBe('11322.60'))
})

describe('Fixture D: F4, Years, Find Period', () => {
  const r = calc({ solveMode: 'period', principal: 10000, monthlyPayment: 188.71, annualInterestPercent: 5 })
  it('period = 5.000', () => expect(r.period).toBe('5.000'))
  it('totalInterest = 1322.60', () => expect(r.totalInterest).toBe('1322.60'))
  it('totalRepayment = 11322.60', () => expect(r.totalRepayment).toBe('11322.60'))
})

describe('Fixture E: F2, Months, Same as A', () => {
  const r = calc({ solveMode: 'monthlyPayment', periodUnit: 'months', principal: 10000, annualInterestPercent: 5, period: 60 })
  it('PMT = 188.71', () => expect(r.monthlyPayment).toBe('188.71'))
  it('totalInterest = 1322.60', () => expect(r.totalInterest).toBe('1322.60'))
  it('totalRepayment = 11322.60', () => expect(r.totalRepayment).toBe('11322.60'))
})

describe('Fixture F: F1, Months', () => {
  const r = calc({ solveMode: 'loanAmount', periodUnit: 'months', monthlyPayment: 200, annualInterestPercent: 5, period: 60 })
  it('PV = 10598.14', () => expect(r.principal).toBe('10598.14'))
  it('totalInterest = 1401.86', () => expect(r.totalInterest).toBe('1401.86'))
  it('totalRepayment = 12000.00', () => expect(r.totalRepayment).toBe('12000.00'))
})

describe('Fixture G: F3, High Interest N/A', () => {
  const r = calc({ solveMode: 'annualInterest', periodUnit: 'months', principal: 1000, monthlyPayment: 500, period: 3 })
  it('interest = N/A', () => expect(r.annualInterestPercent).toBe('N/A'))
  it('totalInterest = 500.00', () => expect(r.totalInterest).toBe('500.00'))
  it('totalRepayment = 1500.00', () => expect(r.totalRepayment).toBe('1500.00'))
})

describe('Fixture H: Comma Interest 5.5%, F2', () => {
  const r = calc({ solveMode: 'monthlyPayment', principal: 10000, annualInterestPercent: 5.5, period: 5 })
  it('PMT = 191.01', () => expect(r.monthlyPayment).toBe('191.01'))
  it('totalInterest = 1460.60', () => expect(r.totalInterest).toBe('1460.60'))
  it('totalRepayment = 11460.60', () => expect(r.totalRepayment).toBe('11460.60'))
})

describe('Fixture I: Long Mortgage 150k/4.2%/30yr', () => {
  const r = calc({ solveMode: 'monthlyPayment', principal: 150000, annualInterestPercent: 4.2, period: 30 })
  it('PMT = 733.53', () => expect(r.monthlyPayment).toBe('733.53'))
  it('totalInterest = 114070.80', () => expect(r.totalInterest).toBe('114070.80'))
  it('totalRepayment = 264070.80', () => expect(r.totalRepayment).toBe('264070.80'))
})

describe('Fixture J: F3, Short Consumer Loan', () => {
  const r = calc({ solveMode: 'annualInterest', periodUnit: 'months', principal: 500, monthlyPayment: 100, period: 6 })
  it('interest = 65.662 %', () => expect(r.annualInterestPercent).toBe('65.662 %'))
  it('totalInterest = 100.00', () => expect(r.totalInterest).toBe('100.00'))
  it('totalRepayment = 600.00', () => expect(r.totalRepayment).toBe('600.00'))
})

describe('Fixture K: F4, Months, Find Period', () => {
  const r = calc({ solveMode: 'period', periodUnit: 'months', principal: 1000, monthlyPayment: 100, annualInterestPercent: 12 })
  it('period = 10.589', () => expect(r.period).toBe('10.589'))
  it('totalInterest = 58.90', () => expect(r.totalInterest).toBe('58.90'))
  it('totalRepayment = 1058.90', () => expect(r.totalRepayment).toBe('1058.90'))
})

describe('Fixture L: F4, Payment Too Small = NaN', () => {
  const r = calc({ solveMode: 'period', principal: 10000, monthlyPayment: 10, annualInterestPercent: 5 })
  it('period = NaN', () => expect(r.period).toBe('NaN'))
  it('totalRepayment = NaN', () => expect(r.totalRepayment).toBe('NaN'))
})

describe('Fixture M: F2, Zero Interest = NaN', () => {
  const r = calc({ solveMode: 'monthlyPayment', principal: 10000, annualInterestPercent: 0, period: 5 })
  it('PMT = NaN', () => expect(r.monthlyPayment).toBe('NaN'))
  it('totalRepayment = NaN', () => expect(r.totalRepayment).toBe('NaN'))
})
