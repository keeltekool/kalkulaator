import type { VatRate } from './types'

export const VAT_RATES: { value: VatRate; label: string; detail: string }[] = [
  { value: 0.24, label: '24%', detail: '01.07.2025 – ...' },
  { value: 0.22, label: '22%', detail: '... – 30.06.2025' },
  { value: 0.13, label: '13%', detail: '01.01.2025 – ...' },
  { value: 0.09, label: '9%', detail: 'Vähendatud määr' },
]

export const DEFAULT_VAT_RATE: VatRate = 0.24
