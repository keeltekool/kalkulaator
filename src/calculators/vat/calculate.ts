import type { VatInput, VatResult } from './types'

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function roundCoefficient(n: number): number {
  return Math.round(n * 1000000) / 1000000
}

export function calculateVat(input: VatInput): VatResult {
  const { rate, mode, amount } = input

  let netPrice: number
  let vatAmount: number
  let grossPrice: number

  if (mode === 'net') {
    netPrice = roundMoney(amount)
    grossPrice = roundMoney(amount * (1 + rate))
    vatAmount = roundMoney(amount * rate)
  } else if (mode === 'vat') {
    vatAmount = roundMoney(amount)
    grossPrice = roundMoney(amount * (1 + rate) / rate)
    netPrice = roundMoney(amount / rate)
  } else {
    grossPrice = roundMoney(amount)
    netPrice = roundMoney(amount / (1 + rate))
    vatAmount = roundMoney(amount * rate / (1 + rate))
  }

  return {
    netPrice,
    vatAmount,
    grossPrice,
    coefficients: {
      vatFromGross: roundCoefficient(rate / (1 + rate)),
      vatFromNet: roundCoefficient(rate),
    },
    derived: { rate, mode },
    warnings: [],
  }
}
