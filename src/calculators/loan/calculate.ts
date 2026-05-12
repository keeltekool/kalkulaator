import type { LoanInput, LoanResult } from './types'

export function sourceRound(n: number, dec: number): string {
  const x = Math.round(n * Math.pow(10, dec))
  return (x / Math.pow(10, dec)).toFixed(dec)
}

export function RATE(
  nper: number, pmt: number, pv: number,
  fv: number, type: number, guess: number
): number {
  const FINANCIAL_ACCURACY = 1.0e-9
  const FINANCIAL_MAX_ITERATIONS = 100
  let rate = guess
  let i = 0
  let x0 = 0
  let x1 = rate
  let y: number, y0: number, y1: number, f: number

  if (Math.abs(rate) < FINANCIAL_ACCURACY) {
    y = pv * (1 + nper * rate) + pmt * (1 + rate * type) * nper + fv
  } else {
    f = Math.exp(nper * Math.log(1 + rate))
    y = pv * f + pmt * (1 / rate + type) * (f - 1) + fv
  }

  y0 = pv + pmt * nper + fv
  f = Math.exp(nper * Math.log(1 + rate))
  y1 = pv * f + pmt * (1 / rate + type) * (f - 1) + fv

  while (Math.abs(y0 - y1) > FINANCIAL_ACCURACY && i < FINANCIAL_MAX_ITERATIONS) {
    rate = (y1 * x0 - y0 * x1) / (y1 - y0)
    x0 = x1
    x1 = rate

    if (Math.abs(rate) < FINANCIAL_ACCURACY) {
      y = pv * (1 + nper * rate) + pmt * (1 + rate * type) * nper + fv
    } else {
      f = Math.exp(nper * Math.log(1 + rate))
      y = pv * f + pmt * (1 / rate + type) * (f - 1) + fv
    }

    y0 = y1
    y1 = y
    i++
  }
  return rate
}

export function calculateLoan(input: LoanInput): LoanResult {
  const { solveMode, periodUnit, principal, monthlyPayment, annualInterestPercent, period } = input

  const n = periodUnit === 'years' ? 12 : 1
  const r = annualInterestPercent / 100
  const t = period * n
  const z = 1 / (1 + r / 12)

  const result: LoanResult = {
    principal: sourceRound(principal, 2),
    monthlyPayment: sourceRound(monthlyPayment, 2),
    annualInterestPercent: sourceRound(annualInterestPercent, 3),
    period: sourceRound(period, 3),
    totalInterest: '0.00',
    totalRepayment: '0.00',
    solveMode,
    periodUnit,
  }

  if (solveMode === 'loanAmount') {
    const div = 1 - Math.pow(z, t)
    const pv = sourceRound((monthlyPayment * z * div) / (1 - z), 2)
    const totalSum = sourceRound(monthlyPayment * t, 2)
    const totalInterest = sourceRound(Number(totalSum) - Number(pv), 2)

    result.principal = pv
    result.totalRepayment = totalSum
    result.totalInterest = totalInterest
  } else if (solveMode === 'monthlyPayment') {
    const div = 1 - Math.pow(z, t)
    const pmt = sourceRound((principal * (1 - z)) / (z * div), 2)
    const totalSum = sourceRound(Number(pmt) * t, 2)
    const totalInterest = sourceRound(Number(totalSum) - principal, 2)

    result.monthlyPayment = pmt
    result.totalRepayment = totalSum
    result.totalInterest = totalInterest
  } else if (solveMode === 'annualInterest') {
    const monthlyRate = RATE(t, monthlyPayment, -principal, 0, 0, 0.01)
    const annualPct = sourceRound(monthlyRate * 100 * 12, 3)

    if (Number(annualPct) > 250) {
      result.annualInterestPercent = 'N/A'
    } else {
      result.annualInterestPercent = annualPct + ' %'
    }

    const totalSum = sourceRound(monthlyPayment * t, 2)
    const totalInterest = sourceRound(Number(totalSum) - principal, 2)
    result.totalRepayment = totalSum
    result.totalInterest = totalInterest
  } else if (solveMode === 'period') {
    const periodVal = sourceRound(
      Math.log(1 - (((1 - z) * principal) / (z * monthlyPayment))) / (n * Math.log(z)),
      3
    )
    const totalSum = sourceRound(monthlyPayment * Number(periodVal) * n, 2)
    const totalInterest = sourceRound(Number(totalSum) - principal, 2)

    result.period = periodVal
    result.totalRepayment = totalSum
    result.totalInterest = totalInterest
  }

  return result
}
