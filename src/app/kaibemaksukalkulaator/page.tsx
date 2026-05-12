import VatCalculator from '@/components/calculators/vat/VatCalculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Käibemaksukalkulaator | Kalku',
  description: 'Arvuta hind koos ja ilma käibemaksuta. Eesti käibemaksu kalkulaator — 9%, 13%, 22%, 24%.',
}

export default function VatPage() {
  return <VatCalculator />
}
