import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { formatCurrencyFromCents } from '#/lib/format'
import { monthCycleSummariesQueryOptions } from '#/lib/transactions/queries'

export const Route = createFileRoute('/transactions/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(monthCycleSummariesQueryOptions)
  },
  component: TransactionsIndexPage,
})

function TransactionsIndexPage() {
  const { data: summaries } = useSuspenseQuery(monthCycleSummariesQueryOptions)

  if (summaries.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Aucune transaction importée pour le moment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 p-8">
      {summaries.map((summary) => (
        <Link
          key={summary.key}
          to="/transactions/$cycle"
          params={{ cycle: summary.key }}
        >
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>{summary.label}</CardTitle>
              <CardDescription>
                {summary.count} transaction(s) — solde :{' '}
                {summary.balance !== null
                  ? formatCurrencyFromCents(summary.balance)
                  : '—'}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
