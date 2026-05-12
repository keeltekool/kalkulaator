export function formatEur(value: number): string {
  return value.toFixed(2) + ' €'
}

export function formatPct(value: number): string {
  return value.toFixed(2) + '%'
}

export const SALARY_LABELS = {
  employerCost: 'Tööandja kulu kokku (palgafond)',
  socialTax: 'Sotsiaalmaks',
  employerUnemployment: 'Töötuskindlustusmakse (tööandja)',
  gross: 'Brutopalk',
  fundedPensionEmployee: 'Kogumispension (II sammas)',
  employeeUnemployment: 'Töötuskindlustusmakse (töötaja)',
  incomeTax: 'Tulumaks',
  net: 'Netopalk',
} as const
