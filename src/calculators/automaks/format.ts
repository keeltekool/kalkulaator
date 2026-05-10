export function formatEur(value: number): string {
  return value.toFixed(2) + ' €'
}

export function formatAge(years: number): string {
  return years.toFixed(2)
}

export function formatCo2(value: number): string {
  return Math.round(value) + ' g/km'
}
