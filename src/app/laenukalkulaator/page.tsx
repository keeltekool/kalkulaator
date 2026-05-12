import LoanCalculator from '@/components/calculators/loan/LoanCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laenukalkulaator | Kalku',
  description: 'Arvuta laenu kuumakse, intress, periood või maksimaalne laenusumma. Universaalne laenukalkulaator.',
}

export default function LoanPage() {
  return <LoanCalculator />
}
