import AutomaksCalculator from '@/components/calculators/automaks/AutomaksCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Automaksu kalkulaator | Kalku',
  description: 'Arvuta oma sõiduki aastamaks ja registreerimistasu. Eesti mootorsõidukimaksu kalkulaator 2025/2026.',
}

export default function AutomaksPage() {
  return <AutomaksCalculator />
}
