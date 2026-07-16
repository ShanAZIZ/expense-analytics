import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatCurrencyFromCents, formatDateFr } from '#/lib/format'
import { shiftCycleKey } from '#/lib/transactions/month-cycle'
import { monthCycleTransactionsQueryOptions } from '#/lib/transactions/queries'

export const Route = createFileRoute('/transactions/$cycle')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      monthCycleTransactionsQueryOptions(params.cycle),
    )
  },
  component: TransactionMonthPage,
})

function TransactionMonthPage() {
  const { cycle } = Route.useParams()
  const { data: group } = useSuspenseQuery(
    monthCycleTransactionsQueryOptions(cycle),
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <Link
          to="/transactions/$cycle"
          params={{ cycle: shiftCycleKey(cycle, -1) }}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Mois précédent
        </Link>
        <Link
          to="/transactions"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Tous les mois
        </Link>
        <Link
          to="/transactions/$cycle"
          params={{ cycle: shiftCycleKey(cycle, 1) }}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Mois suivant →
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{group.label}</CardTitle>
          <CardDescription>
            {group.transactions.length} transaction(s) — solde :{' '}
            {group.balance !== null
              ? formatCurrencyFromCents(group.balance)
              : '—'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {group.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune transaction pour ce mois.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateFr(transaction.date)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {transaction.operationName ?? transaction.operationLabel}
                    </TableCell>
                    <TableCell>{transaction.category ?? '—'}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${
                        transaction.amount < 0
                          ? 'text-destructive'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrencyFromCents(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
