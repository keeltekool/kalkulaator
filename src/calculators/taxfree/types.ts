export type TaxFreeInputMode = 'gross' | 'net'
export type TaxFreeInputPeriod = 'hourly' | 'monthly' | 'annual'
export type TaxFreeOutputPeriod = 'monthly' | 'annual'
export type TaxFreeYear = 2025 | 2026

export interface TaxFreeInput {
  year: TaxFreeYear
  inputMode: TaxFreeInputMode
  amount: number
  inputPeriod: TaxFreeInputPeriod
  workHoursPerMonth: number
  includeEmployeeUnemployment: boolean
  includeFundedPension: boolean
  fundedPensionRate: 0.02 | 0.04 | 0.06
  outputPeriod: TaxFreeOutputPeriod
  retired: boolean
}

export interface TaxFreeResult {
  taxFreeAmount: string
  annualRevenue: string
  outputPeriod: TaxFreeOutputPeriod
  year: TaxFreeYear
  warnings: string[]
}
