import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import { and, desc, gte, lte } from 'drizzle-orm'

import { db } from '#/db'
import { transactions } from '#/db/schema'
import {
  formatMonthCycleLabel,
  getCycleBoundsForKey,
  groupByMonthCycleDesc,
} from '#/lib/transactions/month-cycle'

export interface TransactionDto {
  id: number
  date: Date
  operationLabel: string
  operationName: string | null
  category: string | null
  amount: number
}

export interface MonthCycleSummaryDto {
  key: string
  label: string
  count: number
  balance: number | null
}

export interface MonthCycleTransactionsDto {
  key: string
  label: string
  balance: number | null
  transactions: Array<TransactionDto>
}

export const listMonthCycleSummaries = createServerFn({
  method: 'GET',
}).handler(async (): Promise<Array<MonthCycleSummaryDto>> => {
  const rows = await db
    .select({
      date: transactions.date,
      accountBalance: transactions.accountBalance,
    })
    .from(transactions)
    .orderBy(desc(transactions.date), desc(transactions.id))

  const groups = groupByMonthCycleDesc(rows, (row) => row.date)

  return groups.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.items.length,
    // Les lignes sont triées par date (puis id) décroissante : le premier
    // élément du groupe est donc la dernière transaction importée sur ce
    // cycle, et son accountBalance est le solde bancaire réel à cette date.
    balance: group.items[0].accountBalance,
  }))
})

export const monthCycleSummariesQueryOptions = queryOptions({
  queryKey: ['transactions', 'month-cycle', 'summaries'],
  queryFn: () => listMonthCycleSummaries(),
})

export const getTransactionsForMonthCycle = createServerFn({ method: 'GET' })
  .validator((key: string) => key)
  .handler(async ({ data: key }): Promise<MonthCycleTransactionsDto> => {
    const { start, end } = getCycleBoundsForKey(key)

    const rows = await db
      .select()
      .from(transactions)
      .where(and(gte(transactions.date, start), lte(transactions.date, end)))
      .orderBy(desc(transactions.date), desc(transactions.id))

    return {
      key,
      label: formatMonthCycleLabel(start, end),
      // Solde bancaire réel : celui enregistré sur la dernière transaction
      // importée du cycle (rows[0], vu le tri par date/id décroissant).
      balance: rows[0]?.accountBalance ?? null,
      transactions: rows,
    }
  })

export function monthCycleTransactionsQueryOptions(key: string) {
  return queryOptions({
    queryKey: ['transactions', 'month-cycle', key],
    queryFn: () => getTransactionsForMonthCycle({ data: key }),
  })
}
