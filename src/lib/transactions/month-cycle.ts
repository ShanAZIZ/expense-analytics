export interface MonthCycle {
  start: Date
  end: Date
  key: string
}

export interface MonthCycleGroup<T> {
  key: string
  label: string
  start: Date
  end: Date
  items: Array<T>
}

const dayMonthFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const dayMonthYearFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

// Les dates sont stockées en minuit UTC (voir parse-transactions-csv.ts) :
// on n'utilise donc que les getters UTC pour éviter tout décalage de jour
// selon le fuseau du serveur/navigateur.
export function getMonthCycle(date: Date): MonthCycle {
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const endMonth = day <= 27 ? month : month + 1

  const end = new Date(Date.UTC(year, endMonth, 27))
  const start = new Date(Date.UTC(year, endMonth - 1, 28))
  const key = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}`

  return { start, end, key }
}

export function getCycleBoundsForKey(key: string): {
  start: Date
  end: Date
} {
  const [yearStr, monthStr] = key.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  const end = new Date(Date.UTC(year, month - 1, 27))
  const start = new Date(Date.UTC(year, month - 2, 28))

  return { start, end }
}

export function shiftCycleKey(key: string, delta: number): string {
  const [yearStr, monthStr] = key.split('-')
  const totalMonths = Number(yearStr) * 12 + (Number(monthStr) - 1) + delta
  const year = Math.floor(totalMonths / 12)
  const month = (totalMonths % 12) + 1

  return `${year}-${String(month).padStart(2, '0')}`
}

export function formatMonthCycleLabel(start: Date, end: Date): string {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const startLabel = sameYear
    ? dayMonthFormatter.format(start)
    : dayMonthYearFormatter.format(start)
  const endLabel = dayMonthYearFormatter.format(end)
  return `${startLabel} – ${endLabel}`
}

export function groupByMonthCycleDesc<T>(
  itemsSortedByDateDesc: Array<T>,
  getDate: (item: T) => Date,
): Array<MonthCycleGroup<T>> {
  const groups: Array<MonthCycleGroup<T>> = []
  const groupsByKey = new Map<string, MonthCycleGroup<T>>()

  for (const item of itemsSortedByDateDesc) {
    const { start, end, key } = getMonthCycle(getDate(item))
    let group = groupsByKey.get(key)
    if (!group) {
      group = {
        key,
        label: formatMonthCycleLabel(start, end),
        start,
        end,
        items: [],
      }
      groupsByKey.set(key, group)
      groups.push(group)
    }
    group.items.push(item)
  }

  return groups
}
