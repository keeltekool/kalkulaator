export type SalaryYear = 2022 | 2023 | 2024 | 2025 | 2026

export type SalaryInputMode = 'employerCost' | 'gross' | 'net'

export type SalaryPeriod = 'hourly' | 'monthly' | 'annual'

export type TaxFreeMode = 'calculatedOrManual' | 'annualRevenue'

export interface SalaryInput {
  year: SalaryYear
  inputMode: SalaryInputMode
  amount: number
  period: SalaryPeriod
  workHoursPerMonth: number

  taxFreeEnabled: boolean
  taxFreeMode: TaxFreeMode
  taxFreeAmount?: number
  taxFreeAmountPeriod: 'monthly' | 'annual'
  annualRevenue?: number
  retired: boolean

  applyMinimumSocialTax: boolean
  includeEmployerUnemployment: boolean
  includeEmployeeUnemployment: boolean
  includeFundedPension: boolean
  fundedPensionRate: 0.02 | 0.04 | 0.06

  percentBase: 'employerCost' | 'gross' | 'net'
}

export interface SalaryResult {
  employerCost: number
  socialTax: number
  employerUnemployment: number
  gross: number
  fundedPensionEmployee: number
  employeeUnemployment: number
  incomeTax: number
  net: number

  taxFreeApplied: number
  annualRevenueUsed: number | null

  chart: {
    stateTaxes: number
    localGovernmentTaxes: number
    netWage: number
    pensionFund: number
  }

  percentages: {
    employerCost: number
    socialTax: number
    employerUnemployment: number
    gross: number
    fundedPensionEmployee: number
    employeeUnemployment: number
    incomeTax: number
    net: number
  }

  derived: {
    calculationBaseAmount: number
    periodMultiplier: 1 | 12
    taxFreeAnnualLimit: number
    incomeTaxRate: number
    employeePensionRate: number
    socialTaxFundedPensionRate: number
    employerUnemploymentRate: number
    employeeUnemploymentRate: number
    minimumSocialTaxAmount: number
  }

  warnings: string[]
}

export const DEFAULT_SALARY_INPUT: SalaryInput = {
  year: 2026,
  inputMode: 'gross',
  amount: 0,
  period: 'monthly',
  workHoursPerMonth: 160,
  taxFreeEnabled: true,
  taxFreeMode: 'calculatedOrManual',
  taxFreeAmountPeriod: 'monthly',
  retired: false,
  applyMinimumSocialTax: false,
  includeEmployerUnemployment: true,
  includeEmployeeUnemployment: true,
  includeFundedPension: true,
  fundedPensionRate: 0.02,
  percentBase: 'employerCost',
}
