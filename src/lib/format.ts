const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatCurrencyFromCents(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

export function formatDateFr(date: Date): string {
  return dateFormatter.format(date)
}
