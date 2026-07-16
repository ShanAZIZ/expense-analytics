import { describe, expect, it } from 'vitest'

import {
  formatMonthCycleLabel,
  getMonthCycle,
  groupByMonthCycleDesc,
} from '#/lib/transactions/month-cycle'

function utc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day))
}

describe('getMonthCycle', () => {
  it('day 27 belongs to the cycle ending that same month', () => {
    const { start, end, key } = getMonthCycle(utc(2026, 8, 27))
    expect(start).toEqual(utc(2026, 7, 28))
    expect(end).toEqual(utc(2026, 8, 27))
    expect(key).toBe('2026-08')
  })

  it('day 28 belongs to the cycle ending next month', () => {
    const { start, end, key } = getMonthCycle(utc(2026, 7, 28))
    expect(start).toEqual(utc(2026, 7, 28))
    expect(end).toEqual(utc(2026, 8, 27))
    expect(key).toBe('2026-08')
  })

  it('rolls over the year on a December 28 date', () => {
    const { start, end, key } = getMonthCycle(utc(2026, 12, 28))
    expect(start).toEqual(utc(2026, 12, 28))
    expect(end).toEqual(utc(2027, 1, 27))
    expect(key).toBe('2027-01')
  })
})

describe('formatMonthCycleLabel', () => {
  it('omits the start year when both ends share a year', () => {
    expect(formatMonthCycleLabel(utc(2026, 7, 28), utc(2026, 8, 27))).toBe(
      '28 juil. – 27 août 2026',
    )
  })

  it('includes both years when the cycle crosses a year boundary', () => {
    expect(formatMonthCycleLabel(utc(2026, 12, 28), utc(2027, 1, 27))).toBe(
      '28 déc. 2026 – 27 janv. 2027',
    )
  })
})

describe('groupByMonthCycleDesc', () => {
  it('groups newest-first with items preserved in their original order', () => {
    const items = [
      utc(2026, 8, 5),
      utc(2026, 7, 25),
      utc(2026, 7, 20),
      utc(2026, 6, 15),
    ]

    const groups = groupByMonthCycleDesc(items, (item) => item)

    expect(groups.map((g) => g.key)).toEqual(['2026-08', '2026-07', '2026-06'])
    expect(groups[0]?.items).toEqual([items[0]])
    expect(groups[1]?.items).toEqual([items[1], items[2]])
    expect(groups[2]?.items).toEqual([items[3]])
  })
})
