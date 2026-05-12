import TaxFreeCalculator from '@/components/calculators/taxfree/TaxFreeCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maksuvaba tulu kalkulaator | Kalku',
  description: 'Arvuta oma maksuvaba tulu suurus sissetuleku põhjal. 2025-2026 maksuvaba tulu.',
}

export default function TaxFreePage() {
  return <TaxFreeCalculator />
}
