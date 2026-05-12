export function formatMoney(value: number): string {
  return value.toFixed(2) + ' €'
}

export function formatCoefficient(value: number): string {
  return '× ' + value.toFixed(6)
}
