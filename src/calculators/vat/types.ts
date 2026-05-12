export type VatRate = 0.09 | 0.13 | 0.22 | 0.24

export type VatInputMode = 'net' | 'vat' | 'gross'

export interface VatInput {
  rate: VatRate
  mode: VatInputMode
  amount: number
}

export interface VatResult {
  netPrice: number
  vatAmount: number
  grossPrice: number
  coefficients: {
    vatFromGross: number
    vatFromNet: number
  }
  derived: {
    rate: number
    mode: VatInputMode
  }
  warnings: string[]
}
