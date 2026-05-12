export type LoanSolveMode = 'loanAmount' | 'monthlyPayment' | 'annualInterest' | 'period'

export type LoanPeriodUnit = 'years' | 'months'

export interface LoanInput {
  solveMode: LoanSolveMode
  periodUnit: LoanPeriodUnit
  principal: number
  monthlyPayment: number
  annualInterestPercent: number
  period: number
}

export interface LoanResult {
  principal: string
  monthlyPayment: string
  annualInterestPercent: string
  period: string
  totalInterest: string
  totalRepayment: string
  solveMode: LoanSolveMode
  periodUnit: LoanPeriodUnit
}
