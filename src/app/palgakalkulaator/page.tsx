import SalaryCalculator from '@/components/calculators/salary/SalaryCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Palgakalkulaator 2026 | Kalku',
  description: 'Arvuta palga ja maksude jaotus — tööandja kulu, bruto- ja netopalk. Palgakalkulaator 2022-2026.',
}

export default function SalaryPage() {
  return <SalaryCalculator />
}
